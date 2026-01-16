"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign,
  Activity,
  Mail,
  Calendar,
  BarChart3,
  PieChart,
  MapPin,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalOrgs: number;
  totalLeads: number;
  monthlyRevenue: number;
  userGrowth: number;
  leadConversion: number;
  activeUsers: number;
  newLeadsToday: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrgs: 0,
    totalLeads: 0,
    monthlyRevenue: 0,
    userGrowth: 0,
    leadConversion: 0,
    activeUsers: 0,
    newLeadsToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('[Staff Dashboard] Loading data...');
      
      // Fetch dashboard data from API
      const response = await fetch('/api/staff/dashboard');
      console.log('[Staff Dashboard] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Staff Dashboard] Response data:', data);
      
      if (data.success && data.stats) {
        console.log('[Staff Dashboard] Setting stats:', data.stats);
        setStats(data.stats);
      } else {
        console.error('[Staff Dashboard] API returned error:', data.error);
        // Imposta valori di default invece di lasciare tutto a 0
        setStats({
          totalUsers: 0,
          totalOrgs: 0,
          totalLeads: 0,
          monthlyRevenue: 0,
          userGrowth: 0,
          leadConversion: 0,
          activeUsers: 0,
          newLeadsToday: 0
        });
      }
    } catch (error: any) {
      console.error('[Staff Dashboard] Error loading dashboard data:', error);
      // Imposta valori di default in caso di errore
      setStats({
        totalUsers: 0,
        totalOrgs: 0,
        totalLeads: 0,
        monthlyRevenue: 0,
        userGrowth: 0,
        leadConversion: 0,
        activeUsers: 0,
        newLeadsToday: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Utenti Totali",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: stats.userGrowth,
      color: "blue"
    },
    {
      title: "Organizzazioni",
      value: stats.totalOrgs.toLocaleString(),
      icon: Building2,
      change: 12.5,
      color: "green"
    },
    {
      title: "Lead Generati",
      value: stats.totalLeads.toLocaleString(),
      icon: Mail,
      change: stats.leadConversion,
      color: "purple"
    },
    {
      title: "Revenue Mensile",
      value: `€${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: 8.2,
      color: "amber"
    }
  ];

  const quickActions = [
    {
      title: "Gestisci Utenti",
      description: "Visualizza e gestisci tutti gli utenti",
      icon: Users,
      href: "/staff/admin/users",
      color: "blue"
    },
    {
      title: "Organizzazioni",
      description: "Gestisci organizzazioni e membri",
      icon: Building2,
      href: "/staff/admin/organizations",
      color: "green"
    },
    {
      title: "Lead Management",
      description: "Gestisci lead e conversioni",
      icon: Mail,
      href: "/staff/marketing",
      color: "purple"
    },
    {
      title: "Analytics",
      description: "Visualizza metriche dettagliate",
      icon: BarChart3,
      href: "/staff/admin/analytics",
      color: "amber"
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Amministratore</h1>
          <p className="text-gray-600 mt-2">
            Panoramica completa del sistema e metriche chiave
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {[
              { label: "7 giorni", value: "7d" },
              { label: "30 giorni", value: "30d" },
              { label: "90 giorni", value: "90d" },
              { label: "1 anno", value: "1y" }
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    {stat.change >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ml-1 ${
                      stat.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {Math.abs(stat.change)}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs mese scorso</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Azioni Rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <motion.a
                key={action.title}
                href={action.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center mb-3">
                  <div className={`p-2 rounded-lg bg-${action.color}-50`}>
                    <action.icon className={`h-5 w-5 text-${action.color}-600`} />
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Utenti Recenti</h3>
              <a href="/staff/admin/users" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Visualizza tutti
              </a>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Utente {i}</p>
                    <p className="text-xs text-gray-500">Registrato 2 ore fa</p>
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Attivo
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Leads */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lead Recenti</h3>
              <a href="/staff/marketing" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Visualizza tutti
              </a>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Lead {i}</p>
                    <p className="text-xs text-gray-500">Da form contatti</p>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    Nuovo
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
