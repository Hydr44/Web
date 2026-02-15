"use client";

import { FlaskConical } from "lucide-react";
import SimulatePlanButton from "./SimulatePlanButton";
import DebugButton from "./DebugButton";
import PaymentHistoryButton from "./PaymentHistoryButton";

export default function BillingTestArea() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
      <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-4">
        <FlaskConical className="h-4 w-4" />
        Area test
      </div>
      <p className="text-slate-500 text-xs mb-4">
        Pulsanti di test per sviluppo e debug. Visibili solo in development.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SimulatePlanButton />
        <PaymentHistoryButton />
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
            Debug
          </div>
          <p className="text-slate-500 text-xs mb-2">
            Dettagli abbonamento, customer Stripe, subscription.
          </p>
          <DebugButton />
        </div>
      </div>
    </div>
  );
}
