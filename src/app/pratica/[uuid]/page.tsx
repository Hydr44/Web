// Stato Pratica (F5). Pubblica (token = public_uuid). HUB del cliente dopo il
// pagamento: timeline dei passi + stato corrente + "Riprendi la pratica" se la
// configurazione non è completa. Layout split (metà scuro / metà bianco) come /login.
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/OnboardingShell';

type Step = 'pagamento' | 'carica' | 'in_verifica' | 'correzione' | 'attivato';
type Status = {
  ok: boolean; step: Step;
  label: string; company: string | null; quote_number: string | null; error?: string;
};

// Timeline dell'onboarding (4 tappe).
const TIMELINE: { label: string; desc: string }[] = [
  { label: 'Pagamento', desc: 'Preventivo pagato' },
  { label: 'Configurazione', desc: 'Visura e dati azienda' },
  { label: 'Verifica', desc: 'Controllo dei dati (entro 24h)' },
  { label: 'Attivazione', desc: 'Account attivo e pronto' },
];
function stepIndex(step: Step): number {
  if (step === 'pagamento') return 0;
  if (step === 'carica' || step === 'correzione') return 1;
  if (step === 'in_verifica') return 2;
  return 3; // attivato
}

const STEP_DESC: Record<Step, { color: string; desc: string; resume: boolean }> = {
  pagamento: { color: 'text-amber-600', desc: 'Completa il pagamento per procedere.', resume: false },
  carica: { color: 'text-blue-600', desc: 'Completa la configurazione: carica la visura e conferma i dati.', resume: true },
  correzione: { color: 'text-amber-600', desc: 'Serve una correzione ai dati. Riprendi per aggiornarli e reinviare.', resume: true },
  in_verifica: { color: 'text-blue-600', desc: 'La tua pratica è in verifica. Riceverai l\'esito entro 24 ore.', resume: false },
  attivato: { color: 'text-emerald-600', desc: 'Pratica approvata — stiamo attivando il tuo account.', resume: false },
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

  const ui = st ? STEP_DESC[st.step] : null;
  const current = st ? stepIndex(st.step) : -1;

  return (
    <OnboardingShell panelTitle="Ci siamo quasi" panelSubtitle="Qui segui lo stato della tua pratica. Appena approvata, attiviamo il tuo account.">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Stato pratica</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">Stato della tua pratica</h1>
        {st?.company && <p className="text-sm text-gray-500 mt-1">{st.company}{st.quote_number ? ` · ${st.quote_number}` : ''}</p>}

        {error && <div className="mt-4 px-3 py-2 bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

        {st && ui && (
          <div className="mt-6">
            {/* Stato corrente */}
            <div className="px-4 py-3 bg-gray-50 border border-gray-200">
              <p className={`text-sm font-semibold ${ui.color}`}>{st.label}</p>
              <p className="text-sm text-gray-500 mt-0.5">{ui.desc}</p>
            </div>

            {/* Timeline */}
            <ol className="mt-6">
              {TIMELINE.map((t, i) => {
                const done = i < current || st.step === 'attivato' && i <= current;
                const isCurrent = i === current && st.step !== 'attivato';
                const last = i === TIMELINE.length - 1;
                return (
                  <li key={t.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold
                        ${done ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-400'}`}>
                        {done ? (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        ) : i + 1}
                      </span>
                      {!last && <span className={`w-px flex-1 my-1 ${i < current ? 'bg-emerald-300' : 'bg-gray-200'}`} />}
                    </div>
                    <div className={`pb-5 ${last ? 'pb-0' : ''}`}>
                      <p className={`text-sm font-semibold ${done ? 'text-gray-900' : isCurrent ? 'text-blue-700' : 'text-gray-400'}`}>{t.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {ui.resume && (
              <button onClick={() => router.push(`/configura/${uuid}`)}
                className="mt-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors">
                Riprendi la pratica
              </button>
            )}
            {st.step === 'in_verifica' && (
              <button onClick={load} className="mt-3 w-full px-4 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm transition-colors">
                Aggiorna stato
              </button>
            )}

            {/* Prossimi passi / integrazioni */}
            <div className="mt-6 px-4 py-3 bg-blue-50/60 border border-blue-100">
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">Dopo l&apos;attivazione</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Configureremo insieme i moduli del tuo piano: RENTRI, fatturazione SDI, RVFU e le altre
                integrazioni. Riceverai le credenziali di accesso via email.
              </p>
            </div>
          </div>
        )}

        {!st && !error && <p className="mt-4 text-sm text-gray-500">Caricamento…</p>}

        <p className="text-[11px] text-gray-400 mt-6">Conserva questo link per controllare lo stato della tua pratica.</p>
      </div>
    </OnboardingShell>
  );
}
