'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { KeyRound, Loader2, Check, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = supabaseBrowser();

  const [stage, setStage] = useState<'verifying' | 'form' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (tokenHash && type === 'recovery') {
      // PKCE flow: exchange token_hash for session
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        .then(({ error }) => {
          if (error) {
            setErrorMsg('Link non valido o scaduto. Chiedi un nuovo link all\'amministratore.');
            setStage('error');
          } else {
            setStage('form');
          }
        });
    } else {
      // Implicit flow fallback: check if already has active session from hash redirect
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          setStage('form');
        } else {
          setErrorMsg('Nessun token di recupero trovato. Usa il link ricevuto via email.');
          setStage('error');
        }
      });
    }
  }, []);

  const passwordStrength = (): { score: number; label: string; color: string } => {
    const p = password;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { score, label: 'Debole', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Media', color: 'bg-amber-500' };
    return { score, label: 'Forte', color: 'bg-emerald-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setErrorMsg('Le password non coincidono.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('La password deve essere di almeno 8 caratteri.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.updateUser({
      password,
      data: { force_password_change: false },
    });

    if (error) {
      setErrorMsg(`Errore: ${error.message}`);
      setLoading(false);
      return;
    }

    setStage('success');
    setTimeout(() => router.push('/onboarding'), 2500);
  };

  const strength = passwordStrength();

  if (stage === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Verifica del link in corso...</p>
        </div>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 mb-2">Link non valido</h1>
          <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm underline">
            Torna al sito
          </Link>
        </div>
      </div>
    );
  }

  if (stage === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 mb-2">Password impostata!</h1>
          <p className="text-slate-400 text-sm mb-2">
            Il tuo account è attivo. Sarai reindirizzato automaticamente.
          </p>
          <p className="text-slate-600 text-xs">
            Se non vieni reindirizzato,{' '}
            <Link href="/onboarding" className="text-blue-400 hover:text-blue-300 underline">
              clicca qui
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 px-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Imposta la tua Password</h1>
          <p className="text-slate-400 text-sm mt-2">
            Scegli una password sicura per il tuo account RescueManager.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {errorMsg}
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Nuova password
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 pr-10 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                placeholder="Minimo 8 caratteri"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-slate-700'}`} />
                  ))}
                </div>
                <p className="text-xs text-slate-500">{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Conferma password
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className={`w-full bg-slate-900/50 border rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-1 ${
                confirm && confirm !== password
                  ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                  : 'border-slate-700 focus:border-blue-500/50 focus:ring-blue-500/20'
              }`}
              placeholder="Ripeti la password"
              autoComplete="new-password"
            />
            {confirm && confirm !== password && (
              <p className="text-xs text-red-400 mt-1">Le password non coincidono</p>
            )}
          </div>

          <button type="submit" disabled={loading || !password || !confirm}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvataggio...</> : 'Imposta Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
