"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";

export default function SimulatePlanButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (process.env.NODE_ENV !== "development") return null;

  const handleSimulate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/simulate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "Full" }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("✅ Piano Full attivato! Apri l'app desktop per verificare.");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage(`❌ ${data.error || "Errore"}`);
      }
    } catch (e) {
      setMessage(`❌ ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
        <FlaskConical className="h-4 w-4" />
        Test: simula piano
      </div>
      <p className="text-slate-500 text-xs mb-2">
        Solo in development. Attiva piano Full per la tua org e verifica che l&apos;app desktop risponda.
      </p>
      <button
        onClick={handleSimulate}
        disabled={loading}
        className="px-3 py-1.5 text-xs font-medium bg-amber-500/20 text-amber-200 rounded-lg hover:bg-amber-500/30 disabled:opacity-60 transition"
      >
        {loading ? "..." : "Simula piano Full"}
      </button>
      {message && <p className="text-xs mt-2">{message}</p>}
    </div>
  );
}
