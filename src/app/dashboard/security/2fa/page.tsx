"use client";

import { useState, useEffect, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import {
  Smartphone,
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertTriangle,
  Copy,
  Download,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

/**
 * Pagina 2FA (TOTP) — integrazione reale Supabase MFA.
 *
 * Funzionalità:
 *  - Enrollment TOTP via supabase.auth.mfa.enroll() (QR + secret veri)
 *  - Verifica codice via challenge() + verify()
 *  - Disabilitazione via unenroll() (revoca anche i codici di backup)
 *  - Codici di backup veri: generati server-side, archiviati come SHA-256
 *    (vedi /api/auth/mfa/backup-codes/*), mostrati una sola volta alla
 *    generazione e scaricabili come file.
 *
 * NOTA: la pagina sostituisce la precedente che era completamente mock
 * (setTimeout simulati e codici di backup hardcoded). Vedi audit P0.
 */
export default function TwoFactorAuthPage() {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  // Stato 2FA reale
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  // Setup state (durante l'enrollment)
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [challengeId, setChallengeId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");

  // Backup codes
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupUnused, setBackupUnused] = useState<number | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // UI feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carica lo stato corrente dei fattori MFA. Se trova un factor TOTP
  // NON verificato (enrollment incompleto), lo elimina per partire puliti.
  const refreshFactors = useCallback(async () => {
    const supabase = supabaseBrowser();
    const { data, error: listErr } = await supabase.auth.mfa.listFactors();
    if (listErr) throw new Error(listErr.message);

    const totpVerified = data?.totp?.find((f) => f.status === "verified");
    if (totpVerified) {
      setFactorId(totpVerified.id);
      setVerified(true);
      setQrCode("");
      setSecret("");
      setChallengeId("");
      // Stato codici di backup
      try {
        const r = await fetch("/api/auth/mfa/backup-codes/status");
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.ok) setBackupUnused(j.unused ?? 0);
      } catch {
        /* non bloccante */
      }
      return;
    }

    // Eventuali factor pending (unverified) → cleanup
    const pending = data?.totp?.find((f) => f.status === "unverified");
    if (pending) {
      await supabase.auth.mfa.unenroll({ factorId: pending.id });
    }
    setFactorId(null);
    setVerified(false);
    setBackupUnused(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr || !user) {
          setError("Devi essere autenticato per gestire il 2FA");
          return;
        }
        await refreshFactors();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Errore caricamento 2FA";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshFactors]);

  // ── Enroll: genera factor TOTP, ritorna QR + secret veri ─────────────────
  const handleEnable2FA = async () => {
    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const supabase = supabaseBrowser();
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `RescueManager TOTP ${new Date().toISOString().slice(0, 10)}`,
      });
      if (enrollErr || !data) throw new Error(enrollErr?.message || "Errore enroll TOTP");
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);

      // Prepara la challenge per la verifica
      const { data: chal, error: chalErr } = await supabase.auth.mfa.challenge({
        factorId: data.id,
      });
      if (chalErr || !chal) throw new Error(chalErr?.message || "Errore challenge");
      setChallengeId(chal.id);

      setSuccess("Scansiona il QR code con l'app autenticatore e inserisci il codice.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Errore configurazione 2FA";
      setError(msg);
    } finally {
      setWorking(false);
    }
  };

  // ── Verify TOTP code → attiva 2FA + genera backup codes ──────────────────
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!factorId || !challengeId) {
      setError("Sessione di enrollment scaduta — ricomincia.");
      return;
    }
    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Inserisci un codice di 6 cifre");
      return;
    }

    setWorking(true);
    try {
      const supabase = supabaseBrowser();
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verificationCode,
      });
      if (verifyErr) throw new Error(verifyErr.message || "Codice non valido");

      // Audit log: 2FA enabled
      try {
        await fetch("/api/user/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mfa.enabled" }),
        });
      } catch { /* non bloccante */ }

      // Genera i codici di backup
      const r = await fetch("/api/auth/mfa/backup-codes/regenerate", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok || !Array.isArray(j.codes)) {
        // 2FA attivo ma backup codes falliti: lo segnaliamo ma non rolliamo back.
        setSuccess("2FA abilitato. Generazione codici di backup fallita — riprova in alto.");
      } else {
        setBackupCodes(j.codes);
        setShowBackupCodes(true);
        setSuccess("2FA abilitato! Salva i codici di backup qui sotto — vengono mostrati una sola volta.");
      }

      setVerificationCode("");
      await refreshFactors();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Codice di verifica non valido";
      setError(msg);
    } finally {
      setWorking(false);
    }
  };

  // ── Disable: unenroll factor + revoca codici di backup ───────────────────
  const handleDisable2FA = async () => {
    if (!factorId) return;
    if (!confirm("Disabilitare il 2FA? Verranno revocati anche i codici di backup.")) return;

    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const supabase = supabaseBrowser();
      const { error: unErr } = await supabase.auth.mfa.unenroll({ factorId });
      if (unErr) throw new Error(unErr.message);

      // Best-effort: revoca codici di backup residui
      try {
        await fetch("/api/auth/mfa/backup-codes/revoke", { method: "POST" });
      } catch {
        /* non bloccante */
      }

      setBackupCodes([]);
      setBackupUnused(null);
      try {
        await fetch("/api/user/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "mfa.disabled" }),
        });
      } catch { /* non bloccante */ }
      setSuccess("2FA disabilitato.");
      await refreshFactors();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Errore disabilitazione 2FA";
      setError(msg);
    } finally {
      setWorking(false);
    }
  };

  // ── Regenera backup codes (sostituisce quelli vecchi) ────────────────────
  const handleRegenerateBackupCodes = async () => {
    if (!confirm("Generare nuovi codici di backup? Quelli vecchi saranno invalidati.")) return;
    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await fetch("/api/auth/mfa/backup-codes/regenerate", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok || !Array.isArray(j.codes)) {
        throw new Error(j.error || "Errore generazione codici");
      }
      setBackupCodes(j.codes);
      setShowBackupCodes(true);
      try {
        await fetch("/api/user/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "backup_codes.regen" }),
        });
      } catch { /* non bloccante */ }
      setSuccess("Nuovi codici di backup generati — salvali ora.");
      await refreshFactors();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Errore";
      setError(msg);
    } finally {
      setWorking(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (!backupCodes.length) return;
    const txt = [
      "RescueManager — Codici di backup 2FA",
      `Generati: ${new Date().toLocaleString("it-IT")}`,
      "",
      "Ogni codice è MONOUSO. Conservali in un posto sicuro.",
      "Se li perdi puoi generarne nuovi dalla pagina 2FA (i vecchi vengono invalidati).",
      "",
      ...backupCodes,
      "",
    ].join("\n");
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rescuemanager-2fa-backup-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setSuccess("Chiave segreta copiata.");
    } catch {
      setError("Impossibile copiare negli appunti.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-white border border-gray-100 rounded-lg p-6 space-y-4">
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-full h-10 bg-gray-50 rounded animate-pulse" />
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mt-4" />
          <div className="w-full h-10 bg-gray-50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const enrolling = !!factorId && !verified && !!qrCode;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard/security"
            className="p-2 rounded-lg hover:bg-white transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="inline-flex items-center gap-2 text-sm rounded-full border border-blue-200 px-4 py-2 mb-4 bg-blue-50 text-blue-600 font-medium">
              <Smartphone className="h-4 w-4" />
              Autenticazione a Due Fattori
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Sicurezza <span className="text-blue-600">2FA</span>
            </h1>
            <p className="text-lg text-gray-500">
              Aggiungi un ulteriore livello di sicurezza al tuo account
            </p>
          </div>
        </div>
      </header>

      {/* Stato 2FA */}
      <div
        className={`p-6 rounded-lg border ${
          verified ? "bg-white border-gray-200" : "bg-amber-50/30 border-amber-200"
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                verified ? "bg-green-50" : "bg-amber-50"
              }`}
            >
              {verified ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              )}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${verified ? "text-green-900" : "text-yellow-900"}`}>
                {verified ? "2FA Abilitato" : "2FA Non Abilitato"}
              </h3>
              <p className={`text-sm ${verified ? "text-green-600" : "text-yellow-700"}`}>
                {verified
                  ? "Il tuo account è protetto da TOTP (app autenticatore)."
                  : "Abilita il 2FA per proteggere il tuo account."}
              </p>
            </div>
          </div>

          {verified ? (
            <button
              onClick={handleDisable2FA}
              disabled={working}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200 font-medium disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Disabilita 2FA
            </button>
          ) : (
            !enrolling && (
              <button
                onClick={handleEnable2FA}
                disabled={working}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-gray-900 rounded hover:bg-primary/90 transition-colors duration-200 font-medium disabled:opacity-50"
              >
                {working ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                {working ? "Configurando..." : "Abilita 2FA"}
              </button>
            )
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded bg-emerald-500/10 border border-gray-200 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Setup 2FA — QR + verifica */}
      {enrolling && (
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="p-6 rounded bg-white border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Configurazione 2FA</h2>

            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">1. Scansiona il QR Code</h3>
                <div className="inline-block p-4 bg-white border border-gray-200">
                  {/* Supabase ritorna il QR come SVG data URI */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Usa un&apos;app autenticatore (Google Authenticator, Authy, 1Password, …).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">2. Chiave Segreta</h3>
                <div className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded">
                  <code className="flex-1 font-mono text-sm break-all">{secret}</code>
                  <button
                    onClick={handleCopySecret}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    title="Copia chiave segreta"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Inseriscila manualmente se non riesci a scansionare il QR.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded bg-white border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Verifica Configurazione</h2>

            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label htmlFor="totp-code" className="block text-sm font-medium text-gray-600 mb-2">
                  Codice di Verifica
                </label>
                <input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-200 rounded focus:ring-2 focus:ring-blue-500/20 focus:border-primary transition-colors duration-200"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Inserisci il codice a 6 cifre generato dall&apos;app.
                </p>
              </div>

              <button
                type="submit"
                disabled={working || verificationCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-gray-900 rounded hover:bg-primary/90 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {working ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {working ? "Verificando..." : "Verifica e Attiva 2FA"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Backup codes — mostrati una sola volta dopo generazione */}
      {backupCodes.length > 0 && (
        <div className="p-6 rounded bg-white border border-gray-200">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Codici di Backup</h2>
              <p className="text-sm text-gray-500">
                Salvali ora — non saranno più mostrati. Ogni codice è monouso.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBackupCodes((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-800 transition-colors duration-200"
              >
                {showBackupCodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showBackupCodes ? "Nascondi" : "Mostra"}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {backupCodes.map((code) => (
                <div key={code} className="p-3 bg-white border border-gray-200 rounded text-center">
                  <code className="font-mono text-sm font-medium">{code}</code>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 rounded bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-yellow-900">Importante</span>
            </div>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Conservali in un posto sicuro (password manager).</li>
              <li>• Ogni codice è monouso.</li>
              <li>• Genera nuovi codici se sospetti che siano stati compromessi.</li>
            </ul>
          </div>
        </div>
      )}

      {/* 2FA attivo: stato codici + rigenerazione */}
      {verified && backupCodes.length === 0 && (
        <div className="p-6 rounded bg-white border border-gray-200 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Codici di Backup</h2>
            <p className="text-sm text-gray-500">
              {backupUnused === null
                ? "Stato non disponibile."
                : backupUnused > 0
                  ? `Hai ancora ${backupUnused} codici di backup validi.`
                  : "Nessun codice di backup valido — generane di nuovi."}
            </p>
          </div>
          <button
            onClick={handleRegenerateBackupCodes}
            disabled={working}
            className="flex items-center gap-2 px-4 py-2 text-primary hover:text-primary/80 transition-colors duration-200 font-medium disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Genera nuovi codici
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="p-6 rounded bg-white border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Consigli per la Sicurezza 2FA</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Usa un&apos;app autenticatore dedicata</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Non condividere mai i codici di backup</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Aggiorna regolarmente l&apos;app autenticatore</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Conserva i codici in un password manager</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Testa regolarmente l&apos;accesso 2FA</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Rigenera i codici dopo ogni utilizzo critico</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
