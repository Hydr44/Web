/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FiMail, FiUser, FiLock, FiCheck, FiAlertCircle, FiLoader } from 'react-icons/fi';

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

  const roleLabels: Record<string, string> = {
    owner: 'Proprietario',
    admin: 'Amministratore',
    manager: 'Responsabile',
    operator: 'Operatore',
    viewer: 'Visualizzatore',
  };

  useEffect(() => {
    if (!token) {
      setError('Link invito non valido (token mancante)');
      setStep('error');
      setLoading(false);
      return;
    }

    loadInvite();
  }, [token]);

  async function loadInvite() {
    try {
      setLoading(true);
      const { data, error: inviteError } = await supabase
        .from('org_invites')
        .select('*, orgs(name)')
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (inviteError || !data) {
        setError('Invito non trovato o già utilizzato');
        setStep('error');
        return;
      }

      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        setError('Questo invito è scaduto');
        setStep('error');
        return;
      }

      setInvite(data);
      setStep('register');
    } catch (err: any) {
      console.error('Error loading invite:', err);
      setError('Errore durante il caricamento dell\'invito');
      setStep('error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim()) {
      setError('Inserisci il tuo nome completo');
      return;
    }

    if (password.length < 8) {
      setError('La password deve essere di almeno 8 caratteri');
      return;
    }

    if (password !== confirmPassword) {
      setError('Le password non corrispondono');
      return;
    }

    try {
      setAccepting(true);
      setError('');

      // 1. Registra utente
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Registrazione fallita');

      // 2. Crea profilo
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: invite.email,
          full_name: fullName.trim(),
        });

      if (profileError && profileError.code !== '23505') {
        console.warn('Profile insert warning:', profileError);
      }

      // 3. Aggiungi a org_members
      const { error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: invite.org_id,
          user_id: authData.user.id,
          role: invite.role,
        });

      if (memberError) throw memberError;

      // 4. Marca invito come accettato
      const { error: updateError } = await supabase
        .from('org_invites')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invite.id);

      if (updateError) console.warn('Invite update warning:', updateError);

      // 5. Login automatico
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invite.email,
        password: password,
      });

      if (signInError) {
        console.warn('Auto-login failed:', signInError);
      }

      setStep('success');

      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err: any) {
      console.error('Accept invite error:', err);
      setError(err.message || 'Errore durante l\'accettazione dell\'invito');
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <FiLoader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Caricamento invito...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Invito Non Valido</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Vai al Login
          </button>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Benvenuto nel Team!</h1>
          <p className="text-slate-400 mb-2">
            Ti sei unito con successo a <strong className="text-white">{invite?.orgs?.name}</strong>
          </p>
          <p className="text-sm text-slate-500">Reindirizzamento in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Unisciti al Team</h1>
          <p className="text-slate-400">
            Sei stato invitato a far parte di{' '}
            <strong className="text-white">{invite?.orgs?.name}</strong>
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
              <FiMail className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Email</p>
              <p className="text-white font-medium">{invite?.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
              <FiUser className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Ruolo Assegnato</p>
              <p className="text-white font-medium">{roleLabels[invite?.role] || invite?.role}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAccept} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Completa la Registrazione</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <FiAlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Mario Rossi"
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 8 caratteri"
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
              minLength={8}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Conferma Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ripeti la password"
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={accepting}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {accepting ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                Registrazione in corso...
              </>
            ) : (
              <>
                <FiCheck className="w-5 h-5" />
                Accetta Invito e Registrati
              </>
            )}
          </button>

          <p className="mt-4 text-xs text-slate-500 text-center">
            Accettando l&apos;invito, accetti i{' '}
            <a href="/terms" className="text-blue-400 hover:underline">
              Termini di Servizio
            </a>{' '}
            e la{' '}
            <a href="/privacy" className="text-blue-400 hover:underline">
              Privacy Policy
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <FiLoader className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Caricamento...</p>
        </div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
