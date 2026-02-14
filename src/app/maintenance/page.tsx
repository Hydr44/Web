// src/app/maintenance/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manutenzione — RescueManager",
  description: "Il sito è temporaneamente in manutenzione. Torneremo presto online.",
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0c1929] via-[#111d2e] to-[#0c1929] px-4 relative overflow-hidden">
      {/* Background decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-lg w-full text-center space-y-8 relative z-10">
        {/* Icona wrench */}
        <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/20 flex items-center justify-center shadow-lg shadow-amber-500/5">
          <svg className="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L11.42 15.17a4 4 0 01-5.66-5.66l.1-.1a1.5 1.5 0 012.12 0l3.54 3.54a1.5 1.5 0 010 2.12zM15.17 11.42L15.17 11.42a4 4 0 015.66 5.66l-.1.1a1.5 1.5 0 01-2.12 0l-3.54-3.54a1.5 1.5 0 010-2.12z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.17 8L18 8M6 8L2.83 8M12 2.83L12 6M12 18L12 21.17" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.17 14.83L6 18M18 6L14.83 9.17" />
          </svg>
        </div>

        {/* Testo principale */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white tracking-tight">Sito in manutenzione</h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm mx-auto">
            Stiamo lavorando per migliorare il servizio.
            Torneremo online il prima possibile.
          </p>
        </div>

        {/* Badge stato */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/15 text-sm text-amber-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Manutenzione in corso
        </div>

        {/* Contatto */}
        <div className="pt-4 space-y-2">
          <p className="text-sm text-slate-500">Per informazioni contattaci</p>
          <a
            href="mailto:info@rescuemanager.eu"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            info@rescuemanager.eu
          </a>
        </div>

        {/* Footer brand */}
        <div className="pt-6 flex items-center justify-center gap-2">
          <div className="h-px w-8 bg-slate-700/50" />
          <span className="text-xs text-slate-600 font-medium tracking-wider uppercase">RescueManager</span>
          <div className="h-px w-8 bg-slate-700/50" />
        </div>
      </div>
    </div>
  );
}
