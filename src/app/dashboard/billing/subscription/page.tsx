// src/app/dashboard/billing/subscription/page.tsx
import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import SyncAfterCheckoutClient from "@/components/billing/SyncAfterCheckoutClient";

export const dynamic = "force-dynamic";

// (opzionale) mappa price->nome piano, utile per mostrare il nome umano
const PRICES = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "",
  fleet: process.env.STRIPE_PRICE_FLEET ?? "",
  consortium: process.env.STRIPE_PRICE_CONSORTIUM ?? "",
} as const;

export default async function SubscriptionPage({
  searchParams,
}: {
  // In Next 15 è async
  searchParams: Promise<{ status?: string; err?: string; session_id?: string }>;
}) {
  const sp = await searchParams;

  // 🔧 QUI SERVE await
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard/billing/subscription");

  // se torniamo da Stripe, prova una sync ottimistica lato client
  // (fa un POST a /api/billing/sync usando session_id)
  // non blocca il render
  // ↓↓↓
  // <SyncAfterCheckoutClient status={sp?.status} sessionId={sp?.session_id} />

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, price_id, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const isActive = !!sub && ["active", "trialing", "past_due"].includes(sub.status || "");
  const currentPriceId = sub?.price_id || "";

  const planNameByPrice: Record<string, string> = {
    [PRICES.starter]: "Starter",
    [PRICES.fleet]: "Flotta",
    [PRICES.consortium]: "Azienda / Consorzio",
  };
  const currentPlanName = isActive ? (planNameByPrice[currentPriceId] ?? "Piano attivo") : "Nessun piano";

  const renewAt = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const banner =
    sp?.status === "success"
      ? { tone: "success", text: "Pagamento completato! Abbonamento aggiornato." }
      : sp?.status === "cancel"
      ? { tone: "warn", text: "Checkout annullato. Nessuna modifica effettuata." }
      : sp?.err
      ? {
          tone: "error",
          text:
            sp.err === "missing_price"
              ? "Manca il price ID per questo piano."
              : `Errore: ${decodeURIComponent(sp.err)}`,
        }
      : null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold">Il mio abbonamento</h1>
      <p className="mt-2 text-gray-600">Dettagli del piano e gestione pagamenti.</p>

      {/* Sync ottimistica dopo il ritorno dal checkout */}
      <SyncAfterCheckoutClient status={sp?.status} sessionId={sp?.session_id} />

      {banner && (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            banner.tone === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : banner.tone === "warn"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* Stato piano */}
        <div className="p-6 rounded-2xl border bg-white">
          <div className="text-sm font-medium text-gray-700">Piano attuale</div>
          <div className="mt-1 text-lg">{currentPlanName}</div>

          {isActive ? (
            <>
              <div className="mt-2 text-sm">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200">
                  {sub?.status}
                </span>
              </div>
              {renewAt && (
                <div className="mt-2 text-sm text-gray-600">
                  Prossimo rinnovo: <span className="font-medium">{renewAt}</span>
                </div>
              )}
              <a
                href="/api/billing/portal?return=/dashboard/billing/subscription"
                className="mt-5 inline-flex px-4 py-2 rounded-lg ring-1 ring-gray-300 text-sm"
              >
                Apri Billing Portal
              </a>
            </>
          ) : (
            <div className="mt-3 text-sm text-gray-600">
              Nessun abbonamento attivo. Vai a{" "}
              <Link href="/dashboard/billing" className="underline">
                Piani & licenze
              </Link>{" "}
              per attivare un piano.
            </div>
          )}
        </div>

        {/* Azioni rapide */}
        <div className="p-6 rounded-2xl border bg-white">
          <div className="text-sm font-medium text-gray-700">Azioni</div>
          <div className="mt-3 grid gap-2">
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm"
            >
              Cambia piano
            </Link>
            <a
              href="/api/billing/portal?return=/dashboard/billing/subscription"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg ring-1 ring-gray-300 text-sm"
            >
              Metodi di pagamento / Fatture
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}