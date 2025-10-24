"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  Key, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Clock,
  Save,
  X
} from "lucide-react";

export default function PasswordPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [lastChanged, setLastChanged] = useState<string | null>(null);

  useEffect(() => {
    const loadPasswordInfo = async () => {
      try {
        const supabase = supabaseBrowser();
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }
        
        // Simula data di ultimo cambio password
        setLastChanged("15 giorni fa");
        setLoading(false);
      } catch (error) {
        console.error("Error loading password info:", error);
        setLoading(false);
      }
    };

    loadPasswordInfo();
  }, []);

  useEffect(() => {
    // Calcola la forza della password
    let strength = 0;
    if (newPassword.length >= 8) strength += 20;
    if (newPassword.length >= 12) strength += 20;
    if (/[A-Z]/.test(newPassword)) strength += 20;
    if (/[a-z]/.test(newPassword)) strength += 20;
    if (/[0-9]/.test(newPassword)) strength += 10;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 10;
    
    setPasswordStrength(strength);
  }, [newPassword]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Le password non coincidono");
      setSaving(false);
      return;
    }

    if (passwordStrength < 60) {
      setError("La password non è abbastanza forte");
      setSaving(false);
      return;
    }

    try {
      const supabase = supabaseBrowser();
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess("Password aggiornata con successo!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setLastChanged("Ora");
    } catch (error) {
      console.error("Error changing password:", error);
      setError("Errore durante l'aggiornamento della password");
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 40) return "text-red-600";
    if (strength < 70) return "text-yellow-600";
    return "text-green-600";
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 40) return "Debole";
    if (strength < 70) return "Media";
    return "Forte";
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
              <Key className="h-4 w-4" />
              Gestione Password
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Cambia <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Password</span>
            </h1>
            <p className="text-lg text-gray-600">
              Aggiorna la tua password per mantenere il tuo account sicuro
            </p>
          </div>
        </div>
      </header>

      {/* Password Info */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Current Password Info */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Informazioni Password</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <h3 className="font-medium text-gray-900">Ultimo cambio</h3>
                <p className="text-sm text-gray-600">Password modificata</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                {lastChanged || "Sconosciuto"}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200">
              <div>
                <h3 className="font-medium text-green-900">Sicurezza</h3>
                <p className="text-sm text-green-700">Password attiva e protetta</p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Consigli per la sicurezza</span>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Usa almeno 12 caratteri</li>
                <li>• Includi lettere maiuscole e minuscole</li>
                <li>• Aggiungi numeri e simboli</li>
                <li>• Non riutilizzare password vecchie</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Cambia Password</h2>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800">{success}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Attuale
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                  placeholder="Inserisci la password attuale"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nuova Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                  placeholder="Inserisci la nuova password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Forza password</span>
                    <span className={`text-sm font-medium ${getPasswordStrengthColor(passwordStrength)}`}>
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength < 40 ? 'bg-red-500' : 
                        passwordStrength < 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conferma Nuova Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors duration-200"
                  placeholder="Conferma la nuova password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-2 text-sm text-red-600">Le password non coincidono</p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving || passwordStrength < 60 || newPassword !== confirmPassword}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Salvando..." : "Cambia Password"}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setError(null);
                  setSuccess(null);
                }}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <X className="h-4 w-4" />
                Annulla
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
