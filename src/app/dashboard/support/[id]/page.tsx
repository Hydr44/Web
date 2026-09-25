"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  open:        { label: "Aperta",         cls: "rm-stato rm-stato--corso" },
  pending:     { label: "In attesa",      cls: "rm-stato rm-stato--corso" },
  in_progress: { label: "In lavorazione", cls: "rm-stato rm-stato--corso" },
  resolved:    { label: "Risolta",        cls: "rm-stato rm-stato--ok" },
  closed:      { label: "Chiusa",         cls: "rm-stato rm-stato--fermo" },
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.open;
  return <span className={s.cls}>{s.label}</span>;
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
      if (res.status === 404) { setError("Richiesta non trovata."); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTicket(data.ticket);
      setMessages(data.messages || []);
    } catch {
      setError("Non è stato possibile leggere la richiesta.");
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
      if (!res.ok) throw new Error(data.error || "Non è stato possibile allegare il file");
      setPending(p => [...p, data.attachment]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Non è stato possibile allegare il file");
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
      setError("Non è stato possibile inviare la risposta.");
    } finally {
      setReplying(false);
    }
  };

  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <p className="rm-eyebrow">Assistenza</p>
          <h1 style={{ marginTop: 8 }}>{ticket?.subject || "Richiesta"}</h1>
          {ticket && (
            <p className="rm-muted" style={{ marginTop: 6 }}>
              Aperta il {fmt(ticket.created_at)} · riferimento{" "}
              <span className="rm-mono">{ticket.id.slice(0, 8)}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => router.push("/dashboard/support")}
          className="rm-btn rm-btn--ghost"
        >
          <span>Torna all&apos;elenco</span>
        </button>
      </div>

      {error && <div className="rm-note rm-note--errore">{error}</div>}

      {loading ? (
        <div className="rm-card">
          <p className="rm-muted">Lettura della richiesta.</p>
        </div>
      ) : ticket ? (
        <>
          <div className="rm-card">
            <div className="rm-cardhead">
              <h3>Conversazione</h3>
              <StatusBadge status={ticket.status} />
            </div>

            <div className="rm-righe">
              {messages.map(m => {
                if (m.sender_type === "system") {
                  return (
                    <div key={m.id} className="rm-riga">
                      <span>Servizio</span>
                      <span className="rm-muted">{m.body}</span>
                    </div>
                  );
                }
                const isStaff = m.sender_type === "staff";
                return (
                  <div key={m.id} className="rm-riga">
                    <span>
                      {isStaff ? (m.sender_name || "Assistenza") : "Tu"}
                      <br />
                      <span className="rm-muted">{fmt(m.created_at)}</span>
                    </span>
                    <span>
                      <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                        {m.body}
                      </span>
                      {m.attachments && m.attachments.length > 0 && (
                        <span style={{ display: "block", marginTop: 8 }}>
                          {m.attachments.map(a => (
                            <a
                              key={a.key}
                              href={`/api/support/tickets/${id}/dl?key=${encodeURIComponent(a.key)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "block" }}
                            >
                              {a.name} ({fmtSize(a.size)})
                            </a>
                          ))}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={submitReply}>
            <div className="rm-card">
              <div className="rm-cardhead">
                <h3>Rispondi</h3>
              </div>

              {["resolved", "closed"].includes(ticket.status) && (
                <div className="rm-note" style={{ marginBottom: 14 }}>
                  La richiesta risulta{" "}
                  {STATUS_LABELS[ticket.status].label.toLowerCase()}: rispondendo
                  viene riaperta.
                </div>
              )}

              {pending.length > 0 && (
                <div className="rm-righe" style={{ marginBottom: 14 }}>
                  {pending.map((a, i) => (
                    <div key={a.key} className="rm-riga">
                      <span>Allegato</span>
                      <span className="flex items-center justify-between gap-3">
                        <span>{a.name}</span>
                        <button
                          type="button"
                          onClick={() => removePending(i)}
                          className="rm-btn rm-btn--ghost"
                          style={{ height: 28, padding: "0 8px", gap: 0 }}
                        >
                          <span>Togli</span>
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rm-field">
                <label htmlFor="ticket-reply" className="rm-label">
                  Messaggio
                </label>
                <textarea
                  id="ticket-reply"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={4}
                  placeholder="Scrivi la risposta"
                  className="rm-input"
                />
              </div>

              <div className="flex flex-wrap gap-1" style={{ marginTop: 14 }}>
                <button
                  type="submit"
                  disabled={replying || (reply.trim().length < 2 && pending.length === 0)}
                  className="rm-btn rm-btn--primary"
                >
                  <span>{replying ? "Invio in corso" : "Invia la risposta"}</span>
                </button>
                <label
                  className="rm-btn rm-btn--secondary"
                  style={uploading ? { opacity: 0.6, pointerEvents: "none" } : undefined}
                >
                  <span>{uploading ? "Caricamento in corso" : "Allega un file"}</span>
                  <input type="file" className="hidden" onChange={onFilePick} />
                </label>
              </div>
            </div>
          </form>
        </>
      ) : null}
    </>
  );
}
