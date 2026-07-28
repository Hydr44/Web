/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiMail, FiUser, FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietario',
  admin: 'Amministratore',
  manager: 'Responsabile',
  operator: 'Operatore',
  viewer: 'Visualizzatore',
};

const INPUT_CLASS =
  'w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm';
const LABEL_CLASS = 'block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'loading' | 'register' | 'success' | 'error'>('loading');

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accepting, setAccepting] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!token) {
      setError('Link invito non valido (token mancante)');
      setStep('error');
      setLoading(false);
      return;
    }
    loadInvite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadInvite() {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc('verify_team_invite', { p_token: token });
      if (rpcError || !data?.success) {
        setError(data?.error || 'Invito non trovato o già utilizzato');
        setStep('error');
        return;
      }
      setInvite({ id: data.id, org_id: data.org_id, role: data.role, email: data.email, orgName: data.org_name });
      setStep('register');
    } catch (err: any) {
      console.error('Error loading invite:', err);
      setError("Errore durante il caricamento dell'invito");
      setStep('error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return setError('Inserisci il tuo nome completo');
    if (password.length < 8) return setError('La password deve essere di almeno 8 caratteri');
    if (password !== confirmPassword) return setError('Le password non corrispondono');

    try {
      setAccepting(true);
      setError('');
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, fullName: fullName.trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Errore durante l'accettazione dell'invito");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: json.email || invite.email,
        password,
      });
      setStep('success');
      setTimeout(() => router.push(signInError ? '/login' : '/dashboard'), 1800);
    } catch (err: any) {
      console.error('Accept invite error:', err);
      setError(err.message || "Errore durante l'accettazione dell'invito");
    } finally {
      setAccepting(false);
    }
  }

  // — Stati semplici (no split) —
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-9 w-9 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0f172a] mb-2">Invito non valido</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button onClick={() => router.push('/login')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors">
            Vai al login
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-7 h-7 text-green-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0f172a] mb-2">Benvenuto nel team!</h1>
          <p className="text-sm text-gray-500">
            Ti sei unito a <strong className="text-gray-900">{invite?.orgName}</strong>. Reindirizzamento…
          </p>
        </div>
      </div>
    );
  }

  // — Registrazione: split scuro/bianco come il login —
  return (
    <div className="min-h-screen flex">
      {/* LEFT — brand panel (scuro) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-between p-12">
        <a href="/" className="inline-flex items-center">
          <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={160} height={53} className="h-auto" />
        </a>
        <div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Invito al team</p>
          <h2 className="text-4xl font-extrabold text-white leading-[1.1] mb-4">
            Unisciti a<br />{invite?.orgName}<span className="text-blue-500">.</span>
          </h2>
          <p className="text-slate-400 text-base mb-10 max-w-sm">
            Completa la registrazione per accedere alla piattaforma del tuo team.
          </p>
          <div className="space-y-3">
            {[
              'Soccorso & trasporti e tracking GPS',
              'Magazzino ricambi TecDoc',
              'RENTRI, SDI e RVFU integrati',
              'App mobile per autisti inclusa',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-blue-500 shrink-0" />
                <span className="text-sm text-slate-300">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-600">© {new Date().getFullYear()} RescueManager · rescuemanager.eu</p>
      </div>

      {/* RIGHT — form panel (bianco) */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 text-center">
            <img src="/assets/logos/logo-principale-a-colori.svg" alt="RescueManager" width={200} height={67} className="h-auto inline-block" />
          </div>

          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Invito</p>
          <h1 className="text-3xl font-extrabold text-[#0f172a] mb-1">Unisciti al team</h1>
          <p className="text-sm text-gray-500 mb-6">
            Sei stato invitato in <strong className="text-gray-900">{invite?.orgName}</strong>.
          </p>

          {/* Riepilogo invito */}
          <div className="mb-6 border border-gray-200">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
              <FiMail className="h-4 w-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900 truncate">{invite?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <FiUser className="h-4 w-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-gray-400">Ruolo</p>
                <p className="text-sm font-medium text-gray-900">{ROLE_LABELS[invite?.role] || invite?.role}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleAccept} className="space-y-5">
            <div>
              <label htmlFor="ai-name" className={LABEL_CLASS}>Nome completo</label>
              <input id="ai-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={INPUT_CLASS} placeholder="Mario Rossi" required />
            </div>
            <div>
              <label htmlFor="ai-pwd" className={LABEL_CLASS}>Password</label>
              <input id="ai-pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT_CLASS} placeholder="Minimo 8 caratteri" required minLength={8} />
            </div>
            <div>
              <label htmlFor="ai-pwd2" className={LABEL_CLASS}>Conferma password</label>
              <input id="ai-pwd2" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={INPUT_CLASS} placeholder="Ripeti la password" required minLength={8} />
            </div>
            <button
              type="submit"
              disabled={accepting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {accepting ? (
                <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" /> Registrazione…</>
              ) : (
                'Accetta invito e registrati'
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-400 text-center">
            Accettando accetti i{' '}
            <a href="/terms" className="text-blue-600 hover:underline">Termini</a>{' '}e la{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
