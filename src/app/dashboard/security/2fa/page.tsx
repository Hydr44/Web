"use client";

import { useState, useEffect, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TWO_FACTOR_ENABLED } from "@/lib/feature-2fa";

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
  usePageTitle("2FA");
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
          setError("Serve un accesso attivo per gestire la verifica in due passaggi");
          return;
        }
        await refreshFactors();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Non è stato possibile leggere lo stato della verifica";
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

      setSuccess("Inquadra il codice con l'app di autenticazione, poi scrivi il numero che compare.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Non è stato possibile avviare la configurazione";
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
      setError("La configurazione è scaduta: ricomincia.");
      return;
    }
    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Il codice è di sei cifre");
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
        setSuccess("Verifica in due passaggi attiva. I codici di riserva non sono stati generati: riprova dal riquadro dei codici.");
      } else {
        setBackupCodes(j.codes);
        setShowBackupCodes(true);
        setSuccess("Verifica in due passaggi attiva. Conserva i codici di riserva qui sotto: compaiono una volta sola.");
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
    if (!confirm("Disattivare la verifica in due passaggi? Vengono annullati anche i codici di riserva.")) return;

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
      setSuccess("Verifica in due passaggi disattivata.");
      await refreshFactors();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Non è stato possibile disattivare la verifica";
      setError(msg);
    } finally {
      setWorking(false);
    }
  };

  // ── Regenera backup codes (sostituisce quelli vecchi) ────────────────────
  const handleRegenerateBackupCodes = async () => {
    if (!confirm("Generare nuovi codici di riserva? I precedenti non saranno più validi.")) return;
    setWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await fetch("/api/auth/mfa/backup-codes/regenerate", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok || !Array.isArray(j.codes)) {
        throw new Error(j.error || "Non è stato possibile generare i codici");
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
      setSuccess("Nuovi codici di riserva generati: conservali adesso.");
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
      "RescueManager — Codici di riserva per la verifica in due passaggi",
      `Generati: ${new Date().toLocaleString("it-IT")}`,
      "",
      "Ogni codice è MONOUSO. Conservali in un posto sicuro.",
      "Se li perdi puoi generarne di nuovi dalla pagina Sicurezza: i precedenti non saranno più validi.",
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
      setSuccess("Chiave copiata.");
    } catch {
      setError("Impossibile copiare negli appunti.");
    }
  };

  // 2FA temporaneamente bloccato (vedi lib/feature-2fa): blocca anche l'accesso
  // diretto via URL all'enroll/challenge finché non è pronto su tutte le app.
  if (!TWO_FACTOR_ENABLED) {
    return (
      <>
        <div className="rm-area__intesta">
          <div>
            <p className="rm-eyebrow">Sicurezza</p>
            <h1 style={{ marginTop: 8 }}>Verifica in due passaggi</h1>
          </div>
          <Link href="/dashboard/security" className="rm-btn rm-btn--ghost">
            <span>Torna a Sicurezza</span>
          </Link>
        </div>
        <div className="rm-note rm-note--info">
          La verifica in due passaggi è temporaneamente non disponibile: la
          stiamo completando su tutti i programmi, web e postazione, perché
          funzioni allo stesso modo ovunque.
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <div className="rm-area__intesta">
          <h1>Verifica in due passaggi</h1>
        </div>
        <div className="rm-card">
          <p className="rm-muted">Lettura dello stato in corso.</p>
        </div>
      </>
    );
  }

  const enrolling = !!factorId && !verified && !!qrCode;

  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <p className="rm-eyebrow">Sicurezza</p>
          <h1 style={{ marginTop: 8 }}>Verifica in due passaggi</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Oltre alla password serve un numero che cambia, generato da
            un&apos;app di autenticazione sul telefono.
          </p>
        </div>
        <Link href="/dashboard/security" className="rm-btn rm-btn--ghost">
          <span>Torna a Sicurezza</span>
        </Link>
      </div>

      {error && <div className="rm-note rm-note--errore">{error}</div>}
      {success && <div className="rm-note rm-note--info">{success}</div>}

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Stato</h3>
          <span className={verified ? "rm-stato rm-stato--ok" : "rm-stato rm-stato--fermo"}>
            {verified ? "Attiva" : "Non attiva"}
          </span>
        </div>
        <p className="rm-muted">
          {verified
            ? "L'accesso richiede la password e il numero generato dall'app."
            : "L'accesso richiede la sola password."}
        </p>
        <div style={{ marginTop: 16 }}>
          {verified ? (
            <button
              onClick={handleDisable2FA}
              disabled={working}
              className="rm-btn rm-btn--danger"
            >
              <span>Disattiva la verifica</span>
            </button>
          ) : (
            !enrolling && (
              <button
                onClick={handleEnable2FA}
                disabled={working}
                className="rm-btn rm-btn--primary"
              >
                <span>{working ? "Preparazione in corso" : "Attiva la verifica"}</span>
              </button>
            )
          )}
        </div>
      </div>

      {enrolling && (
        <>
          <div className="rm-card">
            <div className="rm-cardhead">
              <h3>Primo passo: collega l&apos;app</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="rm-muted" style={{ marginBottom: 12 }}>
                  Inquadra questo codice con l&apos;app di autenticazione
                  (Google Authenticator, Authy, 1Password).
                </p>
                <div style={{ display: "inline-block", padding: 12, background: "#fff" }}>
                  {/* Supabase ritorna il QR come SVG data URI */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="Codice da inquadrare" style={{ width: 192, height: 192 }} />
                </div>
              </div>
              <div className="rm-field">
                <span className="rm-label">
                  Se non riesci a inquadrarlo, scrivi questa chiave nell&apos;app
                </span>
                <div className="rm-prefix">
                  <input className="rm-input rm-mono" value={secret} readOnly />
                  <button
                    onClick={handleCopySecret}
                    className="rm-btn rm-btn--ghost"
                    style={{ height: 38, padding: "0 12px", gap: 0 }}
                    type="button"
                  >
                    <span>Copia</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rm-card">
            <div className="rm-cardhead">
              <h3>Secondo passo: conferma</h3>
            </div>
            <form onSubmit={handleVerifyCode} style={{ maxWidth: 320 }}>
              <div className="rm-field">
                <label htmlFor="totp-code" className="rm-label">
                  Numero mostrato dall&apos;app (sei cifre)
                </label>
                <input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="rm-input rm-mono"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={working || verificationCode.length !== 6}
                className="rm-btn rm-btn--primary rm-btn--full"
                style={{ marginTop: 14 }}
              >
                <span>{working ? "Controllo in corso" : "Conferma e attiva"}</span>
              </button>
            </form>
          </div>
        </>
      )}

      {backupCodes.length > 0 && (
        <div className="rm-card">
          <div className="rm-cardhead">
            <div>
              <h3>Codici di riserva</h3>
              <p className="rm-muted" style={{ marginTop: 4 }}>
                Conservali adesso: non vengono più mostrati. Ogni codice si usa
                una volta sola.
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setShowBackupCodes((v) => !v)}
                className="rm-btn rm-btn--secondary"
              >
                <span>{showBackupCodes ? "Nascondi" : "Mostra"}</span>
              </button>
              <button onClick={handleDownloadBackupCodes} className="rm-btn rm-btn--tertiary">
                <span>Scarica</span>
              </button>
            </div>
          </div>

          {showBackupCodes && (
            <div className="rm-griglia">
              {backupCodes.map((code) => (
                <span key={code} className="rm-mono">
                  {code}
                </span>
              ))}
            </div>
          )}

          <div className="rm-note" style={{ marginTop: 16 }}>
            Conservali dove tieni le password. Se sospetti che qualcuno li abbia
            visti, generane di nuovi.
          </div>
        </div>
      )}

      {verified && backupCodes.length === 0 && (
        <div className="rm-card">
          <div className="rm-cardhead">
            <div>
              <h3>Codici di riserva</h3>
              <p className="rm-muted" style={{ marginTop: 4 }}>
                {backupUnused === null
                  ? "Stato non disponibile."
                  : backupUnused > 0
                    ? `Restano ${backupUnused} codici validi.`
                    : "Nessun codice valido: generane di nuovi."}
              </p>
            </div>
            <button
              onClick={handleRegenerateBackupCodes}
              disabled={working}
              className="rm-btn rm-btn--secondary"
            >
              <span>Genera nuovi codici</span>
            </button>
          </div>
        </div>
      )}

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Come usarla bene</h3>
        </div>
        <div className="rm-righe">
          <div className="rm-riga">
            <span>App</span>
            <span>Usa un&apos;app di autenticazione dedicata, tenuta aggiornata</span>
          </div>
          <div className="rm-riga">
            <span>Codici di riserva</span>
            <span>Conservali dove tieni le password e non condividerli</span>
          </div>
          <div className="rm-riga">
            <span>Controllo</span>
            <span>Prova l&apos;accesso ogni tanto, prima di averne bisogno</span>
          </div>
        </div>
      </div>
    </>
  );
}
