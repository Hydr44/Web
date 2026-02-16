'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ActivatePage() {
  const params = useParams();
  const token = params.token as string;
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string; org_name?: string; plan?: string; trial_days?: number; expires_at?: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/activate/${token}/info`)
      .then((r) => r.json())
      .then((info) => {
        if (info.ok && info.type === 'purchase' && info.redirect_url) {
          window.location.href = info.redirect_url;
          return;
        }
        if (info.ok && info.type === 'trial') {
          return fetch(`/api/activate/${token}`).then((r) => r.json());
        }
        setResult({ ok: false, error: info.error || 'Link non valido' });
      })
      .then((data) => {
        if (data && typeof data === 'object' && 'ok' in data) setResult(data);
      })
      .catch(() => setResult({ ok: false, error: 'Errore di connessione' }));
  }, [token]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Attivazione in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
        {result.ok ? (
          <>
            <div className="h-16 w-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-semibold text-slate-100 mb-2">Trial attivato</h1>
            <p className="text-slate-400 mb-6">{result.message}</p>
            {result.org_name && (
              <p className="text-sm text-slate-500 mb-2">
                Organizzazione: <span className="text-slate-300">{result.org_name}</span>
              </p>
            )}
            {result.plan && (
              <p className="text-sm text-slate-500 mb-2">
                Piano: <span className="text-slate-300">{result.plan}</span>
              </p>
            )}
            {result.trial_days && (
              <p className="text-sm text-slate-500 mb-6">
                Trial: <span className="text-slate-300">{result.trial_days} giorni</span>
                {result.expires_at && (
                  <span className="text-slate-500 ml-2">
                    (scade {new Date(result.expires_at).toLocaleDateString('it-IT')})
                  </span>
                )}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-xl font-semibold text-slate-100 mb-2">Attivazione non riuscita</h1>
            <p className="text-slate-400 mb-6">{result.error || 'Link non valido o scaduto.'}</p>
          </>
        )}
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
        >
          Vai alla dashboard
        </Link>
      </div>
    </div>
  );
}
