// src/app/dashboard/layout.tsx
"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Breadcrumbs from "@/components/dashboard/Breadcrumbs";
import PageTransition from "@/components/dashboard/PageTransition";
import DemoLanding from "@/components/dashboard/DemoLanding";
import { supabaseBrowser } from "@/lib/supabase-browser";
import LegalConsentModal from "@/components/dashboard/LegalConsentModal";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
import MaintenanceGate from "@/components/dashboard/MaintenanceGate";
import { TWO_FACTOR_ENABLED } from "@/lib/feature-2fa";
import { useUserRole } from "@/lib/useUserRole";

/**
 * Cornice dell'area cliente.
 *
 * E' la stessa cosa dell'applicazione desktop vista dal browser: barra
 * laterale blu a sinistra, contenuto sul fondo scuro. Le classi stanno in
 * `prodotto.css` (rm-area, rm-card, rm-riga...), qui si mette solo il
 * layout che manca.
 */

// La barra di marketing non compare piu' sulle pagine del prodotto (vedi
// SiteHeader), quindi non c'e' niente da compensare in alto.
// Vecchio commento: la barra del sito e' fissa in alto ed e' alta 112px
// comincia sotto di lei.

type Voce = {
  label: string;
  href: string;
  /** Solo il titolare vede la voce (fatturazione). */
  soloTitolare?: boolean;
  /** Attiva solo con corrispondenza esatta del percorso. */
  esatta?: boolean;
};

type Gruppo = { titolo?: string; voci: Voce[] };

