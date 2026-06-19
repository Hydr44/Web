// Stato Pratica (F5). Pubblica (token = public_uuid). HUB del cliente dopo il
// pagamento: stato + "Riprendi la pratica" se la configurazione non è completa.
// Layout split (metà scuro / metà bianco) come /login.
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/OnboardingShell';

type Status = {
  ok: boolean; step: 'pagamento' | 'carica' | 'in_verifica' | 'correzione' | 'attivato';
  label: string; company: string | null; quote_number: string | null; error?: string;
};

const STEP_UI: Record<string, { color: string; dot: string; desc: string; resume: boolean }> = {
  pagamento: { color: 'text-amber-600', dot: 'bg-amber-500', desc: 'Completa il pagamento per procedere.', resume: false },
  carica: { color: 'text-blue-600', dot: 'bg-blue-500', desc: 'Completa la configurazione: carica la visura e conferma i dati.', resume: true },
  correzione: { color: 'text-amber-600', dot: 'bg-amber-500', desc: 'Serve una correzione ai dati. Riprendi per aggiornarli e reinviare.', resume: true },
  in_verifica: { color: 'text-blue-600', dot: 'bg-blue-500', desc: 'La tua pratica è in verifica. Riceverai l\'esito entro 24 ore.', resume: false },
  attivato: { color: 'text-emerald-600', dot: 'bg-emerald-500', desc: 'Pratica approvata — stiamo attivando il tuo account.', resume: false },
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
    <OnboardingShell panelTitle="Ci siamo quasi" panelSubtitle="Qui segui lo stato della tua pratica. Appena approvata, attiviamo il tuo account.">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Stato pratica</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">Stato della tua pratica</h1>
        {st?.company && <p className="text-sm text-gray-500 mt-1">{st.company}{st.quote_number ? ` · ${st.quote_number}` : ''}</p>}

        {error && <div className="mt-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

        {st && ui && (
          <div className="mt-6">
            <div className="flex items-start gap-3">
              <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${ui.dot}`} />
              <div>
                <p className={`text-base font-semibold ${ui.color}`}>{st.label}</p>
                <p className="text-sm text-gray-500 mt-0.5">{ui.desc}</p>
              </div>
            </div>
            {ui.resume && (
              <button onClick={() => router.push(`/configura/${uuid}`)}
                className="mt-6 w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors">
                Riprendi la pratica
              </button>
            )}
            {st.step === 'in_verifica' && (
              <button onClick={load} className="mt-3 w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm transition-colors">
                Aggiorna stato
              </button>
            )}
          </div>
        )}

        {!st && !error && <p className="mt-4 text-sm text-gray-500">Caricamento…</p>}

        <p className="text-[11px] text-gray-400 mt-6">Conserva questo link per controllare lo stato della tua pratica.</p>
      </div>
    </OnboardingShell>
  );
}
