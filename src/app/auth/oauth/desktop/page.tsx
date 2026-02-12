"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight, CheckCircle, Monitor } from "lucide-react";
import { loginWithPassword, loginWithGoogle } from "@/lib/auth";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import OAuthRedirect from "@/components/OAuthRedirect";
import { supabaseBrowser } from "@/lib/supabase-browser";

// Log immediato quando il modulo viene caricato
console.log('[DesktopOAuth] Module loaded');

function DesktopOAuthContent() {
  console.log('[DesktopOAuthContent] Component rendered');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Inserisci email e password.");
      return;
    }

    if (!acceptTerms) {
      setError("Devi accettare i Termini d'Uso e la Privacy Policy per continuare.");
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

  const handleGoogleLogin = async () => {
    if (!oauthInfo) {
      setError("Parametri OAuth non validi.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await loginWithGoogle();
      
      if (result.success && result.user) {
        console.log("Google login successful:", result.user.email);
        
        // Genera OAuth code
        const oauthCode = `oauth_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        
        // Salva OAuth code nel database
        const supabase = supabaseBrowser();
        const { error: oauthError } = await supabase
          .from('oauth_codes')
          .insert({
            code: oauthCode,
            user_id: result.user.id,
            app_id: oauthInfo.app_id,
            redirect_uri: oauthInfo.redirect_uri,
            state: oauthInfo.state,
            expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minuti
            used: false
          });

        if (oauthError) {
          console.error('Error saving OAuth code:', oauthError);
          setError("Errore durante la generazione del codice OAuth.");
          return;
        }

        setSuccess(true);
        setError("✅ Accesso completato! Reindirizzamento alla desktop app...");

        // Prepara URL di redirect
        const redirectUrl = `${oauthInfo.redirect_uri}?code=${oauthCode}&state=${oauthInfo.state}`;
        setRedirectUrl(redirectUrl);

      } else {
        setError(result.error || "Errore durante l'accesso con Google.");
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError("Errore durante l'accesso con Google. Riprova.");
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
    <div className="min-h-screen bg-[#141c27] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-[#1a2536] border border-[#243044] p-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Monitor className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-100 mb-2">
            Accesso Desktop App
          </h2>
          <p className="text-sm text-slate-400">
            Accedi per continuare con l'applicazione desktop
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-[#243044] bg-[#141c27] text-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-600"
                placeholder="inserisci@email.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-[#243044] bg-[#141c27] text-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-600"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input
              id="accept-terms"
              name="accept-terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-500 border-[#243044] bg-[#141c27] rounded focus:ring-blue-500"
            />
            <label htmlFor="accept-terms" className="text-sm text-slate-400">
              Accetto i{" "}
              <a href="/terms-of-use" className="text-blue-400 hover:underline">Termini d'Uso</a>{" "}
              e la{" "}
              <a href="/privacy-policy" className="text-blue-400 hover:underline">Privacy Policy</a>
            </label>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !acceptTerms}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors ${
              isLoading || !acceptTerms
                ? "bg-[#243044] text-slate-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Accesso in corso...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Accedi alla Desktop App
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#243044]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1a2536] text-slate-500">Oppure</span>
            </div>
          </div>

          {/* Google Login */}
          <div className={isLoading ? "opacity-50 pointer-events-none" : ""}>
            <GoogleLoginButton
              onSuccess={handleGoogleLogin}
              className="w-full"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500">
          <p>
            Non hai un account?{" "}
            <a href="/register" className="text-blue-400 hover:underline">
              Registrati qui
            </a>
          </p>
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
