"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  Shield,
  Zap,
  ArrowLeft
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    console.log("Admin login form submitted:", { email, password: "***" });

    if (!email || !password) {
      setError("Inserisci email e password.");
      return;
    }

    console.log("Starting admin login...");

    const supabase = supabaseBrowser();
    console.log("Supabase client created for admin login:", !!supabase);
    
    const { error: err, data } = await supabase.auth.signInWithPassword({ email, password });
    
    console.log("Admin login response:", { error: err?.message, user: data?.user?.email, session: !!data?.session });

    if (err) {
      console.error("Admin login error:", err);
      if (/invalid login credentials/i.test(err.message)) {
        setError("Email o password non corretti.");
      } else if (/email.*confirm/i.test(err.message)) {
        setError("Email non confermata: controlla la posta per il link di verifica.");
      } else {
        setError(err.message || "Accesso non riuscito.");
      }
      return;
    }

    console.log("Admin login successful:", data);

    // Verifica che l'utente sia admin
    console.log("Checking admin status...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", data.user.id)
      .maybeSingle();
    
    console.log("Admin check result:", { profile, error: profileError?.message });
    
    if (!profile?.is_admin) {
      console.log("User is not admin, showing error");
      setError("Accesso negato. Solo gli amministratori possono accedere a questa sezione.");
      return;
    }

    console.log("Admin verified, redirecting to admin panel");
    
    // Redirect al pannello admin
    startTransition(() => {
      router.push("/admin");
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to normal login */}
        <div className="mb-6">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna al login normale
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Shield className="h-8 w-8 text-red-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Accesso Amministratore</h1>
            <p className="text-blue-200 text-sm">Solo per amministratori autorizzati</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Email Amministratore
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="admin@rescuemanager.eu"
                  required
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-200 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={pending}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Accedi come Amministratore
                </>
              )}
            </motion.button>
          </form>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-yellow-300 text-xs">
              <Zap className="h-4 w-4" />
              <span>Accesso monitorato e registrato</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
