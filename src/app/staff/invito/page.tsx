/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiMail, FiLock, FiCheck, FiAlertCircle, FiLoader, FiShield } from 'react-icons/fi';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', admin: 'Admin', marketing: 'Marketing',
  sales: 'Sales', support: 'Supporto', staff: 'Staff',
};

const INPUT = 'w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-400 text-sm';
const LABEL = 'block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2';

// Requisiti allineati a validatePassword lato server.
function pwProblems(pw: string): string[] {
  const p: string[] = [];
  if (pw.length < 8) p.push('almeno 8 caratteri');
  if (!/[a-z]/.test(pw)) p.push('una minuscola');
  if (!/[A-Z]/.test(pw)) p.push('una maiuscola');
  if (!/\d/.test(pw)) p.push('un numero');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) p.push('un carattere speciale');
  return p;
}

function InvitoContent() {
  const token = useSearchParams().get('token');
  const [step, setStep] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setError('Link non valido (token mancante).'); setStep('error'); return; }
    (async () => {
      try {
        const r = await fetch(`/api/staff/invite/verify?token=${encodeURIComponent(token)}`);
        const j = await r.json().catch(() => ({}));
        if (!j?.valid) { setError(j?.error || 'Invito non valido o scaduto.'); setStep('error'); return; }
        setEmail(j.email); setRole(j.role); setStep('form');
      } catch {
        setError('Errore di rete durante la verifica dell\'invito.'); setStep('error');
      }
    })();
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const problems = pwProblems(password);
    if (problems.length) { setError('La password deve contenere: ' + problems.join(', ') + '.'); return; }
    if (password !== confirm) { setError('Le password non corrispondono.'); return; }
    try {
      setSubmitting(true);
      const r = await fetch('/api/staff/invite/accept', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.success) throw new Error(j?.error || 'Errore durante l\'attivazione.');
      setStep('success');
    } catch (err: any) {
      setError(err?.message || 'Errore durante l\'attivazione.');
    } finally {
      setSubmitting(false);
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
          {step === 'loading' && (
            <div className="flex flex-col items-center py-8 text-gray-500">
              <FiLoader className="w-7 h-7 animate-spin mb-3" />
              <p className="text-sm">Verifico l&apos;invito…</p>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3"><FiAlertCircle className="w-6 h-6 text-red-500" /></div>
              <h1 className="text-lg font-bold text-gray-900 mb-1">Invito non valido</h1>
              <p className="text-sm text-gray-500">{error}</p>
              <p className="text-xs text-gray-400 mt-4">Chiedi a un amministratore di reinviarti l&apos;invito.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3"><FiCheck className="w-6 h-6 text-emerald-500" /></div>
              <h1 className="text-lg font-bold text-gray-900 mb-1">Account attivato</h1>
              <p className="text-sm text-gray-500">La tua email è verificata e la password è impostata.</p>
              <p className="text-sm text-gray-700 mt-4">Ora apri l&apos;app <strong>RescueManager Admin</strong> e accedi con <strong>{email}</strong> e la password appena scelta.</p>
            </div>
          )}

          {step === 'form' && (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Imposta il tuo accesso</h1>
              <p className="text-sm text-gray-500 mb-6">Verifica l&apos;email e scegli una password per attivare il tuo account staff.</p>

              <div className="flex items-center gap-2 mb-2 text-sm text-gray-700"><FiMail className="w-4 h-4 text-gray-400" /><span className="font-medium">{email}</span></div>
              <div className="inline-flex items-center gap-1.5 mb-6 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                <FiShield className="w-3.5 h-3.5" /> {ROLE_LABELS[role] || role}
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label htmlFor="pw" className={LABEL}>Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="pw" type="password" value={password} onChange={e => setPassword(e.target.value)} className={INPUT + ' pl-10'} placeholder="Almeno 8 caratteri" autoComplete="new-password" />
                  </div>
                  {password.length > 0 && pwProblems(password).length > 0 && (
                    <p className="text-[11px] text-amber-600 mt-1.5">Manca: {pwProblems(password).join(', ')}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="pw2" className={LABEL}>Conferma password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="pw2" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className={INPUT + ' pl-10'} placeholder="Ripeti la password" autoComplete="new-password" />
                  </div>
                </div>

                {error && <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"><FiAlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span></div>}

                <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg py-3 text-sm transition">
                  {submitting ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheck className="w-4 h-4" />} Attiva il mio account
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">RescueManager SRL · Pannello staff</p>
      </div>
    </div>
  );
}

export default function StaffInvitoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><FiLoader className="w-7 h-7 animate-spin text-gray-400" /></div>}>
      <InvitoContent />
    </Suspense>
  );
}
