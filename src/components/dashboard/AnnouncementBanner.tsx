"use client";

import { useEffect, useState } from "react";
import { Info, AlertTriangle, CheckCircle, Megaphone, X } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  level: "info" | "warning" | "success" | "critical";
  dismissible: boolean;
  updated_at: string;
};

const LS_KEY = "rm-dismissed-announcements";

function loadDismissed(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function persistDismissed(id: string, updatedAt: string) {
  const d = loadDismissed();
  d[id] = updatedAt;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(d));
  } catch {
    /* no-op */
  }
}

const LEVEL_STYLE: Record<Announcement["level"], string> = {
  info: "bg-blue-50 border-blue-200 text-blue-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  critical: "bg-red-50 border-red-200 text-red-900",
};

function LevelIcon({ level }: { level: Announcement["level"] }) {
  const cls = "h-4 w-4 shrink-0 mt-0.5";
  if (level === "warning") return <AlertTriangle className={cls} />;
  if (level === "critical") return <AlertTriangle className={cls} />;
  if (level === "success") return <CheckCircle className={cls} />;
  if (level === "info") return <Info className={cls} />;
  return <Megaphone className={cls} />;
}

/**
 * Banner avvisi in cima alla dashboard (non bloccante). Legge gli avvisi attivi
 * (pubblici) e li mostra; quelli dismissibili si possono chiudere (memorizzato
 * in localStorage per id+versione: se l'avviso viene modificato, riappare).
 */
export default function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/announcements/active?platform=web")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const dismissed = loadDismissed();
        const list: Announcement[] = (d?.announcements || []).filter(
          (a: Announcement) => dismissed[a.id] !== a.updated_at,
        );
        setItems(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const close = (a: Announcement) => {
    persistDismissed(a.id, a.updated_at);
    setItems((prev) => prev.filter((x) => x.id !== a.id));
  };

  if (!items.length) return null;

  return (
    <div className="space-y-2 mb-4">
      {items.map((a) => (
        <div
          key={a.id}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${LEVEL_STYLE[a.level] || LEVEL_STYLE.info}`}
        >
          <LevelIcon level={a.level} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{a.title}</p>
            <p className="text-sm opacity-90 whitespace-pre-line">{a.body}</p>
          </div>
          {a.dismissible && (
            <button
              onClick={() => close(a)}
              className="shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
              title="Nascondi"
              aria-label="Nascondi avviso"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
