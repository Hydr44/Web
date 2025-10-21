"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  Shield,
  Zap
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
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

    if (!acceptTerms) {
      setError("Devi accettare i Termini d'Uso e la Privacy Policy per continuare.");
      return;
    }

    // Pulisci cookie corrotti prima del login
    try {
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.startsWith("sb-") || name.includes("supabase")) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      });
    } catch (error) {
      console.warn("Error clearing cookies:", error);
    }

    console.log("=== LOGIN DEBUG (PUBLIC REPO) ===");
    console.log("Current URL:", window.location.href);
    console.log("Redirect to:", redirectTo);
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    const supabase = supabaseBrowser();
    const { error: err, data } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      console.error("Login error:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.status,
        name: err.name
      });
      if (/invalid login credentials/i.test(err.message)) {
        setError("Email o password non corretti.");
      } else if (/email.*confirm/i.test(err.message)) {
        setError("Email non confermata: controlla la posta per il link di verifica.");
      } else {
        setError(err.message || "Accesso non riuscito.");
      }
      return;
    }

    console.log("Login successful:", data);
    console.log("User:", data.user);
    console.log("Session:", data.session);

    // Verifica che l'utente sia autenticato correttamente
    const { data: { user: authenticatedUser }, error: authError } = await supabase.auth.getUser();
    console.log("Authenticated user after login:", authenticatedUser);
    console.log("Auth verification error:", authError?.message || "NO ERROR");
    
    if (!authenticatedUser || authError) {
      console.error("Authentication verification failed:", authError);
      setError("Errore di autenticazione. Riprova.");
      return;
    }

    // Verifica che i cookie siano stati salvati
    console.log("All cookies after login:", document.cookie);
    console.log("Supabase cookies found:", document.cookie.includes("sb-"));

    // Aspetta un momento per la sincronizzazione della sessione
    setTimeout(() => {
      startTransition(() => {
        console.log("Executing redirect to:", redirectTo);
        // Prova prima con router.replace
        router.replace(redirectTo);
        // Fallback con window.location se router non funziona
        setTimeout(() => {
          if (window.location.pathname === "/login") {
            console.log("Router redirect failed, using window.location");
            window.location.href = redirectTo;
          }
        }, 500);
        // Forza il refresh per sincronizzare la sessione
        router.refresh();
      });
    }, 100);
  };

  const signInWithProvider = async (provider: "google" | "github") => {
    const supabase = supabaseBrowser();
    const callback = `${globalThis.location.origin}${redirectTo}`;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callback },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50/30">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="rm-container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-primary/30 px-3 py-1.5 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium"
              >
                <LogIn className="h-3 w-3" />
                Accesso Sicuro
              </motion.div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Benvenuto in{" "}
                <span className="block text-primary">RescueManager</span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Accedi al tuo account per gestire la tua officina di soccorso stradale con tutti gli strumenti avanzati di RescueManager.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                {[
                  { icon: Shield, text: "Sicuro" },
                  { icon: Zap, text: "Veloce" },
                  { icon: Mail, text: "Sincronizzato" }
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200"
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-gray-700">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right content - Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Accedi al tuo account
                </h2>
                <p className="text-gray-600">
                  Inserisci le tue credenziali per accedere
                </p>
              </div>

              {/* Social login */}
              <div className="grid gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => signInWithProvider("google")}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Continua con Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => signInWithProvider("github")}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Continua con GitHub</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 mb-6">
                <div className="h-px flex-1 bg-gray-200" />
                <span>oppure</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    {error}
                  </motion.div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="la-tua-email@azienda.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="La tua password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPw ? "Nascondi password" : "Mostra password"}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms acceptance */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <input
                      id="accept-terms"
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                      required
                    />
                  </div>
                  <label htmlFor="accept-terms" className="text-sm text-gray-600 leading-relaxed">
                    Accetto i{" "}
                    <Link href="/terms-of-use" target="_blank" className="text-primary hover:underline font-medium">
                      Termini d'Uso
                    </Link>
                    {" "}e la{" "}
                    <Link href="/privacy-policy" target="_blank" className="text-primary hover:underline font-medium">
                      Privacy Policy
                    </Link>
                    {" "}di RescueManager
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Accesso in corso...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <LogIn className="h-5 w-5" />
                      Accedi
                    </div>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                  <Link href="/reset" className="text-primary hover:underline transition-colors">
                    Password dimenticata?
                  </Link>
                  <span className="text-gray-600">
                    Non hai un account?{" "}
                    <Link href={`/register?redirect=${encodeURIComponent(redirectTo)}`} className="text-primary hover:underline font-medium">
                      Registrati
                    </Link>
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
