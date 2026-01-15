"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight, CheckCircle } from "lucide-react";
import { loginWithPassword, loginWithGoogle } from "@/lib/auth";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";

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

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("=== LOGIN START ===");
      console.log("Email:", email);
      console.log("Redirect to:", redirectTo);

      const result = await loginWithPassword(email, password);

      if (result.success && result.user) {
        console.log("Login successful:", result.user.email);
        setSuccess(true);
        setError("Accesso completato! Reindirizzamento...");
        
        // Piccola pausa per mostrare il successo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Redirect
        globalThis.location.href = redirectTo;
      } else {
        console.error("Login failed:", result.error);
        setError(result.error || "Accesso non riuscito. Verifica le credenziali.");
      }
    } catch (error) {
      console.error("Login exception:", error);
      setError("Errore imprevisto durante l'accesso. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google login handled by GoogleLoginButton component

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="relative w-12 h-12">
              <Image
                src="/logo-rentri.png"
                alt="RescueManager"
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">RescueManager</div>
              <div className="text-sm text-gray-500 -mt-1">Gestione Trasporti</div>
            </div>
          </Link>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-purple-500/10 border border-white/20 p-8"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Accedi al tuo account</h1>
            <p className="text-gray-600">Inserisci le tue credenziali per accedere</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {error}
            </motion.div>
          )}

          {/* Google Login */}
          <div className="mb-6">
            <GoogleLoginButton
              onSuccess={() => console.log("Google login success")}
              onError={(error) => setError(error)}
              className="w-full"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">oppure</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="inserisci@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3">
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                disabled={isLoading}
              />
              <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                Accetto i{" "}
                <Link href="/terms-of-use" className="text-primary hover:underline">
                  Termini d'Uso
                </Link>{" "}
                e la{" "}
                <Link href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading || !acceptTerms}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                isLoading || !acceptTerms
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/30"
              }`}
              whileHover={!isLoading && acceptTerms ? { scale: 1.02 } : {}}
              whileTap={!isLoading && acceptTerms ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Accedi
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <Link
              href="/register"
              className="text-sm text-primary hover:underline transition-colors duration-200"
            >
              Non hai un account? Registrati
            </Link>
            <div>
              <Link
                href="/reset"
                className="text-sm text-gray-500 hover:text-primary transition-colors duration-200"
              >
                Password dimenticata?
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}