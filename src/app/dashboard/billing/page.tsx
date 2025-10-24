// src/app/dashboard/billing/page.tsx
import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import SyncAfterCheckoutClient from "@/components/billing/SyncAfterCheckoutClient";
import ForceSyncButton from "@/components/billing/ForceSyncButton";
import DebugButton from "@/components/billing/DebugButton";
import CheckoutButton from "@/components/billing/CheckoutButton";
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Shield,
  Zap,
  ExternalLink,
  Star,
  Crown,
  Users
} from "lucide-react";

export const dynamic = "force-dynamic";

const PRICES = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "",
  fleet: process.env.STRIPE_PRICE_FLEET ?? "",
  consortium: process.env.STRIPE_PRICE_CONSORTIUM ?? "",
} as const;


export default async function BillingPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ status?: string; err?: string; session_id?: string }>;
}>) {
  const sp = await searchParams;

  // ⬇️ deve essere atteso!
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/dashboard/billing");
  }

  // Carica il profilo utente e la subscription per ottenere il piano corrente
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  // Carica la subscription attiva per ottenere il piano
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, price_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  // Mappa price_id ai nomi dei piani
  const PLAN_MAPPING: Record<string, string> = {
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || ""]: "Starter",
    [process.env.STRIPE_PRICE_FLEET || ""]: "Flotta", 
    [process.env.STRIPE_PRICE_CONSORTIUM || ""]: "Azienda / Consorzio",
  };

  const currentPlanName = subscription?.price_id 
    ? PLAN_MAPPING[subscription.price_id] || "Piano Sconosciuto"
    : "Nessun piano attivo";
    
  const hasStripeCustomer = !!profile?.stripe_customer_id;
  const hasActivePlan = currentPlanName !== "Nessun piano attivo";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fatturazione e Abbonamenti</h1>
        <p className="text-gray-600 mt-2">
          Gestisci il tuo abbonamento e i metodi di pagamento
        </p>
      </div>

      {/* Current Plan Status */}
      <div className="bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-2xl p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Piano Attuale: {currentPlanName}
              </h3>
              <p className="text-gray-600">
                {currentPlanName === "Nessun piano attivo" 
                  ? "Seleziona un piano per iniziare" 
                  : "Il tuo abbonamento è attivo"}
              </p>
            </div>
          </div>
          {hasStripeCustomer && (
            <Link
              href="/api/billing/portal"
              prefetch={false}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200"
            >
              <CreditCard className="h-4 w-4" />
              Gestisci Abbonamento
            </Link>
          )}
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starter Plan */}
        <div className={`rounded-2xl border p-6 ${
          currentPlanName === "Starter" 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Starter</h3>
              <p className="text-sm text-gray-600">Per piccole aziende</p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-3xl font-bold text-gray-900">€29</div>
            <div className="text-sm text-gray-600">al mese</div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Fino a 5 veicoli
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Fino a 10 conducenti
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Dashboard base
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Supporto email
            </li>
          </ul>

          <CheckoutButton
            priceId={PRICES.starter}
            currentPlan={currentPlanName}
            planName="Starter"
            isActive={currentPlanName === "Starter"}
          />
        </div>

        {/* Fleet Plan */}
        <div className={`rounded-2xl border p-6 ${
          currentPlanName === "Flotta" 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Flotta</h3>
              <p className="text-sm text-gray-600">Per aziende in crescita</p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-3xl font-bold text-gray-900">€79</div>
            <div className="text-sm text-gray-600">al mese</div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Fino a 25 veicoli
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Fino a 50 conducenti
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Dashboard avanzata
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Analytics dettagliate
            </li>
          </ul>

          <CheckoutButton
            priceId={PRICES.fleet}
            currentPlan={currentPlanName}
            planName="Flotta"
            isActive={currentPlanName === "Flotta"}
          />
        </div>

        {/* Consortium Plan */}
        <div className={`rounded-2xl border p-6 ${
          currentPlanName === "Azienda / Consorzio" 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Crown className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Enterprise</h3>
              <p className="text-sm text-gray-600">Per grandi aziende</p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-3xl font-bold text-gray-900">€199</div>
            <div className="text-sm text-gray-600">al mese</div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Veicoli illimitati
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Conducenti illimitati
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Dashboard personalizzata
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Supporto dedicato
            </li>
          </ul>

          <CheckoutButton
            priceId={PRICES.consortium}
            currentPlan={currentPlanName}
            planName="Enterprise"
            isActive={currentPlanName === "Azienda / Consorzio"}
          />
        </div>
      </div>

      {/* Billing Portal */}
      {(hasStripeCustomer || hasActivePlan) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gestione Abbonamento</h3>
              <p className="text-gray-600 mt-1">
                Accedi al portale di fatturazione per gestire il tuo abbonamento
              </p>
            </div>
            <div className="flex gap-3">
              <DebugButton />
              <ForceSyncButton />
              {hasStripeCustomer && (
                <Link
                  href="/api/billing/portal"
                  prefetch={false}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200"
                >
                  <ExternalLink className="h-4 w-4" />
                  Apri Portale Fatturazione
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sezione Debug per utenti senza customer */}
      {!hasStripeCustomer && (
        <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">Debug Abbonamento</h3>
              <p className="text-yellow-700 mt-1">
                Se hai appena completato un acquisto, usa questi strumenti per sincronizzare
              </p>
            </div>
            <div className="flex gap-3">
              <DebugButton />
              <ForceSyncButton />
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Hai bisogno di aiuto?
            </h3>
            <p className="text-gray-600 mb-4">
              Il nostro team di supporto è qui per aiutarti con qualsiasi domanda sui piani e la fatturazione.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dashboard/support"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200"
              >
                <Zap className="h-4 w-4" />
                Contatta Supporto
              </Link>
              <Link
                href="/contatti"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                <ExternalLink className="h-4 w-4" />
                Contatta Vendite
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sync After Checkout */}
      {sp.status === "success" && sp.session_id && (
        <SyncAfterCheckoutClient status={sp.status} sessionId={sp.session_id} />
      )}

      {/* Error Messages */}
      {sp.err && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 font-medium">Errore</span>
          </div>
          <p className="text-red-700 mt-1">
            {sp.err === "missing_price" 
              ? "Prezzo non configurato. Contatta il supporto."
              : "Si è verificato un errore. Riprova più tardi."}
          </p>
        </div>
      )}
    </div>
  );
}