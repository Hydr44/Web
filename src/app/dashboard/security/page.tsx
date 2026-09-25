"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TWO_FACTOR_ENABLED } from "@/lib/feature-2fa";

type SecurityState = {
  securityScore: number;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  lastSignIn: string | null;
};

export default function SecurityPage() {
  usePageTitle("Sicurezza");
  const [loading, setLoading] = useState(true);
  const [sec, setSec] = useState<SecurityState>({
    securityScore: 0,
    twoFactorEnabled: false,
    emailVerified: false,
    lastSignIn: null,
  });

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
        });
      } catch {
        /* no-op */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fmtDate = (iso: string | null) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleString("it-IT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  // Azioni residue calcolate sui segnali reali (checklist dinamica, non fissa).
  const todo: { label: string; desc: string; href: string }[] = [];
  if (TWO_FACTOR_ENABLED && !sec.twoFactorEnabled)
    todo.push({
      label: "Abilita la verifica in due passaggi",
      desc: "Aggiunge un secondo controllo all'accesso.",
      href: "/dashboard/security/2fa",
    });
  if (!sec.emailVerified)
    todo.push({
      label: "Conferma l'indirizzo email",
      desc: "Serve per il recupero dell'accesso.",
      href: "/dashboard/profile",
    });

  if (loading) {
    return (
      <>
        <div className="rm-area__intesta">
          <h1>Sicurezza</h1>
        </div>
        <div className="rm-card">
          <p className="rm-muted">Controllo delle protezioni in corso.</p>
        </div>
      </>
    );
  }

  const lastSignIn = fmtDate(sec.lastSignIn);

  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <h1>Sicurezza</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Protezioni attive sull&apos;utenza e registro degli accessi.
          </p>
        </div>
      </div>

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Livello di protezione</h3>
          <span className="rm-muted">Credenziali, email, verifica in due passaggi</span>
        </div>
        <p className="rm-dato">{sec.securityScore}%</p>
        <p className="rm-muted">
          {sec.securityScore >= 80
            ? "Protezioni complete."
            : sec.securityScore >= 60
            ? "Manca la verifica in due passaggi."
            : "Restano passaggi da completare, elencati sotto."}
        </p>

        <div className="rm-righe" style={{ marginTop: 16 }}>
          <div className="rm-riga">
            <span>Email confermata</span>
            <span className={sec.emailVerified ? "rm-stato rm-stato--ok" : "rm-stato rm-stato--fermo"}>
              {sec.emailVerified ? "Sì" : "No"}
            </span>
          </div>
          {TWO_FACTOR_ENABLED && (
            <div className="rm-riga">
              <span>Verifica in due passaggi</span>
              <span className={sec.twoFactorEnabled ? "rm-stato rm-stato--ok" : "rm-stato rm-stato--fermo"}>
                {sec.twoFactorEnabled ? "Attiva" : "Non attiva"}
              </span>
            </div>
          )}
          <div className="rm-riga">
            <span>Ultimo accesso</span>
            <span>{lastSignIn || "Non disponibile"}</span>
          </div>
        </div>
      </div>

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Gestione</h3>
        </div>
        <div className="rm-righe">
          <div className="rm-riga">
            <span>Password</span>
            <span>
              <Link href="/dashboard/security/password">Cambia la password</Link>
            </span>
          </div>
          {TWO_FACTOR_ENABLED && (
            <div className="rm-riga">
              <span>Verifica in due passaggi</span>
              <span>
                <Link href="/dashboard/security/2fa">
                  {sec.twoFactorEnabled ? "Gestisci la verifica" : "Attiva la verifica"}
                </Link>
              </span>
            </div>
          )}
          <div className="rm-riga">
            <span>Postazioni collegate</span>
            <span>
              <Link href="/dashboard/security/sessions">Vedi le sessioni attive</Link>
            </span>
          </div>
          <div className="rm-riga">
            <span>Registro eventi</span>
            <span>
              <Link href="/dashboard/security/audit">Accessi, password, verifiche</Link>
            </span>
          </div>
        </div>
      </div>

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Passaggi consigliati</h3>
        </div>
        {todo.length === 0 ? (
          <p className="rm-muted">
            Tutte le protezioni disponibili risultano attive.
          </p>
        ) : (
          <div className="rm-righe">
            {todo.map((t) => (
              <div key={t.href} className="rm-riga">
                <span>{t.desc}</span>
                <span>
                  <Link href={t.href}>{t.label}</Link>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
