"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff
} from "lucide-react";
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
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
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

    if (!acceptTerms) {
      setError("Devi accettare i Termini d'Uso e la Privacy Policy per continuare.");
      return;
    }

    const supabase = supabaseBrowser();
    const origin = typeof globalThis === "undefined" ? "" : globalThis.location.origin;

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
    <div className="min-h-screen flex">
      {/* LEFT — brand panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#0f172a] flex-col justify-between p-12">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="text-lg font-extrabold text-white tracking-tight">RESCUE<span className="text-blue-500">MANAGER</span></span>
        </Link>

        <div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Inizia gratis</p>
          <h2 className="text-4xl font-extrabold text-white leading-[1.1] mb-4">
            Crea il tuo<br />account oggi<span className="text-blue-500">.</span>
          </h2>
          <p className="text-slate-400 text-base mb-10 max-w-sm">
            Prova RescueManager gratuitamente. Nessuna carta di credito richiesta. Setup in 5 minuti.
          </p>
          <div className="space-y-4">
            {[
              ["14 giorni", "di prova gratuita inclusi"],
              ["Nessun vincolo", "cancella quando vuoi"],
              ["Supporto dedicato", "assistenza in italiano"],
              ["Dati sicuri", "server certificati in Europa"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-blue-500 mt-2 shrink-0" />
                <div>
                  <span className="text-sm font-bold text-white">{title}</span>
                  <span className="text-sm text-slate-400"> — {desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-600">© 2025 RescueManager · rescuemanager.eu</p>
      </div>

      {/* RIGHT — form panel */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="text-xl font-extrabold text-[#0f172a]">
              RESCUE<span className="text-blue-600">MANAGER</span>
            </Link>
          </div>

          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Registrazione</p>
          <h1 className="text-3xl font-extrabold text-[#0f172a] mb-1">Crea account.</h1>
          <p className="text-sm text-gray-500 mb-8">Compila i campi per iniziare la prova gratuita.</p>

          {error && (
            <div className="mb-5 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 border-l-4 border-green-500 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm"
                  placeholder="la-tua-email@azienda.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm"
                  placeholder="Min. 8 caratteri"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPw ? "Nascondi password" : "Mostra password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Conferma Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="confirm-password"
                  type={showConfirmPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 text-sm"
                  placeholder="Ripeti la password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirmPw ? "Nascondi password" : "Mostra password"}
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                required
              />
              <label htmlFor="accept-terms" className="text-xs text-gray-500 leading-relaxed">
                Accetto i{" "}
                <Link href="/terms-of-use" target="_blank" className="text-blue-600 hover:underline font-medium">
                  Termini d&apos;Uso
                </Link>
                {" "}e la{" "}
                <Link href="/privacy-policy" target="_blank" className="text-blue-600 hover:underline font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registrazione in corso...
                </>
              ) : "CREA ACCOUNT"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Hai già un account?{" "}
              <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-blue-600 font-bold hover:underline">
                Accedi
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
