"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { 
  Smartphone, 
  ArrowLeft, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Key, 
  QrCode,
  Copy,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  Settings
} from "lucide-react";

export default function TwoFactorAuthPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    const load2FAStatus = async () => {
      try {
        const supabase = supabaseBrowser();
        
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }
        
        // Qui carichereresti lo stato 2FA reale dal database
        // Per ora simuliamo
        setTwoFactorEnabled(false);
        setLoading(false);
      } catch (error) {
        console.error("Error loading 2FA status:", error);
        setLoading(false);
      }
    };

    load2FAStatus();
  }, []);

  const handleEnable2FA = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Qui implementeresti l'abilitazione 2FA reale
      // Per ora simuliamo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simula generazione QR code e backup codes
      setQrCode("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0Ij5RVyBjb2RlIGZvciAyRkE8L3RleHQ+PC9zdmc+");
      setSecret("JBSWY3DPEHPK3PXP");
      setBackupCodes([
        "12345678",
        "87654321", 
        "11223344",
        "44332211",
        "55667788",
        "88776655",
        "99887766",
        "66778899"
      ]);
      
      setSuccess("2FA configurato! Completa la verifica per attivarlo.");
    } catch (error) {
      console.error("Error enabling 2FA:", error);
      setError("Errore durante la configurazione del 2FA");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (!verificationCode || verificationCode.length !== 6) {
      setError("Inserisci un codice di 6 cifre");
      setSaving(false);
      return;
    }

    try {
      // Qui implementeresti la verifica del codice TOTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTwoFactorEnabled(true);
      setSuccess("2FA abilitato con successo!");
      setVerificationCode("");
    } catch (error) {
      console.error("Error verifying code:", error);
      setError("Codice di verifica non valido");
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    if (confirm("Sei sicuro di voler disabilitare il 2FA? Questo ridurrà la sicurezza del tuo account.")) {
      setSaving(true);
      try {
        // Qui implementeresti la disabilitazione 2FA
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setTwoFactorEnabled(false);
        setBackupCodes([]);
        setQrCode("");
        setSecret("");
        setSuccess("2FA disabilitato con successo");
      } catch (error) {
        console.error("Error disabling 2FA:", error);
        setError("Errore durante la disabilitazione del 2FA");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDownloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes-2fa.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            className="p-2 rounded-lg hover:bg-[#1a2536] transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-slate-400" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-4 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
              <Smartphone className="h-4 w-4" />
              Autenticazione a Due Fattori
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-2">
              Sicurezza <span className="bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">2FA</span>
            </h1>
            <p className="text-lg text-slate-400">
              Aggiungi un ulteriore livello di sicurezza al tuo account
            </p>
          </div>
        </div>
      </header>

      {/* 2FA Status */}
      <div className={`p-6 rounded-2xl border ${
        twoFactorEnabled 
          ? 'bg-gradient-to-r from-green-50/50 via-white to-emerald-50/30 border-emerald-500/20/50' 
          : 'bg-gradient-to-r from-yellow-50/50 via-white to-orange-50/30 border-amber-500/20/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              twoFactorEnabled ? 'bg-emerald-500/15' : 'bg-amber-500/15'
            }`}>
              {twoFactorEnabled ? (
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              )}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                twoFactorEnabled ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {twoFactorEnabled ? '2FA Abilitato' : '2FA Non Abilitato'}
              </h3>
              <p className={`text-sm ${
                twoFactorEnabled ? 'text-emerald-400' : 'text-yellow-700'
              }`}>
                {twoFactorEnabled 
                  ? 'Il tuo account è protetto con autenticazione a due fattori'
                  : 'Abilita il 2FA per proteggere il tuo account'
                }
              </p>
            </div>
          </div>
          
          {twoFactorEnabled ? (
            <button
              onClick={handleDisable2FA}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-800 hover:bg-red-500/10 rounded-xl transition-colors duration-200 font-medium disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Disabilita 2FA
            </button>
          ) : (
            <button
              onClick={handleEnable2FA}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {saving ? "Configurando..." : "Abilita 2FA"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Setup 2FA */}
      {!twoFactorEnabled && qrCode && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* QR Code Setup */}
          <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044] ">
            <h2 className="text-xl font-semibold text-slate-100 mb-6">Configurazione 2FA</h2>
            
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-100 mb-4">1. Scansiona il QR Code</h3>
                <div className="inline-block p-4 bg-[#1a2536] border border-[#243044] rounded-xl">
                  <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
                </div>
                <p className="text-sm text-slate-400 mt-4">
                  Usa un'app autenticatore come Google Authenticator, Authy o 1Password
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-100 mb-4">2. Chiave Segreta</h3>
                <div className="flex items-center gap-2 p-3 bg-[#141c27] rounded-xl">
                  <code className="flex-1 font-mono text-sm">{secret}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(secret)}
                    className="p-2 text-slate-500 hover:text-slate-300 transition-colors duration-200"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Inserisci manualmente questa chiave se non riesci a scansionare il QR code
                </p>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044] ">
            <h2 className="text-xl font-semibold text-slate-100 mb-6">Verifica Configurazione</h2>
            
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Codice di Verifica
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 text-center text-2xl font-mono border border-[#243044] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors duration-200"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
                <p className="text-sm text-slate-400 mt-2">
                  Inserisci il codice a 6 cifre generato dall'app autenticatore
                </p>
              </div>

              <button
                type="submit"
                disabled={saving || verificationCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {saving ? "Verificando..." : "Verifica e Attiva 2FA"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Backup Codes */}
      {twoFactorEnabled && backupCodes.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#1a2536] border border-[#243044] ">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Codici di Backup</h2>
              <p className="text-sm text-slate-400">Usa questi codici se perdi l'accesso al tuo dispositivo</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBackupCodes(!showBackupCodes)}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors duration-200"
              >
                {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showBackupCodes ? 'Nascondi' : 'Mostra'}
              </button>
              
              <button
                onClick={handleDownloadBackupCodes}
                className="flex items-center gap-2 px-4 py-2 text-primary hover:text-primary/80 transition-colors duration-200"
              >
                <Download className="h-4 w-4" />
                Scarica
              </button>
            </div>
          </div>

          {showBackupCodes && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-3 bg-[#141c27] rounded-xl text-center">
                  <code className="font-mono text-sm font-medium">{code}</code>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-yellow-900">Importante</span>
            </div>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Salva questi codici in un posto sicuro</li>
              <li>• Ogni codice può essere usato una sola volta</li>
              <li>• Genera nuovi codici se sospetti che siano stati compromessi</li>
            </ul>
          </div>
        </div>
      )}

      {/* Security Tips */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30 border border-blue-500/20/50 ">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Consigli per la Sicurezza 2FA</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Usa un'app autenticatore dedicata</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Non condividere mai i codici di backup</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Aggiorna regolarmente l'app autenticatore</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Usa backup su più dispositivi</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Testa regolarmente l'accesso 2FA</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span>Mantieni i codici di backup al sicuro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
