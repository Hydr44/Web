// src/app/dashboard/page.tsx
import Link from "next/link";
import { 
  Users, 
  Truck, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Zap,
  Shield,
  BarChart3,
  Download
} from "lucide-react";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function DashboardPanoramica() {
  const supabase = await supabaseServer();

  // Utente e organizzazione corrente
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentOrg: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_org")
      .eq("id", user.id)
      .maybeSingle();
    currentOrg = (profile?.current_org as string | null) ?? null;
  }

  // Dati riepilogo (safe fallback se manca l'org)
  let subscription: { status: string | null; plan: string | null; renewAt: string | null } = {
    status: null,
    plan: null,
    renewAt: null,
  };
  let counts: { vehicles: number; drivers: number; transportsOpen: number; members: number } = {
    vehicles: 0,
    drivers: 0,
    transportsOpen: 0,
    members: 0,
  };

  if (currentOrg) {
    // Stato abbonamento a livello organizzazione
    const { data: orgSub } = await supabase
      .from("org_subscriptions")
      .select("status, plan, current_period_end")
      .eq("org_id", currentOrg)
      .maybeSingle();
    
    if (orgSub) {
      subscription = {
        status: (orgSub as { status?: string }).status ?? null,
        plan: (orgSub as { plan?: string }).plan ?? null,
        renewAt: (orgSub as { current_period_end?: string }).current_period_end
          ? new Date((orgSub as { current_period_end: string }).current_period_end).toLocaleDateString("it-IT", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : null,
      };
    }

    // Conteggi base
    const [vehRes, drvRes, trRes, memRes] = await Promise.all([
      supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("org_id", currentOrg),
      supabase.from("drivers").select("id", { count: "exact", head: true }).eq("org_id", currentOrg),
      supabase
        .from("transports")
        .select("id", { count: "exact", head: true })
        .eq("org_id", currentOrg)
        .in("status", ["new", "assigned", "enroute", "da fare"]) // supporta entrambi i vocaboli
        ,
      supabase.from("org_members").select("user_id", { count: "exact", head: true }).eq("org_id", currentOrg),
    ]);
    counts = {
      vehicles: vehRes.count ?? 0,
      drivers: drvRes.count ?? 0,
      transportsOpen: trRes.count ?? 0,
      members: memRes.count ?? 0,
    };
  }

  const planLabel = subscription.plan
    ? subscription.plan
    : subscription.status
    ? "Piano attivo"
    : "Nessun piano";

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center lg:text-left">
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <Zap className="h-4 w-4" />
          Dashboard Operativa
        </div>
        
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
          Benvenuto in{" "}
          <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            RescueManager
          </span>
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl">
          Gestisci la tua officina di soccorso stradale con tutti gli strumenti avanzati. 
          Monitora attività, team e performance in tempo reale.
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Subscription Status */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 border border-gray-200 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stato Abbonamento</h3>
              <p className="text-sm text-gray-600">Piano e licenze attive</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {currentOrg ? (
              subscription.status ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-200 font-medium">
                      {subscription.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Piano:</span> {planLabel}
                  </div>
                  {subscription.renewAt && (
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Rinnovo: {subscription.renewAt}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span className="text-orange-600 font-medium">Nessun abbonamento attivo</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-gray-500" />
                <span className="text-gray-600">Seleziona un&apos;organizzazione</span>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <Link 
              href="/dashboard/billing" 
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
            >
              Gestisci piano
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/dashboard/invoices" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Ricevute/Fatture
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          {/* Vehicles */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Truck className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-sm font-medium text-gray-700">Mezzi</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{counts.vehicles}</div>
            <div className="text-xs text-gray-500">Registrati</div>
          </div>

          {/* Drivers */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-sm font-medium text-gray-700">Autisti</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{counts.drivers}</div>
            <div className="text-xs text-gray-500">Attivi</div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="space-y-4">
          {/* Open Transports */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-white to-orange-50/30 border border-orange-200/50 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-sm font-medium text-gray-700">Trasporti</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{counts.transportsOpen}</div>
            <div className="text-xs text-gray-500">In corso</div>
          </div>

          {/* Team Members */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-sm font-medium text-gray-700">Team</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{counts.members}</div>
            <div className="text-xs text-gray-500">Membri</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 via-white to-blue-50/30 border border-primary/20 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Azioni Rapide</h3>
            <p className="text-sm text-gray-600">Accedi rapidamente alle funzioni principali</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <Link 
            href="/download" 
            className="group p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center">
                <Download className="h-4 w-4 text-gray-600 group-hover:text-primary" />
              </div>
              <div className="text-sm font-medium text-gray-900">App Desktop</div>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Scarica l&apos;app per macOS o Windows
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 rounded-md bg-gray-100 text-xs font-medium">macOS</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 text-xs font-medium">Windows</span>
            </div>
          </Link>
          
          <Link 
            href="/dashboard/team" 
            className="group p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-gray-600 group-hover:text-primary" />
              </div>
              <div className="text-sm font-medium text-gray-900">Gestisci Team</div>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Aggiungi membri e gestisci ruoli
            </p>
            <div className="text-xs text-primary font-medium group-hover:underline">
              Vai al team →
            </div>
          </Link>
          
          <Link 
            href="/dashboard/settings" 
            className="group p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-gray-600 group-hover:text-primary" />
              </div>
              <div className="text-sm font-medium text-gray-900">Impostazioni</div>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Configura il tuo account e preferenze
            </p>
            <div className="text-xs text-primary font-medium group-hover:underline">
              Vai alle impostazioni →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}