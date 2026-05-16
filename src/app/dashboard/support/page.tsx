"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Mail, Phone, Send, MessageSquareText, Plus, ArrowLeft, Loader2, RefreshCw,
} from "lucide-react";

type TicketListItem = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  last_message_at: string;
  created_at: string;
};

type TicketMessage = {
  id: string;
  sender_type: "customer" | "staff" | "system";
  sender_name: string | null;
  body: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open:        { label: "Aperto",        cls: "bg-blue-100 text-blue-700" },
  pending:     { label: "In attesa",     cls: "bg-amber-100 text-amber-700" },
  in_progress: { label: "In lavorazione", cls: "bg-indigo-100 text-indigo-700" },
  resolved:    { label: "Risolto",       cls: "bg-green-100 text-green-700" },
  closed:      { label: "Chiuso",        cls: "bg-gray-100 text-gray-600" },
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
  const [view, setView] = useState<"list" | "new" | "detail">("list");
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form nuovo ticket
  const [category, setCategory] = useState("domanda");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // dettaglio
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ ticket: TicketListItem; messages: TicketMessage[] } | null>(null);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

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

  const openDetail = async (id: string) => {
    setActiveId(id);
    setView("detail");
    setDetail(null);
    try {
      const res = await fetch(`/api/support/tickets/${id}`);
      if (!res.ok) throw new Error();
      setDetail(await res.json());
    } catch {
      setError("Impossibile caricare il ticket.");
      setView("list");
    }
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
      setSubject("");
      setMessage("");
      setCategory("domanda");
      await loadTickets();
      setView("list");
    } catch {
      setError("Errore durante l'invio. Riprova o scrivi a supporto@rescuemanager.eu");
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || reply.trim().length < 2) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/support/tickets/${activeId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      if (!res.ok) throw new Error();
      setReply("");
      await openDetail(activeId);
    } catch {
      setError("Errore invio risposta.");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Supporto Clienti</h1>
          <p className="text-gray-500 text-lg">Apri un ticket: ti rispondiamo via email e qui in area riservata.</p>
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

      {/* Contatti rapidi */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</div>
            <a href="mailto:supporto@rescuemanager.eu" className="text-sm text-gray-900 font-medium hover:text-blue-600">supporto@rescuemanager.eu</a>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
            <Phone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Telefono</div>
            <a href="tel:+393921723028" className="text-sm text-gray-900 font-medium hover:text-blue-600">+39 392 172 3028</a>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
            <MessageSquareText className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-sm text-gray-600">Risposta media<br /><span className="font-semibold text-gray-900">entro 24h lavorative</span></div>
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
                  <button onClick={() => openDetail(t.id)} className="w-full text-left px-5 py-4 hover:bg-gray-50 transition flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 truncate">{t.subject}</span>
                        <StatusBadge status={t.status} />
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

      {/* DETTAGLIO */}
      {view === "detail" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <button onClick={() => { setView("list"); loadTickets(); }} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3">
              <ArrowLeft className="h-4 w-4" /> Torna ai ticket
            </button>
            {detail ? (
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-bold text-gray-900">{detail.ticket.subject}</h2>
                <StatusBadge status={detail.ticket.status} />
              </div>
            ) : <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
          </div>

          {detail && (
            <>
              <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto bg-gray-50">
                {detail.messages.map(m => {
                  const isStaff = m.sender_type === "staff";
                  return (
                    <div key={m.id} className={`flex ${isStaff ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[80%] rounded-xl px-4 py-3 ${isStaff ? "bg-white border border-gray-200" : "bg-blue-600 text-white"}`}>
                        <div className={`text-[10px] mb-1 ${isStaff ? "text-gray-400" : "text-blue-100"}`}>
                          {isStaff ? (m.sender_name || "Supporto") : "Tu"} · {fmt(m.created_at)}
                        </div>
                        <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={submitReply} className="p-4 border-t border-gray-100">
                {["resolved", "closed"].includes(detail.ticket.status) && (
                  <p className="text-xs text-gray-500 mb-2">Questo ticket è {STATUS_LABELS[detail.ticket.status].label.toLowerCase()}: rispondendo verrà riaperto.</p>
                )}
                <div className="flex gap-2">
                  <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Scrivi una risposta..."
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                  <button type="submit" disabled={replying || reply.trim().length < 2}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium">
                    {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Invia
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
