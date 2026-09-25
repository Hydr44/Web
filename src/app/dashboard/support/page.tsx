"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Contenuto, Dato, PiedeModulo, Sezione, TD, TH, Testata } from "../_ui/cornice";

/**
 * Assistenza: l'elenco delle richieste e i recapiti.
 *
 * Il disegno vuole i tre recapiti in alto, poi la tabella delle richieste con
 * lo stato scritto. La conversazione con l'operatore sta dentro la richiesta.
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

const FORM_CATEGORIES = ["domanda", "bug", "funzionalita", "fatturazione", "altro"];

const APERTE = ["open", "pending", "in_progress"];

function quando(iso: string): string {
  const d = new Date(iso);
  const oggi = new Date();
  const ora = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === oggi.toDateString()) return `oggi alle ${ora}`;
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
}

export default function SupportPage() {
  usePageTitle("Assistenza");
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
      setError("Non è stato possibile leggere le richieste.");
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
      setError(err instanceof Error ? err.message : "Non è stato possibile avviare la conversazione.");
      setStartingChat(false);
    }
  };

  const submitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3) {
      setError("L'oggetto deve avere almeno tre caratteri.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Il messaggio deve avere almeno dieci caratteri.");
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

  const aperte = tickets.filter((t) => APERTE.includes(t.status)).length;

  return (
    <>
      <Testata
        titolo="Assistenza"
        coda={tickets.length > 0 ? tickets.length : undefined}
        sotto="Le tue richieste, con la conversazione con un operatore"
        azioni={
          view === "list" ? (
            <>
              <button
                type="button"
                onClick={startLiveChat}
                disabled={startingChat}
                className="rm-btn rm-btn--tertiary"
              >
                <span>{startingChat ? "Avvio in corso" : "Parla con un operatore"}</span>
              </button>
              <button
                type="button"
                onClick={() => { setView("new"); setError(null); }}
                className="rm-btn rm-btn--primary"
                style={{ gap: 14 }}
              >
                <span>Nuova richiesta</span>
                <Plus size={15} />
              </button>
            </>
          ) : undefined
        }
      />

      <Contenuto>
        {error && <div className="rm-note rm-note--errore" style={{ marginBottom: 16 }}>{error}</div>}

        {view === "list" && (
          <>
            <div className="rm-griglia" style={{ marginBottom: 16 }}>
              <Dato
                etichetta="Email"
                valore={
                  <a href="mailto:supporto@rescuemanager.eu" style={{ fontSize: 18, overflowWrap: "anywhere" }}>
                    supporto@rescuemanager.eu
                  </a>
                }
                nota="rispondiamo in giornata"
              />
              <Dato
                etichetta="Telefono"
                valore={<a href="tel:+393921723028">392 172 3028</a>}
                nota="lunedi a venerdi, 9 alle 18"
              />
              <Dato
                etichetta="WhatsApp"
                valore={
                  <a href="https://wa.me/393921723028" target="_blank" rel="noopener noreferrer">
                    392 172 3028
                  </a>
                }
                nota="per le urgenze in strada"
              />
            </div>

            {loading ? (
              <div className="rm-card">
                <p className="rm-muted">Lettura delle richieste.</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="rm-card">
                <p className="rm-muted">Nessuna richiesta aperta.</p>
                <div style={{ marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => setView("new")}
                    className="rm-btn rm-btn--primary"
                  >
                    <span>Apri la prima richiesta</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="rm-scroll">
                  <table className="rm-tab">
                    <thead>
                      <tr>
                        <th style={TH}>Riferimento</th>
                        <th style={TH}>Oggetto</th>
                        <th style={TH}>Ultimo aggiornamento</th>
                        <th style={TH}>Stato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t) => {
                        const s = STATUS_LABELS[t.status] || STATUS_LABELS.open;
                        return (
                          <tr key={t.id}>
                            <td style={TD} className="rm-mono">{t.id.slice(0, 8)}</td>
                            <td style={TD}>
                              <a
                                href={`/dashboard/support/${t.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  router.push(`/dashboard/support/${t.id}`);
                                }}
                              >
                                {t.subject}
                              </a>
                              <br />
                              <span className="rm-muted">
                                {CATEGORY_LABELS[t.category] || t.category}
                              </span>
                            </td>
                            <td style={TD}>{quando(t.last_message_at)}</td>
                            <td style={TD}>
                              {t.customer_unread ? (
                                <span className="rm-stato rm-stato--ok">Risposta da leggere</span>
                              ) : (
                                <span className={s.cls}>{s.label}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="rm-muted" style={{ marginTop: 12 }}>
                  {tickets.length === 1 ? "1 richiesta" : `${tickets.length} richieste`}
                  {aperte > 0 && (aperte === 1 ? ", 1 aperta" : `, ${aperte} aperte`)}
                </p>
              </>
            )}
          </>
        )}

        {view === "new" && (
          <form onSubmit={submitNew}>
            <Sezione titolo="Nuova richiesta">
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, maxWidth: 640 }}>
                <div className="rm-field">
                  <label htmlFor="ticket-category" className="rm-label">
                    Tipo di richiesta
                  </label>
                  <select
                    id="ticket-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rm-input"
                  >
                    {FORM_CATEGORIES.map((v) => (
                      <option key={v} value={v}>{CATEGORY_LABELS[v]}</option>
                    ))}
                  </select>
                </div>

                <div className="rm-field">
                  <label htmlFor="ticket-subject" className="rm-label">
                    Oggetto
                  </label>
                  <input
                    id="ticket-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Riassumi la richiesta in poche parole"
                    maxLength={200}
                    className="rm-input"
                    required
                  />
                </div>

                <div className="rm-field">
                  <label htmlFor="ticket-message" className="rm-label">
                    Messaggio
                  </label>
                  <textarea
                    id="ticket-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    maxLength={5000}
                    placeholder="Descrivi la richiesta. Indica il cliente o il documento coinvolto."
                    className="rm-input"
                    required
                  />
                  <p className="rm-muted">Almeno dieci caratteri.</p>
                </div>
              </div>
            </Sezione>

            <PiedeModulo
              note="Rispondiamo qui e per email."
              azioni={
                <>
                  <button
                    type="button"
                    onClick={() => { setView("list"); setError(null); }}
                    className="rm-btn rm-btn--secondary"
                  >
                    <span>Annulla</span>
                  </button>
                  <button type="submit" disabled={submitting} className="rm-btn rm-btn--primary">
                    <span>{submitting ? "Invio in corso" : "Invia la richiesta"}</span>
                  </button>
                </>
              }
            />
          </form>
        )}
      </Contenuto>
    </>
  );
}
