"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Contenuto, TD, TH, Testata } from "../../_ui/cornice";

/**
 * Registro eventi dell'utenza — accessi, password, verifiche, inviti.
 *
 * I dati arrivano da `user_audit_logs` (la RLS limita la lettura all'utente in
 * sessione, via /api/user/audit-logs). Il disegno vuole una tabella sola, con
 * l'esito scritto e il rosso riservato ai tentativi non riusciti.
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

/** Nome breve dell'evento, come lo chiama il cliente. */
const EVENTO: Record<string, string> = {
  "login.success": "Accesso",
  "login.failure": "Accesso",
  logout: "Disconnessione",
  "password.changed": "Password cambiata",
  "password.verify_fail": "Password non riconosciuta",
  "mfa.enabled": "Verifica attivata",
  "mfa.disabled": "Verifica disattivata",
  "mfa.verify_success": "Verifica superata",
  "mfa.verify_failure": "Verifica non superata",
  "backup_codes.regen": "Codici di riserva",
  "session.revoked": "Postazione scollegata",
  "session.revoked_all_other": "Altre postazioni scollegate",
  "privacy.export": "Copia dei dati",
  "privacy.delete": "Cancellazione richiesta",
  "profile.updated": "Profilo aggiornato",
  "invite.sent": "Invito",
};

function nomeEvento(action: string) {
  return EVENTO[action] || action.replace(/[._]/g, " ");
}

/** Da dove arriva l'accesso: programma e sistema, in chiaro. */
function daDove(ua: string | null): string {
  if (!ua) return "";
  const l = ua.toLowerCase();
  let programma = "Browser";
  if (l.includes("electron") || l.includes("rescuemanager")) programma = "App desktop";
  else if (l.includes("firefox")) programma = "Firefox";
  else if (l.includes("edg/")) programma = "Edge";
  else if (l.includes("chrome") && !l.includes("edg")) programma = "Chrome";
  else if (l.includes("safari")) programma = "Safari";
  let sistema = "";
  if (l.includes("mac os")) sistema = "macOS";
  else if (l.includes("windows")) sistema = "Windows";
  else if (/iphone|ipad/.test(l)) sistema = "iPhone";
  else if (l.includes("android")) sistema = "Android";
  else if (l.includes("linux")) sistema = "Linux";
  return sistema ? `${programma}, ${sistema}` : programma;
}

/** I dettagli utili del singolo evento, senza gergo tecnico. */
function dettagli(l: AuditRow): string {
  const m = l.metadata || {};
  const pezzi: string[] = [];
  const email = m.email || m.invited_email || m.target_email;
  if (typeof email === "string") pezzi.push(email);
  const ruolo = m.role || m.ruolo;
  if (typeof ruolo === "string") pezzi.push(ruolo);
  const motivo = m.reason || m.motivo;
  if (typeof motivo === "string") pezzi.push(motivo);
  const provenienza = daDove(l.user_agent);
  if (provenienza) pezzi.push(provenienza);
  return pezzi.join(", ") || "—";
}

function quando(iso: string): string {
  const d = new Date(iso);
  const oggi = new Date();
  const ieri = new Date(oggi);
  ieri.setDate(oggi.getDate() - 1);
  const ora = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === oggi.toDateString()) return `Oggi ${ora}`;
  if (d.toDateString() === ieri.toDateString()) return `Ieri ${ora}`;
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export default function AuditPage() {
  usePageTitle("Registro eventi");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setWorking(true);
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
    } finally {
      setWorking(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const handleExport = () => {
    if (!logs.length) return;
    const header = "Data,Azione,Stato,IP,User-Agent,Metadata\n";
    const csv =
      header +
      logs
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
    a.download = `registro-eventi-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const azioni = (
    <>
      <button
        type="button"
        onClick={refresh}
        disabled={working}
        className="rm-btn rm-btn--tertiary"
        style={{ gap: 14 }}
      >
        <span>{working ? "Aggiornamento" : "Aggiorna"}</span>
        <RefreshCw size={15} />
      </button>
      <button
        type="button"
        onClick={handleExport}
        disabled={!logs.length}
        className="rm-btn rm-btn--tertiary"
        style={{ gap: 14 }}
      >
        <span>Scarica</span>
        <Download size={15} />
      </button>
    </>
  );

  if (loading) {
    return (
      <>
        <Testata titolo="Registro eventi" sotto="Accessi, cambi di password, inviti, ultimi 90 giorni" />
        <Contenuto>
          <p className="rm-muted">Lettura del registro in corso.</p>
        </Contenuto>
      </>
    );
  }

  return (
    <>
      <Testata
        titolo="Registro eventi"
        sotto="Accessi, cambi di password, inviti, ultimi 90 giorni"
        azioni={azioni}
      />

      <Contenuto>
        {error && <div className="rm-note rm-note--errore" style={{ marginBottom: 16 }}>{error}</div>}

        {logs.length === 0 ? (
          <div className="rm-card">
            <p className="rm-muted">
              Nessun evento registrato. Gli eventi compaiono dopo un accesso, un
              cambio password o una modifica alle protezioni.
            </p>
          </div>
        ) : (
          <>
            <div className="rm-scroll">
              <table className="rm-tab">
                <thead>
                  <tr>
                    <th style={TH}>Quando</th>
                    <th style={TH}>Evento</th>
                    <th style={TH}>Dettagli</th>
                    <th style={TH}>Indirizzo di rete</th>
                    <th style={TH}>Esito</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => {
                    const fallito = l.status === "failure";
                    return (
                      <tr key={l.id}>
                        <td style={TD}>{quando(l.created_at)}</td>
                        <td style={TD}>{nomeEvento(l.action)}</td>
                        <td style={TD}>{dettagli(l)}</td>
                        <td style={TD} className="rm-mono">{l.ip || "—"}</td>
                        <td style={TD}>
                          <span className={fallito ? "rm-stato rm-stato--male" : "rm-stato rm-stato--fermo"}>
                            {fallito ? "Fallito" : "Riuscito"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="rm-muted" style={{ marginTop: 12 }}>
              Un tentativo fallito da un indirizzo nuovo compare in rosso.
            </p>
          </>
        )}
      </Contenuto>
    </>
  );
}
