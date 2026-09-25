"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Pagina sessioni attive — integrazione reale con `auth.sessions`.
 *
 * Sostituisce la versione mock che usava un array hardcoded.
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
  let device = "Desktop";
  if (/iphone|android|mobile/.test(lower)) device = "Mobile";
  else if (/ipad|tablet/.test(lower)) device = "Tablet";
  let browser = "Browser";
  if (lower.includes("firefox")) browser = "Firefox";
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
  if (min < 1) return "Adesso";
  if (min < 60) return `${min} min fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h fa`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}g fa`;
  return new Date(iso).toLocaleDateString("it-IT");
}

export default function SessionsPage() {
  usePageTitle("Sessioni");
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
    if (!confirm("Chiudere questa sessione? La postazione collegata verrà disconnessa.")) return;
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
      setSuccess("Sessione chiusa.");
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
    if (!confirm("Chiudere tutte le altre sessioni? Resterà collegata solo questa postazione.")) return;
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
      setSuccess("Le altre sessioni sono state chiuse.");
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
        <div className="rm-area__intesta">
          <h1>Postazioni collegate</h1>
        </div>
        <div className="rm-card">
          <p className="rm-muted">Lettura delle sessioni attive.</p>
        </div>
      </>
    );
  }

  const otherCount = sessions.filter((s) => !s.is_current).length;

  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <p className="rm-eyebrow">Sicurezza</p>
          <h1 style={{ marginTop: 8 }}>Postazioni collegate</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Dispositivi e programmi che risultano collegati a questa utenza.
            Chiudi la sessione di quelli che non riconosci.
          </p>
        </div>
        <Link href="/dashboard/security" className="rm-btn rm-btn--ghost">
          <span>Torna a Sicurezza</span>
        </Link>
      </div>

      {error && <div className="rm-note rm-note--errore">{error}</div>}
      {success && <div className="rm-note rm-note--info">{success}</div>}

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>
            {sessions.length === 1
              ? "Una sessione attiva"
              : `${sessions.length} sessioni attive`}
          </h3>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={refresh}
              disabled={working !== null}
              className="rm-btn rm-btn--secondary"
            >
              <span>Aggiorna</span>
            </button>
            {otherCount > 0 && (
              <button
                onClick={revokeAllOther}
                disabled={working !== null}
                className="rm-btn rm-btn--danger"
              >
                <span>
                  {working === "all"
                    ? "Chiusura in corso"
                    : `Chiudi le altre (${otherCount})`}
                </span>
              </button>
            )}
          </div>
        </div>

        {sessions.length === 0 ? (
          <p className="rm-muted">Nessuna sessione registrata.</p>
        ) : (
          <div className="rm-scroll">
            <table className="rm-tab">
              <thead>
                <tr>
                  <th>Postazione</th>
                  <th>Indirizzo di rete</th>
                  <th>Ultima attività</th>
                  <th>Stato</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const ua = parseUA(s.user_agent);
                  return (
                    <tr key={s.id}>
                      <td>
                        {ua.browser} {ua.os ? `· ${ua.os}` : ""}
                        <br />
                        <span className="rm-muted">{ua.device}</span>
                      </td>
                      <td className="rm-mono">{s.ip || "—"}</td>
                      <td>
                        {relTime(s.updated_at)}
                        <br />
                        <span className="rm-muted">
                          Collegata {relTime(s.created_at)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            s.is_current
                              ? "rm-stato rm-stato--ok"
                              : "rm-stato rm-stato--fermo"
                          }
                        >
                          {s.is_current ? "Questa postazione" : "Altra postazione"}
                        </span>
                        {s.aal === "aal2" && (
                          <>
                            <br />
                            <span className="rm-muted">Verifica in due passaggi</span>
                          </>
                        )}
                      </td>
                      <td>
                        {!s.is_current && (
                          <button
                            onClick={() => revoke(s.id)}
                            disabled={working !== null}
                            className="rm-btn rm-btn--danger"
                          >
                            <span>
                              {working === s.id ? "Chiusura in corso" : "Chiudi la sessione"}
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
