"use client";

import { Check, Star } from "lucide-react";
import { useState, useTransition } from "react";

type PlanKey = "free" | "trial" | "Starter" | "Professional" | "Business" | "Full";

type BillingClientProps = {
  currentPlan: string;
};

type BillingInterval = "annual" | "monthly";

const PLANS = [
  {
    key: "Starter",
    label: "Starter",
    desc: "Base + 1 modulo a scelta",
    annualPrice: "1.800",
    monthlyPrice: "179",
    annualEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL",
    monthlyEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY",
    features: [
      "Gestionale completo (trasporti, clienti, mezzi, piazzale, autisti)",
      "Ricambi con database TecDoc integrato",
      "Marketplace (eBay, Subito, Shopify)",
      "Tracking GPS in tempo reale",
      "App Mobile per autisti inclusa",
      "Report, preventivi con PDF",
      "1 modulo a scelta tra SDI, RVFU, RENTRI, Contabilità",
    ],
  },
  {
    key: "Professional",
    label: "Professional",
    desc: "Base + 2 moduli a scelta",
    annualPrice: "2.800",
    monthlyPrice: "279",
    annualEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL",
    monthlyEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY",
    recommended: true,
    features: [
      "Tutto di Starter",
      "2 moduli a scelta",
      "Combinazione più richiesta: RVFU + RENTRI",
      "Ideale per autodemolitori",
    ],
  },
  {
    key: "Business",
    label: "Business",
    desc: "Base + 3 moduli a scelta",
    annualPrice: "3.600",
    monthlyPrice: "359",
    annualEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ANNUAL",
    monthlyEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY",
    features: [
      "Tutto di Professional",
      "3 moduli a scelta",
      "Gestione quasi completa",
      "Ideale per aziende strutturate",
    ],
  },
  {
    key: "Full",
    label: "Full",
    desc: "Tutti i moduli inclusi",
    annualPrice: "4.500",
    monthlyPrice: "449",
    annualEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_FULL_ANNUAL",
    monthlyEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_FULL_MONTHLY",
    features: [
      "Tutto incluso",
      "SDI — Fatturazione Elettronica",
      "RVFU — Demolizioni MIT",
      "RENTRI — Registro Rifiuti",
      "Contabilità completa",
      "Nessuna limitazione",
    ],
  },
];

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      <span>{children}</span>
    </li>
  );
}

export default function BillingClient({ currentPlan }: BillingClientProps) {
  const [pending, startTransition] = useTransition();
  const [interval, setInterval] = useState<BillingInterval>("annual");

  const goCheckout = (envKey: string) => {
    // Il price ID viene iniettato a build time via NEXT_PUBLIC_ env vars
    const priceId = (window as any).__ENV?.[envKey] || "";
    if (!priceId) {
      alert("Price ID non configurato per questo piano. Contatta il supporto.");
      return;
    }
    startTransition(() => {
      const u = new URL("/api/checkout", window.location.origin);
      u.searchParams.set("price", priceId);
      window.location.href = u.toString();
    });
  };

  const openPortal = () => {
    startTransition(() => {
      window.location.href = "/api/billing/portal";
    });
  };

  const isCurrentPlan = (key: string) => {
    return currentPlan?.toLowerCase() === key.toLowerCase();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Piano & Abbonamento</h1>
        <p className="mt-2 text-gray-600">
          Gestisci il tuo abbonamento RescueManager. Puoi cambiare piano o gestire
          i pagamenti dal Billing Portal.
        </p>
      </div>

      {/* Stato piano attuale */}
      <section className="rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Piano attuale</div>
            <div className="mt-1 text-lg font-medium capitalize">
              {currentPlan || "Nessun piano"}
            </div>
          </div>
          {currentPlan && currentPlan !== "free" && currentPlan !== "trial" && (
            <button
              onClick={openPortal}
              disabled={pending}
              className="rounded-lg ring-1 ring-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              Apri Billing Portal
            </button>
          )}
        </div>
      </section>

      {/* Toggle mensile/annuale */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setInterval("monthly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            interval === "monthly"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Mensile
        </button>
        <button
          onClick={() => setInterval("annual")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            interval === "annual"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Annuale
          <span className="ml-1.5 text-xs text-emerald-500 font-semibold">-17%</span>
        </button>
      </div>

      {/* Piani */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = isCurrentPlan(plan.key);
          const price = interval === "annual" ? plan.annualPrice : plan.monthlyPrice;
          const envKey = interval === "annual" ? plan.annualEnvKey : plan.monthlyEnvKey;

          return (
            <article
              key={plan.key}
              className={`rounded-xl border p-5 relative flex flex-col ${
                plan.recommended ? "border-emerald-300 ring-1 ring-emerald-200" : ""
              }`}
            >
              {plan.recommended && (
                <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-medium">
                  <Star className="h-3 w-3" /> Consigliato
                </span>
              )}

              <div className="mb-4">
                <div className="font-semibold text-lg">{plan.label}</div>
                <div className="text-sm text-gray-500 mt-0.5">{plan.desc}</div>
              </div>

              <div className="mb-4">
                <span className="text-3xl font-bold">€{price}</span>
                <span className="text-sm text-gray-500">
                  /{interval === "annual" ? "anno" : "mese"}
                </span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <Feature key={f}>{f}</Feature>
                ))}
              </ul>

              {isCurrent ? (
                <span className="w-full text-center text-sm rounded-lg bg-emerald-50 text-emerald-700 px-4 py-2.5 font-medium">
                  Piano Attivo
                </span>
              ) : (
                <button
                  onClick={() => goCheckout(envKey)}
                  disabled={pending}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                    plan.recommended
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-gray-900 text-white hover:opacity-90"
                  }`}
                >
                  {isCurrent ? "Piano Attivo" : "Scegli"}
                </button>
              )}
            </article>
          );
        })}
      </div>

      {/* Moduli */}
      <section className="rounded-2xl border p-5">
        <div className="font-medium mb-3">Moduli disponibili</div>
        <div className="grid md:grid-cols-4 gap-3">
          {[
            { name: "SDI", desc: "Fatturazione elettronica via SDI-SFTP" },
            { name: "RVFU", desc: "Demolizioni — Registro Veicoli Fuoriuso MIT" },
            { name: "RENTRI", desc: "Rifiuti — Registro Elettronico Nazionale Tracciabilità" },
            { name: "Contabilità", desc: "Prima nota, piano dei conti, movimenti" },
          ].map((mod) => (
            <div key={mod.name} className="rounded-lg border p-3">
              <div className="text-sm font-medium">{mod.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{mod.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Ogni piano include il Gestionale Base completo + App Mobile. I moduli si scelgono in base al piano.
        </p>
      </section>

      {/* Help */}
      <div className="rounded-2xl border p-5">
        <div className="font-medium">Hai bisogno di aiuto?</div>
        <p className="mt-1 text-sm text-gray-600">
          Scrivici a{" "}
          <a className="underline" href="mailto:info@rescuemanager.eu">
            info@rescuemanager.eu
          </a>{" "}
          oppure{" "}
          <a className="underline" href="/contatti">
            prenota una chiamata
          </a>
          .
        </p>
      </div>
    </div>
  );
}
