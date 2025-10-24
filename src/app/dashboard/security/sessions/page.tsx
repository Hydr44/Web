"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  Monitor, 
  ArrowLeft, 
  Smartphone, 
  Tablet, 
  Globe, 
  Clock, 
  LogOut, 
  AlertTriangle,
  CheckCircle,
  Shield,
  MapPin,
  Wifi
} from "lucide-react";

export default function SessionsPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([
    {
      id: "session_1",
      device: "Chrome su Mac",
      browser: "Chrome 120.0",
      os: "macOS 14.2",
      location: "Milano, Italia",
      ip: "192.168.1.100",
      isCurrent: true,
      lastActive: "2 ore fa",
      createdAt: "2024-01-15T10:30:00Z",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    },
    {
      id: "session_2", 
      device: "Safari su iPhone",
      browser: "Safari 17.2",
      os: "iOS 17.2",
      location: "Roma, Italia",
      ip: "192.168.1.101",
      isCurrent: false,
      lastActive: "1 giorno fa",
      createdAt: "2024-01-14T15:20:00Z",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15"
    },
    {
      id: "session_3",
      device: "Firefox su Windows",
      browser: "Firefox 121.0",
      os: "Windows 11",
      location: "Torino, Italia", 
      ip: "192.168.1.102",
      isCurrent: false,
      lastActive: "3 giorni fa",
      createdAt: "2024-01-12T09:15:00Z",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0"
    }
  ]);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const supabase = supabaseBrowser();
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }
        
        // Carica sessioni reali dal database
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          // Per ora usiamo sessioni simulate, ma potresti implementare una tabella sessions
          setSessions([
            {
              id: "session_current",
              device: "Chrome su Mac",
              browser: "Chrome 120.0",
              os: "macOS 14.2",
              location: "Milano, Italia",
              ip: "192.168.1.100",
              isCurrent: true,
              lastActive: "2 ore fa",
              createdAt: profile.updated_at || new Date().toISOString(),
              userAgent: navigator.userAgent
            }
          ]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading sessions:", error);
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const handleLogoutSession = async (sessionId: string) => {
    if (confirm("Sei sicuro di voler disconnettere questa sessione?")) {
      try {
        // Qui implementeresti il logout della sessione specifica
        console.log("Logging out session:", sessionId);
        setSessions(prev => prev.filter(session => session.id !== sessionId));
      } catch (error) {
        console.error("Error logging out session:", error);
      }
    }
  };

  const handleLogoutAllOtherSessions = async () => {
    if (confirm("Sei sicuro di voler disconnettere tutte le altre sessioni? Rimarrà attiva solo questa sessione.")) {
      try {
        // Qui implementeresti il logout di tutte le altre sessioni
        console.log("Logging out all other sessions");
        setSessions(prev => prev.filter(session => session.isCurrent));
      } catch (error) {
        console.error("Error logging out all sessions:", error);
      }
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.includes("iPhone") || device.includes("Android")) {
      return <Smartphone className="h-5 w-5 text-blue-500" />;
    } else if (device.includes("iPad") || device.includes("tablet")) {
      return <Tablet className="h-5 w-5 text-purple-500" />;
    } else {
      return <Monitor className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBrowserIcon = (browser: string) => {
    if (browser.includes("Chrome")) {
      return <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>;
    } else if (browser.includes("Safari")) {
      return <div className="w-4 h-4 bg-blue-600 rounded-sm"></div>;
    } else if (browser.includes("Firefox")) {
      return <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>;
    } else {
      return <div className="w-4 h-4 bg-gray-500 rounded-sm"></div>;
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
              <Monitor className="h-4 w-4" />
              Gestione Sessioni
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Sessioni <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Attive</span>
            </h1>
            <p className="text-lg text-gray-600">
              Monitora e gestisci i dispositivi connessi al tuo account
            </p>
          </div>
        </div>
      </header>

      {/* Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sessioni Attive</h3>
              <p className="text-sm text-gray-600">Dispositivi connessi</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {sessions.length}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sicurezza</h3>
              <p className="text-sm text-gray-600">Stato account</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            Sicuro
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ultima Attività</h3>
              <p className="text-sm text-gray-600">Accesso recente</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            2h
          </div>
        </div>
      </div>

      {/* Current Session */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-green-50/50 via-white to-emerald-50/30 border border-green-200/50 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Sessione Corrente</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Questa è la sessione attualmente attiva. Non puoi disconnetterla da qui.
        </p>
        
        {sessions.filter(session => session.isCurrent).map((session) => (
          <div key={session.id} className="p-4 rounded-xl bg-white border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getDeviceIcon(session.device)}
                <div>
                  <h3 className="font-medium text-gray-900">{session.device}</h3>
                  <p className="text-sm text-gray-600">{session.browser} • {session.os}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Attiva</span>
                </div>
                <p className="text-xs text-gray-500">{session.lastActive}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Other Sessions */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Altre Sessioni</h2>
            <p className="text-sm text-gray-600">Dispositivi connessi in precedenza</p>
          </div>
          
          {sessions.filter(session => !session.isCurrent).length > 0 && (
            <button
              onClick={handleLogoutAllOtherSessions}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 transition-colors duration-200 font-medium"
            >
              <LogOut className="h-4 w-4" />
              Disconnetti Tutte
            </button>
          )}
        </div>

        {sessions.filter(session => !session.isCurrent).length > 0 ? (
          <div className="space-y-4">
            {sessions.filter(session => !session.isCurrent).map((session) => (
              <div key={session.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getDeviceIcon(session.device)}
                    <div>
                      <h3 className="font-medium text-gray-900">{session.device}</h3>
                      <p className="text-sm text-gray-600">{session.browser} • {session.os}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Wifi className="h-3 w-3" />
                          {session.ip}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {session.lastActive}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Ultima attività</div>
                      <div className="text-xs text-gray-500">{session.lastActive}</div>
                    </div>
                    <button
                      onClick={() => handleLogoutSession(session.id)}
                      className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      Disconnetti
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna altra sessione</h3>
            <p className="text-sm text-gray-600">Non ci sono altre sessioni attive al momento.</p>
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30 border border-blue-200/50 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Consigli per la Sicurezza</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Disconnetti sempre da dispositivi condivisi</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Monitora regolarmente le sessioni attive</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Disconnetti sessioni sospette immediatamente</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Usa sempre HTTPS per le connessioni</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Abilita l'autenticazione a due fattori</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Aggiorna regolarmente i tuoi dispositivi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
