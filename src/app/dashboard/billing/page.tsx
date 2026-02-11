// src/app/dashboard/billing/page.tsx
import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
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
  Users,
  Wallet,
  TrendingUp,
  Calendar,
  FileText,
  Settings,
  Bell,
  Download
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
  
  // Colori specifici per ogni piano
  const getPlanColors = (planName: string) => {
    switch (planName) {
      case "Starter":
        return {
          bg: "bg-gradient-to-r from-blue-50 to-indigo-50",
          border: "border-blue-500/20",
          iconBg: "bg-blue-500/15",
          iconColor: "text-blue-400",
          titleColor: "text-blue-900",
          textColor: "text-blue-400"
        };
      case "Flotta":
        return {
          bg: "bg-gradient-to-r from-purple-50 to-violet-50",
          border: "border-purple-200",
          iconBg: "bg-purple-100",
          iconColor: "text-purple-400",
          titleColor: "text-purple-900",
          textColor: "text-purple-700"
        };
      case "Azienda / Consorzio":
        return {
          bg: "bg-gradient-to-r from-amber-50 to-orange-50",
          border: "border-amber-200",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
          titleColor: "text-amber-900",
          textColor: "text-amber-700"
        };
      default:
        return {
          bg: "bg-gradient-to-r from-gray-50 to-slate-50",
          border: "border-[#243044]",
          iconBg: "bg-[#1a2536]",
          iconColor: "text-slate-500",
          titleColor: "text-slate-500",
          textColor: "text-slate-500"
        };
    }
  };
  
  const planColors = getPlanColors(currentPlanName);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <Wallet className="h-4 w-4" />
          Centro Pagamenti
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-4">
          Gestione <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Pagamenti</span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl">
          Gestisci il tuo abbonamento, metodi di pagamento e monitora l'utilizzo delle risorse.
        </p>
      </div>

      {/* Billing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 ">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Piano Attuale</h3>
              <p className="text-sm text-slate-400">Abbonamento</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 mb-1">
            {currentPlanName}
          </div>
          <div className="text-sm text-slate-400">
            {hasActivePlan ? "Attivo" : "Nessun piano"}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-green-50/30 border border-emerald-500/20/50 ">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Utilizzo</h3>
              <p className="text-sm text-slate-400">Risorse</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 mb-1">
            85%
          </div>
          <div className="text-sm text-slate-400">
            Del limite mensile
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 ">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Prossima Fattura</h3>
              <p className="text-sm text-slate-400">Scadenza</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 mb-1">
            15 Gen
          </div>
          <div className="text-sm text-slate-400">
            {hasActivePlan ? "€29,00" : "N/A"}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-orange-50/30 border border-orange-200/50 ">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Fatture</h3>
              <p className="text-sm text-slate-400">Storico</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 mb-1">
            12
          </div>
          <div className="text-sm text-slate-400">
            Fatture totali
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/billing"
          className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Gestione Piano</h3>
              <p className="text-sm text-slate-400">Modifica abbonamento</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Cambia piano, aggiorna metodi di pagamento e gestisci la fatturazione.</p>
        </Link>

        <Link
          href="/dashboard/billing"
          className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Fatture</h3>
              <p className="text-sm text-slate-400">Download e storico</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Scarica le tue fatture e visualizza lo storico dei pagamenti.</p>
        </Link>

        <Link
          href="/dashboard/notifications"
          className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Notifiche</h3>
              <p className="text-sm text-slate-400">Preferenze fatturazione</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">Configura le notifiche per fatture e scadenze di pagamento.</p>
        </Link>
      </div>

      {/* Current Plan Status */}
      <div className={`rounded-2xl p-6 border ${planColors.bg} ${planColors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${planColors.iconBg}`}>
              <Shield className={`h-6 w-6 ${planColors.iconColor}`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${planColors.titleColor}`}>
                Piano Attuale: {currentPlanName}
              </h3>
              <p className={planColors.textColor}>
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
            : 'border-[#243044] bg-[#1a2536]'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Starter</h3>
              <p className="text-sm text-slate-400">Per piccole aziende</p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-3xl font-bold text-slate-100">€29</div>
            <div className="text-sm text-slate-400">al mese</div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Fino a 5 veicoli
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Fino a 10 conducenti
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Dashboard base
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-300">
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
            : 'border-[#243044] bg-[#1a2536]'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Flotta</h3>
              <p className="text-sm text-slate-400">Per aziende in crescita</p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-3xl font-bold text-slate-100">€79</div>
            <div className="text-sm text-slate-400">al mese</div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Fino a 25 veicoli
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Fino a 50 conducenti
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Dashboard avanzata
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-300">
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
            : 'border-[#243044] bg-[#1a2536]'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Crown className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Enterprise</h3>
              <p className="text-sm text-slate-400">Per grandi aziende</p>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-3xl font-bold text-slate-100">€199</div>
            <div className="text-sm text-slate-400">al mese</div>
          </div>

          <ul className="space-y-3 mb-6">
            <li className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Veicoli illimitati
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Conducenti illimitati
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Dashboard personalizzata
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-300">
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
        <div className="bg-[#1a2536] rounded-2xl border border-[#243044] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Gestione Abbonamento</h3>
              <p className="text-slate-400 mt-1">
                Accedi al portale di fatturazione per gestire il tuo abbonamento
              </p>
            </div>
            <div className="flex gap-3">
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


      {/* Help Section */}
      <div className="bg-[#141c27] rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">
              Hai bisogno di aiuto?
            </h3>
            <p className="text-slate-400 mb-4">
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
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#243044] text-slate-300 rounded-xl hover:bg-[#141c27] transition-colors duration-200"
              >
                <ExternalLink className="h-4 w-4" />
                Contatta Vendite
              </Link>
            </div>
          </div>
        </div>
      </div>


      {/* Error Messages */}
      {sp.err && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-800 font-medium">Errore</span>
          </div>
          <p className="text-red-400 mt-1">
            {sp.err === "missing_price" 
              ? "Prezzo non configurato. Contatta il supporto."
              : "Si è verificato un errore. Riprova più tardi."}
          </p>
        </div>
      )}
    </div>
  );
}