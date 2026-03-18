"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { loginWithPassword } from "@/lib/auth";
import OAuthRedirect from "@/components/OAuthRedirect";
import { supabaseBrowser } from "@/lib/supabase-browser";

// Log immediato quando il modulo viene caricato
console.log('[DesktopOAuth] Module loaded');

function DesktopOAuthContent() {
  console.log('[DesktopOAuthContent] Component rendered');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [oauthInfo, setOauthInfo] = useState<{
    app_id: string;
    redirect_uri: string;
    state: string;
    state_id: string;
  } | null>(null);

  // useSearchParams deve essere chiamato sempre, non condizionalmente
  const params = useSearchParams();

  // Estrai parametri OAuth
  useEffect(() => {
    console.log('[DesktopOAuth] === PAGE LOADED ===');
    console.log('[DesktopOAuth] Current URL:', window.location.href);
    console.log('[DesktopOAuth] Search params:', window.location.search);
    
    const encodedParams = params.get('params');
    console.log('[DesktopOAuth] Encoded params from useSearchParams:', encodedParams ? `present (length: ${encodedParams.length})` : 'missing');
    
    // Fallback: prova a leggere direttamente dall'URL se useSearchParams non funziona
    if (!encodedParams) {
      const urlParams = new URLSearchParams(window.location.search);
      const fallbackParams = urlParams.get('params');
      console.log('[DesktopOAuth] Fallback: params from URLSearchParams:', fallbackParams ? `present (length: ${fallbackParams.length})` : 'missing');
      
      if (fallbackParams) {
        // Usa i parametri dal fallback
        try {
          const decodedString = atob(fallbackParams);
          const decodedParams = JSON.parse(decodedString);
          console.log('[DesktopOAuth] Decoded OAuth params (fallback):', decodedParams);
          
          if (decodedParams.expires_at < Date.now()) {
            setError("Sessione OAuth scaduta. Riprova.");
            return;
          }
          
          setOauthInfo({
            app_id: decodedParams.app_id,
            redirect_uri: decodedParams.redirect_uri,
            state: decodedParams.state,
            state_id: decodedParams.state_code
          });
          return;
        } catch (err) {
          console.error('[DesktopOAuth] Error decoding fallback params:', err);
        }
      }
    }
    
    if (encodedParams) {
      try {
        console.log('[DesktopOAuth] Attempting to decode params...');
        // Usa atob per decodificare base64 nel browser (Buffer non è disponibile)
        const decodedString = atob(encodedParams);
        console.log('[DesktopOAuth] Decoded string length:', decodedString.length);
        const decodedParams = JSON.parse(decodedString);
        console.log('[DesktopOAuth] Decoded OAuth params:', decodedParams);
        
        // Verifica scadenza
        if (decodedParams.expires_at < Date.now()) {
          console.error('[DesktopOAuth] OAuth session expired');
          setError("Sessione OAuth scaduta. Riprova.");
          return;
        }
        
        console.log('[DesktopOAuth] Setting OAuth info...');
        setOauthInfo({
          app_id: decodedParams.app_id,
          redirect_uri: decodedParams.redirect_uri,
          state: decodedParams.state,
          state_id: decodedParams.state_code
        });
        console.log('[DesktopOAuth] OAuth info set successfully');
      } catch (err) {
        console.error('[DesktopOAuth] Error decoding OAuth params:', err);
        console.error('[DesktopOAuth] Error details:', {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        });
        setError(`Parametri OAuth non validi: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`);
      }
    } else {
      console.error('[DesktopOAuth] No params found in URL');
      setError("Parametri OAuth mancanti. L'URL potrebbe non essere corretto. Riprova il login dalla desktop app.");
    }
  }, [params]);

  // Auto-login: se l'utente ha già una sessione Supabase attiva, salta il form
  useEffect(() => {
    if (!oauthInfo || success || redirectUrl) return;

    const checkExistingSession = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return; // Nessuna sessione, mostra il form

        console.log('[DesktopOAuth] Existing session found for:', user.email);
        setIsLoading(true);
        setError(null);

        // Genera OAuth code automaticamente
        const oauthCode = `oauth_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        const { error: oauthError } = await supabase
          .from('oauth_codes')
          .insert({
            code: oauthCode,
            user_id: user.id,
            app_id: oauthInfo.app_id,
            redirect_uri: oauthInfo.redirect_uri,
            state: oauthInfo.state,
            expires_at: new Date(Date.now() + 5 * 60 * 1000),
            used: false
          });

        if (oauthError) {
          console.error('[DesktopOAuth] Auto-login error:', oauthError);
          setIsLoading(false);
          return; // Fallback: mostra il form
        }

        console.log('[DesktopOAuth] Auto-login successful, redirecting...');
        setSuccess(true);
        const url = `${oauthInfo.redirect_uri}?code=${oauthCode}&state=${oauthInfo.state}`;
        setRedirectUrl(url);
      } catch (err) {
        console.error('[DesktopOAuth] Auto-login check failed:', err);
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, [oauthInfo, success, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Inserisci email e password.");
      return;
    }

    if (!oauthInfo) {
      setError("Parametri OAuth non validi.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("=== DESKTOP OAUTH LOGIN START ===");
      console.log("Email:", email);
      console.log("OAuth Info:", oauthInfo);

      const result = await loginWithPassword(email, password);

      if (result.success && result.user) {
        console.log("Login successful:", result.user.email);
        
        // Genera OAuth code
        const oauthCode = `oauth_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        
        // Salva OAuth code nel database
        const supabase = supabaseBrowser();
        console.log("=== SAVING OAUTH CODE ===");
        console.log("OAuth Code:", oauthCode);
        console.log("User ID:", result.user.id);
        console.log("App ID:", oauthInfo.app_id);
        console.log("Redirect URI:", oauthInfo.redirect_uri);
        console.log("State:", oauthInfo.state);
        
        // Verifica autenticazione
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        console.log("=== AUTHENTICATION CHECK ===");
        console.log("Current User:", currentUser?.id);
        console.log("Auth Error:", authError);
        
        const { data: insertData, error: oauthError } = await supabase
          .from('oauth_codes')
          .insert({
            code: oauthCode,
            user_id: result.user.id,
            app_id: oauthInfo.app_id,
            redirect_uri: oauthInfo.redirect_uri,
            state: oauthInfo.state,
            expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minuti
            used: false
          })
          .select();

        if (oauthError) {
          console.error('=== OAUTH CODE SAVE ERROR ===');
          console.error('Error:', oauthError);
          setError("Errore durante la generazione del codice OAuth.");
          return;
        }
        
        console.log("=== OAUTH CODE SAVED SUCCESSFULLY ===");
        console.log("Insert Data:", insertData);

        setSuccess(true);
        setError("✅ Accesso completato! Reindirizzamento alla desktop app...");

        // Prepara URL di redirect
        const redirectUrl = `${oauthInfo.redirect_uri}?code=${oauthCode}&state=${oauthInfo.state}`;
        console.log('[DesktopOAuth] Setting redirect URL:', redirectUrl);
        console.log('[DesktopOAuth] Redirect URI from oauthInfo:', oauthInfo.redirect_uri);
        console.log('[DesktopOAuth] OAuth Code:', oauthCode);
        console.log('[DesktopOAuth] State:', oauthInfo.state);
        setRedirectUrl(redirectUrl);

      } else {
        setError(result.error || "Credenziali non valide.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Errore durante l'accesso. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!oauthInfo) {
    return (
      <div className="min-h-screen bg-[#141c27] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-[#1a2536] border border-[#243044] p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Caricamento parametri OAuth</h3>
          <p className="text-sm text-slate-400">Attendere prego...</p>
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <p className="font-semibold mb-1">Errore:</p>
              <p>{error}</p>
              <a href="/login" className="mt-3 inline-block text-blue-400 hover:underline">
                Torna al login
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Se abbiamo l'URL di redirect, mostra il componente di redirect
  if (redirectUrl) {
    return (
      <div className="min-h-screen bg-[#141c27] flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <OAuthRedirect redirectUrl={redirectUrl} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-between p-12">
        <div className="inline-flex items-center">
          <img 
            src="/assets/logos/logo-principale-bianco.svg" 
            alt="RescueManager"
            className="h-auto w-40"
          />
        </div>

        <div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Desktop App</p>
          <h2 className="text-4xl font-extrabold text-white leading-[1.1] mb-4">
            Accedi alla<br />tua applicazione<span className="text-blue-500">.</span>
          </h2>
          <p className="text-slate-400 text-base mb-10 max-w-sm">
            Gestisci trasporti, ricambi, RENTRI, SDI e RVFU dalla tua applicazione desktop.
          </p>
          <div className="space-y-3">
            {["Sincronizzazione automatica","Accesso offline ai dati","Notifiche desktop in tempo reale","Performance ottimizzate"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-blue-500 shrink-0" />
                <span className="text-sm text-slate-300">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">© {new Date().getFullYear()} RescueManager · rescuemanager.eu</p>
      </div>

      {/* RIGHT — form panel */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <img 
              src="/assets/logos/logo-principale-a-colori.svg" 
              alt="RescueManager"
              className="h-auto w-48 mx-auto"
            />
          </div>

          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Accesso Desktop</p>
          <h1 className="text-3xl font-extrabold text-[#0f172a] mb-1">Bentornato.</h1>
          <p className="text-sm text-gray-500 mb-8">Inserisci le credenziali del tuo account.</p>

          {error && (
            <div className="mb-6 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm"
                  placeholder="inserisci@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Accesso in corso...</span>
                </div>
              ) : "ACCEDI"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Non hai un account?{" "}
              <a href="/contatti" className="text-blue-600 font-bold hover:underline">
                Richiedi Accesso
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DesktopOAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#141c27] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-[#1a2536] border border-[#243044] p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">Caricamento</h3>
          <p className="text-sm text-slate-400">Attendere prego...</p>
        </div>
      </div>
    }>
      <DesktopOAuthContent />
    </Suspense>
  );
}
