// Wizard onboarding cliente (F5). Pubblico (token = public_uuid del preventivo).
// "Aiutaci a configurare la tua azienda": verifica email (OTP) → carica visura →
// analisi AI → conferma/modifica dati → invia in verifica. Ripresa nativa: lo step
// si deriva dallo stato persistito (pratica-status), non da state locale.
// Design allineato al sito (palette slate, accenti blu, font Sora).
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

// Acronimi forma giuridica (menù a tendina: niente diciture lunghe).
const FORME_GIURIDICHE = ['SRL', 'SRLS', 'SPA', 'SAPA', 'SNC', 'SAS', 'SS', 'Società cooperativa', 'Ditta individuale', 'Altro'];

type FieldType = 'text' | 'select';
const FIELDS: { key: string; label: string; span?: boolean; type?: FieldType; optional?: boolean; placeholder?: string }[] = [
  { key: 'ragione_sociale', label: 'Ragione sociale', span: true },
  { key: 'partita_iva', label: 'Partita IVA' },
  { key: 'codice_fiscale', label: 'Codice fiscale' },
  { key: 'pec', label: 'PEC', span: true },
  { key: 'forma_giuridica', label: 'Forma giuridica', type: 'select' },
  { key: 'codice_ateco', label: 'Codice ATECO', optional: true },
  { key: 'indirizzo', label: 'Indirizzo (via e numero)', span: true },
  { key: 'citta', label: 'Città' },
  { key: 'provincia', label: 'Provincia' },
  { key: 'cap', label: 'CAP' },
];

type Phase = 'loading' | 'confirming' | 'pagamento' | 'otp' | 'upload' | 'analyzing' | 'review' | 'submitting' | 'done' | 'elsewhere';

// ─── Componenti definiti FUORI dal componente pagina ───────────────────────────
// (se stessero dentro, ogni render li ricrea → React rimonta il sottoalbero e gli
//  input perdono il focus ad ogni carattere — il bug segnalato sull'OTP/verifica.)

function Shell({ company, children }: { company: string | null; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="bg-[#1e293b] border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl shadow-black/20">
          <p className="text-xs text-blue-400 font-semibold tracking-[0.2em] uppercase">RescueManager</p>
          <h1 className="text-xl sm:text-2xl font-semibold mt-1.5 text-white">Configura la tua azienda</h1>
          {company && <p className="text-sm text-slate-400 mt-1">{company}</p>}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </main>
  );
}

