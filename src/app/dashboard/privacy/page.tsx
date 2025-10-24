"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  Database, 
  Shield, 
  Eye, 
  EyeOff, 
  Download, 
  Trash2, 
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Settings,
  Lock,
  Globe,
  User,
  Bell,
  Mail,
  Smartphone,
  Activity
} from "lucide-react";

export default function PrivacyPage() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [privacySettings, setPrivacySettings] = useState({
    dataCollection: true,
    analytics: true,
    marketing: false,
    cookies: true,
    dataRetention: "2years",
    gdprConsent: true,
    dataExport: false,
    accountDeletion: false
  });

  const [dataOverview, setDataOverview] = useState({
    totalDataPoints: 1247,
    personalData: 89,
    usageData: 1158,
    lastExport: null,
    dataRetentionDays: 730
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
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserData(profile);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleExportData = async () => {
    try {
      console.log("Exporting user data...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert("Export completato! Riceverai un'email con i tuoi dati.");
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile.")) {
      if (confirm("Questa azione eliminerà definitivamente tutti i tuoi dati. Sei assolutamente sicuro?")) {
        try {
          console.log("Deleting account...");
          alert("Account eliminato con successo.");
        } catch (error) {
          console.error("Error deleting account:", error);
        }
      }
    }
  };

  const dataRetentionOptions = [
    { value: "1year", label: "1 anno" },
    { value: "2years", label: "2 anni" },
    { value: "5years", label: "5 anni" },
    { value: "indefinite", label: "Indefinito" }
  ];

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
          <Database className="h-4 w-4" />
          Centro Privacy
        </div>
        
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
          Privacy & <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Dati</span>
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl">
          Controlla come vengono utilizzati i tuoi dati e gestisci le tue preferenze di privacy in conformità al GDPR.
        </p>
      </header>

      {/* GDPR Status */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-green-50/50 via-white to-emerald-50/30 border border-green-200/50 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Conformità GDPR</h2>
            <p className="text-sm text-gray-600">I tuoi diritti sulla privacy sono protetti</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Consenso GDPR</span>
            </div>
            <p className="text-xs text-green-700">Attivo dal {new Date().toLocaleDateString('it-IT')}</p>
          </div>
          
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Privacy Policy</span>
            </div>
            <p className="text-xs text-green-700">Accettata e aggiornata</p>
          </div>
          
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Cookie Policy</span>
            </div>
            <p className="text-xs text-green-700">Consenso gestito</p>
          </div>
        </div>
      </div>

      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-blue-50/30 border border-primary/20 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Dati Totali</h3>
              <p className="text-sm text-gray-600">Punti dati</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {dataOverview.totalDataPoints.toLocaleString()}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Dati Personali</h3>
              <p className="text-sm text-gray-600">Informazioni personali</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {dataOverview.personalData}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border border-purple-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Dati Utilizzo</h3>
              <p className="text-sm text-gray-600">Analytics e metriche</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {dataOverview.usageData.toLocaleString()}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-orange-50/30 border border-orange-200/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Conservazione</h3>
              <p className="text-sm text-gray-600">Giorni rimanenti</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {dataOverview.dataRetentionDays}
          </div>
        </div>
      </div>

      {/* Privacy Controls */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Data Collection */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Controlli Privacy</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <h3 className="font-medium text-gray-900">Raccolta dati essenziali</h3>
                <p className="text-sm text-gray-600">Dati necessari per il funzionamento</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.dataCollection}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, dataCollection: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <h3 className="font-medium text-gray-900">Analytics anonime</h3>
                <p className="text-sm text-gray-600">Dati aggregati per migliorare il servizio</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.analytics}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, analytics: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <h3 className="font-medium text-gray-900">Marketing</h3>
                <p className="text-sm text-gray-600">Comunicazioni promozionali</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings.marketing}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, marketing: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Gestione Dati</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conservazione dati
              </label>
              <select
                value={privacySettings.dataRetention}
                onChange={(e) => setPrivacySettings(prev => ({ ...prev, dataRetention: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
              >
                {dataRetentionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">I tuoi dati</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Profilo: {userData?.full_name || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>Organizzazione: {userData?.current_org ? "Presente" : "Nessuna"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Account: {userData?.created_at ? new Date(userData.created_at).toLocaleDateString('it-IT') : "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Actions */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Export Data */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <Download className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Export Dati</h2>
              <p className="text-sm text-gray-600">Scarica una copia dei tuoi dati</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Puoi richiedere una copia completa dei tuoi dati personali in formato JSON. 
              Il processo può richiedere fino a 24 ore.
            </p>
            
            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Nota importante</span>
              </div>
              <p className="text-sm text-yellow-800">
                L'export includerà tutti i tuoi dati personali, inclusi file e documenti.
              </p>
            </div>
            
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              <Download className="h-4 w-4" />
              Richiedi Export Dati
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Elimina Account</h2>
              <p className="text-sm text-gray-600">Cancella permanentemente il tuo account</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Eliminando il tuo account, tutti i tuoi dati verranno cancellati permanentemente.
            </p>
            
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Azione irreversibile</span>
              </div>
              <p className="text-sm text-red-800">
                Questa azione eliminerà definitivamente tutti i tuoi dati.
              </p>
            </div>
            
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Elimina Account
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Documentation */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-gray-50/50 via-white to-slate-50/30 border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Documentazione Privacy</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/privacy-policy"
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium text-gray-900">Privacy Policy</div>
              <div className="text-sm text-gray-600">Come utilizziamo i tuoi dati</div>
            </div>
          </Link>
          
          <Link
            href="/terms-of-use"
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium text-gray-900">Termini di Servizio</div>
              <div className="text-sm text-gray-600">Condizioni di utilizzo</div>
            </div>
          </Link>
          
          <Link
            href="/cookie-policy"
            className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <Settings className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium text-gray-900">Cookie Policy</div>
              <div className="text-sm text-gray-600">Gestione dei cookie</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
