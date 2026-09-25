"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TWO_FACTOR_ENABLED } from "@/lib/feature-2fa";
import { Contenuto, Dato, DueColonne, Riga, Testata } from "../_ui/cornice";

type SecurityState = {
  securityScore: number;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  lastSignIn: string | null;
  passwordChanged: string | null;
};

type Postazione = { id: string; nome: string; quando: string; corrente: boolean };
type Evento = { id: string; quando: string; cosa: string };

/** Il livello di protezione scritto a parole, come vuole il disegno. */
function livello(score: number): { parola: string; nota: string } {
  if (score >= 100) return { parola: "Ottimo", nota: "tutte le protezioni disponibili sono attive" };
  if (score >= 60) return { parola: "Buono", nota: "manca la verifica in due passaggi" };
  return { parola: "Da sistemare", nota: "conferma l'email per recuperare l'accesso" };
}

function nomePostazione(ua: string | null): string {
  if (!ua) return "Postazione sconosciuta";
  const l = ua.toLowerCase();
  let programma = "Browser";
  if (l.includes("electron") || l.includes("rescuemanager")) programma = "App desktop";
  else if (l.includes("firefox")) programma = "Firefox";
  else if (l.includes("edg/")) programma = "Edge";
  else if (l.includes("chrome") && !l.includes("edg")) programma = "Chrome";
  else if (l.includes("safari")) programma = "Safari";
  let sistema = "";
  if (l.includes("mac os")) sistema = "macOS";
  else if (l.includes("windows")) sistema = "Windows";
  else if (/iphone|ipad/.test(l)) sistema = "iPhone";
  else if (l.includes("android")) sistema = "Android";
  else if (l.includes("linux")) sistema = "Linux";
  return sistema ? `${programma}, ${sistema}` : programma;
}

function quando(iso: string): string {
  const d = new Date(iso);
  const oggi = new Date();
  const ieri = new Date(oggi);
  ieri.setDate(oggi.getDate() - 1);
  const ora = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === oggi.toDateString()) return `Oggi ${ora}`;
  if (d.toDateString() === ieri.toDateString()) return `Ieri ${ora}`;
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

const EVENTI: Record<string, string> = {
  "login.success": "Accesso riuscito",
  "login.failure": "Accesso non riuscito",
  logout: "Disconnessione",
  "password.changed": "Password cambiata",
  "mfa.enabled": "Verifica in due passaggi attivata",
  "mfa.disabled": "Verifica in due passaggi disattivata",
  "session.revoked": "Postazione scollegata",
  "session.revoked_all_other": "Scollegate le altre postazioni",
  "privacy.export": "Copia dei dati richiesta",
  "privacy.delete": "Cancellazione richiesta",
  "profile.updated": "Profilo aggiornato",
};

