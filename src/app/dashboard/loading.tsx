/**
 * Indicatore di caricamento per le rotte /dashboard/*.
 *
 * Volontariamente minimale: una sottile barra di avanzamento in alto invece
 * di un grande scheletro che "lampeggia" durante la navigazione. Questo
 * riduce lo scatto fra un cambio pagina e l'altro; la PageTransition nel
 * layout gestisce la dissolvenza del contenuto.
 *
 * Il blu e' quello del prodotto (`--brand` di prodotto.css), con ripiego per
 * i casi in cui la barra venga montata fuori dalla cornice `rm-prod`.
 */
export default function Loading() {
  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden">
      <div
        className="h-full w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite]"
        style={{ background: "var(--brand, #005dfa)" }}
      />
      <style>{`
        @keyframes loading-bar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