const MENU: Gruppo[] = [
  { voci: [{ label: "Panoramica", href: "/dashboard", esatta: true }] },
  {
    titolo: "Account",
    voci: [
      { label: "Profilo", href: "/dashboard/profile" },
      { label: "Sicurezza", href: "/dashboard/security" },
      { label: "Privacy", href: "/dashboard/privacy" },
      { label: "Notifiche", href: "/dashboard/settings/notifications" },
    ],
  },
  {
    titolo: "Azienda",
    voci: [
      { label: "Organizzazione", href: "/dashboard/org" },
      { label: "Abbonamento", href: "/dashboard/billing", soloTitolare: true },
      { label: "Metodi di pagamento", href: "/dashboard/payment-methods", soloTitolare: true },
      { label: "Fatture", href: "/dashboard/invoices", soloTitolare: true },
    ],
  },
  {
    titolo: "Assistenza",
    voci: [
      { label: "Scarica le app", href: "/dashboard/download" },
      { label: "Supporto", href: "/dashboard/support" },
    ],
  },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [userEmail, setUserEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  // Quando is_demo=true sostituiamo la dashboard normale con una landing
  // minimal (download desktop + preventivo). Tutte le altre rotte sotto
  // /dashboard sono inaccessibili (redirect a /dashboard).
  const [isDemo, setIsDemo] = useState(false);
  const [demoQuoteUuid, setDemoQuoteUuid] = useState<string | null>(null);
  const [demoExpiresAt, setDemoExpiresAt] = useState<string | null>(null);
  const [uscendo, setUscendo] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isOwner } = useUserRole();

  useEffect(() => {
    const supabase = supabaseBrowser();

    const checkAuth = async () => {
      try {
        // Prova direttamente getUser (Supabase gestisce automaticamente localStorage e cookie)
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          router.push("/login?redirect=/dashboard");
          return;
        }

        // Prendi l'org DELL'UTENTE: prima da profiles.current_org, fallback a org_members.
        // Niente "select * limit 1" che pesca a caso la prima org del DB.
        let userOrgId: string | null = null;
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_org')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.current_org) {
          userOrgId = profile.current_org as string;
        } else {
          const { data: mem } = await supabase
            .from('org_members')
            .select('org_id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();
          userOrgId = mem?.org_id || null;
        }

        if (userOrgId) {
          // Preferisci company_name salvato in org_settings (Info Azienda),
          // altrimenti fallback al nome di orgs.
          const [{ data: org }, { data: settings }] = await Promise.all([
            supabase.from('orgs').select('name, web_access_enabled, is_demo, demo_expires_at').eq('id', userOrgId).maybeSingle(),
            supabase.from('org_settings').select('value').eq('org_id', userOrgId).eq('key', 'company').maybeSingle(),
          ]);

          // Check accesso web disabilitato dall'admin RescueManager
          if (org && org.web_access_enabled === false) {
            router.push('/no-access?reason=web_disabled');
            return;
          }

          const companyName = (settings?.value as { company_name?: string } | null)?.company_name;
          setOrgName(companyName || org?.name || '');

          // Se l'org è demo: switch a vista landing minimale + carica
          // l'ultimo preventivo "sent/viewed/accepted/paid" del lead
          // collegato (così il cliente demo ha 1 click verso il pagamento).
          if (org?.is_demo === true) {
            setIsDemo(true);
            setDemoExpiresAt(org.demo_expires_at || null);
            try {
              const { data: lead } = await supabase
                .from('leads')
                .select('id')
                .eq('demo_org_id', userOrgId)
                .maybeSingle();
              if (lead?.id) {
                const { data: quote } = await supabase
                  .from('lead_quotes')
                  .select('public_uuid, status, updated_at')
                  .eq('lead_id', lead.id)
                  .in('status', ['sent', 'viewed', 'accepted', 'paid', 'pending_activation'])
                  .order('updated_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (quote?.public_uuid) setDemoQuoteUuid(quote.public_uuid);
              }
            } catch (e) {
              // Non bloccante: senza quote la landing mostra solo Download.
              console.warn('[layout] demo quote lookup failed:', e);
            }
            // Forziamo l'URL su /dashboard: niente sub-route durante demo.
            if (pathname && pathname !== '/dashboard') {
              router.replace('/dashboard');
              return;
            }
          }
        } else {
          setOrgName('');
        }

        // Enforcement 2FA: se l'admin ha reso la 2FA obbligatoria e la sessione
        // non è AAL2, manda l'utente alla pagina sicurezza (che gestisce sia
        // l'enroll sia la challenge del fattore esistente). Non redirige se
        // siamo già lì, per evitare loop.
        // Le pagine security/* (incluso /security/2fa per l'enroll) sono
        // safe-zone per evitare loop di redirect.
        const onSecurityPage = pathname?.startsWith('/dashboard/security');
        // 2FA temporaneamente bloccato (vedi lib/feature-2fa): niente enforcement.
        if (TWO_FACTOR_ENABLED && !onSecurityPage) {
          try {
            const res = await fetch('/api/auth/2fa-status', { cache: 'no-store' });
            if (!res.ok) {
              // L'endpoint risponde, ma con errore HTTP: log strutturato e
              // tentativo di scrittura nell'audit utente (best-effort).
              const detail = await res.text().catch(() => '');
              console.warn('[layout/2fa-status] http_error', {
                status: res.status,
                detail: detail.slice(0, 200),
              });
              try {
                await fetch('/api/user/audit-logs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'mfa.enforcement_check_failed',
                    status: 'failure',
                    metadata: { http_status: res.status },
                  }),
                });
              } catch { /* non bloccante */ }
            } else {
              const { mandatory } = await res.json();
              if (mandatory) {
                const { data: aal } =
                  await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
                if (aal && aal.currentLevel !== 'aal2') {
                  router.push('/dashboard/security/2fa?enforce=1');
                  return;
                }
              }
            }
          } catch (e) {
            // Fail open per non lockare gli utenti se 2fa-status crasha,
            // ma loggiamo strutturato + scriviamo in audit (best-effort).
            const msg = e instanceof Error ? e.message : String(e);
            console.warn('[layout/2fa-status] network_or_throw', { error: msg });
            try {
              await fetch('/api/user/audit-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'mfa.enforcement_check_failed',
                  status: 'failure',
                  metadata: { error: msg.slice(0, 200) },
                }),
              });
            } catch { /* non bloccante */ }
          }
        }

        setUserEmail(user.email || "Utente");
        setLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/login?redirect=/dashboard");
      }
    };

    // Carica stato iniziale
    checkAuth();

    // Listener per cambiamenti di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserEmail(session.user.email || "Utente");
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        router.push("/login?redirect=/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  const esci = async () => {
    if (uscendo) return;
    setUscendo(true);
    try {
      const { authManager } = await import("@/lib/auth");
      await authManager.logout();
    } catch {
      globalThis.location.href = "/";
    } finally {
      setTimeout(() => setUscendo(false), 1500);
    }
  };

  if (loading) {
    return (
      <div className="rm-prod">
        <div className="rm-area">
          <div className="rm-area__nav" />
          <div className="rm-area__corpo">
            <p className="rm-muted">Apertura dell&apos;area cliente in corso</p>
          </div>
        </div>
      </div>
    );
  }

  // Vista demo: niente sidebar/breadcrumbs. Solo download desktop +
  // (eventuale) preventivo. L'utente demo non ha senso navighi tra
  // billing/invoices/activity/org: il suo scopo qui è solo decidere
  // se acquistare (→ preventivo) o esplorare (→ desktop).
  if (isDemo) {
    return (
      <DemoLanding
        userEmail={userEmail}
        orgName={orgName}
        quoteUuid={demoQuoteUuid}
        expiresAt={demoExpiresAt}
      />
    );
  }

  const percorso = pathname || "";

  return (
    <div className="rm-prod">
      <div className="rm-area">
        <nav className="rm-area__nav" aria-label="Aree dell'area cliente">
          <div className="rm-area__testa">
            <div style={{ fontWeight: 600, color: "#fff" }} title={orgName || userEmail}>
              {orgName || userEmail}
            </div>
            {orgName && (
              <div
                style={{ fontSize: 12.5, color: "var(--sidebar-muted)", overflowWrap: "anywhere" }}
                title={userEmail}
              >
                {userEmail}
              </div>
            )}
          </div>

          {/* Titoli e voci sono figli diretti della barra: cosi' su schermo
              stretto diventano una riga scorrevole, come vuole il foglio. */}
          {MENU.map((gruppo, i) => {
            const voci = gruppo.voci.filter((v) => !v.soloTitolare || isOwner);
            if (!voci.length) return null;
            return (
              <Fragment key={gruppo.titolo || `gruppo-${i}`}>
                {gruppo.titolo && <div className="rm-area__gruppo">{gruppo.titolo}</div>}
                {voci.map((v) => {
                  const attiva = v.esatta ? percorso === v.href : percorso.startsWith(v.href);
                  return (
                    <Link key={v.href} href={v.href} aria-current={attiva ? "page" : undefined}>
                      {v.label}
                    </Link>
                  );
                })}
              </Fragment>
            );
          })}

          {/* Spinge l'uscita in fondo alla barra. */}
          <div style={{ flex: 1 }} />

          <div className="rm-area__piede">
            {/* Non c'e' una classe per l'azione dentro la barra laterale:
                pulsante di testo, colori presi dalle variabili del foglio. */}
            <button
              type="button"
              onClick={esci}
              disabled={uscendo}
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                font: "inherit",
                fontSize: 13.5,
                textAlign: "left",
                color: uscendo ? "var(--sidebar-muted)" : "var(--sidebar-text)",
                cursor: uscendo ? "default" : "pointer",
              }}
            >
              {uscendo ? "Disconnessione in corso" : "Esci dall'account"}
            </button>
          </div>
        </nav>

        <div className="rm-area__corpo">
          <MaintenanceGate />
          <LegalConsentModal />
          <AnnouncementBanner />
          {/* Lo stile del percorso di navigazione sta nel suo componente:
              qui serve solo lo spazio prima del titolo di pagina. */}
          <div style={{ marginBottom: 12 }}>
            <Breadcrumbs />
          </div>
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </div>
  );
}
