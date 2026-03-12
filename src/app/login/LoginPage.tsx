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
    <div className="min-h-screen flex">
      {/* LEFT — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-between p-12">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="relative w-10 h-10 overflow-hidden">
            <Image src="/logo_128.png" alt="RescueManager" fill className="object-cover" priority />
          </div>
          <span className="text-lg font-extrabold text-white tracking-tight">RESCUE<span className="text-blue-500">MANAGER</span></span>
        </Link>

        <div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Piattaforma SaaS</p>
          <h2 className="text-4xl font-extrabold text-white leading-[1.1] mb-4">
            Gestisci la tua<br />autodemolizione<span className="text-blue-500">.</span>
          </h2>
          <p className="text-slate-400 text-base mb-10 max-w-sm">
            Trasporti, ricambi, RENTRI, SDI, RVFU. Tutto integrato in un&apos;unica piattaforma conforme alle normative italiane.
          </p>
          <div className="space-y-3">
            {["Integrazione RENTRI & SDI certificata","Tracking trasporti in tempo reale","Magazzino ricambi TecDoc integrato","App mobile per autisti inclusa"].map((f) => (
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
            <Link href="/" className="inline-flex flex-col items-center gap-2">
              <div className="relative w-12 h-12 overflow-hidden">
                <Image src="/logo_128.png" alt="RescueManager" fill className="object-cover" />
              </div>
              <span className="text-xl font-extrabold text-[#0f172a]">RESCUE<span className="text-blue-600">MANAGER</span></span>
            </Link>
          </div>

          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Accesso</p>
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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm"
                  placeholder="inserisci@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-widest">
                  Password
                </label>
                <Link href="/reset" className="text-xs text-blue-600 hover:underline">
                  Dimenticata?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm"
                  placeholder="••••••••"
                  required
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Accesso in corso...
                </>
              ) : "ACCEDI"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Non hai un account?{" "}
              <Link href="/contatti" className="text-blue-600 font-bold hover:underline">
                Richiedi Accesso
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}