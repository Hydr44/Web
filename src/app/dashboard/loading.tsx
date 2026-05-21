/**
 * Loading indicator per le route /dashboard/*.
 *
 * Volontariamente minimale: una sottile barra di progresso in alto invece
 * di un grande skeleton che "lampeggia" durante la navigazione. Questo
 * riduce il "scattoso" tra cambi pagina; la PageTransition nel layout
 * gestisce il fade del contenuto stesso.
 */
export default function Loading() {
  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden">
      <div className="h-full w-1/3 bg-blue-600 animate-[loading-bar_1.2s_ease-in-out_infinite]" />
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
