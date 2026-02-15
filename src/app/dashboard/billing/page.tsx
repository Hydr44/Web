// src/app/dashboard/billing/page.tsx
import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import CheckoutButton from "@/components/billing/CheckoutButton";
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Shield,
  Zap,
  ExternalLink,
  Star,
  Crown,
  Users,
  Wallet,
  FileText,
  Truck,
  BookOpen,
  Calculator,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Nuovi piani con price ID mensili e annuali
const PLANS = [
  {
    key: "Starter",
    label: "Starter",
    desc: "Base + 1 modulo a scelta",
    annualPrice: "1.800",
    monthlyPrice: "179",
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL ?? "",
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY ?? "",
    icon: Users,
    color: "blue",
    features: [
      "Gestionale completo",
      "Ricambi + TecDoc",
      "Tracking GPS live",
      "App Mobile autisti",
      "1 modulo a scelta",
    ],
  },
  {
    key: "Professional",
    label: "Professional",
    desc: "Base + 2 moduli a scelta",
    annualPrice: "2.800",
    monthlyPrice: "279",
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL ?? "",
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY ?? "",
    icon: Star,
    color: "emerald",
    recommended: true,
    features: [
      "Tutto di Starter",
      "2 moduli a scelta",
      "Ideale: RVFU + RENTRI",
      "Per autodemolitori",
    ],
  },
  {
    key: "Business",
    label: "Business",
    desc: "Base + 3 moduli a scelta",
    annualPrice: "3.600",
    monthlyPrice: "359",
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ANNUAL ?? "",
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY ?? "",
    icon: Crown,
    color: "amber",
    features: [
      "Tutto di Professional",
      "3 moduli a scelta",
      "Gestione quasi completa",
      "Per aziende strutturate",
    ],
  },
  {
    key: "Full",
    label: "Full",
    desc: "Tutti i moduli inclusi",
    annualPrice: "4.500",
    monthlyPrice: "449",
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_ANNUAL ?? "",
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_MONTHLY ?? "",
    icon: Shield,
    color: "purple",
    features: [
      "Tutto incluso",
      "SDI + RVFU + RENTRI",
      "Contabilità completa",
      "Nessuna limitazione",
    ],
  },
];

// Mappa price_id ai nomi dei piani (tutti i price ID)
const PLAN_MAPPING: Record<string, string> = {
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_ANNUAL || ""]: "Starter",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER_MONTHLY || ""]: "Starter",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL || ""]: "Professional",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY || ""]: "Professional",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_ANNUAL || ""]: "Business",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY || ""]: "Business",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_ANNUAL || ""]: "Full",
  [process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_MONTHLY || ""]: "Full",
};

const MODULES = [
  { name: "SDI", desc: "Fatturazione elettronica via SDI-SFTP", Icon: FileText },
  { name: "RVFU", desc: "Demolizioni — Registro Veicoli Fuoriuso MIT", Icon: Truck },
  { name: "RENTRI", desc: "Rifiuti — Registro Nazionale Tracciabilità", Icon: BookOpen },
  { name: "Contabilità", desc: "Prima nota, piano dei conti, movimenti", Icon: Calculator },
];

