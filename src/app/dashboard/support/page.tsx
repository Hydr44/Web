"use client";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Mail, Phone, Send, CheckCircle2, MessageSquareText } from "lucide-react";

export default function SupportPage() {
  const [userEmail, setUserEmail] = useState("");
  const [tipo, setTipo] = useState("domanda");
  const [oggetto, setOggetto] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
    };
    loadUser();
  }, []);

  const openChatwoot = () => {
    if ((window as any).$chatwoot) {
      (window as any).$chatwoot.toggle("open");
    } else {
      alert("La live chat non è ancora pronta. Attendi qualche istante.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oggetto.trim() || !messaggio.trim()) {
      setError("Compila tutti i campi.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      // Inoltra la richiesta all'API per scatenare l'email invece del solo salvataggio DB
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact", // Tipo generico
          source: "dashboard_support",
          name: "Utente Dashboard", // Fallback (potremmo prendere metadata.full_name)
          email: userEmail || "utente@rescuemanager.eu",
          message: `[${tipo.toUpperCase()}] ${oggetto}\n\n${messaggio}`,
        }),
      });

      if (!res.ok) {
        throw new Error("Errore API");
      }

      setSent(true);
      setOggetto("");
      setMessaggio("");
    } catch {
      setError("Errore durante l'invio. Scrivi direttamente a info@rescuemanager.eu");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Supporto Clienti</h1>
        <p className="text-gray-500 text-lg">Come possiamo aiutarti oggi?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* CARD LIVE CHAT */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-5">
            <MessageSquareText className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Live Chat</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Parla direttamente con un nostro operatore. Tempo medio di risposta: 5 minuti.
          </p>
          <button
            onClick={openChatwoot}
            className="mt-auto px-6 py-3 w-full bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition shadow-md shadow-slate-200"
          >
            Avvia Chat
          </button>
        </div>

        {/* CARD CONTATTI DIRETTI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Contatti diretti</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Email</div>
                <a href="mailto:info@rescuemanager.eu" className="text-gray-900 font-medium hover:text-blue-600 transition">info@rescuemanager.eu</a>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Telefono e WhatsApp</div>
                <a href="tel:+393921723028" className="text-gray-900 font-medium hover:text-blue-600 transition">+39 392 172 3028</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Invia un messaggio email</h2>
        
        {sent ? (
          <div className="bg-white rounded-xl border border-green-200 shadow-sm p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Richiesta inviata!</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Ti risponderemo via email all'indirizzo <span className="text-gray-900 font-medium">{userEmail}</span> il prima possibile.
            </p>
            <button
              onClick={() => setSent(false)}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Invia un'altra richiesta
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Tipo di richiesta</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="domanda">Domanda generale</option>
                <option value="bug">Segnalazione problema (Bug)</option>
                <option value="funzionalita">Richiesta nuova funzionalità</option>
                <option value="fatturazione">Problemi di fatturazione</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Oggetto</label>
              <input
                type="text"
                value={oggetto}
                onChange={(e) => setOggetto(e.target.value)}
                placeholder="Riassumi il motivo del contatto"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Messaggio</label>
              <textarea
                value={messaggio}
                onChange={(e) => setMessaggio(e.target.value)}
                placeholder="Descrivi dettagliatamente la tua richiesta..."
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold disabled:opacity-50"
            >
              {sending ? (
                <><div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Inviando...</>
              ) : (
                <><Send className="h-5 w-5" /> Invia Messaggio</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}