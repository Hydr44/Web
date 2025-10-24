"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  Settings, 
  Users, 
  Building2, 
  CreditCard, 
  BarChart3, 
  Shield, 
  Database, 
  Server, 
  Globe, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Activity, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  RefreshCw
} from "lucide-react";

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrgs: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    systemHealth: "healthy",
    lastBackup: "2024-01-15T10:30:00Z"
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const supabase = supabaseBrowser();
        
        // Carica statistiche del sistema
        const [usersResult, orgsResult, subscriptionsResult] = await Promise.allSettled([
          supabase
            .from("profiles")
            .select("id", { count: "exact" }),
          supabase
            .from("orgs")
            .select("id", { count: "exact" }),
          supabase
            .from("subscriptions")
            .select("id, status", { count: "exact" })
        ]);

        const totalUsers = usersResult.status === "fulfilled" ? usersResult.value.count || 0 : 0;
        const totalOrgs = orgsResult.status === "fulfilled" ? orgsResult.value.count || 0 : 0;
        const activeSubscriptions = subscriptionsResult.status === "fulfilled" 
          ? (subscriptionsResult.value.data?.filter(s => s.status === "active").length || 0) 
          : 0;

        setStats({
          totalUsers,
          totalOrgs,
          activeSubscriptions,
          totalRevenue: 0, // Da calcolare da Stripe
          systemHealth: "healthy",
          lastBackup: new Date().toISOString()
        });

        // Mock data per attività recenti
        setRecentActivity([
          {
            id: "activity_1",
            type: "user_signup",
            user: "Mario Rossi",
            timestamp: "2024-01-15T10:30:00Z",
            description: "Nuovo utente registrato"
          },
          {
            id: "activity_2",
            type: "org_created",
            user: "Giulia Bianchi",
            timestamp: "2024-01-15T09:15:00Z",
            description: "Organizzazione creata"
          },
          {
            id: "activity_3",
            type: "subscription_created",
            user: "Alessandro Verdi",
            timestamp: "2024-01-15T08:45:00Z",
            description: "Abbonamento attivato"
          }
        ]);

        // Mock data per alert di sistema
        setSystemAlerts([
          {
            id: "alert_1",
            type: "warning",
            title: "Backup in ritardo",
            description: "L'ultimo backup è stato eseguito 2 giorni fa",
            timestamp: "2024-01-13T10:30:00Z"
          },
          {
            id: "alert_2",
            type: "info",
            title: "Aggiornamento disponibile",
            description: "Nuova versione del sistema disponibile",
            timestamp: "2024-01-14T15:20:00Z"
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading admin data:", error);
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_signup":
        return <Users className="h-4 w-4 text-green-600" />;
      case "org_created":
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case "subscription_created":
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      case "info":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

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
      <header>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-4 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
              <Settings className="h-4 w-4" />
              Pannello Amministratore
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Controllo <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Sistema</span>
            </h1>
            <p className="text-lg text-gray-600">
              Gestisci utenti, organizzazioni e monitora il sistema
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200">
              <RefreshCw className="h-4 w-4" />
              Aggiorna
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200">
              <Download className="h-4 w-4" />
              Report
            </button>
          </div>
        </div>
      </header>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Utenti</h3>
              <p className="text-sm text-gray-600">Totale registrati</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalUsers}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Organizzazioni</h3>
              <p className="text-sm text-gray-600">Aziende attive</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalOrgs}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Abbonamenti</h3>
              <p className="text-sm text-gray-600">Attivi</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.activeSubscriptions}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-orange-50/30 border border-orange-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ricavi</h3>
              <p className="text-sm text-gray-600">Questo mese</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            €{stats.totalRevenue.toLocaleString()}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sistema</h3>
              <p className="text-sm text-gray-600">Stato</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-gray-900">Sano</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Attività Recente</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{activity.user}</h4>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('it-IT')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Alert Sistema</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {systemAlerts.map((alert) => (
              <div key={alert.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    {getAlertIcon(alert.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getAlertColor(alert.type)}`}>
                        {alert.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString('it-IT')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-6">
        <Link
          href="/staff/admin/users"
          className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gestione Utenti</h3>
              <p className="text-sm text-gray-600">Amministra utenti</p>
            </div>
          </div>
        </Link>

        <Link
          href="/staff/admin/organizations"
          className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Organizzazioni</h3>
              <p className="text-sm text-gray-600">Gestisci aziende</p>
            </div>
          </div>
        </Link>

        <Link
          href="/staff/admin/billing"
          className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Fatturazione</h3>
              <p className="text-sm text-gray-600">Gestisci abbonamenti</p>
            </div>
          </div>
        </Link>

        <Link
          href="/staff/admin/system"
          className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sistema</h3>
              <p className="text-sm text-gray-600">Configurazioni</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
