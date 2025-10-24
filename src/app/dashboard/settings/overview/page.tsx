"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Building2, 
  CreditCard, 
  Key, 
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  TrendingUp,
  Users,
  Globe,
  Lock,
  Eye,
  Download,
  Upload
} from "lucide-react";

export default function SettingsOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [orgData, setOrgData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSettings: 0,
    configuredSettings: 0,
    securityScore: 0,
    lastActivity: null
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = supabaseBrowser();
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }
        
        // Carica dati utente
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserData(profile);
        }

        // Carica dati organizzazione
        const { data: org } = await supabase
          .from("orgs")
          .select("*")
          .eq("id", profile?.current_org)
          .single();
        
        if (org) {
          setOrgData(org);
        }

        // Calcola statistiche
        setStats({
          totalSettings: 25,
          configuredSettings: 18,
          securityScore: 85,
          lastActivity: new Date()
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const settingsSections = [
    {
      id: "profile",
      title: "Profilo Personale",
      description: "Gestisci le tue informazioni personali",
      icon: User,
      href: "/dashboard/settings/profile",
      status: "complete",
      items: [
        { name: "Nome e cognome", configured: true },
        { name: "Email", configured: true },
        { name: "Telefono", configured: false },
        { name: "Avatar", configured: true }
      ]
    },
    {
      id: "organization",
      title: "Organizzazione",
      description: "Gestisci il tuo team e l'organizzazione",
      icon: Building2,
      href: "/dashboard/settings/organization",
      status: "partial",
      items: [
        { name: "Informazioni azienda", configured: true },
        { name: "Membri team", configured: true },
        { name: "Ruoli e permessi", configured: false },
        { name: "Branding", configured: true }
      ]
    },
    {
      id: "security",
      title: "Sicurezza",
      description: "Proteggi il tuo account e i dati",
      icon: Shield,
      href: "/dashboard/settings/security",
      status: "warning",
      items: [
        { name: "Password", configured: true },
        { name: "2FA", configured: false },
        { name: "Sessioni attive", configured: true },
        { name: "Log di accesso", configured: true }
      ]
    },
    {
      id: "notifications",
      title: "Notifiche",
      description: "Configura come ricevere le notifiche",
      icon: Bell,
      href: "/dashboard/settings/notifications",
      status: "complete",
      items: [
        { name: "Email", configured: true },
        { name: "Push", configured: true },
        { name: "SMS", configured: false },
        { name: "Preferenze", configured: true }
      ]
    },
    {
      id: "billing",
      title: "Fatturazione",
      description: "Gestisci piani e pagamenti",
      icon: CreditCard,
      href: "/dashboard/billing",
      status: "complete",
      items: [
        { name: "Piano attuale", configured: true },
        { name: "Metodi di pagamento", configured: true },
        { name: "Fatture", configured: true },
        { name: "Usage", configured: true }
      ]
    },
    {
      id: "privacy",
      title: "Privacy & Dati",
      description: "Gestisci privacy e export dati",
      icon: Database,
      href: "/dashboard/settings/privacy",
      status: "incomplete",
      items: [
        { name: "Consenso GDPR", configured: false },
        { name: "Export dati", configured: false },
        { name: "Retention", configured: false },
        { name: "Cookies", configured: true }
      ]
    },
    {
      id: "advanced",
      title: "Impostazioni Avanzate",
      description: "Configurazioni per sviluppatori",
      icon: Settings,
      href: "/dashboard/settings/advanced",
      status: "incomplete",
      items: [
        { name: "SSO", configured: false },
        { name: "LDAP", configured: false },
        { name: "Compliance", configured: false },
        { name: "Audit logs", configured: false }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "text-green-600 bg-green-50 border-green-200";
      case "partial":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "warning":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "incomplete":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="h-4 w-4" />;
      case "partial":
        return <Clock className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "incomplete":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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
        <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
          <Settings className="h-4 w-4" />
          Dashboard Impostazioni
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Centro <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Impostazioni</span>
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl">
          Gestisci tutte le impostazioni del tuo account, organizzazione e preferenze in un unico posto.
        </p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Impostazioni</h3>
              <p className="text-sm text-gray-600">Configurate</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats.configuredSettings}/{stats.totalSettings}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-blue-600 h-2 rounded-full"
              style={{ width: `${(stats.configuredSettings / stats.totalSettings) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sicurezza</h3>
              <p className="text-sm text-gray-600">Score</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {stats.securityScore}%
          </div>
          <div className="text-sm text-green-600 font-medium">
            {stats.securityScore >= 80 ? "Ottimo" : stats.securityScore >= 60 ? "Buono" : "Da migliorare"}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Attività</h3>
              <p className="text-sm text-gray-600">Ultima modifica</p>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString('it-IT') : "N/A"}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-orange-50/30 border border-orange-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Completamento</h3>
              <p className="text-sm text-gray-600">Progresso</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {Math.round((stats.configuredSettings / stats.totalSettings) * 100)}%
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 via-white to-blue-50/30 border border-primary/20 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/settings/security"
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-medium text-gray-900">Sicurezza</span>
          </Link>
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <CreditCard className="h-5 w-5 text-primary" />
            <span className="font-medium text-gray-900">Fatturazione</span>
          </Link>
          <Link
            href="/dashboard/settings/notifications"
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <Bell className="h-5 w-5 text-primary" />
            <span className="font-medium text-gray-900">Notifiche</span>
          </Link>
          <Link
            href="/dashboard/settings/privacy"
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <Database className="h-5 w-5 text-primary" />
            <span className="font-medium text-gray-900">Privacy</span>
          </Link>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid lg:grid-cols-2 gap-6">
        {settingsSections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="block p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                  <section.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(section.status)}`}>
                {getStatusIcon(section.status)}
                {section.status === "complete" ? "Completo" : 
                 section.status === "partial" ? "Parziale" :
                 section.status === "warning" ? "Attenzione" : "Incompleto"}
              </div>
            </div>
            
            <div className="space-y-2">
              {section.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <div className="flex items-center gap-1">
                    {item.configured ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Attività Recente</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Password aggiornata</p>
              <p className="text-xs text-gray-600">2 ore fa</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bell className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Notifiche configurate</p>
              <p className="text-xs text-gray-600">1 giorno fa</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Organizzazione aggiornata</p>
              <p className="text-xs text-gray-600">3 giorni fa</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
