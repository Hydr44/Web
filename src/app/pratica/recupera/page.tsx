// Recupero stato pratica via OTP (F5). Il cliente senza account inserisce l'email →
// riceve un codice → lo inserisce → viene portato allo stato della sua pratica.
// Layout split come /login.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingShell } from '@/components/OnboardingShell';

const inputCls = 'w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none';
const btnCls = 'mt-4 w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50 transition-colors';

export default function RecuperaPraticaPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const sendCode = async () => {
    setError('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError('Inserisci un indirizzo email valido.'); return; }
    setBusy('send');
    try {
      const r = await fetch('/api/pratica/recover', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await r.json();
      if (!d.ok && d.error) { setError(d.error); return; }
      setEmailMasked(d.email_masked || '');
      setStep('otp');
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setBusy('');
    }
  };

  const verifyCode = async () => {
    setError('');
    if (!/^\d{6}$/.test(code)) { setError('Inserisci il codice a 6 cifre.'); return; }
    setBusy('verify');
    try {
      const r = await fetch('/api/pratica/recover/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const d = await r.json();
      if (!d.ok) { setError(d.error || 'Codice errato.'); setCode(''); return; }
      router.push(`/pratica/${d.uuid}`);
    } catch {
      setError('Errore di rete. Riprova.');
    } finally {
      setBusy('');
    }
  };

  return (
    <OnboardingShell panelTitle="Ritrova la tua pratica" panelSubtitle="Inserisci l’email del preventivo: ti inviamo un codice e accedi allo stato.">
      <div key={step} className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Stato pratica</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a]">Controlla lo stato</h1>

        {step === 'email' ? (
          <>
            <p className="text-sm text-gray-500 mt-1 mb-6">Inserisci l&apos;email usata per il preventivo: ti inviamo un codice di verifica.</p>
            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') sendCode(); }}
              placeholder="nome@azienda.it"
              className={inputCls}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button onClick={sendCode} disabled={busy === 'send'} className={btnCls}>
              {busy === 'send' ? 'Invio…' : 'Invia il codice'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Se esiste una pratica con <b className="text-gray-700">{emailMasked || 'questa email'}</b>, ti abbiamo inviato un codice a 6 cifre. Inseriscilo qui.
            </p>
            <input
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') verifyCode(); }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              className="w-full text-center tracking-[0.5em] text-2xl font-semibold py-3 rounded-lg bg-white border border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <button onClick={verifyCode} disabled={code.length !== 6 || busy === 'verify'} className={btnCls}>
              {busy === 'verify' ? 'Verifica…' : 'Accedi allo stato pratica'}
            </button>
            <button onClick={sendCode} disabled={busy === 'send'} className="mt-3 w-full text-sm text-gray-500 hover:text-gray-800 disabled:opacity-50">
              {busy === 'send' ? 'Invio…' : 'Non hai ricevuto il codice? Reinvia'}
            </button>
          </>
        )}
      </div>
    </OnboardingShell>
  );
}
