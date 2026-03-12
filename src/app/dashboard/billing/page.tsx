// src/app/dashboard/billing/page.tsx
import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Shield,
  Zap,
  ExternalLink,
  Wallet,
  FileText,
  Truck,
  BookOpen,
  Calculator,
  Package,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Mappa price_id ai nomi dei piani
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

const PLAN_DETAILS: Record<string, { desc: string; modules: string }> = {
  "Starter": { desc: "Gestionale Base + 1 modulo", modules: "1 modulo attivo" },
  "Professional": { desc: "Gestionale Base + 2 moduli", modules: "2 moduli attivi" },
  "Business": { desc: "Gestionale Base + 3 moduli", modules: "3 moduli attivi" },
  "Full": { desc: "Gestionale completo — tutti i moduli", modules: "Tutti i moduli" },
};

const MODULES = [
  { key: "sdi", name: "SDI", desc: "Fatturazione elettronica", Icon: FileText },
  { key: "rvfu", name: "RVFU", desc: "Demolizioni MIT", Icon: Truck },
  { key: "rentri", name: "RENTRI", desc: "Registro Rifiuti", Icon: BookOpen },
  { key: "contabilita", name: "Contabilità", desc: "Prima nota e conti", Icon: Calculator },
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
    .select("stripe_customer_id, current_org")
    .eq("id", user.id)
    .single();

  // Trova org_id dell'utente (da profile o org_members)
  let userOrgId = profile?.current_org || null;
  if (!userOrgId) {
    const { data: mem } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    userOrgId = mem?.org_id || null;
  }

  // Carica abbonamento da org_subscriptions (tabella reale)
  let subscription: any = null;
  if (userOrgId) {
    const { data: orgSub } = await supabase
      .from("org_subscriptions")
      .select("*")
      .eq("org_id", userOrgId)
      .maybeSingle();
    subscription = orgSub;
  }

  // Carica moduli attivi per l'organizzazione
  let activeModules: string[] = [];
  if (userOrgId) {
    const { data: mods } = await supabase
      .from("org_modules")
      .select("module")
      .eq("org_id", userOrgId)
      .eq("status", "active");
    activeModules = (mods || []).map(m => m.module);
  }

  const PLAN_LABELS: Record<string, string> = {
    starter: "Starter", professional: "Professional",
    business: "Business", full: "Full",
  };

  const currentPlanName = subscription?.plan
    ? PLAN_LABELS[subscription.plan] || subscription.plan
    : null;
    
  const hasStripeCustomer = !!profile?.stripe_customer_id;
  const isActive = subscription && (subscription.status === "active" || subscription.status === "trial");
  const hasActivePlan = !!currentPlanName && isActive;
  const planDetail = currentPlanName ? PLAN_DETAILS[currentPlanName] : null;
  
  const renewalDate = subscription?.current_period_end 
    ? new Date(subscription.current_period_end).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
    : null;
  
  const isTrial = subscription?.status === "trial";
  const trialEnd = subscription?.trial_end
    ? new Date(subscription.trial_end).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Abbonamento
        </h1>
        
        <p className="text-lg text-gray-500 max-w-2xl">
          Gestisci il tuo piano, visualizza i moduli attivi e accedi al portale di fatturazione.
        </p>
      </div>

      {/* Success/Error Messages */}
      {sp.status === "success" && (
        <div className="bg-emerald-500/10 border border-gray-200  p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <span className="text-green-600 font-medium">Abbonamento attivato!</span>
            <p className="text-green-600/70 text-sm mt-0.5">Il tuo piano è ora attivo. Buon lavoro!</p>
          </div>
        </div>
      )}

      {sp.err && (
        <div className="bg-red-50 border border-red-200  p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <span className="text-red-600 font-medium">Errore</span>
            <p className="text-red-600/70 text-sm mt-0.5">
              {sp.err === "missing_price" 
                ? "Prezzo non configurato. Contatta il supporto."
                : "Si è verificato un errore. Riprova più tardi."}
            </p>
          </div>
        </div>
      )}

      {/* Piano attuale */}
      {hasActivePlan ? (
        <div className=" border border-blue-200 bg-blue-50/30 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 flex items-center justify-center border border-blue-200">
                <CreditCard className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-900">Piano {currentPlanName}</h2>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isTrial ? 'text-blue-600 bg-blue-50 border border-blue-200' : 'text-blue-600 bg-blue-50 border border-blue-200'}`}>
                    <CheckCircle2 className="h-3 w-3" /> {isTrial ? 'Trial' : 'Attivo'}
                  </span>
                </div>
                {planDetail && (
                  <p className="text-gray-500 text-sm mt-1">{planDetail.desc}</p>
                )}
                {renewalDate && (
                  <p className="text-gray-400 text-xs mt-2">
                    Prossimo rinnovo: {renewalDate}
                  </p>
                )}
              </div>
            </div>
            {hasStripeCustomer && (
              <Link
                href="/api/billing/portal"
                prefetch={false}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-gray-900  hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
              >
                <CreditCard className="h-4 w-4" />
                Gestisci Pagamento
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className=" border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14  bg-gray-100/10 flex items-center justify-center">
              <Package className="h-7 w-7 text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Nessun piano attivo</h2>
              <p className="text-gray-400 text-sm mt-1">
                Contattaci per attivare il piano più adatto alla tua attività.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Moduli attivi */}
      <div className=" border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Moduli</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {MODULES.map((mod) => {
            const isActive = activeModules.includes(mod.key || mod.name.toLowerCase());
            return (
              <div
                key={mod.name}
                className={`p-4 rounded-lg border transition-colors ${
                  isActive
                    ? "border-blue-200 bg-blue-50/50"
                    : "border-gray-200 bg-white opacity-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <mod.Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                    <span className="text-sm font-medium text-gray-800">{mod.name}</span>
                  </div>
                  {isActive ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full text-blue-600 bg-blue-50 font-medium">
                      Attivo
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400">Non attivo</span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400">{mod.desc}</p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Per attivare o modificare i moduli, contatta il supporto.
        </p>
      </div>

      {/* Portale fatturazione */}
      {hasStripeCustomer && (
        <div className="bg-white  border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Portale Fatturazione</h3>
              <p className="text-gray-500 mt-1 text-sm">
                Gestisci metodi di pagamento, scarica fatture e visualizza lo storico
              </p>
            </div>
            <Link
              href="/api/billing/portal"
              prefetch={false}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600  hover:bg-gray-50 transition-colors duration-200 text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Apri Portale
            </Link>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="bg-white  p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Hai bisogno di aiuto?</h3>
            <p className="text-gray-500 text-sm mb-3">
              Per informazioni su piani, prezzi e attivazione moduli contattaci.
            </p>
            <a
              href="mailto:info@rescuemanager.eu"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600  hover:bg-white transition-colors duration-200 text-sm"
            >
              info@rescuemanager.eu
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
