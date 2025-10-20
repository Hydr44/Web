"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { supabaseBrowser } from "@/lib/supabase-browser";

function safeRedirect(val: string | null, fallback = "/dashboard") {
  if (!val) return fallback;
  try {
    const url = new URL(val, "http://dummy");
    const path = url.pathname + (url.search || "") + (url.hash || "");
    return path.startsWith("/") ? path : fallback;
  } catch {
    return val.startsWith("/") ? val : fallback;
  }
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = safeRedirect(params.get("redirect"), "/login");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== confirm) {
      setError("Le password non coincidono");
      return;
    }

    const supabase = supabaseBrowser();
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/login` },
    });

    if (error) {
      setError(error.message || "Registrazione non riuscita");
      return;
    }

    setSuccess("Registrazione inviata. Controlla la tua email per confermare l'account.");
    startTransition(() => router.replace(redirectTo));
  };

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl font-semibold text-center">Registrati</h1>
        <p className="mt-2 text-gray-600 text-center">Crea un account per iniziare</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Conferma Password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {pending ? "Registrazione..." : "Registrati"}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Hai già un account?{" "}
          <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-primary hover:underline">
            Accedi
          </Link>
        </p>
      </section>
    </main>
  );
}
