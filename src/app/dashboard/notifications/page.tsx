"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Monitor, 
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Zap,
  Shield,
  CreditCard,
  Building2,
  User
} from "lucide-react";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      enabled: true,
      security: true,
      billing: true,
      organization: true,
      marketing: false,
      weekly: true
    },
    push: {
      enabled: true,
      security: true,
      billing: false,
      organization: true,
      marketing: false
    },
    sms: {
      enabled: false,
      security: true,
      billing: false,
      organization: false
    },
    preferences: {
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00"
      },
      frequency: "immediate", // immediate, daily, weekly
      digest: true
    }
  });

  const [recentNotifications, setRecentNotifications] = useState([
    {
      id: 1,
      type: "security",
      title: "Nuovo accesso rilevato",
      message: "Abbiamo rilevato un nuovo accesso dal dispositivo Chrome su Mac",
      time: "2 ore fa",
      read: false,
      icon: Shield
    },
    {
      id: 2,
      type: "billing",
      title: "Fattura disponibile",
      message: "La tua fattura di gennaio è pronta per il download",
      time: "1 giorno fa",
      read: true,
      icon: CreditCard
    },
    {
      id: 3,
      type: "organization",
      title: "Nuovo membro aggiunto",
      message: "Mario Rossi è stato aggiunto al team",
      time: "3 giorni fa",
      read: true,
      icon: Building2
    }
  ]);

  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const supabase = supabaseBrowser();
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }
        
        // Carica impostazioni notifiche reali
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          // Carica impostazioni notifiche dal profilo o da una tabella dedicata
          // Per ora usiamo impostazioni di default
          setNotificationSettings({
            email: {
              enabled: true,
              security: true,
              billing: true,
              organization: true,
              marketing: false,
              weekly: true
            },
            push: {
              enabled: true,
              security: true,
              billing: false,
              organization: true,
              marketing: false
            },
            sms: {
              enabled: false,
              security: true,
              billing: false,
              organization: false
            },
            preferences: {
              quietHours: {
                enabled: false,
                start: "22:00",
                end: "08:00"
              },
              frequency: "immediate",
              digest: true
            }
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading notification settings:", error);
        setLoading(false);
      }
    };

    loadNotificationSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Qui salveresti le impostazioni nel database
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Notification settings saved:", notificationSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "security":
        return <Shield className="h-5 w-5 text-red-500" />;
      case "billing":
        return <CreditCard className="h-5 w-5 text-blue-500" />;
      case "organization":
        return <Building2 className="h-5 w-5 text-green-500" />;
      case "marketing":
        return <Zap className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case "security":
        return "bg-red-500/10 border-red-500/20";
      case "billing":
        return "bg-blue-500/10 border-blue-500/20";
      case "organization":
        return "bg-emerald-500/10 border-emerald-500/20";
      case "marketing":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-[#141c27] border-[#243044]";
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
          <Bell className="h-4 w-4" />
          Centro Notifiche
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
              Gestione <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">Notifiche</span>
            </h1>
            <p className="text-lg text-slate-400">
              Personalizza come e quando ricevere le notifiche per il tuo account.
            </p>
          </div>
          
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Settings className="h-4 w-4" />
            )}
            {saving ? "Salvando..." : "Salva Impostazioni"}
          </button>
        </div>
      </header>

      {/* Notification Channels */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Email Notifications */}
        <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044] ">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Email</h2>
              <p className="text-sm text-slate-400">Notifiche via email</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Notifiche email</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.email.enabled}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, enabled: e.target.checked }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            {notificationSettings.email.enabled && (
              <div className="space-y-3 ml-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Sicurezza</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.email.security}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, security: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Fatturazione</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.email.billing}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, billing: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Organizzazione</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.email.organization}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, organization: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Marketing</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.email.marketing}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, marketing: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Push Notifications */}
        <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044] ">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Push</h2>
              <p className="text-sm text-slate-400">Notifiche push</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Notifiche push</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.push.enabled}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    push: { ...prev.push, enabled: e.target.checked }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            {notificationSettings.push.enabled && (
              <div className="space-y-3 ml-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Sicurezza</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.push.security}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        push: { ...prev.push, security: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Fatturazione</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.push.billing}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        push: { ...prev.push, billing: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Organizzazione</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.push.organization}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        push: { ...prev.push, organization: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SMS Notifications */}
        <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044] ">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">SMS</h2>
              <p className="text-sm text-slate-400">Notifiche SMS</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Notifiche SMS</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.sms.enabled}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    sms: { ...prev.sms, enabled: e.target.checked }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            {notificationSettings.sms.enabled && (
              <div className="space-y-3 ml-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Sicurezza</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.sms.security}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        sms: { ...prev.sms, security: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Fatturazione</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.sms.billing}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        sms: { ...prev.sms, billing: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quiet Hours */}
        <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044] ">
          <h2 className="text-xl font-semibold text-slate-100 mb-6">Ore Silenziose</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Abilita ore silenziose</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.preferences.quietHours.enabled}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      quietHours: { ...prev.preferences.quietHours, enabled: e.target.checked }
                    }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            {notificationSettings.preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Inizio</label>
                  <input
                    type="time"
                    value={notificationSettings.preferences.quietHours.start}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        quietHours: { ...prev.preferences.quietHours, start: e.target.value }
                      }
                    }))}
                    className="w-full px-4 py-3 border border-[#243044] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Fine</label>
                  <input
                    type="time"
                    value={notificationSettings.preferences.quietHours.end}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        quietHours: { ...prev.preferences.quietHours, end: e.target.value }
                      }
                    }))}
                    className="w-full px-4 py-3 border border-[#243044] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors duration-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Frequency Settings */}
        <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044] ">
          <h2 className="text-xl font-semibold text-slate-100 mb-6">Frequenza</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Frequenza notifiche</label>
              <select
                value={notificationSettings.preferences.frequency}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  preferences: { ...prev.preferences, frequency: e.target.value }
                }))}
                className="w-full px-4 py-3 border border-[#243044] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors duration-200"
              >
                <option value="immediate">Immediata</option>
                <option value="daily">Giornaliera</option>
                <option value="weekly">Settimanale</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300">Digest settimanale</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.preferences.digest}
                  onChange={(e) => setNotificationSettings(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, digest: e.target.checked }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#243044] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1a2536] after:border-[#243044] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044] ">
        <h2 className="text-xl font-semibold text-slate-100 mb-6">Notifiche Recenti</h2>
        
        <div className="space-y-4">
          {recentNotifications.map((notification) => (
            <div key={notification.id} className={`p-4 rounded-xl border ${getNotificationTypeColor(notification.type)} ${!notification.read ? 'ring-2 ring-primary/20' : ''}`}>
              <div className="flex items-start gap-3">
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-slate-100">{notification.title}</h3>
                    <span className="text-sm text-slate-500">{notification.time}</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{notification.message}</p>
                  {!notification.read && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary text-white">
                      <Bell className="h-3 w-3" />
                      Non letta
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
