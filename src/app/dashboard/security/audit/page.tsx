"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  Shield, 
  ArrowLeft, 
  Clock, 
  User, 
  Key, 
  Smartphone, 
  Monitor, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Filter,
  Download,
  Search,
  Calendar,
  MapPin,
  Globe
} from "lucide-react";

export default function AuditLogPage() {
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([
    {
      id: "audit_1",
      action: "Login",
      user: "user@example.com",
      timestamp: "2024-01-15T10:30:00Z",
      ip: "192.168.1.100",
      location: "Milano, Italia",
      device: "Chrome su Mac",
      status: "success",
      details: "Login riuscito con autenticazione email"
    },
    {
      id: "audit_2",
      action: "Password Change",
      user: "user@example.com",
      timestamp: "2024-01-15T09:15:00Z",
      ip: "192.168.1.100",
      location: "Milano, Italia",
      device: "Chrome su Mac",
      status: "success",
      details: "Password modificata con successo"
    },
    {
      id: "audit_3",
      action: "2FA Setup",
      user: "user@example.com",
      timestamp: "2024-01-14T16:45:00Z",
      ip: "192.168.1.101",
      location: "Roma, Italia",
      device: "Safari su iPhone",
      status: "success",
      details: "Autenticazione a due fattori configurata"
    },
    {
      id: "audit_4",
      action: "Failed Login",
      user: "user@example.com",
      timestamp: "2024-01-14T14:20:00Z",
      ip: "192.168.1.102",
      location: "Torino, Italia",
      device: "Firefox su Windows",
      status: "failed",
      details: "Tentativo di login con password errata"
    },
    {
      id: "audit_5",
      action: "Session Expired",
      user: "user@example.com",
      timestamp: "2024-01-14T12:00:00Z",
      ip: "192.168.1.100",
      location: "Milano, Italia",
      device: "Chrome su Mac",
      status: "info",
      details: "Sessione scaduta per inattività"
    }
  ]);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        const supabase = supabaseBrowser();
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }
        
        // Qui carichereresti i log di audit reali dal database
        // Per ora usiamo dati simulati
        setLoading(false);
      } catch (error) {
        console.error("Error loading audit logs:", error);
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, []);

  const filteredLogs = auditLogs.filter(log => {
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    const matchesAction = filterAction === "all" || log.action.toLowerCase().includes(filterAction.toLowerCase());
    const matchesSearch = searchTerm === "" || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.includes(searchTerm);
    
    return matchesStatus && matchesAction && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "info":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-50 border-green-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      case "info":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "login":
        return <User className="h-4 w-4" />;
      case "password change":
        return <Key className="h-4 w-4" />;
      case "2fa setup":
        return <Smartphone className="h-4 w-4" />;
      case "session expired":
        return <Clock className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
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
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/dashboard/security"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-4 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
              <Shield className="h-4 w-4" />
              Audit Log
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Log di <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Sicurezza</span>
            </h1>
            <p className="text-lg text-gray-600">
              Monitora tutte le attività di sicurezza del tuo account
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Successi</h3>
              <p className="text-sm text-gray-600">Ultimi 30 giorni</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {auditLogs.filter(log => log.status === "success").length}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-red-50/30 border border-red-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tentativi Falliti</h3>
              <p className="text-sm text-gray-600">Ultimi 30 giorni</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {auditLogs.filter(log => log.status === "failed").length}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Eventi Totali</h3>
              <p className="text-sm text-gray-600">Ultimi 30 giorni</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {auditLogs.length}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Posizioni</h3>
              <p className="text-sm text-gray-600">Diverse</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {new Set(auditLogs.map(log => log.location)).size}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per azione, dettagli o IP..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            className="w-full sm:w-auto pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 appearance-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tutti gli Stati</option>
            <option value="success">Successo</option>
            <option value="failed">Fallito</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            className="w-full sm:w-auto pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 appearance-none"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="all">Tutte le Azioni</option>
            <option value="login">Login</option>
            <option value="password">Password</option>
            <option value="2fa">2FA</option>
            <option value="session">Sessione</option>
          </select>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200">
          <Download className="h-4 w-4" />
          Esporta
        </button>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Log di Sicurezza ({filteredLogs.length})</h3>
        </div>
        
        {filteredLogs.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getActionIcon(log.action)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-gray-900">{log.action}</h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                          {getStatusIcon(log.status)}
                          {log.status}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{log.details}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleString('it-IT')}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {log.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" />
                          {log.device}
                        </div>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {log.ip}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun log trovato</h3>
            <p className="text-sm text-gray-600">Prova a modificare i filtri di ricerca.</p>
          </div>
        )}
      </div>
    </div>
  );
}
