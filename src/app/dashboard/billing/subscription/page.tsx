// src/app/dashboard/billing/subscription/page.tsx
import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import SyncAfterCheckoutClient from "@/components/billing/SyncAfterCheckoutClient";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Shield,
  Zap,
  ExternalLink
} from "lucide-react";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_org")
    .eq("id", user.id)
    .maybeSingle();

  const currentOrg = profile?.current_org as string | undefined;

  // se torniamo da Stripe, prova una sync ottimistica lato client
  // (fa un POST a /api/billing/sync usando session_id)
  // non blocca il render
  // ↓↓↓
  // <SyncAfterCheckoutClient status={sp?.status} sessionId={sp?.session_id} />

  const { data: sub } = currentOrg
    ? await supabase
        .from("org_subscriptions")
        .select("status, plan as price_id, current_period_end")
        .eq("org_id", currentOrg)
        .maybeSingle()
    : { data: null };

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
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center lg:text-left">
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <CreditCard className="h-4 w-4" />
          Piano & Licenze
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Il tuo <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">abbonamento</span>
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl">
          Gestisci il tuo piano, visualizza i dettagli di fatturazione e controlla lo stato del tuo abbonamento.
        </p>
      </header>

      {/* Sync ottimistica dopo il ritorno dal checkout */}
      <SyncAfterCheckoutClient status={sp?.status} sessionId={sp?.session_id} />

      {/* Banner di stato */}
      {banner && (
        <div className={`p-4 rounded-xl border ${
          banner.tone === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : banner.tone === "warn"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}>
          <div className="flex items-center gap-3">
            {banner.tone === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : banner.tone === "warn" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{banner.text}</span>
          </div>
        </div>
      )}

      {/* Contenuto principale */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Stato piano */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Piano Attuale</h3>
              <p className="text-sm text-gray-600">Stato del tuo abbonamento</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Piano</div>
              <div className="text-xl font-semibold text-gray-900">{currentPlanName}</div>
            </div>

            {isActive ? (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-700 capitalize">{sub?.status}</span>
                </div>
                
                {renewAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Prossimo rinnovo: <span className="font-medium">{renewAt}</span></span>
                  </div>
                )}

                <a
                  href="/api/billing/portal?return=/dashboard/billing/subscription"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-medium hover:shadow-lg transition-all duration-200"
                >
                  <ExternalLink className="h-4 w-4" />
                  Apri Billing Portal
                </a>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span>Nessun abbonamento attivo</span>
              </div>
            )}
          </div>
        </div>

        {/* Azioni rapide */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Azioni Rapide</h3>
              <p className="text-sm text-gray-600">Gestisci il tuo abbonamento</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/dashboard/billing"
              className="group flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Cambia Piano</div>
                  <div className="text-xs text-gray-600">Scegli un nuovo piano</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>

            <a
              href="/api/billing/portal?return=/dashboard/billing/subscription"
              className="group flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Fatture & Pagamenti</div>
                  <div className="text-xs text-gray-600">Gestisci metodi di pagamento</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}