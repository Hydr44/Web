"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Monitor,
  ArrowLeft,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  RefreshCw,
} from "lucide-react";
import { SkeletonPage } from "@/components/dashboard/ui/Skeleton";

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
        setError(j.error || "Errore caricamento sessioni");
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
    if (!confirm("Revocare questa sessione? L'utente connesso verrà disconnesso.")) return;
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
      if (!r.ok || !j.ok) throw new Error(j.error || "Errore revoca sessione");
      setSuccess("Sessione revocata.");
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
      setError(e instanceof Error ? e.message : "Errore revoca");
    } finally {
      setWorking(null);
    }
  };

  const revokeAllOther = async () => {
    if (!confirm("Revocare tutte le altre sessioni? Solo questo dispositivo resterà connesso.")) return;
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
      if (!r.ok || !j.ok) throw new Error(j.error || "Errore revoca");
      setSuccess("Tutte le altre sessioni sono state revocate.");
      try {
        await fetch("/api/user/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "session.revoked_all_other" }),
        });
      } catch { /* non bloccante */ }
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore revoca");
    } finally {
      setWorking(null);
    }
  };

  if (loading) {
    return <SkeletonPage variant="list" />;
  }

  const otherCount = sessions.filter((s) => !s.is_current).length;

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/security" className="p-2 rounded-lg hover:bg-white transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 text-sm rounded-full border border-blue-200 px-4 py-2 mb-4 bg-blue-50 text-blue-600 font-medium">
              <Monitor className="h-4 w-4" />
              Sessioni attive
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Le tue <span className="text-blue-600">sessioni</span>
            </h1>
            <p className="text-lg text-gray-500">
              Dispositivi e browser attualmente autenticati. Revoca quelli che non riconosci.
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

      {success && (
        <div className="p-4 rounded bg-emerald-500/10 border border-gray-200 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-gray-500">
          {sessions.length} sessione{sessions.length === 1 ? "" : "i"} attive
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={working !== null}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Aggiorna
          </button>
          {otherCount > 0 && (
            <button
              onClick={revokeAllOther}
              disabled={working !== null}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50 font-medium"
            >
              <LogOut className="h-4 w-4" />
              {working === "all" ? "Revoca in corso…" : `Revoca tutte le altre (${otherCount})`}
            </button>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="p-8 text-center bg-white border border-gray-200 rounded">
          <Monitor className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nessuna sessione trovata.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const ua = parseUA(s.user_agent);
            const isMobile = ua.device === "Mobile" || ua.device === "Tablet";
            return (
              <div
                key={s.id}
                className={`p-5 bg-white border rounded ${
                  s.is_current ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center">
                      {isMobile ? (
                        <Smartphone className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Monitor className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                          {ua.browser} {ua.os ? `· ${ua.os}` : ""}
                        </h3>
                        {s.is_current && (
                          <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Questa sessione
                          </span>
                        )}
                        {s.aal === "aal2" && (
                          <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            2FA
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        IP: <code className="font-mono text-xs">{s.ip || "—"}</code>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Ultima attività: {relTime(s.updated_at)}
                        {" · "}
                        Creata: {relTime(s.created_at)}
                      </p>
                    </div>
                  </div>

                  {!s.is_current && (
                    <button
                      onClick={() => revoke(s.id)}
                      disabled={working !== null}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {working === s.id ? "Revoca…" : "Revoca"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
