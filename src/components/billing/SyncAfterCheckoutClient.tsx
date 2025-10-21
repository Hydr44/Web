// src/components/billing/SyncAfterCheckoutClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncAfterCheckoutClient({
  status,
  sessionId,
}: {
  status?: string;
  sessionId?: string;
}) {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (done) return;
      if (status !== "success" || !sessionId) return;

      try {
        const res = await fetch("/api/billing/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "sync_failed");

        // pulisci querystring e ricarica i dati
        const url = new URL(window.location.href);
        url.searchParams.delete("status");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.toString());

        setDone(true);
        router.refresh();
      } catch (e: unknown) {
        setErr((e as Error)?.message || "sync_failed");
      }
    };
    run();
  }, [status, sessionId, done, router]);

  if (status === "success" && !done && !err) {
    return (
      <div className="mt-4 rounded-lg border bg-white px-3 py-2 text-sm">
        Stiamo aggiornando il tuo abbonamento… ⏳
      </div>
    );
  }
  if (err) {
    return (
      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        Errore durante la sincronizzazione: {err}
      </div>
    );
  }
  return null;
}
