"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staffAuth, StaffUser } from "@/lib/staff-auth-client";
import { staffData } from "@/lib/staff-data-real";
import { 
  Users, 
  Building2,
  BarChart3,
  Mail,
  Settings,
  Shield,
  UserPlus,
  Activity,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
  Bell,
  Database
} from "lucide-react";

export default function AdminOverviewPage() {
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaffUsers();
  }, []);

  const loadStaffUsers = async () => {
    try {
      setLoading(true);
      console.log('[Staff Overview] Loading users...');
      const users = await staffData.getUsers();
      console.log('[Staff Overview] Loaded users:', users.length);
      setStaffUsers(users);
    } catch (error: any) {
      console.error('[Staff Overview] Error loading staff users:', error);
      setStaffUsers([]); // Assicurati che sia un array vuoto
    } finally {
      setLoading(false);
    }
  };

  const adminSections = [
    {
      title: "Dashboard",
      description: "Panoramica generale del sistema",
      icon: BarChart3,
      href: "/staff/admin/dashboard",
      color: "blue",
      stats: "Metriche chiave"
    },
    {
      title: "Gestione Utenti",
      description: "Gestisci tutti gli utenti dell'app",
      icon: Users,
      href: "/staff/admin/users",
      color: "green",
      stats: `${staffUsers.length} staff attivi`
    },
    {
      title: "Organizzazioni",
      description: "Gestisci organizzazioni e membri",
      icon: Building2,
      href: "/staff/admin/organizations",
      color: "purple",
      stats: "Gestione team"
    },
    {
      title: "Lead Management",
      description: "Gestisci lead e conversioni",
      icon: Mail,
      href: "/staff/marketing",
      color: "amber",
      stats: "Marketing e vendite"
    },
    {
      title: "Analytics",
      description: "Metriche e report dettagliati",
      icon: TrendingUp,
      href: "/staff/admin/analytics",
      color: "red",
      stats: "Analisi avanzate"
    },
    {
      title: "Staff Management",
      description: "Gestisci team staff",
      icon: Shield,
      href: "/staff/admin/staff",
      color: "indigo",
      stats: `${staffUsers.length} membri staff`
    }
  ];

  const quickActions = [
    {
      title: "Crea Nuovo Staff",
      description: "Aggiungi nuovo membro del team",
      icon: UserPlus,
      href: "/staff/admin/staff/create",
      color: "blue"
    },
    {
      title: "Visualizza Report",
      description: "Genera report dettagliati",
      icon: FileText,
      href: "/staff/admin/reports",
      color: "green"
    },
    {
      title: "Impostazioni Sistema",
      description: "Configurazione avanzata",
      icon: Settings,
      href: "/staff/admin/settings",
      color: "gray"
    },
    {
      title: "Notifiche",
      description: "Gestisci notifiche globali",
      icon: Bell,
      href: "/staff/admin/notifications",
      color: "yellow"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pannello Amministratore</h1>
          <p className="text-gray-600 mt-2">
            Centro di controllo completo per la gestione del sistema
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Staff Attivi</p>
                <p className="text-2xl font-bold text-gray-900">{staffUsers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Amministratori</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staffUsers.filter(u => u.is_admin).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sistema</p>
                <p className="text-2xl font-bold text-gray-900">Online</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-amber-50 rounded-lg">
                <Database className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Database</p>
                <p className="text-2xl font-bold text-gray-900">Attivo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Sections */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sezioni Principali</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminSections.map((section, index) => (
              <motion.a
                key={section.title}
                href={section.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${section.color}-50 group-hover:bg-${section.color}-100 transition-colors`}>
                    <section.icon className={`h-6 w-6 text-${section.color}-600`} />
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {section.stats}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-600">{section.description}</p>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Azioni Rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.a
                key={action.title}
                href={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-center mb-3">
                  <div className={`p-2 rounded-lg bg-${action.color}-50 group-hover:bg-${action.color}-100 transition-colors`}>
                    <action.icon className={`h-5 w-5 text-${action.color}-600`} />
                  </div>
                </div>
                <h3 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attività Recente</h3>
          <div className="space-y-3">
            {[
              { action: "Nuovo utente staff creato", user: "Admin", time: "2 minuti fa" },
              { action: "Lead convertito in cliente", user: "Marketing", time: "15 minuti fa" },
              { action: "Organizzazione aggiornata", user: "Admin", time: "1 ora fa" },
              { action: "Report generato", user: "Analytics", time: "2 ore fa" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 py-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">da {activity.user} • {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
