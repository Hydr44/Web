"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { loginWithPassword } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Inserisci email e password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await loginWithPassword(email, password);

      if (result.success && result.user) {
        globalThis.location.href = redirectTo;
      } else {
        setError(result.error || "Accesso non riuscito. Verifica le credenziali.");
      }
    } catch {
      setError("Errore imprevisto durante l'accesso. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google login handled by GoogleLoginButton component

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 pt-36">
      <div className="w-full max-w-md">
        {/* Logo grande */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3 group">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden">
              <Image
                src="/logo_128.png"
                alt="RescueManager"
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white tracking-tight">RESCUE<span className="text-blue-500">MANAGER</span></div>
              <div className="text-sm text-slate-400 -mt-1">Autodemolizioni & Soccorso</div>
            </div>
          </Link>
        </div>

        {/* Login Form */}
        <div
          className="bg-[#1e293b] rounded-xl border border-slate-700 p-8 shadow-2xl"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Accedi al tuo account</h1>
            <p className="text-slate-400">Inserisci le tue credenziali per accedere</p>
          </div>

          {/* Error Messages */}
          {error && (
            <div
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-[#243044] bg-[#141c27] text-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-600"
                  placeholder="inserisci@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-[#243044] bg-[#141c27] text-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-600"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                "Accedi"
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <Link
              href="/register"
              className="text-sm text-blue-400 hover:underline transition-colors duration-200"
            >
              Non hai un account? Registrati
            </Link>
            <div>
              <Link
                href="/reset"
                className="text-sm text-slate-500 hover:text-blue-400 transition-colors duration-200"
              >
                Password dimenticata?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}