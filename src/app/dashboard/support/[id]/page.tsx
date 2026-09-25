"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Send } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Contenuto, DueColonne, Riga, TestataAzione } from "../../_ui/cornice";

/**
 * Una richiesta di assistenza: la conversazione a sinistra, la scheda della
 * richiesta a destra. I messaggi dell'operatore stanno a sinistra, i propri a
 * destra, come nel disegno.
 */

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
  resolved:    { label: "Risolta",        cls: "rm-stato rm-stato--fermo" },
  closed:      { label: "Chiusa",         cls: "rm-stato rm-stato--fermo" },
};

const CATEGORY_LABELS: Record<string, string> = {
  domanda: "Domanda generale",
  bug: "Segnalazione problema",
  funzionalita: "Richiesta funzionalità",
  fatturazione: "Fatturazione",
  altro: "Altro",
  chat: "Conversazione",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/** "Oggi alle 11:20" quando e' di oggi, altrimenti la data per esteso. */
function quando(iso: string): string {
  const d = new Date(iso);
  const ora = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === new Date().toDateString()) return `Oggi alle ${ora}`;
  return `${d.toLocaleDateString("it-IT", { day: "numeric", month: "long" })} alle ${ora}`;
}

export default function TicketDetailPage() {
  usePageTitle("Richiesta di assistenza");
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

  const inviaRisposta = async () => {
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

  const submitReply = (e: React.FormEvent) => {
    e.preventDefault();
    void inviaRisposta();
  };

  const stato = ticket ? STATUS_LABELS[ticket.status] || STATUS_LABELS.open : null;
  const servizio = ticket ? CATEGORY_LABELS[ticket.category] || ticket.category : "";
  const operatore = [...messages].reverse().find((m) => m.sender_type === "staff")?.sender_name || null;
  const allegati = messages.flatMap((m) => m.attachments || []);
  const nonInviabile = replying || (reply.trim().length < 2 && pending.length === 0);

  return (
    <>
      <TestataAzione
        indietro="/dashboard/support"
        occhiello={id ? `Assistenza, ${id.slice(0, 8)}` : "Assistenza"}
        titolo={ticket?.subject || "Richiesta"}
        sotto={
          ticket ? (
            <>
              {servizio}
              <span style={{ marginLeft: 16 }}>Aperta il {fmt(ticket.created_at)}</span>
            </>
          ) : undefined
        }
        azioni={stato ? <span className={stato.cls}>{stato.label}</span> : undefined}
      />

      <Contenuto>
        {error && <div className="rm-note rm-note--errore" style={{ marginBottom: 16 }}>{error}</div>}

        {loading && (
          <div className="rm-card">
            <p className="rm-muted">Lettura della richiesta.</p>
          </div>
        )}

        {!loading && ticket && (
          <DueColonne
            principale={
              <>
                <section className="rm-card">
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {messages.map((m) => {
                      if (m.sender_type === "system") {
                        return (
                          <p key={m.id} className="rm-muted" style={{ textAlign: "center" }}>
                            {m.body}
                          </p>
                        );
                      }
                      const operatoreScrive = m.sender_type === "staff";
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            gap: 12,
                            justifyContent: operatoreScrive ? "flex-start" : "flex-end",
                          }}
                        >
                          {operatoreScrive && (
                            <span
                              aria-hidden
                              style={{
                                flex: "0 0 auto",
                                width: 22,
                                height: 22,
                                marginTop: 2,
                                background: "var(--brand)",
                              }}
                            />
                          )}
                          <div style={{ maxWidth: "78%", minWidth: 0 }}>
                            <div
                              style={{
                                padding: operatoreScrive ? 0 : "10px 14px",
                                background: operatoreScrive ? "transparent" : "var(--layer-2)",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                              }}
                            >
                              {m.body}
                            </div>
                            {m.attachments && m.attachments.length > 0 && (
                              <div style={{ marginTop: 8 }}>
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
                              </div>
                            )}
                            <p
                              className="rm-muted"
                              style={{ marginTop: 6, textAlign: operatoreScrive ? "left" : "right" }}
                            >
                              {quando(m.created_at)}
                              {operatoreScrive && `, ${m.sender_name || "Assistenza"} di RescueManager`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <form onSubmit={submitReply}>
                  <section className="rm-card">
                    {["resolved", "closed"].includes(ticket.status) && (
                      <div className="rm-note" style={{ marginBottom: 14 }}>
                        La richiesta risulta {STATUS_LABELS[ticket.status].label.toLowerCase()}:
                        rispondendo viene riaperta.
                      </div>
                    )}

                    {pending.length > 0 && (
                      <div className="rm-righe" style={{ marginBottom: 14 }}>
                        {pending.map((a, i) => (
                          <div key={a.key} className="rm-riga">
                            <span>Allegato</span>
                            <span style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                              <span>{a.name}</span>
                              <button
                                type="button"
                                onClick={() => removePending(i)}
                                className="rm-btn rm-btn--ghost"
                                style={{ height: 24, padding: "0 8px", gap: 0 }}
                              >
                                <span>Togli</span>
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 1, alignItems: "stretch" }}>
                      <textarea
                        id="ticket-reply"
                        aria-label="Scrivi la risposta"
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (!nonInviabile) void inviaRisposta();
                          }
                        }}
                        rows={3}
                        placeholder="Scrivi la risposta"
                        className="rm-input"
                        style={{ flex: 1, minWidth: 0 }}
                      />
                      <button
                        type="submit"
                        disabled={nonInviabile}
                        aria-label="Invia la risposta"
                        className="rm-btn rm-btn--primary"
                        style={{ height: "auto", padding: "0 16px", gap: 0 }}
                      >
                        <Send size={16} />
                      </button>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        marginTop: 10,
                      }}
                    >
                      <span className="rm-muted">Invio per mandare, Maiusc Invio per andare a capo</span>
                      <label
                        className="rm-muted"
                        style={{ cursor: uploading ? "default" : "pointer", textDecoration: "underline" }}
                      >
                        {uploading ? "Caricamento in corso" : "Allega un file: PDF e immagini"}
                        <input type="file" className="hidden" onChange={onFilePick} disabled={uploading} />
                      </label>
                    </div>
                  </section>
                </form>
              </>
            }
            laterale={
              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 className="rm-mono" style={{ fontSize: 18 }}>{ticket.id.slice(0, 8)}</h2>
                </div>
                <p>{servizio}</p>
                <p className="rm-muted" style={{ marginTop: 4 }}>
                  Aperta il{" "}
                  {new Date(ticket.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long" })}
                </p>
                <div className="rm-righe" style={{ marginTop: 14 }}>
                  <Riga
                    etichetta="Stato"
                    valore={stato ? <span className={stato.cls}>{stato.label}</span> : "—"}
                  />
                  <Riga etichetta="Operatore" valore={operatore || "in assegnazione"} />
                  <Riga etichetta="Servizio" valore={servizio} />
                  <Riga
                    etichetta="Allegati"
                    valore={
                      allegati.length === 0
                        ? "nessuno"
                        : allegati.map((a) => a.name).join(", ")
                    }
                  />
                </div>
              </section>
            }
          />
        )}
      </Contenuto>
    </>
  );
}
