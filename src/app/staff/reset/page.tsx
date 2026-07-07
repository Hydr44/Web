/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { FiMail, FiLock, FiCheck, FiAlertCircle, FiLoader, FiShield, FiKey } from 'react-icons/fi';

const INPUT = 'w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-400 text-sm';
const LABEL = 'block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2';

function pwProblems(pw: string): string[] {
  const p: string[] = [];
  if (pw.length < 8) p.push('almeno 8 caratteri');
  if (!/[a-z]/.test(pw)) p.push('una minuscola');
  if (!/[A-Z]/.test(pw)) p.push('una maiuscola');
  if (!/\d/.test(pw)) p.push('un numero');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) p.push('un carattere speciale');
  return p;
}

export default function StaffResetPage() {
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Inserisci la tua email.'); return; }
    try {
      setLoading(true);
      await fetch('/api/staff/auth/password/forgot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Risposta sempre generica lato server (no enumeration) → avanza comunque.
      setStep('code');
    } catch {
      setStep('code'); // non riveliamo nulla, procedi allo step codice
    } finally {
      setLoading(false);
    }
  }

  async function doReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!code.trim()) { setError('Inserisci il codice ricevuto via email.'); return; }
    const problems = pwProblems(password);
    if (problems.length) { setError('La password deve contenere: ' + problems.join(', ') + '.'); return; }
    if (password !== confirm) { setError('Le password non corrispondono.'); return; }
    try {
      setLoading(true);
      const r = await fetch('/api/staff/auth/password/reset', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim(), password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.success) throw new Error(j?.error || 'Codice non valido o scaduto.');
      setStep('success');
    } catch (err: any) {
      setError(err?.message || 'Errore durante il reset.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6 text-gray-900">
          <FiShield className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-extrabold tracking-tight">RescueManager <span className="text-blue-600">Staff</span></span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          {step === 'success' ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3"><FiCheck className="w-6 h-6 text-emerald-500" /></div>
              <h1 className="text-lg font-bold text-gray-900 mb-1">Password aggiornata</h1>
              <p className="text-sm text-gray-500">Tutte le sessioni attive sono state disconnesse.</p>
              <p className="text-sm text-gray-700 mt-4">Apri l&apos;app <strong>RescueManager Admin</strong> e accedi con la nuova password.</p>
            </div>
          ) : step === 'email' ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Password dimenticata</h1>
              <p className="text-sm text-gray-500 mb-6">Inserisci la tua email staff: ti invieremo un codice per reimpostare la password.</p>
              <form onSubmit={requestCode} className="space-y-4">
                <div>
                  <label htmlFor="em" className={LABEL}>Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="em" type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT + ' pl-10'} placeholder="nome@rescuemanager.eu" autoComplete="email" />
                  </div>
                </div>
                {error && <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"><FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span></div>}
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg py-3 text-sm transition">
                  {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiMail className="w-4 h-4" />} Invia codice
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Nuova password</h1>
              <p className="text-sm text-gray-500 mb-6">Se l&apos;email è registrata, hai ricevuto un codice a 6 cifre. Inseriscilo e scegli la nuova password.</p>
              <form onSubmit={doReset} className="space-y-4">
                <div>
                  <label htmlFor="cd" className={LABEL}>Codice</label>
                  <div className="relative">
                    <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="cd" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className={INPUT + ' pl-10 tracking-[0.4em] font-mono'} placeholder="000000" />
                  </div>
                </div>
                <div>
                  <label htmlFor="np" className={LABEL}>Nuova password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="np" type="password" value={password} onChange={e => setPassword(e.target.value)} className={INPUT + ' pl-10'} placeholder="Almeno 8 caratteri" autoComplete="new-password" />
                  </div>
                  {password.length > 0 && pwProblems(password).length > 0 && (
                    <p className="text-[11px] text-amber-600 mt-1.5">Manca: {pwProblems(password).join(', ')}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="np2" className={LABEL}>Conferma password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="np2" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className={INPUT + ' pl-10'} placeholder="Ripeti la password" autoComplete="new-password" />
                  </div>
                </div>
                {error && <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"><FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span></div>}
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg py-3 text-sm transition">
                  {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheck className="w-4 h-4" />} Reimposta password
                </button>
                <button type="button" onClick={() => { setStep('email'); setError(''); }} className="w-full text-xs text-gray-500 hover:text-gray-700">← Cambia email</button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">RescueManager SRL · Pannello staff</p>
      </div>
    </div>
  );
}
