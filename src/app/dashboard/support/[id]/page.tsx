"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send, Paperclip, X, FileText } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type TicketDetail = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  last_message_at: string;
};

type Attachment = { name: string; key: string; size: number; type: string };

type TicketMessage = {
  id: string;
  sender_type: "customer" | "staff" | "system";
  sender_name: string | null;
  body: string;
  attachments?: Attachment[];
  created_at: string;
};

const fmtSize = (b: number) =>
  b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open:        { label: "Aperto",         cls: "bg-blue-100 text-blue-700" },
  pending:     { label: "In attesa",      cls: "bg-amber-100 text-amber-700" },
  in_progress: { label: "In lavorazione", cls: "bg-indigo-100 text-indigo-700" },
  resolved:    { label: "Risolto",        cls: "bg-green-100 text-green-700" },
  closed:      { label: "Chiuso",         cls: "bg-gray-100 text-gray-600" },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.open;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [pending, setPending] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/support/tickets/${id}`);
      if (res.status === 404) { setError("Ticket non trovato."); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
    } catch {
      setError("Impossibile caricare il ticket.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Realtime: nuovi messaggi sul ticket → ricarica thread
  useEffect(() => {
    if (!id) return;
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`ticket-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${id}` },
        () => { load(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, load]);

  const uploadFile = async (file: File) => {
    if (!id) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/support/tickets/${id}/attachments`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload fallito");
      setPending(p => [...p, data.attachment]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fallito");
    } finally {
      setUploading(false);
    }
  };

  const removePending = (idx: number) => setPending(p => p.filter((_, j) => j !== idx));

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) uploadFile(f);
  };

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || (reply.trim().length < 2 && pending.length === 0)) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/support/tickets/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply, attachments: pending }),
      });
      if (!res.ok) throw new Error();
      setReply("");
      setPending([]);
      await load();
    } catch {
      setError("Errore invio risposta.");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <button
        onClick={() => router.push("/dashboard/support")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Torna ai ticket
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-medium">{error}</div>
      )}

      {loading ? (
        <div className="p-16 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>
      ) : ticket ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Aperto il {fmt(ticket.created_at)} · #{ticket.id.slice(0, 8)}
            </p>
          </div>

          <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto bg-gray-50">
            {messages.map(m => {
              if (m.sender_type === "system") {
                return (
                  <div key={m.id} className="flex justify-center">
                    <div className="max-w-[90%] text-center text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded-lg px-4 py-2">
                      {m.body}
                    </div>
                  </div>
                );
              }
              const isStaff = m.sender_type === "staff";
              return (
                <div key={m.id} className={`flex ${isStaff ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 ${isStaff ? "bg-white border border-gray-200" : "bg-blue-600 text-white"}`}>
                    <div className={`text-[10px] mb-1 ${isStaff ? "text-gray-400" : "text-blue-100"}`}>
                      {isStaff ? (m.sender_name || "Supporto") : "Tu"} · {fmt(m.created_at)}
                    </div>
                    <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {m.attachments.map(a => (
                          <a
                            key={a.key}
                            href={`/api/support/tickets/${id}/dl?key=${encodeURIComponent(a.key)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 text-xs underline ${isStaff ? "text-blue-600" : "text-blue-100"}`}
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{a.name}</span>
                            <span className="opacity-60">({fmtSize(a.size)})</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={submitReply} className="p-4 border-t border-gray-100">
            {["resolved", "closed"].includes(ticket.status) && (
              <p className="text-xs text-gray-500 mb-2">
                Questo ticket è {STATUS_LABELS[ticket.status].label.toLowerCase()}: rispondendo verrà riaperto.
              </p>
            )}
            {pending.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {pending.map((a, i) => (
                  <span key={a.key} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-lg">
                    <FileText className="h-3 w-3" />
                    <span className="max-w-[160px] truncate">{a.name}</span>
                    <button type="button" onClick={() => removePending(i)} className="text-gray-400 hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <label className={`flex items-center justify-center px-3 py-2.5 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-50 ${uploading ? "opacity-50 pointer-events-none" : ""}`} title="Allega file">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" /> : <Paperclip className="h-4 w-4 text-gray-500" />}
                <input type="file" className="hidden" onChange={onFilePick} />
              </label>
              <input
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Scrivi una risposta..."
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="submit"
                disabled={replying || (reply.trim().length < 2 && pending.length === 0)}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium"
              >
                {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Invia
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