export default async function BillingPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ status?: string; err?: string; session_id?: string }>;
}>) {
  const sp = await searchParams;
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/dashboard/billing");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, price_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const currentPlanName = subscription?.price_id 
    ? PLAN_MAPPING[subscription.price_id] || "Piano Sconosciuto"
    : "Nessun piano attivo";
    
  const hasStripeCustomer = !!profile?.stripe_customer_id;
  const hasActivePlan = currentPlanName !== "Nessun piano attivo";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <Wallet className="h-4 w-4" />
          Centro Pagamenti
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-4">
          Gestione <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Abbonamento</span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl">
          Scegli il piano più adatto alla tua attività. Tutti i piani includono il gestionale completo e l'app mobile.
        </p>
      </div>

      {/* Success/Error Messages */}
      {sp.status === "success" && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <div>
            <span className="text-emerald-400 font-medium">Abbonamento attivato!</span>
            <p className="text-emerald-400/70 text-sm mt-0.5">Il tuo piano è ora attivo. Buon lavoro!</p>
          </div>
        </div>
      )}

      {sp.err && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div>
            <span className="text-red-400 font-medium">Errore</span>
            <p className="text-red-400/70 text-sm mt-0.5">
              {sp.err === "missing_price" 
                ? "Prezzo non configurato. Contatta il supporto."
                : sp.err === "missing_org"
                ? "Devi prima creare un'organizzazione."
                : "Si è verificato un errore. Riprova più tardi."}
            </p>
          </div>
        </div>
      )}

      {/* Current Plan Status */}
      {hasActivePlan && (
        <div className="rounded-2xl p-6 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-blue-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-500/15">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-100">
                  Piano Attuale: {currentPlanName}
                </h3>
                <p className="text-emerald-400 text-sm">Il tuo abbonamento è attivo</p>
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
      )}

      {/* Pricing Plans — Annuali */}
      <div>
        <h2 className="text-xl font-semibold text-slate-200 mb-2">Piani Annuali</h2>
        <p className="text-sm text-slate-500 mb-4">Risparmia circa 2 mensilità con il pagamento annuale</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = currentPlanName === plan.key;
            const IconComp = plan.icon;
            
            return (
              <div
                key={`${plan.key}-annual`}
                className={`rounded-2xl border p-6 relative flex flex-col ${
                  isCurrent
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : plan.recommended
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-[#243044] bg-[#1a2536]'
                }`}
              >
                {plan.recommended && !isCurrent && (
                  <span className="absolute -top-2.5 right-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 text-[10px] font-medium border border-emerald-500/20">
                    Consigliato
                  </span>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-${plan.color}-500/15 flex items-center justify-center`}>
                    <IconComp className={`h-5 w-5 text-${plan.color}-400`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{plan.label}</h3>
                    <p className="text-xs text-slate-500">{plan.desc}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-3xl font-bold text-slate-100">€{plan.annualPrice}</div>
                  <div className="text-sm text-slate-500">all'anno</div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <CheckoutButton
                  priceId={plan.annualPriceId}
                  currentPlan={currentPlanName}
                  planName={plan.label}
                  isActive={isCurrent}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Plans — Mensili */}
      <div>
        <h2 className="text-xl font-semibold text-slate-200 mb-2">Piani Mensili</h2>
        <p className="text-sm text-slate-500 mb-4">Flessibilità massima, disdici quando vuoi</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = currentPlanName === plan.key;
            const IconComp = plan.icon;
            
            return (
              <div
                key={`${plan.key}-monthly`}
                className={`rounded-2xl border p-6 flex flex-col ${
                  isCurrent
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-[#243044] bg-[#1a2536]'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-${plan.color}-500/15 flex items-center justify-center`}>
                    <IconComp className={`h-5 w-5 text-${plan.color}-400`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{plan.label}</h3>
                    <p className="text-xs text-slate-500">{plan.desc}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-3xl font-bold text-slate-100">€{plan.monthlyPrice}</div>
                  <div className="text-sm text-slate-500">al mese</div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <CheckoutButton
                  priceId={plan.monthlyPriceId}
                  currentPlan={currentPlanName}
                  planName={plan.label}
                  isActive={isCurrent}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Moduli disponibili */}
      <div className="rounded-2xl border border-[#243044] bg-[#1a2536] p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Moduli disponibili</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {MODULES.map((mod) => (
            <div key={mod.name} className="p-4 rounded-lg border border-[#243044] bg-[#141c27]">
              <div className="flex items-center gap-2 mb-1">
                <mod.Icon className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-200">{mod.name}</span>
              </div>
              <p className="text-[11px] text-slate-500">{mod.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3">
          Ogni piano include il Gestionale Base completo + App Mobile per autisti. I moduli si scelgono in base al piano acquistato.
        </p>
      </div>

      {/* Billing Portal */}
      {(hasStripeCustomer || hasActivePlan) && (
        <div className="bg-[#1a2536] rounded-2xl border border-[#243044] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Portale Fatturazione</h3>
              <p className="text-slate-400 mt-1 text-sm">
                Gestisci metodi di pagamento, scarica fatture e modifica l'abbonamento
              </p>
            </div>
            {hasStripeCustomer && (
              <Link
                href="/api/billing/portal"
                prefetch={false}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200"
              >
                <ExternalLink className="h-4 w-4" />
                Apri Portale
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Help */}
      <div className="bg-[#141c27] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Hai bisogno di aiuto?</h3>
            <p className="text-slate-400 text-sm mb-3">
              Scrivici per qualsiasi domanda sui piani e la fatturazione.
            </p>
            <a
              href="mailto:info@rescuemanager.eu"
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#243044] text-slate-300 rounded-xl hover:bg-[#1a2536] transition-colors duration-200 text-sm"
            >
              info@rescuemanager.eu
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
