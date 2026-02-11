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
  UserPlus,
  Shield,
  Zap,
  CheckCircle2
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
    <div className="min-h-screen bg-gradient-to-br from-[#0c1929] via-[#141c27] to-[#0c1929] pt-20">
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
                className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-primary/30 px-3 py-1.5 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-blue-400 font-medium"
              >
                <UserPlus className="h-3 w-3" />
                Registrazione Gratuita
              </motion.div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-100 mb-6 leading-tight">
                Inizia la tua{" "}
                <span className="block text-blue-400">trasformazione digitale</span>
              </h1>
              
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Crea il tuo account RescueManager e scopri come gestire la tua officina di soccorso stradale in modo più efficiente e professionale.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                {[
                  { icon: Shield, text: "Sicuro" },
                  { icon: Zap, text: "Veloce" },
                  { icon: CheckCircle2, text: "Gratuito" }
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a2536]/80 backdrop-blur-sm border border-[#243044]"
                  >
                    <item.icon className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-slate-300">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right content - Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-[#1a2536] rounded-3xl p-8 shadow-xl border border-[#243044]"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-100 mb-2">
                  Crea il tuo account
                </h2>
                <p className="text-slate-400">
                  Inizia subito con RescueManager
                </p>
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
                
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {success}
                  </motion.div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#243044] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="la-tua-email@azienda.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="password"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-[#243044] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Scegli una password sicura"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                      aria-label={showPw ? "Nascondi password" : "Mostra password"}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-2">
                    Conferma Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      id="confirm-password"
                      type={showConfirmPw ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-[#243044] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Conferma la password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw((v) => !v)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-400 transition-colors"
                      aria-label={showConfirmPw ? "Nascondi password" : "Mostra password"}
                    >
                      {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                      className="w-4 h-4 text-blue-400 bg-[#1a2536] border-[#243044] rounded focus:ring-blue-500 focus:ring-2"
                      required
                    />
                  </div>
                  <label htmlFor="accept-terms" className="text-sm text-slate-400 leading-relaxed">
                    Accetto i{" "}
                    <Link href="/terms-of-use" target="_blank" className="text-blue-400 hover:underline font-medium">
                      Termini d'Uso
                    </Link>
                    {" "}e la{" "}
                    <Link href="/privacy-policy" target="_blank" className="text-blue-400 hover:underline font-medium">
                      Privacy Policy
                    </Link>
                    {" "}di RescueManager
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pending ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registrazione in corso...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Registrati
                    </div>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-[#243044]">
                <p className="text-sm text-center text-slate-400">
                  Hai già un account?{" "}
                  <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-blue-400 hover:underline font-medium">
                    Accedi
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
