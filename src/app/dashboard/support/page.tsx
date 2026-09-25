"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { usePageTitle } from "@/hooks/usePageTitle";

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
  open:        { label: "Aperta",         cls: "rm-stato rm-stato--corso" },
  pending:     { label: "In attesa",      cls: "rm-stato rm-stato--corso" },
  in_progress: { label: "In lavorazione", cls: "rm-stato rm-stato--corso" },
  resolved:    { label: "Risolta",        cls: "rm-stato rm-stato--ok" },
  closed:      { label: "Chiusa",         cls: "rm-stato rm-stato--fermo" },
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
  return <span className={s.cls}>{s.label}</span>;
}

export default function SupportPage() {
  usePageTitle("Supporto");
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

  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <h1>Assistenza</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Apri una richiesta o avvia una conversazione: rispondiamo qui e per
            email.
          </p>
        </div>
        {view === "list" && (
          <button
            onClick={() => { setView("new"); setError(null); }}
            className="rm-btn rm-btn--primary"
          >
            <span>Nuova richiesta</span>
          </button>
        )}
      </div>

      {error && <div className="rm-note rm-note--errore">{error}</div>}

      <div className="rm-card">
        <div className="rm-cardhead">
          <div>
            <h3>Conversazione con un operatore</h3>
            <p className="rm-muted" style={{ marginTop: 4 }}>
              Dal lunedì al venerdì, dalle 9 alle 18. Fuori orario la richiesta
              resta aperta e riceve risposta entro un giorno lavorativo.
            </p>
          </div>
          <button
            onClick={startLiveChat}
            disabled={startingChat}
            className="rm-btn rm-btn--secondary"
          >
            <span>{startingChat ? "Avvio in corso" : "Avvia la conversazione"}</span>
          </button>
        </div>
        <div className="rm-righe">
          <div className="rm-riga">
            <span>Email</span>
            <span>
              <a href="mailto:supporto@rescuemanager.eu">supporto@rescuemanager.eu</a>
            </span>
          </div>
          <div className="rm-riga">
            <span>Telefono</span>
            <span>
              <a href="tel:+393921723028">+39 392 172 3028</a>
            </span>
          </div>
          <div className="rm-riga">
            <span>WhatsApp</span>
            <span>
              <a href="https://wa.me/393921723028" target="_blank" rel="noopener noreferrer">
                Scrivi su WhatsApp
              </a>
            </span>
          </div>
        </div>
      </div>

      {view === "list" && (
        <div className="rm-card">
          <div className="rm-cardhead">
            <h3>
              Le tue richieste{tickets.length > 0 ? ` (${tickets.length})` : ""}
            </h3>
            <button onClick={loadTickets} className="rm-btn rm-btn--secondary">
              <span>{loading ? "Aggiornamento in corso" : "Aggiorna"}</span>
            </button>
          </div>

          {loading ? (
            <p className="rm-muted">Lettura delle richieste.</p>
          ) : tickets.length === 0 ? (
            <>
              <p className="rm-muted">Nessuna richiesta aperta.</p>
              <p style={{ marginTop: 16 }}>
                <button onClick={() => setView("new")} className="rm-btn rm-btn--primary">
                  <span>Apri la prima richiesta</span>
                </button>
              </p>
            </>
          ) : (
            <div className="rm-scroll">
              <table className="rm-tab">
                <thead>
                  <tr>
                    <th>Oggetto</th>
                    <th>Tipo</th>
                    <th>Stato</th>
                    <th>Ultimo aggiornamento</th>
                    <th>Riferimento</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <a
                          href={`/dashboard/support/${t.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/dashboard/support/${t.id}`);
                          }}
                        >
                          {t.subject}
                        </a>
                        {t.customer_unread && (
                          <>
                            <br />
                            <span className="rm-stato rm-stato--corso">Nuova risposta</span>
                          </>
                        )}
                      </td>
                      <td>{CATEGORY_LABELS[t.category] || t.category}</td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td>{fmt(t.last_message_at)}</td>
                      <td className="rm-mono">{t.id.slice(0, 8)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === "new" && (
        <form onSubmit={submitNew}>
          <div className="rm-card">
            <div className="rm-cardhead">
              <h3>Nuova richiesta</h3>
              <button
                type="button"
                onClick={() => { setView("list"); setError(null); }}
                className="rm-btn rm-btn--ghost"
              >
                <span>Torna all&apos;elenco</span>
              </button>
            </div>

            <div className="flex flex-col gap-4" style={{ maxWidth: 620 }}>
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

              <div className="flex flex-wrap gap-1">
                <button type="submit" disabled={submitting} className="rm-btn rm-btn--primary">
                  <span>{submitting ? "Invio in corso" : "Invia la richiesta"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setView("list"); setError(null); }}
                  className="rm-btn rm-btn--secondary"
                >
                  <span>Annulla</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
