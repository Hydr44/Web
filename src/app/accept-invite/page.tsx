/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiMail, FiUser, FiBriefcase, FiCheck, FiAlertCircle, FiLoader, FiShield } from 'react-icons/fi';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Proprietario',
  admin: 'Amministratore',
  manager: 'Responsabile',
  operator: 'Operatore',
  viewer: 'Visualizzatore',
};

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
      // Lettura pre-login via RPC SECURITY DEFINER (come il desktop): valida
      // stato 'pending' + scadenza server-side e restituisce anche il nome org.
      // Niente più letture dirette su `orgs` bloccate da RLS ("Org data: null").
      const { data, error: rpcError } = await supabase.rpc('verify_team_invite', { p_token: token });

      if (rpcError || !data?.success) {
        setError(data?.error || 'Invito non trovato o già utilizzato');
        setStep('error');
        return;
      }

      setInvite({
        id: data.id,
        org_id: data.org_id,
        role: data.role,
        email: data.email,
        orgName: data.org_name,
      });
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

      // Accettazione LATO SERVER: crea l'utente già confermato (niente mail di
      // conferma → niente errore SMTP, niente seconda email) + org_members col
      // ruolo dell'invito. Vedi /api/invite/accept.
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, fullName: fullName.trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Errore durante l\'accettazione dell\'invito');

      // Login automatico → poi dashboard. Se l'account esisteva già con un'altra
      // password, il login può fallire: mandiamo al login manuale.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: json.email || invite.email,
        password,
      });

      setStep('success');
      setTimeout(() => {
        router.push(signInError ? '/login' : '/dashboard');
      }, 1800);
    } catch (err: any) {
      console.error('Accept invite error:', err);
      setError(err.message || "Errore durante l'accettazione dell'invito");
    } finally {
      setAccepting(false);
    }
  }

  const Wordmark = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      <div className="h-8 w-8 rounded-lg bg-[#3B82F6] flex items-center justify-center">
        <FiShield className="h-4 w-4 text-white" />
      </div>
      <span className="text-lg font-bold tracking-tight text-white">RescueManager</span>
    </div>
  );

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#0A0E13] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );

  if (loading) {
    return (
      <Shell>
        <div className="text-center">
          <FiLoader className="w-10 h-10 text-[#3B82F6] animate-spin mx-auto mb-4" />
          <p className="text-[#9CA3AF] text-sm">Caricamento invito…</p>
        </div>
      </Shell>
    );
  }

  if (step === 'error') {
    return (
      <Shell>
        <Wordmark />
        <div className="bg-[#1C2128] border border-[#374151] p-8 text-center">
          <div className="w-14 h-14 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-7 h-7 text-[#EF4444]" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invito non valido</h1>
          <p className="text-[#9CA3AF] text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-sm font-medium rounded-lg transition-colors"
          >
            Vai al login
          </button>
        </div>
      </Shell>
    );
  }

  if (step === 'success') {
    return (
      <Shell>
        <Wordmark />
        <div className="bg-[#1C2128] border border-[#374151] p-8 text-center">
          <div className="w-14 h-14 bg-[#10B981]/10 border border-[#10B981]/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-7 h-7 text-[#10B981]" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Benvenuto nel team!</h1>
          <p className="text-[#9CA3AF] text-sm">
            Ti sei unito a <strong className="text-white">{invite?.orgName}</strong>. Reindirizzamento…
          </p>
        </div>
      </Shell>
    );
  }

  const InfoRow = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#374151] last:border-b-0">
      <div className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}1A`, color: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF]">{label}</p>
        <p className="text-sm font-medium text-white truncate">{value}</p>
      </div>
    </div>
  );

  return (
    <Shell>
      <Wordmark />

      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Unisciti al team</h1>
        <p className="text-[#9CA3AF] text-sm">
          Sei stato invitato in <strong className="text-white">{invite?.orgName}</strong>
        </p>
      </div>

      {/* Riepilogo invito */}
      <div className="bg-[#1C2128] border border-[#374151] mb-5">
        <InfoRow icon={<FiBriefcase className="h-4 w-4" />} label="Organizzazione" value={invite?.orgName || '—'} accent="#3B82F6" />
        <InfoRow icon={<FiMail className="h-4 w-4" />} label="Email" value={invite?.email || '—'} accent="#3B82F6" />
        <InfoRow icon={<FiUser className="h-4 w-4" />} label="Ruolo" value={ROLE_LABELS[invite?.role] || invite?.role || '—'} accent="#10B981" />
      </div>

      {/* Form registrazione */}
      <form onSubmit={handleAccept} className="bg-[#1C2128] border border-[#374151] p-6">
        <h2 className="text-base font-semibold text-white mb-4">Completa la registrazione</h2>

        {error && (
          <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg flex items-start gap-2">
            <FiAlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
            <p className="text-sm text-[#EF4444]">{error}</p>
          </div>
        )}

        <label className="block text-[13px] font-medium text-[#D1D5DB] mb-1.5">Nome completo</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Mario Rossi"
          className="w-full mb-4 px-3.5 py-2.5 bg-[#0A0E13] border border-[#374151] rounded-lg text-white text-sm placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]"
          required
        />

        <label className="block text-[13px] font-medium text-[#D1D5DB] mb-1.5">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimo 8 caratteri"
          className="w-full mb-4 px-3.5 py-2.5 bg-[#0A0E13] border border-[#374151] rounded-lg text-white text-sm placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]"
          required
          minLength={8}
        />

        <label className="block text-[13px] font-medium text-[#D1D5DB] mb-1.5">Conferma password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Ripeti la password"
          className="w-full mb-6 px-3.5 py-2.5 bg-[#0A0E13] border border-[#374151] rounded-lg text-white text-sm placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]"
          required
          minLength={8}
        />

        <button
          type="submit"
          disabled={accepting}
          className="w-full px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#374151] disabled:text-[#9CA3AF] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {accepting ? (
            <><FiLoader className="w-4 h-4 animate-spin" /> Registrazione…</>
          ) : (
            <><FiCheck className="w-4 h-4" /> Accetta invito e registrati</>
          )}
        </button>

        <p className="mt-4 text-xs text-[#6B7280] text-center">
          Accettando accetti i{' '}
          <a href="/terms" className="text-[#3B82F6] hover:underline">Termini</a>{' '}e la{' '}
          <a href="/privacy" className="text-[#3B82F6] hover:underline">Privacy</a>.
        </p>
      </form>
    </Shell>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0E13] flex items-center justify-center">
          <FiLoader className="w-8 h-8 text-[#3B82F6] animate-spin" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
