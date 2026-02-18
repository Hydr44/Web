"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
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

    const supabase = supabaseBrowser();
    const origin = typeof globalThis === "undefined" ? "" : globalThis.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      emailRedirectTo: `${origin}/update-password`,
    });

    if (error) {
      setError(error.message || "Errore nell'invio dell'email di reset.");
      return;
    }

    setSuccess("Email di reset inviata! Controlla la tua posta.");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <section className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-7 w-7 text-[#2563EB]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Password dimenticata?
            </h1>
            <p className="text-sm text-gray-600">
              Inserisci la tua email per ricevere il link di reset
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder="la-tua-email@esempio.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3 px-6 rounded-lg bg-[#2563EB] text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Invio in corso...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  Invia link di reset
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 text-sm text-[#2563EB] hover:underline transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Torna al login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
