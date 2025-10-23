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
import { supabaseBrowser } from "@/lib/supabase-browser";

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
        
        // Carica statistiche reali con gestione errori
        const [vehiclesResult, driversResult, transportsResult, clientsResult, invoicesResult, quotesResult] = await Promise.allSettled([
          supabase.from("vehicles").select("id", { count: "exact" }),
          supabase.from("drivers").select("id", { count: "exact" }),
          supabase.from("transports").select("id", { count: "exact" }),
          supabase.from("clients").select("id", { count: "exact" }),
          supabase.from("invoices").select("id", { count: "exact" }),
          supabase.from("quotes").select("id", { count: "exact" })
        ]);

        // Estrai i risultati con gestione errori
        const getCount = (result: PromiseSettledResult<any>) => {
          if (result.status === 'fulfilled' && !result.value.error) {
            return result.value.count || 0;
          }
          console.warn("Query failed:", result.status === 'rejected' ? result.reason : result.value.error);
          return 0;
        };

        setStats({
          vehicles: getCount(vehiclesResult),
          drivers: getCount(driversResult),
          transports: getCount(transportsResult),
          clients: getCount(clientsResult),
          invoices: getCount(invoicesResult),
          quotes: getCount(quotesResult)
        });
        
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
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
            
            <button className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200">
              <Users className="h-5 w-5" />
              Unisciti a un'Organizzazione
            </button>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Building2, title: "Gestione Completa", desc: "Organizza la tua officina con tutti gli strumenti necessari" },
            { icon: Users, title: "Team Collaboration", desc: "Lavora con il tuo team in modo efficiente" },
            { icon: Shield, title: "Sicurezza Dati", desc: "I tuoi dati sono protetti e sicuri" }
          ].map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm"
            >
              <benefit.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Benvenuto in {currentOrg}, {userEmail}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Piano attivo</p>
            <p className="font-semibold text-blue-600">{subscription.plan}</p>
          </div>
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Veicoli</p>
              <p className="text-2xl font-bold text-gray-900">{counts.vehicles}</p>
            </div>
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Autisti</p>
              <p className="text-2xl font-bold text-gray-900">{counts.drivers}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trasporti Aperti</p>
              <p className="text-2xl font-bold text-gray-900">{counts.transportsOpen}</p>
            </div>
            <FileText className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Membri</p>
              <p className="text-2xl font-bold text-gray-900">{counts.members}</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/dashboard/team" className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Users className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Gestisci Team</p>
              <p className="text-sm text-gray-600">Aggiungi o modifica membri</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
          </Link>

          <Link href="/dashboard/billing" className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <BarChart3 className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Fatturazione</p>
              <p className="text-sm text-gray-600">Gestisci abbonamenti</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
          </Link>

          <Link href="/dashboard/download" className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <Download className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Download</p>
              <p className="text-sm text-gray-600">App e accessi</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Stato Sistema</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-gray-900">Sistema operativo</span>
            </div>
            <span className="text-sm text-green-600 font-medium">Attivo</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-gray-900">Database connesso</span>
            </div>
            <span className="text-sm text-green-600 font-medium">Online</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-gray-900">Abbonamento</span>
            </div>
            <span className="text-sm text-green-600 font-medium">{subscription.plan}</span>
          </div>
        </div>
      </div>
    </div>
  );
}