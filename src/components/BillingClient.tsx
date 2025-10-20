"use client";

import { Check, Star } from "lucide-react";
import { useTransition } from "react";

type PlanKey = "free" | "starter" | "team" | "fleet";

type BillingClientProps = {
  currentPlan: PlanKey;
  prices: {
    starter?: string; // es: "price_123"
    team?: string;
    fleet?: string;
  };
  monthlyLabels?: {
    starter?: string; // es: "€ 29/mese"
    team?: string;    // es: "€ 79/mese"
    fleet?: string;   // es: "€ 149/mese"
  };
};

const FEATURES: Record<Exclude<PlanKey, "free">, string[]> = {
  starter: [
    "Dispatch in tempo reale",
    "Rapportini con foto & firma",
    "Analytics base",
    "Fino a 5 mezzi",
  ],
  team: [
    "Tutto di Starter",
    "Turni & reperibilità",
    "Manutenzioni e scadenze",
    "Fino a 15 mezzi",
  ],
  fleet: [
    "Tutto di Team",
    "Portale clienti (facoltativo)",
    "SLA dedicati",
    "16–40 mezzi",
  ],
};

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <Check className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export default function BillingClient({
  currentPlan,
  prices,
  monthlyLabels,
}: BillingClientProps) {
  const [pending, startTransition] = useTransition();

  const goCheckout = (price?: string) => {
    if (!price) {
      alert("Manca il Price ID di Stripe per questo piano.");
      return;
    }
    startTransition(() => {
      const u = new URL("/api/billing/checkout", window.location.origin);
      u.searchParams.set("price", price);
      window.location.href = u.toString();
    });
  };

  const openPortal = () => {
    startTransition(() => {
      window.location.href = "/api/billing/portal";
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Piano & licenze</h1>
        <p className="mt-2 text-gray-600">
          Gestisci il tuo abbonamento. Puoi effettuare l’upgrade o aprire il Billing
          Portal per carte, fatture e metodi di pagamento.
        </p>
      </div>

      {/* Stato piano + CTA Portal */}
      <div className="grid md:grid-cols-2 gap-4">
        <section className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Stato piano</div>
          <div className="mt-1 text-lg font-medium capitalize">
            {currentPlan === "free" ? "Free" : currentPlan}
          </div>
          {currentPlan === "free" ? (
            <ul className="mt-4 space-y-1">
              <li className="text-sm text-gray-700">• 1 mezzo</li>
              <li className="text-sm text-gray-700">• Rapportini base</li>
              <li className="text-sm text-gray-700">• Accesso web</li>
            </ul>
          ) : (
            <p className="mt-4 text-sm text-gray-700">
              Il piano è attivo. Puoi modificare o annullare dal Billing Portal.
            </p>
          )}

          {currentPlan === "free" ? (
            <button
              onClick={() => goCheckout(prices.starter)}
              disabled={pending}
              className="mt-5 rounded-lg bg-gray-900 text-white px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60"
            >
              Attiva Starter
            </button>
          ) : (
            <button
              onClick={openPortal}
              disabled={pending}
              className="mt-5 rounded-lg ring-1 ring-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              Apri Billing Portal
            </button>
          )}
        </section>

        {/* Piani disponibili */}
        <section className="rounded-2xl border p-5">
          <div className="text-sm text-gray-500">Piani disponibili</div>

          <div className="mt-4 space-y-4">
            {/* Starter */}
            <article className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">Starter</div>
                  <div className="text-sm text-gray-500">
                    {monthlyLabels?.starter ?? "€ 29/mese"} • fino a 5 mezzi
                  </div>
                </div>
                {currentPlan === "starter" ? (
                  <span className="text-xs rounded-full bg-green-50 text-green-700 px-2 py-1">
                    Attivo
                  </span>
                ) : (
                  <button
                    onClick={() => goCheckout(prices.starter)}
                    disabled={pending}
                    className="rounded-lg bg-gray-900 text-white px-3 py-1.5 text-sm hover:opacity-90 disabled:opacity-60"
                  >
                    Scegli
                  </button>
                )}
              </div>
              <ul className="mt-3 space-y-1.5">
                {FEATURES.starter.map((f) => (
                  <Feature key={f}>{f}</Feature>
                ))}
              </ul>
            </article>

            {/* Team – consigliato */}
            <article className="rounded-xl border p-4 relative">
              <span className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs">
                <Star className="h-3 w-3" /> Consigliato
              </span>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">Team</div>
                  <div className="text-sm text-gray-500">
                    {monthlyLabels?.team ?? "€ 79/mese"} • fino a 15 mezzi
                  </div>
                </div>
                {currentPlan === "team" ? (
                  <span className="text-xs rounded-full bg-green-50 text-green-700 px-2 py-1">
                    Attivo
                  </span>
                ) : (
                  <button
                    onClick={() => goCheckout(prices.team)}
                    disabled={pending}
                    className="rounded-lg bg-gray-900 text-white px-3 py-1.5 text-sm hover:opacity-90 disabled:opacity-60"
                  >
                    Scegli
                  </button>
                )}
              </div>
              <ul className="mt-3 space-y-1.5">
                {FEATURES.team.map((f) => (
                  <Feature key={f}>{f}</Feature>
                ))}
              </ul>
            </article>

            {/* Fleet */}
            <article className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">Fleet</div>
                  <div className="text-sm text-gray-500">
                    {monthlyLabels?.fleet ?? "€ 149/mese"} • 16–40 mezzi
                  </div>
                </div>
                {currentPlan === "fleet" ? (
                  <span className="text-xs rounded-full bg-green-50 text-green-700 px-2 py-1">
                    Attivo
                  </span>
                ) : (
                  <button
                    onClick={() => goCheckout(prices.fleet)}
                    disabled={pending}
                    className="rounded-lg bg-gray-900 text-white px-3 py-1.5 text-sm hover:opacity-90 disabled:opacity-60"
                  >
                    Scegli
                  </button>
                )}
              </div>
              <ul className="mt-3 space-y-1.5">
                {FEATURES.fleet.map((f) => (
                  <Feature key={f}>{f}</Feature>
                ))}
              </ul>
            </article>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Puoi aggiornare o annullare in qualsiasi momento dal Billing Portal.
          </p>
        </section>
      </div>

      {/* Help */}
      <div className="rounded-2xl border p-5">
        <div className="font-medium">Hai bisogno di aiuto?</div>
        <p className="mt-1 text-sm text-gray-600">
          Scrivici a <a className="underline" href="mailto:info@rescuemanager.eu">info@rescuemanager.eu</a>{" "}
          oppure <a className="underline" href="/contatti">prenota una chiamata</a>.
        </p>
      </div>
    </div>
  );
}
