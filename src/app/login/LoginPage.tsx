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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = safeRedirect(params.get("redirect"));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Inserisci email e password.");
      return;
    }

    const supabase = supabaseBrowser();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      if (/invalid login credentials/i.test(err.message)) {
        setError("Email o password non corretti.");
      } else if (/email.*confirm/i.test(err.message)) {
        setError("Email non confermata: controlla la posta per il link di verifica.");
      } else {
        setError(err.message || "Accesso non riuscito.");
      }
      return;
    }

    startTransition(() => router.replace(redirectTo));
  };

  const signInWithProvider = async (provider: "google" | "github") => {
    const supabase = supabaseBrowser();
    const callback = `${window.location.origin}${redirectTo}`;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callback },
    });
  };

  return (
    <main>
      <SiteHeader />

      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl font-semibold text-center">Accedi</h1>
        <p className="mt-2 text-gray-600 text-center">
          Entra con le tue credenziali o usa un provider.
        </p>

        <div className="mt-8 grid gap-2">
          <button
            type="button"
            onClick={() => signInWithProvider("google")}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50 transition"
          >
            Continua con Google
          </button>
          <button
            type="button"
            onClick={() => signInWithProvider("github")}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50 transition"
          >
            Continua con GitHub
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-gray-500">
          <div className="h-px flex-1 bg-gray-200" />
          <span>oppure</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
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
            <div className="mt-1 relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 pr-10 focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 text-xs text-gray-500 hover:text-gray-700"
                aria-label={showPw ? "Nascondi password" : "Mostra password"}
              >
                {showPw ? "Nascondi" : "Mostra"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {pending ? "Accesso..." : "Accedi"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/reset" className="text-primary hover:underline">
            Password dimenticata?
          </Link>
          <span className="text-gray-600">
            Non hai un account?{" "}
            <Link href={`/register?redirect=${encodeURIComponent(redirectTo)}`} className="text-primary hover:underline">
              Registrati
            </Link>
          </span>
        </div>
      </section>
    </main>
  );
}
