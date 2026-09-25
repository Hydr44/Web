// Guscio dell'accesso (mezzo blu a sinistra, contenuto a destra) per le pagine
// pubbliche di avvio: /configura, /pratica, /pratica/recupera. Stesso aspetto
// dell'applicazione per il computer: la cornice arriva da src/app/prodotto.css.
'use client';

import Link from 'next/link';

const FEATURES = [
  'Registri e formulari RENTRI',
  'Fatture elettroniche allo SDI',
  'Pratiche RVFU e radiazioni',
  'App per gli autisti, compresa nel canone',
];

// L'intestazione del sito e' fissa in alto e alta 112 px: la cornice parte sotto.

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
    <div className="rm-prod">
      <div className="rm-gate" >
        <aside className="rm-gate__lato">
          <Link href="/" className="inline-flex" style={{ textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={160} height={53} />
          </Link>

          <div>
            <h2>{panelTitle}</h2>
            <p style={{ marginTop: 14, maxWidth: '38ch' }}>{panelSubtitle}</p>
            <ul>
              {FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          <p style={{ fontSize: 12.5, color: 'var(--sidebar-muted)' }}>
            © {new Date().getFullYear()} RescueManager · rescuemanager.eu
          </p>
        </aside>

        {/* Contenuto: scorre da solo quando e' piu' alto della finestra. */}
        <main className="rm-gate__corpo" style={{ overflowY: 'auto', maxHeight: '100vh' }}>
          <div className="rm-gate__modulo" style={{ maxWidth: 448, marginBlock: 'auto' }}>
            <div className="lg:hidden">
              <Link href="/" className="inline-flex" style={{ textDecoration: 'none' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={150} height={50} />
              </Link>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
