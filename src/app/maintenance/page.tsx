// src/app/maintenance/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manutenzione — RescueManager",
  description: "Il sito è temporaneamente in manutenzione. Torneremo presto online.",
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icona */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.13-5.12a2.25 2.25 0 010-3.18l.34-.35a2.25 2.25 0 013.18 0l1.59 1.6 1.59-1.6a2.25 2.25 0 013.18 0l.34.35a2.25 2.25 0 010 3.18l-5.13 5.12a.75.75 0 01-1.06 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12a9.75 9.75 0 11-19.5 0 9.75 9.75 0 0119.5 0z" />
          </svg>
        </div>

        {/* Testo */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">Sito in manutenzione</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Stiamo lavorando per migliorare il servizio.<br />
            Torneremo online il prima possibile.
          </p>
        </div>

        {/* Info */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Manutenzione in corso
        </div>

        {/* Logo */}
        <p className="text-xs text-slate-600 pt-4">RescueManager</p>
      </div>
    </div>
  );
}
