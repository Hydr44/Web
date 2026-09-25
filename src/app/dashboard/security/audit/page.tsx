"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Audit log per-utente — eventi sensibili (login, password, 2FA, sessioni,
 * privacy). Sostituisce la versione mock; dati da `user_audit_logs` (RLS
 * limita la SELECT all'utente in sessione via /api/user/audit-logs).
 */

interface AuditRow {
  id: string;
  action: string;
  status: string;
  ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Mappa action → descrizione leggibile dal cliente
const ACTION_META: Record<string, string> = {
  "login.success": "Accesso effettuato",
  "login.failure": "Tentativo di accesso non riuscito",
  "logout": "Disconnessione",
  "password.changed": "Password aggiornata",
  "password.verify_fail": "Password attuale non riconosciuta",
  "mfa.enabled": "Verifica in due passaggi attivata",
  "mfa.disabled": "Verifica in due passaggi disattivata",
  "mfa.verify_success": "Verifica in due passaggi superata",
  "mfa.verify_failure": "Verifica in due passaggi non superata",
  "backup_codes.regen": "Codici di riserva rigenerati",
  "session.revoked": "Sessione chiusa",
  "session.revoked_all_other": "Chiuse tutte le altre sessioni",
  "privacy.export": "Richiesta copia dei dati",
  "privacy.delete": "Richiesta cancellazione dell'utenza",
  "profile.updated": "Profilo aggiornato",
};

function actionLabel(action: string) {
  // fallback leggibile
  return ACTION_META[action] || action.replace(/[._]/g, " ");
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

export default function AuditPage() {
  usePageTitle("Audit log");
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failure">("all");

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const r = await fetch("/api/user/audit-logs?limit=100");
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setError(j.error || "Non è stato possibile leggere il registro");
        setLogs([]);
        return;
      }
      setLogs(j.logs || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore di rete");
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (filterStatus === "all") return logs;
    return logs.filter((l) => l.status === filterStatus);
  }, [logs, filterStatus]);

  const handleExport = () => {
    if (!filtered.length) return;
    const header = "Data,Azione,Stato,IP,User-Agent,Metadata\n";
    const csv =
      header +
      filtered
        .map((l) => {
          const meta = l.metadata ? JSON.stringify(l.metadata) : "";
          const cells = [
            new Date(l.created_at).toISOString(),
            l.action,
            l.status,
            l.ip || "",
            (l.user_agent || "").replace(/"/g, "'"),
            meta.replace(/"/g, "'"),
          ];
          return cells.map((c) => `"${c}"`).join(",");
        })
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <div className="rm-area__intesta">
          <h1>Registro eventi</h1>
        </div>
        <div className="rm-card">
          <p className="rm-muted">Lettura del registro in corso.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <p className="rm-eyebrow">Sicurezza</p>
          <h1 style={{ marginTop: 8 }}>Registro eventi</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Accessi, cambi password, verifiche e sessioni di questa utenza.
          </p>
        </div>
        <Link href="/dashboard/security" className="rm-btn rm-btn--ghost">
          <span>Torna a Sicurezza</span>
        </Link>
      </div>

      {error && <div className="rm-note rm-note--errore">{error}</div>}

      <div className="rm-card">
        <div className="rm-cardhead">
          <div className="flex flex-wrap gap-1">
            {(["all", "success", "failure"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilterStatus(k)}
                className={
                  filterStatus === k
                    ? "rm-btn rm-btn--primary"
                    : "rm-btn rm-btn--secondary"
                }
                aria-pressed={filterStatus === k}
              >
                <span>
                  {k === "all" ? "Tutti" : k === "success" ? "Riusciti" : "Non riusciti"}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            <button onClick={refresh} className="rm-btn rm-btn--secondary">
              <span>Aggiorna</span>
            </button>
            <button
              onClick={handleExport}
              disabled={!filtered.length}
              className="rm-btn rm-btn--tertiary"
            >
              <span>Scarica il registro</span>
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="rm-muted">
            {logs.length === 0
              ? "Nessun evento registrato. Gli eventi compaiono dopo un accesso, un cambio password o una modifica alle protezioni."
              : "Nessun evento per il filtro scelto."}
          </p>
        ) : (
          <div className="rm-scroll">
            <table className="rm-tab">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Esito</th>
                  <th>Quando</th>
                  <th>Indirizzo di rete</th>
                  <th>Dettagli</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const failed = l.status === "failure";
                  return (
                    <tr key={l.id}>
                      <td>{actionLabel(l.action)}</td>
                      <td>
                        <span
                          className={
                            failed ? "rm-stato rm-stato--male" : "rm-stato rm-stato--ok"
                          }
                        >
                          {failed ? "Non riuscito" : "Riuscito"}
                        </span>
                      </td>
                      <td>{relTime(l.created_at)}</td>
                      <td className="rm-mono">{l.ip || "—"}</td>
                      <td>
                        {l.metadata && Object.keys(l.metadata).length > 0 ? (
                          <details>
                            <summary style={{ cursor: "pointer" }}>Apri</summary>
                            <pre
                              className="rm-mono"
                              style={{
                                marginTop: 8,
                                padding: 8,
                                background: "var(--layer-2)",
                                overflowX: "auto",
                                fontSize: 12,
                              }}
                            >
                              {JSON.stringify(l.metadata, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          "—"
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
