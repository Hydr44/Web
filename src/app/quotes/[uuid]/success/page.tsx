'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Loader2, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';

export default function QuoteSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }
    // Piccolo delay per dare tempo al webhook di processare
    const timer = setTimeout(() => setStatus('success'), 2000);
    return () => clearTimeout(timer);
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 font-medium">Confermando il pagamento...</p>
          <p className="text-slate-500 text-sm mt-1">Attendi un momento</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="text-center max-w-md px-6">
          <p className="text-red-400 mb-4">Sessione non valida.</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
            Torna al sito
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-emerald-400" />
        </div>

        <h1 className="text-3xl font-bold text-slate-100 mb-3">
          Pagamento Completato!
        </h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Il tuo abbonamento RescueManager è stato attivato con successo.
          Riceverai a breve una email con le istruzioni per accedere alla piattaforma.
        </p>

        {/* Info Cards */}
        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Email di Attivazione</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Controlla la tua casella email per le credenziali di accesso.
                Se non la ricevi entro pochi minuti, controlla lo spam.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <ArrowRight className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Prossimi Passi</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Il nostro team ti contatterà per guidarti nell&apos;onboarding
                e configurazione iniziale della piattaforma.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm">
            Accedi alla Piattaforma <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm border border-slate-600/50">
            Torna al Sito
          </Link>
        </div>

        <p className="text-xs text-slate-600 mt-8">
          Per assistenza: <a href="mailto:info@rescuemanager.eu" className="text-slate-500 hover:text-slate-400">info@rescuemanager.eu</a>
        </p>
      </div>
    </div>
  );
}
