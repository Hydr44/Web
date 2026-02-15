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
import SimulatePlanButton from "@/components/billing/SimulatePlanButton";

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
  { name: "SDI", desc: "Fatturazione elettronica", Icon: FileText },
  { name: "RVFU", desc: "Demolizioni MIT", Icon: Truck },
  { name: "RENTRI", desc: "Registro Rifiuti", Icon: BookOpen },
  { name: "Contabilità", desc: "Prima nota e conti", Icon: Calculator },
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

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, price_id, current_period_end")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  // Carica moduli attivi per l'organizzazione
  let activeModules: string[] = [];
  if (profile?.current_org) {
    const { data: mods } = await supabase
      .from("org_modules")
      .select("module")
      .eq("org_id", profile.current_org)
      .eq("status", "active");
    activeModules = (mods || []).map(m => m.module);
  }

  const currentPlanName = subscription?.price_id 
    ? PLAN_MAPPING[subscription.price_id] || "Piano Attivo"
    : null;
    
  const hasStripeCustomer = !!profile?.stripe_customer_id;
  const hasActivePlan = !!currentPlanName;
  const planDetail = currentPlanName ? PLAN_DETAILS[currentPlanName] : null;
  
  const renewalDate = subscription?.current_period_end 
    ? new Date(subscription.current_period_end).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <Wallet className="h-4 w-4" />
          Abbonamento
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-4">
          Il tuo <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Abbonamento</span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl">
          Gestisci il tuo piano, visualizza i moduli attivi e accedi al portale di fatturazione.
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
                : "Si è verificato un errore. Riprova più tardi."}
            </p>
          </div>
        </div>
      )}

      {/* Piano attuale */}
      {hasActivePlan ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                <Shield className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-100">Piano {currentPlanName}</h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" /> Attivo
                  </span>
                </div>
                {planDetail && (
                  <p className="text-slate-400 text-sm mt-1">{planDetail.desc}</p>
                )}
                {renewalDate && (
                  <p className="text-slate-500 text-xs mt-2">
                    Prossimo rinnovo: {renewalDate}
                  </p>
                )}
              </div>
            </div>
            {hasStripeCustomer && (
              <Link
                href="/api/billing/portal"
                prefetch={false}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
              >
                <CreditCard className="h-4 w-4" />
                Gestisci Pagamento
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#243044] bg-[#1a2536] p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center">
              <Package className="h-7 w-7 text-slate-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-200">Nessun piano attivo</h2>
              <p className="text-slate-500 text-sm mt-1">
                Contattaci per attivare il piano più adatto alla tua attività.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Moduli attivi */}
      <div className="rounded-2xl border border-[#243044] bg-[#1a2536] p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Moduli</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {MODULES.map((mod) => {
            const isActive = activeModules.includes(mod.key || mod.name.toLowerCase());
            return (
              <div
                key={mod.name}
                className={`p-4 rounded-lg border transition-colors ${
                  isActive
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-[#243044] bg-[#141c27] opacity-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <mod.Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                    <span className="text-sm font-medium text-slate-200">{mod.name}</span>
                  </div>
                  {isActive ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full text-emerald-400 bg-emerald-500/10 font-medium">
                      Attivo
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-600">Non attivo</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">{mod.desc}</p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-600 mt-3">
          Per attivare o modificare i moduli, contatta il supporto.
        </p>

        <div className="mt-4">
          <SimulatePlanButton />
        </div>
      </div>

      {/* Portale fatturazione */}
      {hasStripeCustomer && (
        <div className="bg-[#1a2536] rounded-2xl border border-[#243044] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Portale Fatturazione</h3>
              <p className="text-slate-400 mt-1 text-sm">
                Gestisci metodi di pagamento, scarica fatture e visualizza lo storico
              </p>
            </div>
            <Link
              href="/api/billing/portal"
              prefetch={false}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#141c27] border border-[#243044] text-slate-300 rounded-xl hover:bg-[#243044] transition-colors duration-200 text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              Apri Portale
            </Link>
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
              Per informazioni su piani, prezzi e attivazione moduli contattaci.
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
