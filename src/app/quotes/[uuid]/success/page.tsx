'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';

export default function QuoteSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }
    const timer = setTimeout(() => setStatus('success'), 2000);
    return () => clearTimeout(timer);
  }, [sessionId]);

  const BrandHeader = () => (
    <header className="bg-[#0f172a] border-b border-slate-800">
      <div className="max-w-3xl mx-auto px-6 py-4">
        <Link href="/" className="text-lg font-extrabold text-white tracking-tight">
          RESCUE<span className="text-blue-500">MANAGER</span>
        </Link>
      </div>
    </header>
  );

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col">
        <BrandHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-300 font-medium">Confermando il pagamento...</p>
            <p className="text-slate-500 text-sm mt-1">Attendi un momento</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col">
        <BrandHeader />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Errore</p>
            <p className="text-white font-bold text-xl mb-2">Sessione non valida</p>
            <p className="text-slate-400 text-sm mb-6">Il link di conferma non è valido o è già stato utilizzato.</p>
            <Link href="/" className="text-sm text-blue-500 font-bold hover:underline">
              ← Torna al sito
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      <BrandHeader />

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full">
          {/* Success mark */}
          <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mb-8">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>

          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Pagamento confermato</p>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Il tuo account<br />è attivo<span className="text-blue-500">.</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10">
            Il tuo abbonamento RescueManager è stato attivato con successo.
            Riceverai a breve una email con le istruzioni di accesso.
          </p>

          {/* Info blocks */}
          <div className="space-y-3 mb-10">
            <div className="flex items-start gap-4 p-5 bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">Email di Attivazione</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Controlla la tua casella email per le credenziali di accesso.
                  Se non la ricevi entro pochi minuti, controlla la cartella spam.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 bg-blue-600/20 border border-blue-600/30 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowRight className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">Prossimi Passi</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Il nostro team ti contatterà per guidarti nell&apos;onboarding
                  e nella configurazione iniziale della piattaforma.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors uppercase tracking-wide">
              Accedi a RescueManager <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm">
              Torna al Sito
            </Link>
          </div>

          <p className="text-xs text-slate-600 mt-8">
            Per assistenza:{' '}
            <a href="mailto:info@rescuemanager.eu" className="text-slate-500 hover:text-slate-400">
              info@rescuemanager.eu
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
