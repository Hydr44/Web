// Stato Pratica (F5). Pubblica (token = public_uuid). È l'HUB del cliente dopo il
// pagamento: mostra lo stato e, se la configurazione non è completa, il tasto
// "Riprendi la pratica" che riporta al wizard allo step giusto. Niente accesso al
// resto finché non approvato.
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Status = {
  ok: boolean; step: 'pagamento' | 'carica' | 'in_verifica' | 'correzione' | 'attivato';
  label: string; company: string | null; quote_number: string | null; error?: string;
};

const STEP_UI: Record<string, { color: string; icon: string; desc: string; resume: boolean }> = {
  pagamento: { color: 'text-amber-400', icon: '⏳', desc: 'Completa il pagamento per procedere.', resume: false },
  carica: { color: 'text-blue-400', icon: '📋', desc: 'Completa la configurazione: carica la visura e conferma i dati.', resume: true },
  correzione: { color: 'text-amber-400', icon: '✏️', desc: 'Serve una correzione ai dati. Riprendi per aggiornarli e reinviare.', resume: true },
  in_verifica: { color: 'text-blue-400', icon: '🕓', desc: 'La tua pratica è in verifica. Riceverai l\'esito entro 24 ore.', resume: false },
  attivato: { color: 'text-emerald-400', icon: '✓', desc: 'Pratica approvata — stiamo attivando il tuo account.', resume: false },
};

export default function PraticaPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const [st, setSt] = useState<Status | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/quotes/${uuid}/pratica-status`);
      const d = await r.json();
      if (!d.ok) { setError(d.error || 'Pratica non trovata.'); return; }
      setSt(d);
    } catch { setError('Errore di rete.'); }
  }, [uuid]);

  useEffect(() => { load(); }, [load]);

  const ui = st ? STEP_UI[st.step] : null;

  return (
    <main className="min-h-screen bg-[#0b1220] text-slate-200 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-[#111827] border border-[#1f2937] rounded-2xl p-6">
        <p className="text-xs text-blue-400 font-semibold tracking-widest uppercase">RescueManager</p>
        <h1 className="text-xl font-semibold mt-1 mb-1">Stato della tua pratica</h1>
        {st?.company && <p className="text-sm text-slate-400">{st.company}{st.quote_number ? ` · ${st.quote_number}` : ''}</p>}

        {error && <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">{error}</div>}

        {st && ui && (
          <div className="mt-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{ui.icon}</span>
              <div>
                <p className={`text-base font-semibold ${ui.color}`}>{st.label}</p>
                <p className="text-sm text-slate-400 mt-0.5">{ui.desc}</p>
              </div>
            </div>
            {ui.resume && (
              <button onClick={() => router.push(`/configura/${uuid}`)}
                className="mt-5 w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium">
                Riprendi la pratica
              </button>
            )}
            {st.step === 'in_verifica' && (
              <button onClick={load} className="mt-5 w-full px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm">
                Aggiorna stato
              </button>
            )}
          </div>
        )}

        {!st && !error && <p className="mt-4 text-sm text-slate-400">Caricamento…</p>}

        <p className="text-[11px] text-slate-600 mt-6">Conserva questo link per controllare lo stato della tua pratica.</p>
      </div>
    </main>
  );
}
