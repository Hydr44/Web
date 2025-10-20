"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function SyncAfterCheckout() {
  const params = useSearchParams();
  const router = useRouter();
  const status = params.get("status");
  const sessionId = params.get("session_id");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setDone(true);
        // pulisci la query string e ricarica i dati server
        const url = new URL(window.location.href);
        url.searchParams.delete("status");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.toString());
        router.refresh();
      } catch (e: any) {
        setError(e?.message || "sync_failed");
      }
    };
    run();
  }, [status, sessionId, done, router]);

  if (status === "success" && !done && !error) {
    return (
      <div className="mb-4 rounded-lg border bg-white p-3 text-sm">
        Stiamo aggiornando il tuo abbonamento… ⏳
      </div>
    );
  }
  if (error) {
    return (
      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Errore durante la sincronizzazione: {error}
      </div>
    );
  }
  return null;
}
