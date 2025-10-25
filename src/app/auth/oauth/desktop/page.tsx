"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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

  const params = useSearchParams();

  // Estrai parametri OAuth
  useEffect(() => {
    const appId = params.get('app_id');
    const redirectUri = params.get('redirect_uri');
    const state = params.get('state');
    const stateId = params.get('state_id');

    if (appId && redirectUri && state && stateId) {
      setOauthInfo({ app_id: appId, redirect_uri: redirectUri, state, state_id: stateId });
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
        const { error: oauthError } = await supabase
          .from('oauth_codes')
          .update({
            code: oauthCode,
            user_id: result.user.id,
            used: false,
            expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minuti
          })
          .eq('id', oauthInfo.state_id);

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
          .update({
            code: oauthCode,
            user_id: result.user.id,
            used: false,
            expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minuti
          })
          .eq('id', oauthInfo.state_id);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento parametri OAuth...</p>
        </div>
      </div>
    );
  }

  // Se abbiamo l'URL di redirect, mostra il componente di redirect
  if (redirectUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full">
          <OAuthRedirect redirectUrl={redirectUrl} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-6"
          >
            <Monitor className="h-8 w-8 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
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
          className="space-y-6"
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

          {/* Terms */}
          <div className="flex items-center">
            <input
              id="accept-terms"
              name="accept-terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-700">
              Accetto i{" "}
              <a href="/terms-of-use" className="text-indigo-600 hover:text-indigo-500">
                Termini d'Uso
              </a>{" "}
              e la{" "}
              <a href="/privacy-policy" className="text-indigo-600 hover:text-indigo-500">
                Privacy Policy
              </a>
            </label>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              {error} {/* Usa error per il messaggio di successo */}
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Accesso in corso...
              </div>
            ) : (
              <div className="flex items-center">
                <LogIn className="h-5 w-5 mr-2" />
                Accedi alla Desktop App
                <ArrowRight className="h-5 w-5 ml-2" />
              </div>
            )}
          </motion.button>

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    }>
      <DesktopOAuthContent />
    </Suspense>
  );
}
