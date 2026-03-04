"use client";

import Link from "next/link";
import { 
  Users, 
  ArrowRight,
  Shield,
  BarChart3,
  Download,
  Building2
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
    plan: "Pro"
  });
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
          .select("status, plan_name")
          .eq("org_id", profile.current_org)
          .single();
        
        if (sub) {
          setSubscription({
            status: sub.status || "active",
            plan: sub.plan_name || "Pro"
          });
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
    return <LoadingPage text="Caricamento dashboard..." />;
  }

  if (!hasOrganization) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-blue-600 flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Benvenuto in RescueManager!
          </h1>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Per iniziare, crea la tua organizzazione. Ti permetterà di gestire la tua officina.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard/create-org"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Crea Organizzazione
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors">
              <Users className="h-4 w-4" />
              Unisciti a un&apos;Organizzazione
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Building2, title: "Gestione Completa", desc: "Organizza la tua officina con tutti gli strumenti necessari" },
            { icon: Users, title: "Team", desc: "Lavora con il tuo team in modo efficiente" },
            { icon: Shield, title: "Sicurezza Dati", desc: "I tuoi dati sono protetti e sicuri" }
          ].map((b) => (
            <div key={b.title} className="p-6 border border-gray-200 bg-white">
              <b.icon className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="font-bold text-gray-900 text-sm mb-1">{b.title}</h3>
              <p className="text-gray-500 text-xs">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Benvenuto in {currentOrg}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Piano</p>
            <p className="font-bold text-green-600 text-sm">{subscription.plan}</p>
          </div>
          <div className="w-9 h-9 bg-green-50 flex items-center justify-center border border-green-200">
            <Shield className="h-4 w-4 text-green-600" />
          </div>
        </div>
      </div>

      <div className="p-6 border border-gray-200 bg-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-50 flex items-center justify-center border border-blue-200 shrink-0">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 mb-1">{currentOrg}</h2>
            <p className="text-sm text-gray-500 mb-3">
              Le funzionalità operative sono nell&apos;app desktop. Da qui gestisci abbonamento e download.
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

      <div>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Gestione Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { href: "/dashboard/billing", icon: BarChart3, color: "text-green-600 bg-green-50 border-green-200", title: "Abbonamento e Fatturazione", desc: "Gestisci piano e metodi di pagamento" },
            { href: "/dashboard/download", icon: Download, color: "text-blue-600 bg-blue-50 border-blue-200", title: "Download Applicazione", desc: "Scarica app desktop e mobile" },
            { href: "/dashboard/team", icon: Users, color: "text-purple-600 bg-purple-50 border-purple-200", title: "Gestione Team", desc: "Invita e gestisci membri" },
            { href: "/dashboard/org", icon: Building2, color: "text-amber-600 bg-amber-50 border-amber-200", title: "Organizzazione", desc: "Visualizza e modifica dati aziendali" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center p-4 border border-gray-200 bg-white hover:bg-gray-50 transition-colors group">
              <div className={`w-9 h-9 flex items-center justify-center mr-3 border ${a.color}`}>
                <a.icon className="h-4 w-4" />
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