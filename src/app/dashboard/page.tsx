"use client";

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
  Download,
  Building2
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOptimizedAnimations } from "@/hooks/useOptimizedAnimations";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { LoadingPage } from "@/components/ui/LoadingSpinner";

export default function DashboardPanoramica() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [currentOrg, setCurrentOrg] = useState<string>("RescueManager");
  const [loading, setLoading] = useState(true);
  const [hasOrganization, setHasOrganization] = useState<boolean>(true);
  const [stats, setStats] = useState({
    vehicles: 0,
    drivers: 0,
    transports: 0,
    clients: 0,
    invoices: 0,
    quotes: 0
  });
  const animations = useOptimizedAnimations();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const supabase = supabaseBrowser();
        
        // Ottieni l'utente corrente
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setUserEmail("Utente");
          setCurrentOrg("RescueManager");
          setLoading(false);
          return;
        }
        
        setUserEmail(user.email || "");
        
        // Controlla se l'utente ha un'organizzazione
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
        
        // Carica nome organizzazione
        const { data: org } = await supabase
          .from("orgs")
          .select("name")
          .eq("id", profile.current_org)
          .single();
        
        setCurrentOrg(org?.name || "Organizzazione");
        
        console.log("Loading stats for org:", profile.current_org, "org name:", org?.name);
        
        // Carica statistiche reali con gestione errori - FILTRATE PER ORG_ID
        const [vehiclesResult, driversResult, transportsResult, clientsResult, invoicesResult, quotesResult] = await Promise.allSettled([
          supabase.from("vehicles").select("id", { count: "exact" }).eq("org_id", profile.current_org),
          supabase.from("drivers").select("id", { count: "exact" }).eq("org_id", profile.current_org),
          supabase.from("transports").select("id", { count: "exact" }).eq("org_id", profile.current_org),
          supabase.from("clients").select("id", { count: "exact" }).eq("org_id", profile.current_org),
          supabase.from("invoices").select("id", { count: "exact" }).eq("org_id", profile.current_org),
          supabase.from("quotes").select("id", { count: "exact" }).eq("org_id", profile.current_org)
        ]);

        // Estrai i risultati con gestione errori
        const getCount = (result: PromiseSettledResult<any>) => {
          if (result.status === 'fulfilled' && !result.value.error) {
            return result.value.count || 0;
          }
          console.warn("Query failed:", result.status === 'rejected' ? result.reason : result.value.error);
          return 0;
        };

        const finalStats = {
          vehicles: getCount(vehiclesResult),
          drivers: getCount(driversResult),
          transports: getCount(transportsResult),
          clients: getCount(clientsResult),
          invoices: getCount(invoicesResult),
          quotes: getCount(quotesResult)
        };
        
        console.log("Final stats loaded:", finalStats);
        setStats(finalStats);
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setUserEmail("Utente");
        setCurrentOrg("RescueManager");
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingPage text="Caricamento dashboard..." />;
  }

  // Se l'utente non ha organizzazione, mostra messaggio
  if (!hasOrganization) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-8 w-8 text-yellow-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Benvenuto in RescueManager!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Per iniziare a utilizzare RescueManager, devi prima creare o unirti a un'organizzazione.
            Questo ti permetterà di gestire la tua officina e i tuoi dati in modo sicuro.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard/create-org"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <Building2 className="h-5 w-5" />
              Crea Organizzazione
              <ArrowRight className="h-4 w-4" />
            </Link>
            
            <button className="inline-flex items-center gap-2 px-6 py-3 border border-[#243044] text-slate-300 font-semibold rounded-xl hover:bg-[#1a2536] transition-all duration-200">
              <Users className="h-5 w-5" />
              Unisciti a un'Organizzazione
            </button>
          </div>
        </div>

        {/* Benefits */}
        <motion.div 
          {...animations.staggerContainer}
          className="grid md:grid-cols-3 gap-6"
        >
          {[
            { icon: Building2, title: "Gestione Completa", desc: "Organizza la tua officina con tutti gli strumenti necessari" },
            { icon: Users, title: "Team Collaboration", desc: "Lavora con il tuo team in modo efficiente" },
            { icon: Shield, title: "Sicurezza Dati", desc: "I tuoi dati sono protetti e sicuri" }
          ].map((benefit, i) => (
            <motion.div
              key={benefit.title}
              {...animations.staggerItem}
              className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]"
            >
              <benefit.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-slate-100 mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  // Dati reali dal database
  const subscription = {
    status: "active",
    plan: "Pro",
    renewAt: "31/12/2024"
  };

  const counts = {
    vehicles: stats.vehicles,
    drivers: stats.drivers,
    transportsOpen: stats.transports,
    members: stats.clients
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Benvenuto in {currentOrg}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-xs text-slate-500">Piano attivo</p>
            <p className="font-semibold text-emerald-400">{subscription.plan}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Veicoli", value: counts.vehicles, icon: Truck, color: "blue", border: "border-l-blue-500" },
          { label: "Autisti", value: counts.drivers, icon: Users, color: "emerald", border: "border-l-emerald-500" },
          { label: "Trasporti", value: counts.transportsOpen, icon: FileText, color: "amber", border: "border-l-amber-500" },
          { label: "Clienti", value: counts.members, icon: Users, color: "purple", border: "border-l-purple-500" },
        ].map((card) => (
          <div key={card.label} className={`bg-[#1a2536] rounded-xl p-5 border border-[#243044] ${card.border} border-l-4 hover:border-l-4 transition-all duration-200`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</p>
                <p className="text-2xl font-semibold text-slate-100 mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-${card.color}-500/15 flex items-center justify-center`}>
                <card.icon className={`h-5 w-5 text-${card.color}-400`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-[#1a2536] rounded-xl p-6 border border-[#243044]">
        <h2 className="text-base font-semibold text-slate-200 mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link href="/dashboard/team" className="flex items-center p-4 rounded-lg border border-[#243044] hover:bg-[#243044]/50 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center mr-3">
              <Users className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-200 text-sm">Gestisci Team</p>
              <p className="text-xs text-slate-500">Aggiungi o modifica membri</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </Link>

          <Link href="/dashboard/billing" className="flex items-center p-4 rounded-lg border border-[#243044] hover:bg-[#243044]/50 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center mr-3">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-200 text-sm">Fatturazione</p>
              <p className="text-xs text-slate-500">Gestisci abbonamenti</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </Link>

          <Link href="/dashboard/download" className="flex items-center p-4 rounded-lg border border-[#243044] hover:bg-[#243044]/50 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center mr-3">
              <Download className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-200 text-sm">Download</p>
              <p className="text-xs text-slate-500">App e accessi</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Status */}
      <div className="bg-[#1a2536] rounded-xl p-6 border border-[#243044]">
        <h2 className="text-base font-semibold text-slate-200 mb-4">Stato Sistema</h2>
        <div className="space-y-3">
          {[
            { label: "Sistema operativo", status: "Attivo" },
            { label: "Database connesso", status: "Online" },
            { label: "Abbonamento", status: subscription.plan },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-slate-300">{item.label}</span>
              </div>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}