export default function SecurityPage() {
  usePageTitle("Sicurezza");
  const [loading, setLoading] = useState(true);
  const [sec, setSec] = useState<SecurityState>({
    securityScore: 0,
    twoFactorEnabled: false,
    emailVerified: false,
    lastSignIn: null,
    passwordChanged: null,
  });
  const [postazioni, setPostazioni] = useState<Postazione[]>([]);
  const [eventi, setEventi] = useState<Evento[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          setLoading(false);
          return;
        }

        // 2FA REALE: un factor TOTP verificato = abilitato.
        let twoFA = false;
        try {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          twoFA = !!factors?.totp?.some((f) => f.status === "verified");
        } catch {
          /* MFA non disponibile → resta false */
        }

        const emailVerified = !!(user.email_confirmed_at || user.confirmed_at);

        // Score su SEGNALI REALI di sicurezza (non "completezza profilo"):
        // credenziali attive (40) + email verificata (20) + 2FA (40).
        let score = 40;
        if (emailVerified) score += 20;
        if (twoFA) score += 40;

        setSec({
          securityScore: Math.min(score, 100),
          twoFactorEnabled: twoFA,
          emailVerified,
          lastSignIn: user.last_sign_in_at ?? null,
          passwordChanged: user.updated_at ?? null,
        });

        // Postazioni collegate e ultimi eventi: gli stessi dati delle pagine
        // di dettaglio, qui in forma breve.
        try {
          const r = await fetch("/api/auth/sessions/list");
          const j = await r.json().catch(() => ({}));
          if (r.ok && j.ok && Array.isArray(j.sessions)) {
            setPostazioni(
              j.sessions.slice(0, 4).map((s: { id: string; user_agent: string | null; updated_at: string; is_current: boolean }) => ({
                id: s.id,
                nome: nomePostazione(s.user_agent),
                quando: s.is_current ? "adesso, questa" : quando(s.updated_at),
                corrente: s.is_current,
              })),
            );
          }
        } catch { /* opzionale */ }

        try {
          const r = await fetch("/api/user/audit-logs?limit=3");
          const j = await r.json().catch(() => ({}));
          if (r.ok && j.ok && Array.isArray(j.logs)) {
            setEventi(
              j.logs.slice(0, 3).map((l: { id: string; action: string; created_at: string }) => ({
                id: l.id,
                quando: quando(l.created_at),
                cosa: EVENTI[l.action] || l.action.replace(/[._]/g, " "),
              })),
            );
          }
        } catch { /* opzionale */ }
      } catch {
        /* no-op */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <>
        <Testata titolo="Sicurezza" sotto="Accessi, password, verifiche" />
        <Contenuto>
          <p className="rm-muted">Controllo delle protezioni in corso.</p>
        </Contenuto>
      </>
    );
  }

  const liv = livello(sec.securityScore);
  const accesso = sec.lastSignIn ? new Date(sec.lastSignIn) : null;
  const oggi = accesso?.toDateString() === new Date().toDateString();
  let notaAccesso = "non disponibile";
  if (accesso) {
    notaAccesso = oggi ? "oggi" : accesso.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
  }

  return (
    <>
      <Testata titolo="Sicurezza" sotto="Accessi, password, verifiche" />

      <Contenuto>
        <div className="rm-griglia" style={{ marginBottom: 16 }}>
          <Dato etichetta="Livello di protezione" valore={liv.parola} nota={liv.nota} />
          <Dato
            etichetta="Postazioni collegate"
            valore={postazioni.length ? String(postazioni.length) : "—"}
            nota={postazioni.length ? postazioni.map((p) => p.nome).join(", ") : "nessuna sessione registrata"}
          />
          <Dato
            etichetta="Ultimo accesso"
            valore={accesso ? accesso.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "—"}
            nota={notaAccesso}
          />
        </div>

        <DueColonne
          principale={
            <>
              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 style={{ fontSize: 14 }}>Password</h2>
                  <span className="rm-muted">
                    {sec.passwordChanged
                      ? `cambiata il ${new Date(sec.passwordChanged).toLocaleDateString("it-IT", { day: "numeric", month: "long" })}`
                      : "data non disponibile"}
                  </span>
                </div>
                <p className="rm-muted">Serve la password attuale. Le postazioni restano collegate.</p>
                <div style={{ marginTop: 14 }}>
                  <Link href="/dashboard/security/password" className="rm-btn rm-btn--tertiary">
                    <span>Cambia la password</span>
                  </Link>
                </div>
              </section>

              {TWO_FACTOR_ENABLED && (
                <section className="rm-card">
                  <div className="rm-cardhead">
                    <h2 style={{ fontSize: 14 }}>Verifica in due passaggi</h2>
                    <span className={sec.twoFactorEnabled ? "rm-stato rm-stato--ok" : "rm-stato rm-stato--fermo"}>
                      {sec.twoFactorEnabled ? "attiva" : "non attiva"}
                    </span>
                  </div>
                  <p className="rm-muted">
                    Un codice dall&apos;app di autenticazione a ogni accesso nuovo. Consigliata a
                    chi fattura.
                  </p>
                  <div style={{ marginTop: 14 }}>
                    <Link href="/dashboard/security/2fa" className="rm-btn rm-btn--primary">
                      <span>{sec.twoFactorEnabled ? "Gestisci" : "Attiva"}</span>
                    </Link>
                  </div>
                </section>
              )}

              {!sec.emailVerified && (
                <div className="rm-note rm-note--info">
                  L&apos;indirizzo email non risulta confermato: serve per recuperare
                  l&apos;accesso.
                </div>
              )}
            </>
          }
          laterale={
            <>
              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 style={{ fontSize: 14 }}>Postazioni collegate</h2>
                  <Link href="/dashboard/security/sessions">Gestisci</Link>
                </div>
                {postazioni.length === 0 ? (
                  <p className="rm-muted">Nessuna sessione registrata.</p>
                ) : (
                  <div className="rm-righe">
                    {postazioni.map((p) => (
                      <Riga key={p.id} etichetta={p.nome} valore={p.quando} />
                    ))}
                  </div>
                )}
              </section>

              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 style={{ fontSize: 14 }}>Registro eventi</h2>
                  <Link href="/dashboard/security/audit">Tutto</Link>
                </div>
                {eventi.length === 0 ? (
                  <p className="rm-muted">Nessun evento registrato.</p>
                ) : (
                  <div className="rm-righe">
                    {eventi.map((e) => (
                      <Riga key={e.id} etichetta={e.quando} valore={e.cosa} />
                    ))}
                  </div>
                )}
              </section>
            </>
          }
        />
      </Contenuto>
    </>
  );
}
