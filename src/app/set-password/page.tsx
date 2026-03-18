'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check, Eye, EyeOff } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import Link from 'next/link';
import Image from 'next/image';

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
    const init = async () => {
      const tokenHash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
        if (error) {
          setErrorMsg("Link non valido o scaduto. Chiedi un nuovo link all'amministratore.");
          setStage('error');
        } else {
          setStage('form');
        }
        return;
      }

      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setErrorMsg("Link non valido o scaduto. Chiedi un nuovo link all'amministratore.");
          setStage('error');
        } else {
          setStage('form');
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setStage('form');
      } else {
        setErrorMsg('Nessun token di recupero trovato. Usa il link ricevuto via email.');
        setStage('error');
      }
    };

    init();
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
    if (password !== confirm) { setErrorMsg('Le password non coincidono.'); return; }
    if (password.length < 8) { setErrorMsg('La password deve essere di almeno 8 caratteri.'); return; }
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.updateUser({
      password,
      data: { force_password_change: false },
    });
    if (error) { setErrorMsg(`Errore: ${error.message}`); setLoading(false); return; }
    setStage('success');
    setTimeout(() => router.push('/onboarding'), 2500);
  };

  const strength = passwordStrength();

  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-between p-12">
      <Link href="/" className="inline-flex items-center">
        <img 
          src="/assets/logos/logo-principale-bianco.svg" 
          alt="RescueManager"
          width={160}
          height={53}
          className="h-auto"
        />
      </Link>
      <div>
        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Account Attivato</p>
        <h2 className="text-4xl font-extrabold text-white leading-[1.1] mb-4">
          Quasi pronto<span className="text-blue-500">.</span>
        </h2>
        <p className="text-slate-400 text-base mb-10 max-w-sm">
          Imposta la tua password per accedere a RescueManager e completare la configurazione della tua organizzazione.
        </p>
        <div className="space-y-3">
          {[
            'Accesso completo a tutti i moduli inclusi',
            'Piattaforma web + applicazione desktop',
            'Integrazione RENTRI & SDI certificata',
            'Supporto tecnico dedicato',
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
  );

  if (stage === 'verifying') {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 bg-white flex items-center justify-center p-8">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Verifica del link in corso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-sm text-center">
            <div className="lg:hidden mb-8">
              <Link href="/" className="inline-flex flex-col items-center gap-2">
                <div className="relative w-12 h-12 overflow-hidden">
                  <Image src="/logo_128.png" alt="RescueManager" fill className="object-cover" />
                </div>
                <span className="text-xl font-extrabold text-[#0f172a]">RESCUE<span className="text-blue-600">MANAGER</span></span>
              </Link>
            </div>
            <div className="border-l-4 border-red-500 bg-red-50 px-4 py-4 text-left mb-6">
              <p className="text-sm font-bold text-red-700 mb-1">Link non valido</p>
              <p className="text-sm text-red-600">{errorMsg}</p>
            </div>
            <Link href="/" className="text-sm text-blue-600 font-bold hover:underline">
              ← Torna al sito
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'success') {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Completato</p>
            <h1 className="text-3xl font-extrabold text-[#0f172a] mb-3">Password impostata!</h1>
            <p className="text-sm text-gray-500 mb-6">
              Il tuo account è attivo. Sarai reindirizzato automaticamente alla configurazione iniziale.
            </p>
            <div className="h-1 w-full bg-gray-100">
              <div className="h-1 bg-blue-600 animate-pulse w-3/4" />
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Se non vieni reindirizzato,{' '}
              <Link href="/onboarding" className="text-blue-600 font-bold hover:underline">clicca qui</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      {/* RIGHT — form panel */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center justify-center">
              <img 
                src="/assets/logos/logo-principale-a-colori.svg" 
                alt="RescueManager"
                width={200}
                height={67}
                className="h-auto"
              />
            </Link>
          </div>

          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Account Attivato</p>
          <h1 className="text-3xl font-extrabold text-[#0f172a] mb-1">Imposta la password.</h1>
          <p className="text-sm text-gray-500 mb-8">Scegli una password sicura per il tuo account RescueManager.</p>

          {errorMsg && (
            <div className="mb-6 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Nuova password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm pr-10"
                  placeholder="Minimo 8 caratteri"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`h-1 flex-1 transition-colors ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label htmlFor="confirm" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Conferma password
              </label>
              <input
                id="confirm"
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className={`w-full px-4 py-3 border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-colors placeholder-gray-400 text-sm ${
                  confirm && confirm !== password
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-gray-200 focus:ring-blue-500'
                }`}
                placeholder="Ripeti la password"
                autoComplete="new-password"
                disabled={loading}
              />
              {confirm && confirm !== password && (
                <p className="text-xs text-red-500 mt-1">Le password non coincidono</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Salvataggio...</span>
                </div>
              ) : 'IMPOSTA PASSWORD'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Hai bisogno di aiuto?{' '}
              <a href="mailto:info@rescuemanager.eu" className="text-blue-600 font-bold hover:underline">
                Contattaci
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
