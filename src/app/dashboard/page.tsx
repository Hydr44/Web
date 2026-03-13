"use client";

import Link from "next/link";
import { 
  ArrowRight,
  BarChart3,
  Download,
  Building2,
  CreditCard,
  Shield as ShieldIcon,
  HeadphonesIcon,
  Settings,
  Bell
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { LoadingPage } from "@/components/ui/LoadingSpinner";

export default function DashboardPanoramica() {
  const [currentOrg, setCurrentOrg] = useState<string>("RescueManager");
  const [loading, setLoading] = useState(true);
  const [hasOrganization, setHasOrganization] = useState<boolean>(true);
  const [subscription, setSubscription] = useState({
    status: "active",
    plan: "Pro",
    renewalDate: null as string | null,
  });
  const [activeModules, setActiveModules] = useState<string[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const supabase = supabaseBrowser();
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setCurrentOrg("RescueManager");
          setLoading(false);
          return;
        }
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_org")
          .eq("id", user.id)
          .single();
        
        if (!profile?.current_org) {
          setHasOrganization(false);
          setCurrentOrg("Nessuna organizzazione");
          setLoading(false);
          return;
        }
        
        const { data: org } = await supabase
          .from("orgs")
          .select("name")
          .eq("id", profile.current_org)
          .single();
        
        setCurrentOrg(org?.name || "Organizzazione");
        
        // Carica info abbonamento
        const { data: sub } = await supabase
          .from("org_subscriptions")
          .select("status, plan_name, current_period_end")
          .eq("org_id", profile.current_org)
          .single();
        
        if (sub) {
          setSubscription({
            status: sub.status || "active",
            plan: sub.plan_name || "Pro",
            renewalDate: sub.current_period_end 
              ? new Date(sub.current_period_end).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
              : null,
          });
        }

        // Carica moduli attivi
        const { data: mods } = await supabase
          .from("org_modules")
          .select("module")
          .eq("org_id", profile.current_org)
          .eq("status", "active");
        
        if (mods) {
          setActiveModules(mods.map(m => m.module));
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setCurrentOrg("RescueManager");
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="w-64 h-4 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Abbonamento Skeleton */}
        <div className="p-6 border border-gray-100 bg-white">
          <div className="w-32 h-3 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex items-center gap-3">
             <div className="w-40 h-6 bg-gray-200 rounded animate-pulse" />
             <div className="w-16 h-5 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="w-48 h-3 bg-gray-100 rounded animate-pulse mt-3" />
        </div>

        {/* Org Skeleton */}
        <div className="p-6 border border-gray-100 bg-white flex gap-4 items-center">
          <div className="w-10 h-10 bg-gray-100 rounded animate-pulse" />
          <div className="space-y-2 flex-1">
             <div className="w-1/3 h-5 bg-gray-200 rounded animate-pulse" />
             <div className="w-1/2 h-3 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        
        {/* Grid Skeletons */}
        <div>
          <div className="w-32 h-3 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border border-gray-100 bg-white flex items-center">
                <div className="w-9 h-9 bg-gray-100 rounded animate-pulse mr-3" />
                <div className="space-y-2 flex-1">
                  <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-3/4 h-3 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasOrganization) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xl border border-blue-100 mx-auto mb-6">
            <Building2 className="h-6 w-6 " />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Benvenuto in RescueManager!
          </h1>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Per iniziare, crea la tua organizzazione. Ti permetterà di gestire la tua attività.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/create-org"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600  font-bold text-sm hover:bg-blue-700 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Crea Organizzazione
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Benvenuto in {currentOrg}</p>
      </div>

      {/* Riepilogo Abbonamento */}
      <div className="p-6 border border-gray-200 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Abbonamento</h2>
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold text-gray-900">Piano {subscription.plan}</p>
              <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${
                subscription.status === "active" 
                  ? "text-blue-600 bg-blue-50 border border-blue-200" 
                  : "text-amber-600 bg-amber-50 border border-amber-200"
              }`}>
                {subscription.status === "active" ? "Attivo" : subscription.status === "trial" ? "Trial" : subscription.status}
              </span>
            </div>
            {subscription.renewalDate && (
              <p className="text-sm text-gray-400 mt-1">Rinnovo: {subscription.renewalDate}</p>
            )}
          </div>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1 text-sm text-blue-600 font-bold hover:underline"
          >
            Gestisci <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Moduli attivi */}
        {activeModules.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Moduli Attivi</p>
            <div className="flex flex-wrap gap-2">
              {activeModules.map((mod) => (
                <span key={mod} className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-200">
                  {mod.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info organizzazione */}
      <div className="p-6 border border-gray-200 bg-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-50 flex items-center justify-center border border-blue-200 shrink-0">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 mb-1">{currentOrg}</h2>
            <p className="text-sm text-gray-500 mb-3">
              Le funzionalità operative sono nell&apos;app desktop. Da qui gestisci abbonamento, supporto e download.
            </p>
            <Link
              href="/dashboard/org"
              className="inline-flex items-center gap-1 text-sm text-blue-600 font-bold hover:underline"
            >
              Dettagli organizzazione <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Link rapidi */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Gestione Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { href: "/dashboard/billing", icon: CreditCard, title: "Abbonamento e Fatturazione", desc: "Gestisci piano e metodi di pagamento" },
            { href: "/dashboard/download", icon: Download, title: "Download Applicazione", desc: "Scarica app desktop e mobile" },
            { href: "/dashboard/support", icon: HeadphonesIcon, title: "Supporto", desc: "Richiedi assistenza tecnica" },
            { href: "/dashboard/org", icon: Building2, title: "Organizzazione", desc: "Visualizza e modifica dati aziendali" },
            { href: "/dashboard/security", icon: ShieldIcon, title: "Sicurezza", desc: "Password, 2FA e sessioni attive" },
            { href: "/dashboard/settings", icon: Settings, title: "Impostazioni", desc: "Preferenze account e notifiche" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center p-4 border border-gray-200 bg-white hover:bg-gray-50 transition-colors group">
              <div className="w-9 h-9 flex items-center justify-center mr-3 bg-gray-50 border border-gray-200">
                <a.icon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">{a.title}</p>
                <p className="text-xs text-gray-400">{a.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}