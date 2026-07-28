"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TWO_FACTOR_ENABLED } from "@/lib/feature-2fa";
import {
  Shield,
  Key,
  Smartphone,
  Monitor,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

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

  const scoreColor = (s: number) =>
    s >= 80 ? "text-emerald-600" : s >= 60 ? "text-amber-600" : "text-red-600";
  const scoreBar = (s: number) =>
    s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-amber-500" : "bg-red-500";

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
      label: "Abilita l'autenticazione a due fattori",
      desc: "Aggiunge un secondo livello di protezione all'accesso.",
      href: "/dashboard/security/2fa",
    });
  if (!sec.emailVerified)
    todo.push({
      label: "Verifica l'indirizzo email",
      desc: "Conferma la tua email per proteggere il recupero dell'account.",
      href: "/dashboard/profile",
    });

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="w-64 h-4 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="p-6 bg-white border border-gray-100 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="w-40 h-5 bg-gray-200 rounded animate-pulse" />
                <div className="w-64 h-4 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full animate-pulse mb-4" />
          <div className="w-1/3 h-4 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 bg-white border border-gray-100 rounded-lg space-y-4">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="w-2/3 h-5 bg-gray-200 rounded animate-pulse" />
                  <div className="w-full h-3 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const lastSignIn = fmtDate(sec.lastSignIn);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Sicurezza</h1>
        <p className="text-gray-500">Monitora e gestisci la sicurezza del tuo account.</p>
      </header>

      {/* Security Score */}
      <div className="p-5 bg-white border border-gray-200 rounded">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center">
              <Shield className="h-4 w-4 text-gray-700" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Score sicurezza</h2>
              <p className="text-xs text-gray-500">Credenziali, email verificata e 2FA</p>
            </div>
          </div>
          <div className={`text-2xl font-semibold tabular-nums ${scoreColor(sec.securityScore)}`}>
            {sec.securityScore}%
          </div>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${scoreBar(sec.securityScore)}`}
            style={{ width: `${sec.securityScore}%` }}
          />
        </div>

        <p className="text-xs text-gray-500">
          {sec.securityScore >= 80
            ? "Ottimo: il tuo account è ben protetto."
            : sec.securityScore >= 60
            ? "Buono — abilita il 2FA per la protezione massima."
            : "Attenzione: completa i passaggi consigliati qui sotto."}
        </p>
        {lastSignIn && (
          <p className="text-xs text-gray-400 mt-2">Ultimo accesso: {lastSignIn}</p>
        )}
      </div>

      {/* Quick Actions — tiles uniformi, neutre */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/dashboard/security/password"
          className="p-5 bg-white border border-gray-200 rounded hover:border-gray-300 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center">
              <Key className="h-4 w-4 text-gray-700" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">Password</h3>
              <p className="text-xs text-gray-500">Cambia la password</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Gestione credenziali</span>
            <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-700 transition-colors" />
          </div>
        </Link>

        {TWO_FACTOR_ENABLED && (
        <Link
          href="/dashboard/security/2fa"
          className="p-5 bg-white border border-gray-200 rounded hover:border-gray-300 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-gray-700" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">2FA</h3>
              <p className="text-xs text-gray-500">Due fattori (TOTP)</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${sec.twoFactorEnabled ? "text-emerald-700" : "text-amber-700"}`}>
              {sec.twoFactorEnabled ? "Abilitato" : "Non abilitato"}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-700 transition-colors" />
          </div>
        </Link>
        )}

        <Link
          href="/dashboard/security/sessions"
          className="p-5 bg-white border border-gray-200 rounded hover:border-gray-300 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center">
              <Monitor className="h-4 w-4 text-gray-700" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">Sessioni</h3>
              <p className="text-xs text-gray-500">Dispositivi attivi</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Gestisci dispositivi</span>
            <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-700 transition-colors" />
          </div>
        </Link>

        <Link
          href="/dashboard/security/audit"
          className="p-5 bg-white border border-gray-200 rounded hover:border-gray-300 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center">
              <Shield className="h-4 w-4 text-gray-700" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">Audit log</h3>
              <p className="text-xs text-gray-500">Eventi account</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Login · password · 2FA</span>
            <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-700 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Azioni consigliate — dinamiche sui segnali reali */}
      <div className="p-6 bg-white border border-gray-200 rounded">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Migliora la sicurezza</h2>
        <p className="text-sm text-gray-500 mb-5">
          {todo.length === 0
            ? "Hai attivato tutte le protezioni disponibili."
            : `${todo.length} ${todo.length === 1 ? "azione consigliata" : "azioni consigliate"} per rafforzare l'account.`}
        </p>

        {todo.length === 0 ? (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-800">
              Account protetto: 2FA attivo ed email verificata.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {todo.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded hover:border-gray-300 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-700 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
