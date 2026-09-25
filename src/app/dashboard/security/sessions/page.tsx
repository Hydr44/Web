"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Contenuto, TD, TH, TestataAzione } from "../../_ui/cornice";
import { useConferma } from "../../_ui/conferma";

/**
 * Postazioni collegate — sessioni reali su `auth.sessions`.
 * Vedi API `/api/auth/sessions/list` e `/api/auth/sessions/revoke`.
 */

interface SessionRow {
  id: string;
  created_at: string;
  updated_at: string;
  not_after: string | null;
  ip: string | null;
  user_agent: string | null;
  aal: string | null;
  factor_id: string | null;
  is_current: boolean;
}

function parseUA(ua: string | null) {
  if (!ua) return { device: "Sconosciuto", browser: "", os: "" };
  const lower = ua.toLowerCase();
  let device = "Computer";
  if (/iphone|android|mobile/.test(lower)) device = "Telefono";
  else if (/ipad|tablet/.test(lower)) device = "Tavoletta";
  let browser = "Browser";
  if (lower.includes("electron") || lower.includes("rescuemanager")) browser = "App desktop";
  else if (lower.includes("firefox")) browser = "Firefox";
  else if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("chrome") && !lower.includes("edg")) browser = "Chrome";
  else if (lower.includes("safari") && !lower.includes("chrome")) browser = "Safari";
  let os = "";
  if (lower.includes("mac os")) os = "macOS";
  else if (lower.includes("windows")) os = "Windows";
  else if (lower.includes("linux") && !/android/.test(lower)) os = "Linux";
  else if (lower.includes("android")) os = "Android";
  else if (/iphone|ipad/.test(lower)) os = "iOS";
  return { device, browser, os };
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "adesso";
  if (min < 60) return `${min} minuti fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ore fa`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} giorni fa`;
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long" });
}

export default function SessionsPage() {
  usePageTitle("Postazioni collegate");
  const { chiedi, dialogo } = useConferma();
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null); // session_id in revoca o "all"
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/auth/sessions/list");
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setError(j.error || "Non è stato possibile leggere le sessioni");
        setSessions([]);
        return;
      }
      setSessions(j.sessions || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore di rete");
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const revoke = async (sessionId: string) => {
    const ok = await chiedi({
      titolo: "Scollegare questa postazione",
      testo: "Chi la sta usando viene buttato fuori e dovra' rientrare con la password.",
      conferma: "Scollega",
      annulla: "Lascia collegata",
      pericolo: true,
    });
    if (!ok) return;
    setWorking(sessionId);
    setError(null);
    setSuccess(null);
    try {
      const r = await fetch("/api/auth/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Non è stato possibile chiudere la sessione");
      setSuccess("Postazione scollegata.");
      // Audit log
      try {
        await fetch("/api/user/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "session.revoked", metadata: { session_id: sessionId } }),
        });
      } catch { /* non bloccante */ }
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Non è stato possibile chiudere le sessioni");
    } finally {
      setWorking(null);
    }
  };

  const revokeAllOther = async () => {
    const ok = await chiedi({
      titolo: "Scollegare tutte le altre postazioni",
      testo: "Resta collegata solo quella che stai usando adesso. Su tutte le altre bisognera' rientrare con la password.",
      conferma: "Scollega le altre",
      annulla: "Lascia tutto com'e'",
      pericolo: true,
    });
    if (!ok) return;
    setWorking("all");
    setError(null);
    setSuccess(null);
    try {
      const r = await fetch("/api/auth/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all_other: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Non è stato possibile chiudere le sessioni");
      setSuccess("Le altre postazioni sono state scollegate.");
      try {
        await fetch("/api/user/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "session.revoked_all_other" }),
        });
      } catch { /* non bloccante */ }
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Non è stato possibile chiudere le sessioni");
    } finally {
      setWorking(null);
    }
  };

  if (loading) {
    return (
      <>
        <TestataAzione
          indietro="/dashboard/security"
          occhiello="Sicurezza"
          titolo="Postazioni collegate"
        />
        <Contenuto>
          <p className="rm-muted">Lettura delle sessioni attive.</p>
        </Contenuto>
      </>
    );
  }

  const altre = sessions.filter((s) => !s.is_current).length;

  return (
    <>
      <TestataAzione
        indietro="/dashboard/security"
        occhiello="Sicurezza"
        titolo="Postazioni collegate"
        sotto="Dispositivi e programmi collegati a questa utenza. Scollega quelli che non riconosci."
        azioni={
          <>
            <button
              type="button"
              onClick={refresh}
              disabled={working !== null}
              className="rm-btn rm-btn--tertiary"
              style={{ gap: 14 }}
            >
              <span>Aggiorna</span>
              <RefreshCw size={15} />
            </button>
            {altre > 0 && (
              <button
                type="button"
                onClick={revokeAllOther}
                disabled={working !== null}
                className="rm-btn rm-btn--danger"
              >
                <span>
                  {working === "all" ? "Scollegamento in corso" : `Scollega le altre (${altre})`}
                </span>
              </button>
            )}
          </>
        }
      />

      <Contenuto>
        {error && <div className="rm-note rm-note--errore" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="rm-note rm-note--info" style={{ marginBottom: 16 }}>{success}</div>}

        {sessions.length === 0 ? (
          <div className="rm-card">
            <p className="rm-muted">Nessuna sessione registrata.</p>
          </div>
        ) : (
          <>
            <div className="rm-scroll">
              <table className="rm-tab">
                <thead>
                  <tr>
                    <th style={TH}>Postazione</th>
                    <th style={TH}>Indirizzo di rete</th>
                    <th style={TH}>Ultima attivita&apos;</th>
                    <th style={TH}>Stato</th>
                    <th style={TH} />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => {
                    const ua = parseUA(s.user_agent);
                    return (
                      <tr key={s.id}>
                        <td style={TD}>
                          {ua.browser}{ua.os ? `, ${ua.os}` : ""}
                          <br />
                          <span className="rm-muted">{ua.device}</span>
                        </td>
                        <td style={TD} className="rm-mono">{s.ip || "—"}</td>
                        <td style={TD}>
                          {relTime(s.updated_at)}
                          <br />
                          <span className="rm-muted">collegata {relTime(s.created_at)}</span>
                        </td>
                        <td style={TD}>
                          <span className={s.is_current ? "rm-stato rm-stato--ok" : "rm-stato rm-stato--fermo"}>
                            {s.is_current ? "Questa postazione" : "Altra postazione"}
                          </span>
                          {s.aal === "aal2" && (
                            <>
                              <br />
                              <span className="rm-muted">verifica in due passaggi</span>
                            </>
                          )}
                        </td>
                        <td style={TD}>
                          {!s.is_current && (
                            <button
                              type="button"
                              onClick={() => revoke(s.id)}
                              disabled={working !== null}
                              className="rm-btn rm-btn--danger"
                              style={{ height: 28, padding: "0 10px", gap: 0 }}
                            >
                              <span>{working === s.id ? "Scollegamento" : "Scollega"}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="rm-muted" style={{ marginTop: 12 }}>
              {sessions.length === 1 ? "Una postazione collegata." : `${sessions.length} postazioni collegate.`}
            </p>
          </>
        )}
      </Contenuto>
      {dialogo}
    </>
  );
}
