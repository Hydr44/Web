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
  Download
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function DashboardPanoramica() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [currentOrg, setCurrentOrg] = useState<string>("RescueManager");
  const [loading, setLoading] = useState(true);
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
        setCurrentOrg("RescueManager");
        
        // Carica statistiche reali
        const [vehiclesResult, driversResult, transportsResult, clientsResult, invoicesResult, quotesResult] = await Promise.all([
          supabase.from("vehicles").select("id", { count: "exact" }),
          supabase.from("drivers").select("id", { count: "exact" }),
          supabase.from("transports").select("id", { count: "exact" }),
          supabase.from("clients").select("id", { count: "exact" }),
          supabase.from("invoices").select("id", { count: "exact" }),
          supabase.from("quotes").select("id", { count: "exact" })
        ]);

        setStats({
          vehicles: vehiclesResult.count || 0,
          drivers: driversResult.count || 0,
          transports: transportsResult.count || 0,
          clients: clientsResult.count || 0,
          invoices: invoicesResult.count || 0,
          quotes: quotesResult.count || 0
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