function Stepper({ active }: { active: 1 | 2 | 3 }) {
  const steps = ['Carica visura', 'Verifica dati', 'Invia'];
  return (
    <div className="flex items-center gap-2 mb-6 text-[11px]">
      {steps.map((t, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const on = step <= active;
        return (
          <div key={t} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${on ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>{step}</span>
            <span className={on ? 'text-slate-200' : 'text-slate-500'}>{t}</span>
            {i < steps.length - 1 && <span className="w-6 h-px bg-slate-700" />}
          </div>
        );
      })}
    </div>
  );
}

function CheckCircle() {
  return (
    <div className="w-12 h-12 rounded-full bg-emerald-500/15 mx-auto flex items-center justify-center mb-3">
      <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
      <div className="h-full bg-blue-500 rounded-full transition-[width] duration-300 ease-out" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

const primaryBtn = 'w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors';
const fieldCls = 'w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors';

export default function ConfiguraPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [company, setCompany] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pdfB64, setPdfB64] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [mismatch, setMismatch] = useState(false);
  const [notice, setNotice] = useState('');
  const [progress, setProgress] = useState(0);
  // OTP verifica email
  const [otpCode, setOtpCode] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpBusy, setOtpBusy] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  // Polling "confermando pagamento": timer + flag per non aggiornare lo stato dopo l'unmount.
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aliveRef = useRef(true);

  const loadStatus = useCallback(async (retry = 0) => {
    try {
      const r = await fetch(`/api/quotes/${uuid}/pratica-status`);
      const d = await r.json();
      if (!aliveRef.current) return;
      if (!d.ok) { setError(d.error || 'Pratica non trovata.'); setPhase('elsewhere'); return; }
      setCompany(d.company);
      if (d.step === 'pagamento') {
        // Arrivo dal checkout (?paid=1) ma il webhook può tardare qualche secondo →
        // mostra "confermando pagamento" e ripolla, invece di dire "paga".
        const justPaid = typeof window !== 'undefined' && window.location.search.includes('paid=1');
        if (justPaid && retry < 8) {
          setPhase('confirming');
          pollRef.current = setTimeout(() => loadStatus(retry + 1), 2500);
        } else {
          setPhase('pagamento');
        }
      } else if (d.step === 'carica' || d.step === 'correzione') {
        // Verifica email (anti-frode link inoltrato) prima dell'upload — salvo
        // ripresa sullo stesso dispositivo (cookie di sessione).
        const otp = await fetch(`/api/quotes/${uuid}/otp/status`).then(r => r.json()).catch(() => ({ verified: false }));
        if (!aliveRef.current) return;
        setPhase(otp.verified ? 'upload' : 'otp');
      } else {
        router.replace(`/pratica/${uuid}`); // in_verifica / attivato → pagina stato
      }
    } catch {
      if (!aliveRef.current) return;
      setError('Errore di rete.'); setPhase('elsewhere');
    }
  }, [uuid, router]);

  useEffect(() => {
    aliveRef.current = true;
    loadStatus();
    return () => { aliveRef.current = false; if (pollRef.current) clearTimeout(pollRef.current); };
  }, [loadStatus]);

  // Barra di avanzamento "finta" durante l'analisi AI (richiede qualche secondo).
  useEffect(() => {
    if (phase !== 'analyzing') { setProgress(0); return; }
    setProgress(10);
    const id = setInterval(() => setProgress(p => (p < 90 ? p + Math.max(1, (90 - p) * 0.08) : p)), 400);
    return () => clearInterval(id);
  }, [phase]);

  const sendOtp = useCallback(async () => {
    setOtpSent(true); setOtpError('');
    setOtpBusy('send');
    try {
      const r = await fetch(`/api/quotes/${uuid}/otp/send`, { method: 'POST' });
      const d = await r.json();
      if (!d.ok) setOtpError(d.error || 'Invio del codice non riuscito.');
      else setEmailMasked(d.email_masked || '');
    } catch {
      setOtpError('Errore di rete. Riprova.');
    } finally {
      setOtpBusy('');
    }
  }, [uuid]);

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otpCode)) { setOtpError('Inserisci il codice a 6 cifre.'); return; }
    setOtpBusy('verify'); setOtpError('');
    try {
      const r = await fetch(`/api/quotes/${uuid}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode }),
      });
      const d = await r.json();
      if (!d.ok) { setOtpError(d.error || 'Codice errato.'); setOtpCode(''); }
      else setPhase('upload');
    } catch {
      setOtpError('Errore di rete. Riprova.');
    } finally {
      setOtpBusy('');
    }
  };

  // Auto-invio del codice quando si entra nello step verifica (una sola volta).
  useEffect(() => {
    if (phase === 'otp' && !otpSent) sendOtp();
  }, [phase, otpSent, sendOtp]);

  const onFile = (file: File | null) => {
    setError('');
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Carica un file PDF.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Il PDF supera 10MB.'); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPdfB64(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!pdfB64) { setError('Carica prima la visura (PDF).'); return; }
    setPhase('analyzing'); setError(''); setNotice('');
    try {
      const r = await fetch(`/api/quotes/${uuid}/visura/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_base64: pdfB64 }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.error || 'Analisi non riuscita.'); setPhase('upload'); return; }
      const init: Record<string, string> = {};
      for (const f of FIELDS) init[f.key] = d.fields?.[f.key]?.v || '';
      setValues(init);
      setMismatch(!!d.piva_mismatch);
      if (d.not_a_visura) setNotice('Questo documento non sembra una visura camerale: controlla i dati a mano.');
      else if (d.low_confidence) setNotice('Non siamo riusciti a leggere tutto: controlla e completa i dati.');
      else setNotice('Abbiamo letto i tuoi dati dalla visura. Controlla che siano corretti.');
      setPhase('review');
    } catch {
      setError('Errore di rete.'); setPhase('upload');
    }
  };

  const submit = async () => {
    setPhase('submitting'); setError('');
    try {
      const r = await fetch(`/api/quotes/${uuid}/visura/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_base64: pdfB64, fields: values }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.error || 'Invio non riuscito.'); setPhase('review'); return; }
      setPhase('done');
    } catch {
      setError('Errore di rete.'); setPhase('review');
    }
  };

  if (phase === 'loading') return <Shell company={company}><p className="text-sm text-slate-400">Caricamento…</p></Shell>;
  if (phase === 'elsewhere') return <Shell company={company}><p className="text-sm text-red-400">{error || 'Pratica non disponibile.'}</p></Shell>;

  if (phase === 'confirming') return (
    <Shell company={company}>
      <div className="text-center py-6">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-white font-medium">Pagamento completato</p>
        <p className="text-sm text-slate-400 mt-1">Stiamo confermando il pagamento, un istante…</p>
      </div>
    </Shell>
  );

  if (phase === 'pagamento') return (
    <Shell company={company}>
      <p className="text-sm text-amber-400">Se hai appena pagato, attendi qualche minuto e aggiorna la pagina. Altrimenti completa prima il pagamento del preventivo.</p>
    </Shell>
  );

  if (phase === 'done') return (
    <Shell company={company}>
      <div className="text-center py-6">
        <CheckCircle />
        <h2 className="text-lg font-semibold text-white">Pratica inviata</h2>
        <p className="text-sm text-slate-400 mt-1">Riceverai l&apos;esito della verifica <b className="text-slate-200">entro 24 ore</b>.</p>
        <button onClick={() => router.replace(`/pratica/${uuid}`)} className={`${primaryBtn} mt-5`}>Vai allo stato della pratica</button>
      </div>
    </Shell>
  );

  if (phase === 'otp') return (
    <Shell company={company}>
      <div className="py-2">
        <h2 className="text-lg font-semibold text-white">Verifica la tua email</h2>
        <p className="text-sm text-slate-400 mt-1">
          Abbiamo inviato un codice a 6 cifre a{' '}
          <b className="text-slate-200">{emailMasked || 'la tua email'}</b>. Inseriscilo per continuare.
        </p>

        <div className="mt-5 max-w-xs">
          <input
            value={otpCode}
            onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') verifyOtp(); }}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            className="w-full text-center tracking-[0.5em] text-2xl font-semibold py-3 rounded-xl bg-[#0f172a] border border-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
          {otpError && <p className="mt-2 text-sm text-red-400">{otpError}</p>}

          <button onClick={verifyOtp} disabled={otpCode.length !== 6 || otpBusy === 'verify'} className={`${primaryBtn} mt-4`}>
            {otpBusy === 'verify' ? 'Verifica…' : 'Verifica e continua'}
          </button>
          <button onClick={sendOtp} disabled={otpBusy === 'send'} className="mt-3 w-full text-sm text-slate-400 hover:text-slate-200 disabled:opacity-50">
            {otpBusy === 'send' ? 'Invio in corso…' : 'Non hai ricevuto il codice? Reinvia'}
          </button>
        </div>
      </div>
    </Shell>
  );

  return (
    <Shell company={company}>
      <Stepper active={phase === 'review' || phase === 'submitting' ? 2 : 1} />
      {error && <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">{error}</div>}

      {(phase === 'upload' || phase === 'analyzing') && (
        <div>
          <p className="text-sm text-slate-300 mb-3">Carica la <b className="text-white">visura camerale</b> (PDF). La leggiamo automaticamente per precompilare i tuoi dati.</p>
          <label className={`block border-2 border-dashed rounded-xl p-6 text-center transition-colors ${phase === 'analyzing' ? 'border-slate-700 cursor-default' : 'border-slate-600 hover:border-blue-500/60 cursor-pointer'}`}>
            <input type="file" accept="application/pdf" className="hidden" onChange={e => onFile(e.target.files?.[0] || null)} disabled={phase === 'analyzing'} />
            <span className="text-sm text-slate-400">{fileName || 'Trascina o seleziona il PDF della visura'}</span>
          </label>

          {phase === 'analyzing' ? (
            <div className="mt-5">
              <ProgressBar value={progress} />
              <p className="text-sm text-slate-400 mt-2 text-center">Stiamo leggendo la visura… ci vuole qualche secondo.</p>
            </div>
          ) : (
            <button onClick={analyze} disabled={!pdfB64} className={`${primaryBtn} mt-4`}>Analizza la visura</button>
          )}
        </div>
      )}

      {(phase === 'review' || phase === 'submitting') && (
        <div>
          {notice && <p className="text-sm text-slate-300 mb-3">{notice}</p>}
          {mismatch && <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">La P.IVA della visura è diversa da quella del preventivo. Hai caricato il documento giusto?</div>}
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(f => (
              <div key={f.key} className={f.span ? 'col-span-2' : ''}>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                  {f.label}{f.optional && <span className="text-slate-600 normal-case tracking-normal"> (facoltativo)</span>}
                </label>
                {f.type === 'select' ? (
                  <select value={values[f.key] || ''} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} className={fieldCls}>
                    <option value="">— seleziona —</option>
                    {FORME_GIURIDICHE.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.key === 'indirizzo' ? (
                  <AddressAutocomplete
                    value={values.indirizzo || ''}
                    onChange={v => setValues(s => ({ ...s, indirizzo: v }))}
                    onPick={p => setValues(s => ({
                      ...s,
                      indirizzo: p.indirizzo || s.indirizzo,
                      citta: p.citta || s.citta,
                      provincia: p.provincia || s.provincia,
                      cap: p.cap || s.cap,
                    }))}
                    className={fieldCls}
                  />
                ) : (
                  <input value={values[f.key] || ''} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} className={fieldCls} placeholder={f.placeholder} />
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-3">Controlla i dati: se qualcosa non è corretto, modificalo prima di inviare.</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setPhase('upload')} className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700/40 text-sm transition-colors">Ricarica visura</button>
            <button onClick={submit} disabled={phase === 'submitting'}
              className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-colors">
              {phase === 'submitting' ? 'Invio…' : 'I dati sono corretti — invia in verifica'}
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}
