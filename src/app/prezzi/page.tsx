// src/app/prezzi/page.tsx
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

/** Price IDs dalle env (con fallback) */
const PRICES = {
  starter:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ??
    process.env.STRIPE_PRICE_STARTER ??
    "",
  fleet:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_FLEET ??
    process.env.STRIPE_PRICE_FLEET ??
    "",
  consortium:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_CONSORTIUM ??
    process.env.STRIPE_PRICE_CONSORTIUM ??
    "",
} as const;

/** URL per la checkout Stripe via route API.
 *  Se non loggato → /login e poi ritorno qui automatico.
 */
function checkoutUrl(priceId: string, returnTo = "/dashboard/billing/subscription") {
  if (!priceId) return "";
  return `/api/billing/checkout?price=${encodeURIComponent(
    priceId
  )}&return=${encodeURIComponent(returnTo)}`;
}

type Plan = {
  id: "starter" | "fleet" | "company";
  name: string;
  price?: string;
  badge?: string;
  note: string;
  features: string[];
  priceId?: string;
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter (Officina singola)",
    price: "€ 29/mese",
    note: "Per iniziare: 1–5 mezzi",
    badge: "Più scelto",
    highlight: true,
    priceId: PRICES.starter,
    features: [
      "Dashboard",
      "Clienti",
      "Nuovo trasporto",
      "1–5 mezzi",
      "Report base",
      "Richiesta posizione cliente",
      "Accesso web",
    ],
  },
  {
    id: "fleet",
    name: "Flotta",
    price: "€ 79/mese",
    note: "Per 6–15 mezzi e piccolo team",
    priceId: PRICES.fleet,
    features: [
      "Tutto di Starter",
      "Piazzale mezzi (sequestri/rubati)",
      "Autisti",
      "Calendario interventi",
      "Preventivi",
      "Report avanzati",
      "Utenti illimitati",
    ],
  },
  {
    id: "company",
    name: "Azienda / Consorzio",
    price: "€ 149/mese",
    note: "Per flotte complesse (16–40 mezzi)",
    priceId: PRICES.consortium,
    features: [
      "Tutto di Flotta",
      "Utenti & ruoli granulari",
      "Manutenzioni e scadenze",
      "Analytics dettagliati",
      "Supporto prioritario",
      "API / integrazioni (su richiesta)",
    ],
  },
];

const CORE_FEATURES = [
  "Accesso web + mobile",
  "Utenti illimitati (da Flotta)",
  "Backup giornalieri",
  "GDPR by design",
  "Permessi granulari (da Azienda)",
];

export default function PrezziPage() {
  return (
    <main className="hero-bg">
      {/* HERO */}
      <section className="rm-container pt-18 md:pt-24 pb-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Prezzi semplici e trasparenti
          </h1>
          <p className="mt-3 text-gray-600">
            Attiva subito online oppure richiedi un preventivo. I piani crescono con la tua officina.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {CORE_FEATURES.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full ring-1 ring-black/10 bg-white text-gray-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="rm-container pb-8">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((p) => {
            const checkout = p.priceId ? checkoutUrl(p.priceId) : "";
            const canCheckout = Boolean(checkout);
            return (
              <article
                key={p.id}
                className={[
                  "p-6 rounded-2xl border bg-white flex flex-col",
                  p.highlight
                    ? "ring-1 ring-primary/20 shadow-[0_8px_28px_-8px_rgba(0,0,0,.1)]"
                    : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{p.name}</h3>
                    <p className="text-sm text-gray-500">{p.note}</p>
                  </div>
                  {p.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary ring-1 ring-primary/20">
                      {p.badge}
                    </span>
                  )}
                </div>

                {p.price && <div className="mt-3 text-2xl font-semibold">{p.price}</div>}

                <ul className="mt-4 space-y-2 text-sm text-gray-700 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA: sempre due bottoni per TUTTI i piani */}
                <div className="mt-6 grid gap-2">
                  <a
                    href={canCheckout ? checkout : "/dashboard/billing?err=missing_price"}
                    aria-disabled={!canCheckout}
                    className={[
                      "block w-full text-center px-4 py-2 rounded-lg transition",
                      "bg-primary text-primary-foreground hover:opacity-90",
                      !canCheckout ? "opacity-60 pointer-events-none" : "",
                    ].join(" ")}
                  >
                    Attiva subito
                  </a>

                  <Link
                    href="/contatti"
                    className="block w-full text-center px-4 py-2 rounded-lg ring-1 ring-black/10 bg-white text-gray-900 hover:bg-gray-50 transition"
                  >
                    Richiedi info / preventivo
                  </Link>
                </div>

                {!canCheckout && (
                  <p className="mt-3 text-xs text-gray-500">
                    Per l’attivazione online imposta il <code>priceId</code> di questo piano nelle variabili d’ambiente.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="py-12">
        <div className="rm-container">
          <div className="rounded-2xl border bg-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Vuoi un piano su misura?</h2>
              <p className="text-gray-600 mt-1">
                Dicci quanti mezzi gestisci e quali moduli ti servono: ti rispondiamo entro 24 ore.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/contatti"
                className="px-5 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                Richiedi preventivo
              </Link>
              <Link
                href="/prodotto"
                className="px-5 py-3 rounded-lg ring-1 ring-black/10 bg-white text-gray-900 hover:bg-gray-50 transition"
              >
                Vedi moduli
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ BREVE */}
      <section className="rm-container pb-16">
        <h3 className="text-lg font-medium">Domande frequenti</h3>
        <div className="mt-4 grid md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div className="rounded-xl border p-5 bg-white">
            <p className="font-medium">Posso attivare subito online?</p>
            <p className="mt-1 text-gray-600">
              Sì, per tutti i piani abilitati al checkout. In alternativa, puoi richiedere un preventivo.
            </p>
          </div>
          <div className="rounded-xl border p-5 bg-white">
            <p className="font-medium">Come conteggiate i mezzi?</p>
            <p className="mt-1 text-gray-600">
              In base ai mezzi attivi nel mese. Puoi aumentare o ridurre senza penali.
            </p>
          </div>
          <div className="rounded-xl border p-5 bg-white">
            <p className="font-medium">Migrazione dati?</p>
            <p className="mt-1 text-gray-600">
              Offriamo import da CSV/Excel e supporto alla mappatura dei campi.
            </p>
          </div>
          <div className="rounded-xl border p-5 bg-white">
            <p className="font-medium">Pagamenti e fatturazione?</p>
            <p className="mt-1 text-gray-600">
              Pagamenti con carta o bonifico. Fatturazione mensile; annuale su richiesta.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}