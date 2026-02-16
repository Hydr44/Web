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
import { motion } from "framer-motion";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useOptimizedAnimations } from "@/hooks/useOptimizedAnimations";
import { LoadingPage } from "@/components/ui/LoadingSpinner";

export default function DashboardPanoramica() {
  const [currentOrg, setCurrentOrg] = useState<string>("RescueManager");
  const [loading, setLoading] = useState(true);
  const [hasOrganization, setHasOrganization] = useState<boolean>(true);
  const [subscription, setSubscription] = useState({
    status: "active",
    plan: "Pro"
  });
  const animations = useOptimizedAnimations();

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

  return (
    <div className="space-y-6">
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

      {/* Info Card */}
      <div className="bg-gradient-to-br from-blue-600/10 to-emerald-600/10 rounded-xl p-6 border border-blue-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-100 mb-1">{currentOrg}</h2>
            <p className="text-sm text-slate-400 mb-3">
              Tutte le funzionalità operative sono disponibili nell'app desktop. Da qui puoi gestire il tuo abbonamento e scaricare l'applicazione.
            </p>
            <Link
              href="/dashboard/org"
              className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Visualizza dettagli organizzazione
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#1a2536] rounded-xl p-6 border border-[#243044]">
        <h2 className="text-base font-semibold text-slate-200 mb-4">Gestione Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/dashboard/billing" className="flex items-center p-4 rounded-lg border border-[#243044] hover:bg-[#243044]/50 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center mr-3">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-200 text-sm">Abbonamento e Fatturazione</p>
              <p className="text-xs text-slate-500">Gestisci piano e metodi di pagamento</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </Link>

          <Link href="/dashboard/download" className="flex items-center p-4 rounded-lg border border-[#243044] hover:bg-[#243044]/50 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center mr-3">
              <Download className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-200 text-sm">Download Applicazione</p>
              <p className="text-xs text-slate-500">Scarica app desktop e mobile</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </Link>

          <Link href="/dashboard/team" className="flex items-center p-4 rounded-lg border border-[#243044] hover:bg-[#243044]/50 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center mr-3">
              <Users className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-200 text-sm">Gestione Team</p>
              <p className="text-xs text-slate-500">Invita e gestisci membri</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </Link>

          <Link href="/dashboard/org" className="flex items-center p-4 rounded-lg border border-[#243044] hover:bg-[#243044]/50 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center mr-3">
              <Building2 className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-200 text-sm">Organizzazione</p>
              <p className="text-xs text-slate-500">Visualizza e modifica dati aziendali</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}