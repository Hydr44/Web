"use client";

import { useEffect, useState } from "react";
import { Wrench, Clock } from "lucide-react";

type Status = {
  state: "none" | "warning" | "active";
  message: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
};

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

function humanRemaining(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.parse(iso) - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return "a breve";
  const min = Math.round(ms / 60000);
  if (min < 60) return `tra ~${min} ${min === 1 ? "minuto" : "minuti"}`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `tra ~${h}h${m ? ` ${m}m` : ""}`;
}

/**
 * Blocca la dashboard durante una manutenzione programmata (state=active) e
 * mostra un avviso con countdown quando è imminente (state=warning). Polla lo
 * stato ogni 30s, così sblocca da solo quando la finestra finisce.
 * NB: non tocca il sito pubblico (solo la dashboard cliente).
 */
export default function MaintenanceGate() {
  const [st, setSt] = useState<Status | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = () =>
      fetch("/api/maintenance/status?platform=web", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setSt(d);
        })
        .catch(() => {});
    fetchStatus();
    const t = setInterval(fetchStatus, 30000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (!st || st.state === "none") return null;

  if (st.state === "active") {
    return (
      <div className="fixed inset-0 z-[110] bg-gradient-to-br from-[#0c1929] via-[#111d2e] to-[#0c1929] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
            <Wrench className="w-10 h-10 text-amber-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Manutenzione in corso</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              {st.message || "Stiamo aggiornando il servizio. Torneremo online a breve."}
            </p>
          </div>
          {st.scheduled_end && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/15 text-sm text-amber-400">
              <Clock className="h-4 w-4" />
              Previsto ripristino: {fmtTime(st.scheduled_end)}
            </div>
          )}
          <p className="text-xs text-slate-600">Questa pagina si sblocca automaticamente al termine.</p>
        </div>
      </div>
    );
  }

  // warning
  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
      <Wrench className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 text-sm">
        <p className="font-semibold">Manutenzione programmata {humanRemaining(st.scheduled_start)}</p>
        <p className="opacity-90">
          {st.message || "Il servizio sarà temporaneamente sospeso."}
          {st.scheduled_start ? ` Dalle ${fmtTime(st.scheduled_start)}` : ""}
          {st.scheduled_end ? ` alle ${fmtTime(st.scheduled_end)}.` : "."}
        </p>
      </div>
    </div>
  );
}
