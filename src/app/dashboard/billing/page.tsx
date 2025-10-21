// src/app/dashboard/billing/page.tsx
import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import SyncAfterCheckoutClient from "@/components/billing/SyncAfterCheckoutClient";

export const dynamic = "force-dynamic";

const PRICES = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "",
  fleet: process.env.STRIPE_PRICE_FLEET ?? "",
  consortium: process.env.STRIPE_PRICE_CONSORTIUM ?? "",
} as const;

function goToCheckout(price: string) {
  if (!price) return "/dashboard/billing?err=missing_price";
  return `/api/billing/checkout?price=${encodeURIComponent(
    price
  )}&return=${encodeURIComponent("/dashboard/billing/subscription")}`;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; err?: string; session_id?: string }>;
}) {
  const sp = await searchParams;

  // ⬇️ deve essere atteso!
  const supabase = await supabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/billing");

  // Recupera l'organizzazione corrente
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_org")
    .eq("id", user.id)
    .maybeSingle();

  const currentOrg = profile?.current_org as string | undefined;
  if (!currentOrg) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl md:text-3xl font-semibold">Piano & licenze</h1>
        <div className="mt-4 rounded-lg border bg-amber-50 text-amber-900 border-amber-200 px-3 py-2 text-sm">
          Nessuna organizzazione selezionata. Vai a <a className="underline" href="/dashboard/org">Organizzazione</a> e seleziona/crea la tua azienda.
        </div>
      </main>
    );
  }

  const { data: sub } = currentOrg
    ? await supabase
        .from("org_subscriptions")
        .select("status, plan as price_id, current_period_end")
        .eq("org_id", currentOrg)
        .maybeSingle()
    : { data: null };

  const isActive =
    !!sub && ["active", "trialing", "past_due"].includes(sub.status || "");
  const currentPriceId = sub?.price_id || "";

  const planNameByPrice: Record<string, string> = {
    [PRICES.starter]: "Starter",
    [PRICES.fleet]: "Flotta",
    [PRICES.consortium]: "Azienda / Consorzio",
  };
  const currentPlanName = isActive
    ? planNameByPrice[currentPriceId] ?? "Piano attivo"
    : "Free";

  const renewAt =
    sub?.current_period_end &&
    new Date(sub.current_period_end).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const banner =
    sp?.status === "success"
      ? { tone: "success", text: "Pagamento completato! Il piano è stato aggiornato." }
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
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-semibold">Piano & licenze</h1>
      <p className="mt-2 text-gray-600">
        Gestisci il tuo abbonamento. Puoi effettuare l’upgrade o aprire il Billing
        Portal per carte, fatture e metodi di pagamento.
      </p>

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
        <div className="p-6 rounded-2xl border bg-white">
          <div className="text-sm font-medium">Stato piano</div>
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
                href="/api/billing/portal?return=/dashboard/billing"
                className="mt-5 inline-flex px-4 py-2 rounded-lg ring-1 ring-gray-300 text-sm"
              >
                Apri Billing Portal
              </a>
            </>
          ) : (
            <>
              <ul className="mt-4 text-sm text-gray-700 space-y-1">
                <li>• 1 mezzo</li>
                <li>• Rapportini base</li>
                <li>• Accesso web</li>
              </ul>
              <a
                href={goToCheckout(PRICES.starter)}
                className="mt-5 inline-flex px-4 py-2 rounded-lg bg-primary text-white text-sm"
              >
                Attiva Starter
              </a>
            </>
          )}
        </div>

        <div className="p-6 rounded-2xl border bg-white">
          <div className="text-sm font-medium">Piani disponibili</div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">Starter</div>
                  <div className="text-sm text-gray-600">€ 29/mese • fino a 5 mezzi</div>
                </div>
                <a
                  href={
                    PRICES.starter
                      ? goToCheckout(PRICES.starter)
                      : "/dashboard/billing?err=missing_price"
                  }
                  className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm"
                >
                  {currentPlanName === "Starter" ? "Gestisci" : "Scegli"}
                </a>
              </div>
              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                <li>• Dispatch in tempo reale</li>
                <li>• Rapportini con foto & firma</li>
                <li>• Analytics base</li>
              </ul>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">Flotta</div>
                  <div className="text-sm text-gray-600">€ 79/mese • fino a 15 mezzi</div>
                </div>
                <a
                  href={
                    PRICES.fleet
                      ? goToCheckout(PRICES.fleet)
                      : "/dashboard/billing?err=missing_price"
                  }
                  className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm"
                >
                  {currentPlanName === "Flotta" ? "Gestisci" : "Scegli"}
                </a>
              </div>
              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                <li>• Tutto di Starter</li>
                <li>• Turni & reperibilità</li>
                <li>• Manutenzioni e scadenze</li>
              </ul>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">Azienda / Consorzio</div>
                  <div className="text-sm text-gray-600">€ 149/mese • mezzi illimitati</div>
                </div>
                <a
                  href={
                    PRICES.consortium
                      ? goToCheckout(PRICES.consortium)
                      : "/dashboard/billing?err=missing_price"
                  }
                  className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm"
                >
                  {currentPlanName === "Azienda / Consorzio" ? "Gestisci" : "Scegli"}
                </a>
              </div>
              <ul className="mt-2 text-sm text-gray-700 space-y-1">
                <li>• Tutto di Flotta</li>
                <li>• Portale clienti</li>
                <li>• Integrazioni avanzate</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Puoi aggiornare o annullare in qualsiasi momento dal Billing Portal.
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-xl border p-4 bg-white">
        <div className="text-sm font-medium">Hai bisogno di aiuto?</div>
        <div className="text-sm text-gray-600 mt-1">
          Scrivici a <a className="underline" href="mailto:info@rescuemanager.eu">info@rescuemanager.eu</a>{" "}
          o <Link href="/contatti" className="underline">prenota una chiamata</Link>.
        </div>
      </div>
    </main>
  );
}