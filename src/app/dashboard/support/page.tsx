"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  Send,
  MessageSquareText,
  Plus,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Pagina supporto — stile dashboard professionale.
 *
 * Sostituisce la versione precedente con CTA blu accesi / icone grandi /
 * gradients. Mantiene tutte le funzionalità: lista ticket, creazione,
 * live chat, contatti, realtime sui propri ticket.
 */

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
  open:        { label: "Aperto",         cls: "bg-gray-100 text-gray-700 border-gray-200" },
  pending:     { label: "In attesa",      cls: "bg-amber-50 text-amber-800 border-amber-200" },
  in_progress: { label: "In lavorazione", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  resolved:    { label: "Risolto",        cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  closed:      { label: "Chiuso",         cls: "bg-gray-50 text-gray-500 border-gray-200" },
};

const CATEGORY_LABELS: Record<string, string> = {
  domanda: "Domanda generale",
  bug: "Segnalazione problema",
  funzionalita: "Richiesta funzionalità",
  fatturazione: "Fatturazione",
  altro: "Altro",
  chat: "Chat dal vivo",
};

const FORM_CATEGORIES = ["domanda", "bug", "funzionalita", "fatturazione", "altro"];

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.open;
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded border ${s.cls}`}>
      {s.label}
    </span>
  );
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
  const [startingChat, setStartingChat] = useState(false);

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

  // Realtime sui ticket dell'utente
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

  const startLiveChat = async () => {
    setStartingChat(true);
    setError(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Chat dal vivo",
          category: "chat",
          message: "Ho avviato una chat dal vivo e ho bisogno di assistenza.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      router.push(`/dashboard/support/${data.ticket_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossibile avviare la chat.");
      setStartingChat(false);
    }
  };

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3) {
      setError("L'oggetto deve contenere almeno 3 caratteri.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Il messaggio deve contenere almeno 10 caratteri.");
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      setSubject("");
      setMessage("");
      setCategory("domanda");
      if (data.ticket_id) router.push(`/dashboard/support/${data.ticket_id}`);
      else { await loadTickets(); setView("list"); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'invio.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header — stile compatto, professionale */}
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Supporto</h1>
          <p className="text-sm text-gray-500 mt-1">
            Apri un ticket o avvia una chat: ti rispondiamo in area riservata e via email.
          </p>
        </div>
        {view === "list" && (
          <button
            onClick={() => { setView("new"); setError(null); }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuovo ticket
          </button>
        )}
      </header>

      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded border border-red-200 bg-red-50 text-sm text-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Canali rapidi: chat + contatti */}
      <section className="grid md:grid-cols-3 gap-3">
        {/* Live chat */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center shrink-0">
              <MessageSquareText className="h-5 w-5 text-gray-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">Chat dal vivo</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Operatore reale in orario d&apos;ufficio (lun–ven 9:00–18:00).
                Fuori orario rispondiamo via ticket entro 24h.
              </p>
              <button
                onClick={startLiveChat}
                disabled={startingChat}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
              >
                {startingChat ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Avvio…
                  </>
                ) : (
                  <>
                    <MessageSquareText className="h-3.5 w-3.5" />
                    Avvia chat
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Contatti diretti */}
        <div className="bg-white border border-gray-200 rounded p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Contatti</h2>
          <a
            href="mailto:supporto@rescuemanager.eu"
            className="group flex items-center gap-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Mail className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            <span className="truncate">supporto@rescuemanager.eu</span>
          </a>
          <a
            href="tel:+393921723028"
            className="group flex items-center gap-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Phone className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            <span>+39 392 172 3028</span>
          </a>
        </div>
      </section>

      {/* Lista ticket */}
      {view === "list" && (
        <section className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">I tuoi ticket</h2>
              {tickets.length > 0 && (
                <span className="text-xs text-gray-400">({tickets.length})</span>
              )}
            </div>
            <button
              onClick={loadTickets}
              className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors"
              title="Aggiorna"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="px-5 py-10 flex justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">Nessun ticket aperto.</p>
              <button
                onClick={() => setView("new")}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Apri il primo ticket
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => router.push(`/dashboard/support/${t.id}`)}
                    className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {t.subject}
                        </span>
                        <StatusBadge status={t.status} />
                        {t.customer_unread && (
                          <span className="inline-flex items-center text-[10px] font-semibold bg-gray-900 text-white px-1.5 py-0.5 rounded">
                            NUOVA
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {CATEGORY_LABELS[t.category] || t.category} · aggiornato {fmt(t.last_message_at)}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 shrink-0">
                      #{t.id.slice(0, 8)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Form nuovo ticket */}
      {view === "new" && (
        <form
          onSubmit={submitNew}
          className="bg-white border border-gray-200 rounded p-5 space-y-4"
        >
          <button
            type="button"
            onClick={() => { setView("list"); setError(null); }}
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Torna ai ticket
          </button>

          <div>
            <label htmlFor="ticket-category" className="block text-xs font-medium text-gray-700 mb-1">
              Tipo di richiesta
            </label>
            <select
              id="ticket-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded border border-gray-200 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition-colors"
            >
              {FORM_CATEGORIES.map((v) => (
                <option key={v} value={v}>{CATEGORY_LABELS[v]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ticket-subject" className="block text-xs font-medium text-gray-700 mb-1">
              Oggetto
            </label>
            <input
              id="ticket-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Riassumi il problema in poche parole"
              maxLength={200}
              className="w-full px-3 py-2 text-sm rounded border border-gray-200 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="ticket-message" className="block text-xs font-medium text-gray-700 mb-1">
              Messaggio
            </label>
            <textarea
              id="ticket-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={5000}
              placeholder="Descrivi nel dettaglio la richiesta. Allega screenshot/ID se utile."
              className="w-full px-3 py-2 text-sm rounded border border-gray-200 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition-colors resize-none"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Minimo 10 caratteri · ricordati di indicare org / cliente coinvolti.
            </p>
          </div>

          <div className="pt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setView("list"); setError(null); }}
              className="px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Invio…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Apri ticket
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
