"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Briefcase, User, Phone, CheckCircle2 } from "lucide-react";

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
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefono: "",
    azienda: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = safeRedirect(params.get("redirect"), "/login");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!acceptTerms) {
      setError("Devi accettare i Termini d'Uso e la Privacy Policy per continuare.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "access_request",
            source: "website_register",
            name: formData.nome,
            email: formData.email,
            phone: formData.telefono,
            company: formData.azienda,
            message: "Richiesta di creazione account / accesso a RescueManager.",
          }),
        });
        
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Impossibile inviare la richiesta.");
          return;
        }

        setIsSubmitted(true);
      } catch {
        setError("Errore di rete. Riprova più tardi.");
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg p-10 text-center border border-gray-200 shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#0f172a] mb-3">Richiesta ricevuta!</h2>
          <p className="text-gray-600 mb-6 leading-relaxed text-sm">
            Abbiamo preso in carico la tua richiesta di accesso. Il nostro team verificherà i tuoi dati e creerà l'account manualmente.
            Riceverai le credenziali all'indirizzo <strong>{formData.email}</strong> non appena il tuo account sarà attivo.
          </p>
          <Link href="/" className="inline-block w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
            Torna alla Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT — brand panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#0f172a] flex-col justify-between p-12">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="text-lg font-extrabold text-white tracking-tight">RESCUE<span className="text-blue-500">MANAGER</span></span>
        </Link>

        <div>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Accesso Esclusivo</p>
          <h2 className="text-4xl font-extrabold text-white leading-[1.1] mb-4">
            Richiedi<br />l'accesso<span className="text-blue-500">.</span>
          </h2>
          <p className="text-slate-400 text-base mb-10 max-w-sm">
            Per garantire la massima sicurezza e la corretta configurazione, creiamo manualmente ogni ambiente di lavoro.
          </p>
          <div className="space-y-4">
            {[
              ["Step 1", "Compila il modulo con i dati aziendali"],
              ["Step 2", "Il nostro team validerà la richiesta in 24h"],
              ["Step 3", "Ricevi le credenziali sicure per l'accesso"],
              ["Step 4", "Inizia a usare RescueManager"],
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

          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Benvenuto</p>
          <h1 className="text-3xl font-extrabold text-[#0f172a] mb-1">Richiedi Accesso.</h1>
          <p className="text-sm text-gray-500 mb-8">Inviaci i tuoi dati e attiveremo il tuo piano.</p>

          {error && (
            <div className="mb-5 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Nome e Cognome
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formData.nome}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  placeholder="Mario Rossi"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Email Aziendale
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  placeholder="info@azienda.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="telefono" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Telefono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  placeholder="+39 340 000 0000"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="azienda" className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                Nome Azienda
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="azienda"
                  name="azienda"
                  type="text"
                  value={formData.azienda}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                  placeholder="La tua attività"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                required
              />
              <label htmlFor="accept-terms" className="text-xs text-gray-500 leading-relaxed">
                Accetto i{" "}
                <Link href="/terms-of-use" target="_blank" className="text-blue-600 hover:underline font-medium">
                  Termini d'Uso
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 rounded-lg text-white font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Invio richiesta...
                </>
              ) : "RICHIEDI ACCESSO"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Hai già un account o le credenziali?{" "}
              <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-blue-600 font-bold hover:underline">
                Accedi qui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
