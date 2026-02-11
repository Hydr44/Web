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
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const getSecurityScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "bg-amber-500/10 border-amber-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case "info":
        return <Shield className="h-5 w-5 text-blue-400" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      default:
        return <Shield className="h-5 w-5 text-slate-400" />;
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
          <Shield className="h-4 w-4" />
          Centro Sicurezza
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-4">
          Sicurezza <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Account</span>
        </h1>
        
        <p className="text-lg text-slate-400 max-w-2xl">
          Monitora e gestisci la sicurezza del tuo account. Proteggi i tuoi dati con le migliori pratiche di sicurezza.
        </p>
      </header>

      {/* Security Score */}
      <div className={`p-6 rounded-2xl border ${getSecurityScoreBg(securityData.securityScore)} `}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Score Sicurezza</h2>
              <p className="text-sm text-slate-400">Valutazione generale della sicurezza</p>
            </div>
          </div>
          <div className={`text-3xl font-bold ${getSecurityScoreColor(securityData.securityScore)}`}>
            {securityData.securityScore}%
          </div>
        </div>
        
        <div className="w-full bg-[#243044] rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              securityData.securityScore >= 80 ? 'bg-emerald-500/100' : 
              securityData.securityScore >= 60 ? 'bg-amber-500/100' : 'bg-red-500/100'
            }`}
            style={{ width: `${securityData.securityScore}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-slate-400">
          {securityData.securityScore >= 80 ? "Ottimo! Il tuo account è ben protetto." : 
           securityData.securityScore >= 60 ? "Buono, ma puoi migliorare la sicurezza." : 
           "Attenzione! La sicurezza del tuo account necessita di miglioramenti."}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          href="/dashboard/security/password"
          className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Password</h3>
              <p className="text-sm text-slate-400">Gestisci password</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Ultimo cambio: 1 giorno fa</span>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors duration-200" />
          </div>
        </Link>

        <Link
          href="/dashboard/security/2fa"
          className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">2FA</h3>
              <p className="text-sm text-slate-400">Autenticazione a due fattori</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${securityData.twoFactorEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
              {securityData.twoFactorEnabled ? 'Abilitato' : 'Non abilitato'}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors duration-200" />
          </div>
        </Link>

        <Link
          href="/dashboard/security/sessions"
          className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Sessioni</h3>
              <p className="text-sm text-slate-400">Dispositivi attivi</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{securityData.activeSessions} dispositivi</span>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors duration-200" />
          </div>
        </Link>

        <Link
          href="/dashboard/security/audit"
          className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Audit Log</h3>
              <p className="text-sm text-slate-400">Log di sicurezza</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Monitora attività</span>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors duration-200" />
          </div>
        </Link>

        <Link
          href="/dashboard/security/audit"
          className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044]  hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Audit Log</h3>
              <p className="text-sm text-slate-400">Attività di sicurezza</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Ultimo accesso: 2 ore fa</span>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors duration-200" />
          </div>
        </Link>
      </div>

      {/* Security Alerts */}
      {securityData.securityAlerts.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044] ">
          <h2 className="text-xl font-semibold text-slate-100 mb-6">Avvisi Sicurezza</h2>
          <div className="space-y-4">
            {securityData.securityAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-[#141c27] border border-[#243044]">
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <p className="font-medium text-slate-100">{alert.message}</p>
                    <p className="text-sm text-slate-400">Raccomandazione di sicurezza</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm font-medium">
                  {alert.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044] ">
        <h2 className="text-xl font-semibold text-slate-100 mb-6">Attività Recente</h2>
        <div className="space-y-4">
          {securityData.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-[#141c27] border border-[#243044]">
              <div className="flex-shrink-0">
                {getStatusIcon(activity.status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-100">{activity.action}</h3>
                  <span className="text-sm text-slate-500">{activity.time}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
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
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30 border border-blue-500/20/50 ">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Migliora la Sicurezza del tuo Account</h2>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Livello di Sicurezza</span>
            <span className="text-sm font-bold text-slate-100">{securityData.securityScore}%</span>
          </div>
          <div className="w-full bg-[#243044] rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                securityData.securityScore < 40 ? 'bg-red-500/100' : 
                securityData.securityScore < 70 ? 'bg-amber-500/100' : 'bg-emerald-500/100'
              }`}
              style={{ width: `${securityData.securityScore}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-100">Azioni per raggiungere il 100%:</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a2536] border border-[#243044]">
              <div className="w-8 h-8 rounded-full bg-[#1a2536] flex items-center justify-center">
                <Shield className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-100">Abilita l'autenticazione a due fattori</p>
                <p className="text-sm text-slate-400">Aggiungi un ulteriore livello di sicurezza</p>
              </div>
              <Link 
                href="/dashboard/security/2fa"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
              >
                Configura
              </Link>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a2536] border border-[#243044]">
              <div className="w-8 h-8 rounded-full bg-[#1a2536] flex items-center justify-center">
                <Key className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-100">Aggiorna la tua password</p>
                <p className="text-sm text-slate-400">Usa una password forte e unica</p>
              </div>
              <Link 
                href="/dashboard/security/password"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
              >
                Cambia
              </Link>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a2536] border border-[#243044]">
              <div className="w-8 h-8 rounded-full bg-[#1a2536] flex items-center justify-center">
                <Monitor className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-100">Monitora le sessioni attive</p>
                <p className="text-sm text-slate-400">Controlla i dispositivi connessi</p>
              </div>
              <Link 
                href="/dashboard/security/sessions"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200 text-sm font-medium"
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
