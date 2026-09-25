// src/app/dashboard/layout.tsx
"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  CreditCard,
  Download,
  Eye,
  FileText,
  Gauge,
  HelpCircle,
  Lock,
  LogOut,
  Settings,
  User,
  Wallet,
} from "lucide-react";
import PageTransition from "@/components/dashboard/PageTransition";
import DemoLanding from "@/components/dashboard/DemoLanding";
import { supabaseBrowser } from "@/lib/supabase-browser";
import LegalConsentModal from "@/components/dashboard/LegalConsentModal";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
import MaintenanceGate from "@/components/dashboard/MaintenanceGate";
import { TWO_FACTOR_ENABLED } from "@/lib/feature-2fa";
import { useUserRole } from "@/lib/useUserRole";
import { Conferma } from "./_ui/conferma";

/**
 * Cornice dell'area personale.
 *
 * Segue il disegno del titolare: barra laterale blu con il marchio in alto,
 * le voci in due gruppi e il nome di chi e' collegato in fondo; barra in alto
 * con "Area personale", l'indirizzo del sito e l'uscita. Le classi stanno in
 * `prodotto.css` (rm-area, rm-card, rm-riga...), qui si mette solo il layout
 * che manca.
 */

type Voce = {
  label: string;
  href: string;
  icona: typeof Gauge;
  /** Solo il titolare vede la voce (fatturazione). */
  soloTitolare?: boolean;
  /** Attiva solo con corrispondenza esatta del percorso. */
  esatta?: boolean;
};

type Gruppo = { titolo?: string; voci: Voce[] };

const MENU: Gruppo[] = [
  { voci: [{ label: "Panoramica", href: "/dashboard", icona: Gauge, esatta: true }] },
  {
    titolo: "Account",
    voci: [
      { label: "Profilo", href: "/dashboard/profile", icona: User },
      { label: "Sicurezza", href: "/dashboard/security", icona: Lock },
      { label: "Privacy", href: "/dashboard/privacy", icona: Eye },
      { label: "Notifiche", href: "/dashboard/settings/notifications", icona: Bell },
      { label: "Organizzazione", href: "/dashboard/org", icona: Building2 },
    ],
  },
  {
    titolo: "Fatturazione",
    voci: [
      { label: "Abbonamento", href: "/dashboard/billing", icona: CreditCard, soloTitolare: true },
      { label: "Metodi di pagamento", href: "/dashboard/payment-methods", icona: Wallet, soloTitolare: true },
      { label: "Fatture", href: "/dashboard/invoices", icona: FileText, soloTitolare: true },
      { label: "Download app", href: "/dashboard/download", icona: Download },
      { label: "Supporto", href: "/dashboard/support", icona: HelpCircle },
    ],
  },
];

/** "Emmanuel Scozzarini" diventa "Emmanuel S."; senza nome resta l'email. */
function nomeBreve(nome: string, email: string): string {
  const pulito = nome.trim();
  if (!pulito) return email;
  const parti = pulito.split(/\s+/);
  if (parti.length === 1) return parti[0];
  return `${parti[0]} ${parti[parti.length - 1].charAt(0).toUpperCase()}.`;
}

