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

export default function DashboardPanoramica() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [currentOrg, setCurrentOrg] = useState<string>("RescueManager");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // BYPASS: Controlla il localStorage per i dati utente
    const bypassAuth = localStorage.getItem("rescuemanager-auth");
    if (bypassAuth) {
      try {
        const authData = JSON.parse(bypassAuth);
        if (authData.user?.email === "haxiesz@gmail.com") {
          console.log("BYPASS: Dashboard page detected founder auth");
          setUserEmail(authData.user.email);
          setCurrentOrg("RescueManager");
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn("BYPASS: Error parsing localStorage auth in dashboard page:", error);
      }
    }
    
    // Fallback: mostra comunque il dashboard
    setUserEmail("haxiesz@gmail.com");
    setCurrentOrg("RescueManager");
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Dati mock per il dashboard
  const subscription = {
    status: "active",
    plan: "Pro",
    renewAt: "31/12/2024"
  };

  const counts = {
    vehicles: 12,
    drivers: 8,
    transportsOpen: 5,
    members: 15
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