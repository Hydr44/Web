"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  Clock,
  Download,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

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

// Mappa action → etichetta IT + colore
const ACTION_META: Record<string, { label: string; emoji: string }> = {
  "login.success":        { label: "Accesso effettuato",       emoji: "🔑" },
  "login.failure":        { label: "Tentativo accesso fallito", emoji: "⚠️" },
  "logout":               { label: "Disconnessione",            emoji: "🚪" },
  "password.changed":     { label: "Password aggiornata",       emoji: "🔒" },
  "password.verify_fail": { label: "Verifica password fallita", emoji: "❌" },
  "mfa.enabled":          { label: "2FA abilitato",             emoji: "🛡️" },
  "mfa.disabled":         { label: "2FA disabilitato",          emoji: "🛡️" },
  "mfa.verify_success":   { label: "2FA verificato",            emoji: "✅" },
  "mfa.verify_failure":   { label: "2FA verifica fallita",      emoji: "❌" },
  "backup_codes.regen":   { label: "Codici di backup rigenerati", emoji: "♻️" },
  "session.revoked":      { label: "Sessione revocata",         emoji: "🚪" },
  "session.revoked_all_other": { label: "Tutte le altre sessioni revocate", emoji: "🚪" },
  "privacy.export":       { label: "Export dati richiesto",     emoji: "📤" },
  "privacy.delete":       { label: "Eliminazione account richiesta", emoji: "🗑️" },
  "profile.updated":      { label: "Profilo aggiornato",        emoji: "👤" },
};

function actionLabel(action: string) {
  const m = ACTION_META[action];
  if (m) return m;
  // fallback leggibile
  return { label: action.replace(/[._]/g, " "), emoji: "•" };
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
        setError(j.error || "Errore caricamento audit log");
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
      <div className="space-y-6 max-w-3xl">
        <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-white border border-gray-100 rounded-lg animate-pulse" />
        <div className="h-32 bg-white border border-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/security" className="p-2 rounded-lg hover:bg-white transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 text-sm rounded-full border border-blue-200 px-4 py-2 mb-4 bg-blue-50 text-blue-600 font-medium">
              <Shield className="h-4 w-4" />
              Audit log
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Attività <span className="text-blue-600">account</span>
            </h1>
            <p className="text-lg text-gray-500">
              Eventi sensibili sul tuo account (login, password, 2FA, sessioni, privacy).
            </p>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-gray-400" />
          {(["all", "success", "failure"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilterStatus(k)}
              className={`px-3 py-1.5 rounded transition-colors ${
                filterStatus === k
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {k === "all" ? "Tutti" : k === "success" ? "Riusciti" : "Falliti"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Aggiorna
          </button>
          <button
            onClick={handleExport}
            disabled={!filtered.length}
            className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Esporta CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white border border-gray-200 rounded">
          <Shield className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {logs.length === 0
              ? "Nessun evento di audit registrato. Gli eventi appariranno qui dopo login, cambio password, modifiche 2FA, ecc."
              : "Nessun evento per il filtro selezionato."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {filtered.map((l) => {
              const meta = actionLabel(l.action);
              const failed = l.status === "failure";
              return (
                <li key={l.id} className="p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${
                    failed ? "bg-red-50" : "bg-green-50"
                  }`}>
                    <span>{meta.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">{meta.label}</p>
                      {failed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                          <XCircle className="h-3 w-3" /> Fallito
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" /> Successo
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {relTime(l.created_at)}
                      </span>
                      {l.ip && (
                        <span>
                          IP: <code className="font-mono">{l.ip}</code>
                        </span>
                      )}
                      <code className="font-mono text-gray-400">{l.action}</code>
                    </div>
                    {l.metadata && Object.keys(l.metadata).length > 0 && (
                      <details className="mt-2 text-xs text-gray-500">
                        <summary className="cursor-pointer hover:text-gray-700">Dettagli</summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">{JSON.stringify(l.metadata, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
