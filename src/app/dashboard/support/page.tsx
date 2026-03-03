"use client";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { LifeBuoy, Mail, Phone, Send, CheckCircle, MessageSquare } from "lucide-react";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oggetto.trim() || !messaggio.trim()) {
      setError("Compila tutti i campi.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("support_requests").insert({
        user_id: user?.id ?? null,
        email: userEmail,
        tipo,
        oggetto,
        messaggio,
        status: "aperto",
      });
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Supporto</h1>
        <p className="text-slate-400">Scrivi al nostro team. Risposta entro 24 ore.</p>
      </div>

      {sent ? (
        <div className="bg-[#1e293b] rounded-xl border border-green-500/30 p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Richiesta inviata</h2>
          <p className="text-slate-400 mb-6">Ti risponderemo all'indirizzo <span className="text-white">{userEmail}</span> entro 24 ore.</p>
          <button
            onClick={() => setSent(false)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Invia un'altra richiesta
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#1e293b] rounded-xl border border-slate-700 p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">Tipo di richiesta</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-[#0f172a] text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="domanda">Domanda</option>
              <option value="bug">Segnalazione bug</option>
              <option value="funzionalita">Richiesta funzionalità</option>
              <option value="account">Problema account</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Oggetto</label>
            <input
              type="text"
              value={oggetto}
              onChange={(e) => setOggetto(e.target.value)}
              placeholder="Descrivi brevemente il problema"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-[#0f172a] text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Messaggio</label>
            <textarea
              value={messaggio}
              onChange={(e) => setMessaggio(e.target.value)}
              placeholder="Descrivi il problema in dettaglio..."
              rows={5}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-[#0f172a] text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Invio in corso...</>
            ) : (
              <><Send className="h-4 w-4" />Invia richiesta</>
            )}
          </button>
        </form>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-slate-700 p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Contatti diretti</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Mail className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Email supporto</div>
              <a href="mailto:info@rescuemanager.eu" className="text-white text-sm hover:text-blue-400 transition-colors">info@rescuemanager.eu</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Phone className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Telefono</div>
              <a href="tel:+393921723028" className="text-white text-sm hover:text-blue-400 transition-colors">+39 392 172 3028</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}