/** Le due lettere del riquadro: iniziali del nome, altrimenti dell'email. */
function iniziali(nome: string, email: string): string {
  const pulito = nome.trim();
  if (pulito) {
    const parti = pulito.split(/\s+/);
    const a = parti[0]?.charAt(0) || "";
    const b = parti.length > 1 ? parti[parti.length - 1].charAt(0) : "";
    return (a + b).toUpperCase() || "?";
  }
  return (email.slice(0, 2) || "?").toUpperCase();
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  // Quando is_demo=true sostituiamo la dashboard normale con una landing
  // minimal (download desktop + preventivo). Tutte le altre rotte sotto
  // /dashboard sono inaccessibili (redirect a /dashboard).
  const [isDemo, setIsDemo] = useState(false);
  const [demoQuoteUuid, setDemoQuoteUuid] = useState<string | null>(null);
  const [demoExpiresAt, setDemoExpiresAt] = useState<string | null>(null);
  const [chiedeUscita, setChiedeUscita] = useState(false);
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
          .select('current_org, full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.full_name) setUserName(profile.full_name as string);
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

  // L'uscita vera: invariata. Cambia solo il momento in cui parte, cioe' dopo
  // la conferma. Finche' e' in corso la finestra resta aperta e spenta.
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

  const resta = useCallback(() => setChiedeUscita(false), []);

  if (loading) {
    return (
      <div className="rm-prod">
        <div className="rm-area">
          <div className="rm-area__nav" />
          <div className="rm-area__corpo">
            <p className="rm-muted">Apertura dell&apos;area personale in corso</p>
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
  const nome = nomeBreve(userName, userEmail);
  const sigla = iniziali(userName, userEmail);

  /** Riquadro con le due lettere: in alto pieno, nella barra solo bordato. */
  const quadratino = (pieno: boolean) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    flex: "0 0 auto",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: ".04em",
    background: pieno ? "var(--brand)" : "rgba(255,255,255,.14)",
    color: "#fff",
  });

  return (
    <div className="rm-prod">
      <div className="rm-area">
        <nav className="rm-area__nav" aria-label="Sezioni dell'area personale">
          <div className="rm-area__testa">
            <Link
              href="/dashboard"
              aria-label="RescueManager, torna alla panoramica"
              style={{ display: "inline-block", padding: 0 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logos/logo-principale-bianco.svg"
                alt="RescueManager"
                style={{ height: 24, width: "auto", display: "block" }}
              />
            </Link>
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
                  const Icona = v.icona;
                  return (
                    <Link
                      key={v.href}
                      href={v.href}
                      aria-current={attiva ? "page" : undefined}
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <Icona size={15} style={{ flex: "0 0 auto", opacity: attiva ? 1 : 0.75 }} />
                      <span>{v.label}</span>
                    </Link>
                  );
                })}
              </Fragment>
            );
          })}

          {/* Spinge il nome di chi e' collegato in fondo alla barra. */}
          <div style={{ flex: 1 }} />

          <div
            className="rm-area__piede"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <span aria-hidden style={quadratino(false)}>
              {sigla}
            </span>
            <span
              style={{ flex: 1, minWidth: 0, fontSize: 13, color: "#fff", overflowWrap: "anywhere" }}
              title={userEmail}
            >
              {nome}
            </span>
            <Link
              href="/dashboard/profile"
              aria-label="Impostazioni dell'utenza"
              style={{
                display: "inline-flex",
                padding: 0,
                color: "var(--sidebar-muted)",
                textDecoration: "none",
                background: "transparent",
              }}
            >
              <Settings size={16} />
            </Link>
          </div>
        </nav>

        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Barra in alto: a sinistra dove si e', a destra le scorciatoie. */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              background: "var(--layer)",
              borderBottom: "1px solid var(--border)",
              padding: "12px 24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
              <span style={{ fontWeight: 600 }}>Area personale</span>
              <span className="rm-muted">rescuemanager.eu</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Link
                href="/dashboard/settings/notifications"
                aria-label="Notifiche"
                style={{ display: "inline-flex", color: "var(--text-secondary)", textDecoration: "none" }}
              >
                <Bell size={17} />
              </Link>
              <Link
                href="/dashboard/support"
                aria-label="Assistenza"
                style={{ display: "inline-flex", color: "var(--text-secondary)", textDecoration: "none" }}
              >
                <HelpCircle size={17} />
              </Link>
              <Link
                href="/dashboard/profile"
                aria-label={`Profilo di ${nome}`}
                title={userEmail}
                style={{ ...quadratino(true), textDecoration: "none" }}
              >
                {sigla}
              </Link>
              <button
                type="button"
                onClick={() => setChiedeUscita(true)}
                className="rm-btn rm-btn--tertiary"
                style={{ height: 32, gap: 10, padding: "0 12px" }}
              >
                <span>Esci</span>
                <LogOut size={15} />
              </button>
            </div>
          </header>

          {/* Il contenuto gestisce da solo i propri margini: le pagine di
              secondo livello hanno una fascia scura a tutta larghezza. */}
          <div className="rm-area__corpo" style={{ padding: 0 }}>
            <div style={{ padding: "0 24px" }}>
              <MaintenanceGate />
              <LegalConsentModal />
              <AnnouncementBanner />
            </div>
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </div>

      <Conferma
        aperta={chiedeUscita}
        titolo="Uscire dall&rsquo;area personale"
        testo="Si torna alla pagina di accesso. Il lavoro non salvato va perso."
        conferma={uscendo ? "Disconnessione in corso" : "Disconnetti"}
        annulla="Resta"
        occupato={uscendo}
        onAnnulla={resta}
        onConferma={esci}
      />
    </div>
  );
}
