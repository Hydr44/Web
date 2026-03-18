"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Inserisci la tua email.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = supabaseBrowser();
      const origin = typeof globalThis === "undefined" ? "" : globalThis.location.origin;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/update-password`,
      });

      if (error) {
        setError(error.message || "Errore nell'invio dell'email di reset.");
        return;
      }

      setSuccess("Email di reset inviata! Controlla la tua casella di posta.");
    } catch {
      setError("Errore imprevisto. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT — brand panel */}
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
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Recupero Password</p>
          <h2 className="text-4xl font-extrabold text-white leading-[1.1] mb-4">
            Non preoccuparti<span className="text-blue-500">.</span>
          </h2>
          <p className="text-slate-400 text-base mb-10 max-w-sm">
            Inserisci l&apos;email associata al tuo account e ti invieremo un link per reimpostare la password.
          </p>
          <div className="space-y-3">
            {["Link sicuro via email", "Valido per 1 ora", "Password precedente non richiesta"].map((f) => (
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
            <Link href="/" className="inline-flex items-center justify-center">
              <img 
                src="/assets/logos/logo-principale-colori.svg" 
                alt="RescueManager"
                width={200}
                height={67}
                className="h-auto"
              />
            </Link>
          </div>

          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Password</p>
          <h1 className="text-3xl font-extrabold text-[#0f172a] mb-1">Recupera accesso.</h1>
          <p className="text-sm text-gray-500 mb-8">Ti invieremo un link per reimpostare la password.</p>

          {error && (
            <div className="mb-6 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 border-l-4 border-green-500 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Invio in corso...
                </>
              ) : "INVIA LINK DI RESET"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
              <ArrowLeft className="h-4 w-4" />
              Torna al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
