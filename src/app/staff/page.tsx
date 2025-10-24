"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Building2, 
  Target, 
  BarChart3, 
  CreditCard, 
  Shield, 
  Database, 
  Server, 
  Globe, 
  Zap, 
  TrendingUp, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight
} from "lucide-react";

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    totalUsers: 0,
    totalOrgs: 0,
    activeSubscriptions: 0,
    systemHealth: "healthy"
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Mock data per ora
        setStats({
          totalLeads: 24,
          newLeads: 8,
          totalUsers: 156,
          totalOrgs: 42,
          activeSubscriptions: 38,
          systemHealth: "healthy"
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading stats:", error);
        setLoading(false);
      }
    };

    loadStats();
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
      <header>
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <Zap className="h-4 w-4" />
          Staff Dashboard
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Benvenuto nello <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Staff Panel</span>
        </h1>
        <p className="text-lg text-gray-600">
          Gestisci lead, utenti e monitora il sistema
        </p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Lead Totali</h3>
              <p className="text-sm text-gray-600">Richieste demo/preventivi</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalLeads}
          </div>
          <div className="text-sm text-green-600 font-medium mt-2">
            +{stats.newLeads} nuovi questa settimana
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Utenti Attivi</h3>
              <p className="text-sm text-gray-600">Registrati al sistema</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.totalUsers}
          </div>
          <div className="text-sm text-green-600 font-medium mt-2">
            +12% vs mese scorso
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Abbonamenti</h3>
              <p className="text-sm text-gray-600">Piani attivi</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.activeSubscriptions}
          </div>
          <div className="text-sm text-green-600 font-medium mt-2">
            {Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)}% conversione
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Marketing Section */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Marketing</h3>
              <p className="text-sm text-gray-600">Gestisci lead e richieste</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Link
              href="/staff/marketing"
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200 group"
            >
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-gray-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Gestione Lead</h4>
                  <p className="text-sm text-gray-600">Demo e preventivi</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
            </Link>
          </div>
        </div>

        {/* Admin Section */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Amministrazione</h3>
              <p className="text-sm text-gray-600">Controllo sistema</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Link
              href="/staff/admin"
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200 group"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Dashboard Admin</h4>
                  <p className="text-sm text-gray-600">Panoramica sistema</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
            </Link>
            
            <Link
              href="/staff/admin/users"
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200 group"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Gestione Utenti</h4>
                  <p className="text-sm text-gray-600">Amministra utenti</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
            </Link>
            
            <Link
              href="/staff/admin/organizations"
              className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200 group"
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Organizzazioni</h4>
                  <p className="text-sm text-gray-600">Gestisci aziende</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
            </Link>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Stato Sistema</h3>
            <p className="text-sm text-gray-600">Monitoraggio in tempo reale</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">Database</h4>
              <p className="text-sm text-green-600">Operativo</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">API</h4>
              <p className="text-sm text-green-600">Operativo</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">Stripe</h4>
              <p className="text-sm text-green-600">Operativo</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">Email</h4>
              <p className="text-sm text-green-600">Operativo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
