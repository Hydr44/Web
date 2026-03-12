"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  Shield, 
  Lock, 
  Key, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Smartphone,
  Monitor,
  Globe,
  Database,
  Settings,
  ArrowRight,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";

export default function SecurityPage() {
  const [loading, setLoading] = useState(true);
  const [securityData, setSecurityData] = useState({
    securityScore: 85,
    lastLogin: "2024-01-15T10:30:00Z",
    activeSessions: 3,
    twoFactorEnabled: false,
    passwordStrength: "strong",
    recentActivity: [
      { action: "Login", device: "Chrome on Mac", location: "Milano, IT", time: "2 ore fa", status: "success" },
      { action: "Password changed", device: "Chrome on Mac", location: "Milano, IT", time: "1 giorno fa", status: "success" },
      { action: "Failed login", device: "Safari on iPhone", location: "Roma, IT", time: "3 giorni fa", status: "failed" }
    ],
    securityAlerts: [
      { type: "warning", message: "Password scade tra 30 giorni", action: "Cambia password" },
      { type: "info", message: "2FA non abilitato", action: "Abilita 2FA" }
    ]
  });

  useEffect(() => {
    const loadSecurityData = async () => {
      try {
        const supabase = supabaseBrowser();
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }
        
        // Carica dati reali di sicurezza
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          // Calcola score sicurezza basato su dati reali
          let score = 50; // Base score
          if (profile.full_name) score += 10;
          if (profile.phone) score += 10;
          if (profile.avatar_url) score += 5;
          // Qui potresti aggiungere controlli per 2FA, password strength, etc.
          
          setSecurityData(prev => ({
            ...prev,
            securityScore: Math.min(score, 100),
            lastLogin: profile.updated_at || new Date().toISOString(),
            twoFactorEnabled: false // Da implementare con tabella dedicata
          }));
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading security data:", error);
        setLoading(false);
      }
    };

    loadSecurityData();
  }, []);

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getSecurityScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10 border-gray-200";
    if (score >= 60) return "bg-amber-500/10 border-amber-500/20";
    return "bg-red-50 border-red-200";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "info":
        return <Shield className="h-5 w-5 text-blue-600" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Sicurezza</h1>
        <p className="text-gray-500">Monitora e gestisci la sicurezza del tuo account.</p>
      </header>

      {/* Security Score */}
      <div className={`p-6  border ${getSecurityScoreBg(securityData.securityScore)} `}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10  bg-blue-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Score Sicurezza</h2>
              <p className="text-sm text-gray-500">Valutazione generale della sicurezza</p>
            </div>
          </div>
          <div className={`text-3xl font-bold ${getSecurityScoreColor(securityData.securityScore)}`}>
            {securityData.securityScore}%
          </div>
        </div>
        
        <div className="w-full bg-gray-50 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              securityData.securityScore >= 80 ? 'bg-emerald-500/100' : 
              securityData.securityScore >= 60 ? 'bg-amber-500/100' : 'bg-red-500'
            }`}
            style={{ width: `${securityData.securityScore}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-500">
          {securityData.securityScore >= 80 ? "Ottimo! Il tuo account è ben protetto." : 
           securityData.securityScore >= 60 ? "Buono, ma puoi migliorare la sicurezza." : 
           "Attenzione! La sicurezza del tuo account necessita di miglioramenti."}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/dashboard/security/password"
          className="p-6  bg-white border border-gray-200  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10  bg-blue-600 flex items-center justify-center">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Password</h3>
              <p className="text-sm text-gray-500">Gestisci password</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Ultimo cambio: 1 giorno fa</span>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-200" />
          </div>
        </Link>

        <Link
          href="/dashboard/security/2fa"
          className="p-6  bg-white border border-gray-200  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10  bg-emerald-600 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-gray-900" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">2FA</h3>
              <p className="text-sm text-gray-500">Autenticazione a due fattori</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${securityData.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {securityData.twoFactorEnabled ? 'Abilitato' : 'Non abilitato'}
            </span>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-200" />
          </div>
        </Link>

        <Link
          href="/dashboard/security/sessions"
          className="p-6  bg-white border border-gray-200  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10  bg-gray-100 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-gray-900" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sessioni</h3>
              <p className="text-sm text-gray-500">Dispositivi attivi</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{securityData.activeSessions} dispositivi</span>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-200" />
          </div>
        </Link>

        <Link
          href="/dashboard/security/audit"
          className="p-6  bg-white border border-gray-200  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10  bg-amber-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-gray-900" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Audit Log</h3>
              <p className="text-sm text-gray-500">Log di sicurezza</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Monitora attività</span>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-200" />
          </div>
        </Link>

        <Link
          href="/dashboard/security/audit"
          className="p-6  bg-white border border-gray-200  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10  bg-amber-600 flex items-center justify-center">
              <Activity className="h-5 w-5 text-gray-900" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Audit Log</h3>
              <p className="text-sm text-gray-500">Attività di sicurezza</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Ultimo accesso: 2 ore fa</span>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-200" />
          </div>
        </Link>
      </div>

      {/* Security Alerts */}
      {securityData.securityAlerts.length > 0 && (
        <div className="p-6  bg-white border border-gray-200 ">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Avvisi Sicurezza</h2>
          <div className="space-y-4">
            {securityData.securityAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-4  bg-white border border-gray-200">
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-500">Raccomandazione di sicurezza</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-primary text-gray-900 rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm font-medium">
                  {alert.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="p-6  bg-white border border-gray-200 ">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Attività Recente</h2>
        <div className="space-y-4">
          {securityData.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-4  bg-white border border-gray-200">
              <div className="flex-shrink-0">
                {getStatusIcon(activity.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{activity.action}</h3>
                  <span className="text-sm text-gray-400">{activity.time}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Monitor className="h-3 w-3" />
                    {activity.device}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {activity.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Progress */}
      <div className="p-6  bg-white border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Migliora la Sicurezza del tuo Account</h2>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Livello di Sicurezza</span>
            <span className="text-sm font-bold text-gray-900">{securityData.securityScore}%</span>
          </div>
          <div className="w-full bg-gray-50 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                securityData.securityScore < 40 ? 'bg-red-500' : 
                securityData.securityScore < 70 ? 'bg-amber-500/100' : 'bg-emerald-500/100'
              }`}
              style={{ width: `${securityData.securityScore}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Azioni per raggiungere il 100%:</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3  bg-white border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <Shield className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Abilita l'autenticazione a due fattori</p>
                <p className="text-sm text-gray-500">Aggiungi un ulteriore livello di sicurezza</p>
              </div>
              <Link 
                href="/dashboard/security/2fa"
                className="px-4 py-2 bg-primary text-gray-900 rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
              >
                Configura
              </Link>
            </div>

            <div className="flex items-center gap-3 p-3  bg-white border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <Key className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Aggiorna la tua password</p>
                <p className="text-sm text-gray-500">Usa una password forte e unica</p>
              </div>
              <Link 
                href="/dashboard/security/password"
                className="px-4 py-2 bg-primary text-gray-900 rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
              >
                Cambia
              </Link>
            </div>

            <div className="flex items-center gap-3 p-3  bg-white border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <Monitor className="h-4 w-4 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Monitora le sessioni attive</p>
                <p className="text-sm text-gray-500">Controlla i dispositivi connessi</p>
              </div>
              <Link 
                href="/dashboard/security/sessions"
                className="px-4 py-2 bg-primary text-gray-900 rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
              >
                Gestisci
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
