"use client";

/**
 * DemoLanding — vista web minimale per utenti con `orgs.is_demo=true`.
 *
 * Sostituisce completamente la dashboard normale (niente sidebar, niente
 * billing/invoices/activity/org settings). Lo scopo è canalizzare il
 * cliente demo verso due sole azioni:
 *   1. Scaricare la desktop app per esplorare la demo
 *   2. Aprire il preventivo che gli abbiamo inviato (CTA acquisto)
 *
 * Il routing forzato è in `dashboard/layout.tsx`: qualsiasi sub-route
 * di /dashboard viene redirezionata a /dashboard se l'org è demo.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { Download, FileText, LogOut, ExternalLink, Clock } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface Props {
  userEmail: string;
  orgName: string;
  quoteUuid: string | null;
  expiresAt: string | null;
}

function formatExpiry(iso: string | null): { label: string; tone: "ok" | "warn" | "expired" } {
  if (!iso) return { label: "—", tone: "ok" };
  const exp = new Date(iso);
  const now = new Date();
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const dateStr = exp.toLocaleDateString("it-IT", {
    day: "2-digit", month: "long", year: "numeric"
  });
  if (diffMs < 0) return { label: `Scaduta il ${dateStr}`, tone: "expired" };
  if (diffDays <= 2) return { label: `Scade tra ${diffDays + 1} giorn${diffDays + 1 === 1 ? "o" : "i"} (${dateStr})`, tone: "warn" };
  return { label: `Scade il ${dateStr} (${diffDays + 1} giorni)`, tone: "ok" };
}

export default function DemoLanding({ userEmail, orgName, quoteUuid, expiresAt }: Props) {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = supabaseBrowser();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      setSigningOut(false);
    }
  };

  const expiry = formatExpiry(expiresAt);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 mb-4">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Account Demo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Benvenuto{orgName ? `, ${orgName}` : ""}!
          </h1>
          <p className="text-gray-600">
            Questa è la tua area demo. Per esplorare il software scarica la desktop app, oppure consulta il preventivo che ti abbiamo inviato per attivare l'account definitivo.
          </p>
          {expiresAt && (
            <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${
              expiry.tone === "expired" ? "bg-red-50 text-red-700 border border-red-200" :
              expiry.tone === "warn" ? "bg-amber-50 text-amber-700 border border-amber-200" :
              "bg-slate-100 text-slate-700 border border-slate-200"
            }`}>
              <Clock className="h-3.5 w-3.5" />
              {expiry.label}
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Download desktop */}
          <Link
            href="/download"
            className="group block bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Scarica desktop app</h2>
            <p className="text-sm text-gray-600 mb-4">
              L'app desktop è dove succede tutto: soccorso & trasporti, clienti, mezzi, fatture, RVFU, RENTRI. In demo puoi esplorare senza inviare nulla davvero.
            </p>
            <div className="text-xs text-blue-600 font-semibold group-hover:underline">
              Windows · macOS · Linux →
            </div>
          </Link>

          {/* Preventivo */}
          {quoteUuid ? (
            <Link
              href={`/quotes/${quoteUuid}`}
              className="group block bg-white border border-gray-200 rounded-xl p-6 hover:border-emerald-400 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Il tuo preventivo</h2>
              <p className="text-sm text-gray-600 mb-4">
                Configurazione e prezzo personalizzati per la tua azienda. Da qui puoi accettare e procedere al pagamento per attivare l'account produzione.
              </p>
              <div className="text-xs text-emerald-600 font-semibold group-hover:underline">
                Apri preventivo →
              </div>
            </Link>
          ) : (
            <div className="block bg-white border border-gray-200 rounded-xl p-6 opacity-70">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-700 mb-1">Preventivo in arrivo</h2>
              <p className="text-sm text-gray-500 mb-4">
                Il tuo contatto commerciale ti invierà a breve una proposta personalizzata. Nel frattempo esplora la demo dalla desktop app.
              </p>
              <div className="text-xs text-gray-400 font-medium">
                Nessun preventivo disponibile
              </div>
            </div>
          )}
        </div>

        {/* Footer minimal */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="truncate">
            Connesso come <span className="font-mono text-gray-700">{userEmail}</span>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            {signingOut ? "Uscita..." : "Esci"}
          </button>
        </div>
      </div>
    </div>
  );
}
