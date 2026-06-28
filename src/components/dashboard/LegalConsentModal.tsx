"use client";

import { useEffect, useState } from "react";
import { LEGAL_DOCS } from "@/lib/legal";
import { ShieldCheck, ExternalLink, Loader2, AlertTriangle } from "lucide-react";

type LegalStatus = { needsConsent: boolean; version: string; effective_date: string };

/**
 * Modale BLOCCANTE di (ri)consenso ai documenti legali. Compare quando l'utente
 * non ha ancora accettato la versione corrente (nuovo utente o policy
 * aggiornata). Non si può chiudere senza accettare: la dashboard resta sotto
 * l'overlay finché non si clicca "Accetto".
 */
export default function LegalConsentModal() {
  const [status, setStatus] = useState<LegalStatus | null>(null);
  const [checked, setChecked] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/legal")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.needsConsent) {
          setStatus({ needsConsent: true, version: d.version, effective_date: d.effective_date });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const accept = async () => {
    setAccepting(true);
    setErr(null);
    try {
      const res = await fetch("/api/legal", { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Errore durante la registrazione del consenso");
      }
      setStatus(null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Errore durante la registrazione del consenso");
      setAccepting(false);
    }
  };

  if (!status?.needsConsent) return null;

  const effective = (() => {
    try {
      return new Date(status.effective_date).toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return status.effective_date;
    }
  })();

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-7">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Condizioni aggiornate</h2>
            <p className="text-xs text-gray-500">Versione {status.version} · in vigore dal {effective}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Abbiamo aggiornato i nostri documenti legali. Per continuare a usare RescueManager
          ti chiediamo di prenderne visione e di accettarli.
        </p>

        <div className="space-y-2 mb-4">
          {LEGAL_DOCS.map((d) => (
            <a
              key={d.key}
              href={d.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 px-3 py-2 rounded border border-gray-200 hover:border-gray-300 transition-colors text-sm text-gray-800"
            >
              <span>{d.title}</span>
              <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            </a>
          ))}
        </div>

        <label className="flex items-start gap-2.5 mb-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Dichiaro di aver letto e di accettare l&apos;Informativa Privacy, la Cookie Policy,
            i Termini di Servizio e l&apos;Accordo sul Trattamento dei Dati (versione {status.version}).
          </span>
        </label>

        {err && (
          <div className="mb-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {err}
          </div>
        )}

        <button
          onClick={accept}
          disabled={!checked || accepting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {accepting ? "Registro…" : "Accetto e continuo"}
        </button>
      </div>
    </div>
  );
}
