// Guscio split (metà scuro / metà bianco) per le pagine pubbliche onboarding,
// stesso layout di /login: sinistra = pannello brand scuro, destra = contenuto su
// bianco. Usato da /configura, /pratica, /pratica/recupera.
'use client';

import Link from 'next/link';

const FEATURES = [
  'Integrazione RENTRI & SDI certificata',
  'Tracking soccorso & trasporti in tempo reale',
  'Magazzino ricambi TecDoc integrato',
  'App mobile per autisti inclusa',
];

export function OnboardingShell({
  panelTitle = 'Pochi passi e sei operativo',
  panelSubtitle = 'Carica la visura, conferma i dati e attiviamo la tua azienda. Ricevi l’esito entro 24 ore.',
  children,
}: {
  panelTitle?: string;
  panelSubtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* LEFT — pannello brand scuro */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-between p-12">
        <Link href="/" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={160} height={53} className="h-auto" />
        </Link>

        <div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Configurazione azienda</p>
          <h2 className="text-4xl font-extrabold text-white leading-[1.1] mb-4">{panelTitle}<span className="text-blue-500">.</span></h2>
          <p className="text-slate-400 text-base mb-10 max-w-sm">{panelSubtitle}</p>
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-blue-500 shrink-0" />
                <span className="text-sm text-slate-300">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">© {new Date().getFullYear()} RescueManager · rescuemanager.eu</p>
      </div>

      {/* RIGHT — contenuto su bianco (scrollabile se più alto della viewport) */}
      <div className="flex-1 bg-white overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 text-center">
              <Link href="/" className="inline-flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logos/logo-principale-a-colori.svg" alt="RescueManager" width={200} height={67} className="h-auto" />
              </Link>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
