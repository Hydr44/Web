"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  FileText,
  Users,
  Calendar,
  Edit,
  Zap,
  Settings,
  BarChart3,
  Shield,
  CreditCard
} from "lucide-react";

export default function OrgPage() {
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalVehicles: 0,
    totalTransports: 0,
    activeTransports: 0
  });

  useEffect(() => {
    const loadOrgData = async () => {
      try {
        const supabase = supabaseBrowser();
        
        // Ottieni l'utente corrente
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }
        
        // Carica dati organizzazione dell'utente corrente
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_org")
          .eq("id", user.id)
          .single();
        
        if (profile?.current_org) {
          // Carica dati organizzazione
          const { data: org, error: orgError } = await supabase
            .from("orgs")
            .select("*")
            .eq("id", profile.current_org)
            .single();
          
          if (orgError) {
            console.warn("Errore caricamento organizzazione:", orgError);
          } else if (org) {
            setOrgData(org);
          }

          // Carica statistiche reali
          const [membersResult, vehiclesResult, transportsResult] = await Promise.allSettled([
            supabase
              .from("org_members")
              .select("user_id", { count: "exact" })
              .eq("org_id", profile.current_org),
            supabase
              .from("vehicles")
              .select("id", { count: "exact" })
              .eq("org_id", profile.current_org),
            supabase
              .from("transports")
              .select("id, status", { count: "exact" })
              .eq("org_id", profile.current_org)
          ]);

          const membersCount = membersResult.status === "fulfilled" ? membersResult.value.count || 0 : 0;
          const vehiclesCount = vehiclesResult.status === "fulfilled" ? vehiclesResult.value.count || 0 : 0;
          const transportsCount = transportsResult.status === "fulfilled" ? transportsResult.value.count || 0 : 0;
          const activeTransportsCount = transportsResult.status === "fulfilled" 
            ? (transportsResult.value.data?.filter(t => t.status === "enroute" || t.status === "assigned").length || 0) 
            : 0;

          setStats({
            totalMembers: membersCount,
            totalVehicles: vehiclesCount,
            totalTransports: transportsCount,
            activeTransports: activeTransportsCount
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading org data:", error);
        setLoading(false);
      }
    };

    loadOrgData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center lg:text-left">
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <Building2 className="h-4 w-4" />
          Informazioni Azienda
        </div>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-4">
              La tua <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">azienda</span>
            </h1>
            
            <p className="text-lg text-slate-400 max-w-2xl">
              Gestisci le informazioni della tua azienda, i contatti e i dettagli fiscali per una gestione completa.
            </p>
          </div>
          
          {orgData && (
            <div className="flex gap-3">
              <Link
                href="/dashboard/org/edit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium"
              >
                <Edit className="h-4 w-4" />
                Modifica
              </Link>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a2536] border border-[#243044] text-slate-300 rounded-xl hover:border-primary/30 hover:shadow-md transition-all duration-200 font-medium">
                <FileText className="h-4 w-4" />
                Esporta
              </button>
            </div>
          )}
        </div>
      </header>

      {orgData ? (
        <>
          {/* Informazioni principali */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Dettagli azienda */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 border border-[#243044] shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Informazioni Principali</h3>
                  <p className="text-sm text-slate-400">Dati aziendali</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Nome Azienda</label>
                  <div className="mt-1 p-3 rounded-lg bg-[#141c27] border border-[#243044]">
                    {orgData.name || "Non specificato"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">Partita IVA</label>
                  <div className="mt-1 p-3 rounded-lg bg-[#141c27] border border-[#243044]">
                    {orgData.vat_number || "Non specificato"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">Codice Fiscale</label>
                  <div className="mt-1 p-3 rounded-lg bg-[#141c27] border border-[#243044]">
                    {orgData.fiscal_code || "Non specificato"}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">Settore</label>
                  <div className="mt-1 p-3 rounded-lg bg-[#141c27] border border-[#243044]">
                    {orgData.sector || "Non specificato"}
                  </div>
                </div>
              </div>
            </div>

            {/* Contatti */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Contatti</h3>
                  <p className="text-sm text-slate-400">Informazioni di contatto</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a2536] border border-[#243044]">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/100/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-100">Indirizzo</div>
                    <div className="text-xs text-slate-400">
                      {orgData.address || "Non specificato"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a2536] border border-[#243044]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/100/10 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-100">Telefono</div>
                    <div className="text-xs text-slate-400">
                      {orgData.phone || "Non specificato"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a2536] border border-[#243044]">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-100">Email</div>
                    <div className="text-xs text-slate-400">
                      {orgData.email || "Non specificato"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a2536] border border-[#243044]">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-100">Sito Web</div>
                    <div className="text-xs text-slate-400">
                      {orgData.website || "Non specificato"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiche e informazioni aggiuntive */}
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-gray-50/50 border border-[#243044] shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Membri</h3>
                  <p className="text-sm text-slate-400">Team attivo</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-100 mb-2">
                {stats.totalMembers}
              </div>
              <Link 
                href="/dashboard/org/members"
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Gestisci membri →
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Creata il</h3>
                  <p className="text-sm text-slate-400">Data di registrazione</p>
                </div>
              </div>
              <div className="text-sm font-medium text-slate-100">
                {orgData.created_at ? new Date(orgData.created_at).toLocaleDateString('it-IT') : "Non disponibile"}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Stato</h3>
                  <p className="text-sm text-slate-400">Organizzazione</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500/100"></div>
                <span className="text-sm font-medium text-slate-100">Attiva</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-green-50/30 border border-emerald-500/20/50 shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Attività</h3>
                  <p className="text-sm text-slate-400">Ultimi 30 giorni</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-100">
                {stats.activeTransports}
              </div>
              <div className="text-sm text-emerald-400 font-medium">
                Trasporti in corso
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Gestione Azienda */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 via-white to-blue-50/30 border border-primary/20 shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
                  <Edit className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Gestione Azienda</h3>
                  <p className="text-sm text-slate-400">Modifica le informazioni aziendali</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard/org/edit"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white font-medium hover:shadow-lg shadow-black/20 transition-all duration-200"
                >
                  <Edit className="h-4 w-4" />
                  Modifica informazioni
                </Link>
                <Link
                  href="/dashboard/org/settings"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a2536] border border-[#243044] text-slate-300 font-medium hover:border-primary/30 hover:shadow-md transition-all duration-200"
                >
                  <Settings className="h-4 w-4" />
                  Impostazioni
                </Link>
              </div>
              
              <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-medium text-blue-900 mb-2">Impostazioni Avanzate</h4>
                <p className="text-sm text-blue-400 mb-3">
                  Per sicurezza e fatturazione, utilizza le impostazioni globali
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/dashboard/settings/security"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a2536] border border-blue-500/20 text-blue-400 text-sm font-medium hover:border-blue-300 hover: transition-all duration-200"
                  >
                    <Shield className="h-4 w-4" />
                    Sicurezza
                  </Link>
                  <Link
                    href="/dashboard/billing"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a2536] border border-blue-500/20 text-blue-400 text-sm font-medium hover:border-blue-300 hover: transition-all duration-200"
                  >
                    <CreditCard className="h-4 w-4" />
                    Fatturazione
                  </Link>
                </div>
              </div>
            </div>

            {/* Analytics e Report */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-green-50/50 via-white to-emerald-50/30 border border-emerald-500/20/50 shadow-lg shadow-black/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Analytics</h3>
                  <p className="text-sm text-slate-400">Monitora le performance</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard/org/analytics"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:shadow-lg shadow-black/20 transition-all duration-200"
                >
                  <BarChart3 className="h-4 w-4" />
                  Visualizza Analytics
                </Link>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a2536] border border-[#243044] text-slate-300 font-medium hover:border-green-300 hover:shadow-md transition-all duration-200">
                  <FileText className="h-4 w-4" />
                  Esporta Report
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-[#1a2536] flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-100 mb-2">Nessuna organizzazione trovata</h3>
          <p className="text-sm text-slate-400 mb-4">Crea o seleziona un&apos;organizzazione per gestire le informazioni aziendali</p>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-sm font-medium hover:shadow-lg shadow-black/20 transition-all duration-200">
            <Building2 className="h-4 w-4" />
            Crea organizzazione
          </button>
        </div>
      )}
    </div>
  );
}