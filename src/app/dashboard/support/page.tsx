"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Phone, Send, MessageSquareText, Plus, ArrowLeft, Loader2, RefreshCw,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type TicketListItem = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  last_message_at: string;
  created_at: string;
  customer_unread?: boolean;
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open:        { label: "Aperto",         cls: "bg-blue-100 text-blue-700" },
  pending:     { label: "In attesa",      cls: "bg-amber-100 text-amber-700" },
  in_progress: { label: "In lavorazione", cls: "bg-indigo-100 text-indigo-700" },
  resolved:    { label: "Risolto",        cls: "bg-green-100 text-green-700" },
  closed:      { label: "Chiuso",         cls: "bg-gray-100 text-gray-600" },
};

const CATEGORY_LABELS: Record<string, string> = {
  domanda: "Domanda generale",
  bug: "Segnalazione problema",
  funzionalita: "Richiesta funzionalità",
  fatturazione: "Fatturazione",
  altro: "Altro",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.open;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

export default function SupportPage() {
  const router = useRouter();
  const [view, setView] = useState<"list" | "new">("list");
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState("domanda");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/support/tickets");
      if (!res.ok) throw new Error("Errore caricamento");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch {
      setError("Impossibile caricare i ticket.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  // Realtime: cambi sui propri ticket (es. risposta staff) → aggiorna lista live
  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("support-tickets-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => { loadTickets(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadTickets]);

  const openChatwoot = () => {
    const cw = (window as unknown as { $chatwoot?: { toggle: (s: string) => void } }).$chatwoot;
    if (cw) cw.toggle("open");
    else alert("La live chat si sta caricando, riprova tra qualche istante.");
  };

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3 || message.trim().length < 5) {
      setError("Compila oggetto e messaggio.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, message }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSubject("");
      setMessage("");
      setCategory("domanda");
      // Va direttamente alla pagina del ticket creato
      if (data.ticket_id) router.push(`/dashboard/support/${data.ticket_id}`);
      else { await loadTickets(); setView("list"); }
    } catch {
      setError("Errore durante l'invio. Riprova o scrivi a supporto@rescuemanager.eu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Supporto Clienti</h1>
          <p className="text-gray-500 text-lg">Apri un ticket o avvia la live chat: ti rispondiamo via email e qui in area riservata.</p>
        </div>
        {view === "list" && (
          <button
            onClick={() => { setView("new"); setError(null); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shrink-0"
          >
            <Plus className="h-4 w-4" /> Nuovo ticket
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">{error}</div>
      )}

      {/* Live chat + contatti */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-5">
            <MessageSquareText className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Live Chat</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Parla in tempo reale con un nostro operatore. Risposta media: pochi minuti.
          </p>
          <button
            onClick={openChatwoot}
            className="mt-auto px-6 py-3 w-full bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition shadow-md shadow-slate-200"
          >
            Avvia Chat
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Contatti diretti</h2>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email</div>
                <a href="mailto:supporto@rescuemanager.eu" className="text-gray-900 font-medium hover:text-blue-600 transition">supporto@rescuemanager.eu</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Telefono e WhatsApp</div>
                <a href="tel:+393921723028" className="text-gray-900 font-medium hover:text-blue-600 transition">+39 392 172 3028</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTA */}
      {view === "list" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">I tuoi ticket</h2>
            <button onClick={loadTickets} className="text-gray-400 hover:text-gray-700" title="Aggiorna">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {loading ? (
            <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <p className="mb-4">Nessun ticket aperto.</p>
              <button onClick={() => setView("new")} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Apri il primo ticket
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {tickets.map(t => (
                <li key={t.id}>
                  <button
                    onClick={() => router.push(`/dashboard/support/${t.id}`)}
                    className="w-full text-left px-5 py-4 hover:bg-gray-50 transition flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 truncate">{t.subject}</span>
                        <StatusBadge status={t.status} />
                        {t.customer_unread && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 animate-pulse">
                            Nuova risposta
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {CATEGORY_LABELS[t.category] || t.category} · aggiornato {fmt(t.last_message_at)}
                      </div>
                    </div>
                    <span className="text-gray-300 text-xs shrink-0">#{t.id.slice(0, 8)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* NUOVO */}
      {view === "new" && (
        <form onSubmit={submitNew} className="bg-white rounded-xl border border-gray-200 p-8 space-y-5">
          <button type="button" onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Torna ai ticket
          </button>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Tipo di richiesta</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Oggetto</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Riassumi il problema" maxLength={200}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Messaggio</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} maxLength={5000}
              placeholder="Descrivi nel dettaglio la tua richiesta..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" required />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50">
            {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Invio...</> : <><Send className="h-5 w-5" /> Apri ticket</>}
          </button>
        </form>
      )}
    </div>
  );
}
