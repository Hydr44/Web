'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Stato = 'confermato' | 'annullato' | 'errore';

const MESSAGES: Record<Stato, { title: string; text: string; tone: 'ok' | 'neutral' | 'error' }> = {
  confermato: {
    title: 'Iscrizione confermata',
    text: 'Grazie! Da ora riceverai le novità di RescueManager: funzionalità, normativa (RENTRI, SDI, RVFU) e aggiornamenti.',
    tone: 'ok',
  },
  annullato: {
    title: 'Disiscrizione completata',
    text: 'Non riceverai più la nostra newsletter. Puoi reiscriverti quando vuoi dal sito.',
    tone: 'neutral',
  },
  errore: {
    title: 'Link non valido o scaduto',
    text: 'Non siamo riusciti a completare l\'operazione. Riprova a iscriverti dal sito.',
    tone: 'error',
  },
};

function Inner() {
  const sp = useSearchParams();
  const stato = (sp.get('stato') as Stato) || 'errore';
  const m = MESSAGES[stato] || MESSAGES.errore;

  const ring =
    m.tone === 'ok'
      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      : m.tone === 'error'
        ? 'bg-red-500/10 border-red-500/30 text-red-400'
        : 'bg-slate-500/10 border-slate-500/30 text-slate-300';

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-[#0c1929] px-4 overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-blue-600/10 blur-3xl" />
      <div className="relative w-full max-w-md text-center">
        <span className="text-lg font-extrabold tracking-tight text-white">
          RESCUE<span className="text-blue-500">MANAGER</span>
        </span>
        <div className="mt-7 rounded-2xl bg-[#141c27] border border-[#243044] shadow-xl shadow-black/30 p-8">
          <div className={`mx-auto w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${ring}`}>
            {m.tone === 'error' ? (
              <span className="text-2xl leading-none">!</span>
            ) : (
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-100 mb-2">{m.title}</h1>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">{m.text}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors no-underline"
          >
            Torna al sito
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function NewsletterStatusPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
