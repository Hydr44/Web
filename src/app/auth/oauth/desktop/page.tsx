"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight, CheckCircle, Monitor } from "lucide-react";
import { loginWithPassword, loginWithGoogle } from "@/lib/auth";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import OAuthRedirect from "@/components/OAuthRedirect";
import { supabaseBrowser } from "@/lib/supabase-browser";

function DesktopOAuthContent() {
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

  const params = useSearchParams();

  // Estrai parametri OAuth
  useEffect(() => {
    console.log('[DesktopOAuth] Page loaded, extracting params...');
    const encodedParams = params.get('params');
    console.log('[DesktopOAuth] Encoded params:', encodedParams ? 'present' : 'missing');
    
    if (encodedParams) {
      try {
        // Usa atob per decodificare base64 nel browser
        const decodedString = atob(encodedParams);
        const decodedParams = JSON.parse(decodedString);
        console.log('Decoded OAuth params:', decodedParams);
        
        // Verifica scadenza
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
      } catch (err) {
        console.error('Error decoding OAuth params:', err);
        setError("Parametri OAuth non validi. Impossibile procedere con l'autenticazione.");
      }
    } else {
      setError("Parametri OAuth mancanti. Impossibile procedere con l'autenticazione.");
    }
  }, [params]);

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
        setError("Accesso completato! Reindirizzamento alla desktop app...");

        // Prepara URL di redirect
        const redirectUrl = `${oauthInfo.redirect_uri}?code=${oauthCode}&state=${oauthInfo.state}`;
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
        setError("Accesso completato! Reindirizzamento alla desktop app...");

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50/30 to-pink-50/30">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Caricamento parametri OAuth...</p>
        </div>
      </div>
    );
  }

  // Se abbiamo l'URL di redirect, mostra il componente di redirect
  if (redirectUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50/30 to-pink-50/30 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
        <div className="max-w-md w-full relative z-10 px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-purple-500/10 border border-white/20 p-8">
            <OAuthRedirect redirectUrl={redirectUrl} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50/30 to-pink-50/30 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-20 w-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30"
          >
            <Monitor className="h-10 w-10 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Accesso Desktop App
          </h2>
          <p className="text-gray-600 mb-8">
            Accedi per continuare con l'applicazione desktop
          </p>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6 bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl shadow-purple-500/10 border border-white/20"
          onSubmit={handleSubmit}
        >
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="Inserisci la tua email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="Inserisci la tua password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && !success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center shadow-sm"
            >
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={isLoading ? {} : { scale: 1.02 }}
            whileTap={isLoading ? {} : { scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-purple-500/30 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 relative overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Accesso in corso...</span>
              </div>
            ) : (
              <div className="flex items-center">
                <LogIn className="h-5 w-5 mr-2" />
                Accedi alla Desktop App
                <ArrowRight className="h-5 w-5 ml-2" />
              </div>
            )}
            {isLoading && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </motion.button>

          {/* Terms - Accettati automaticamente cliccando Accedi */}
          <p className="text-xs text-center text-gray-500 mt-3">
            Cliccando su "Accedi", accetti i{" "}
            <a href="/terms-of-use" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 underline">
              Termini d'Uso
            </a>{" "}
            e la{" "}
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 underline">
              Privacy Policy
            </a>
          </p>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Oppure</span>
            </div>
          </div>

          {/* Google Login */}
          <GoogleLoginButton
            onSuccess={handleGoogleLogin}
            disabled={isLoading}
            className="w-full"
          />
        </motion.form>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Non hai un account?{" "}
            <a href="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
              Registrati qui
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function DesktopOAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50/30 to-pink-50/30">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600 font-medium">Caricamento...</p>
        </div>
      </div>
    }>
      <DesktopOAuthContent />
    </Suspense>
  );
}
