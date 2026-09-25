"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import { TWO_FACTOR_ENABLED } from "@/lib/feature-2fa";
import { Contenuto, PiedeModulo, Sezione, TestataAzione } from "../../_ui/cornice";
import { useConferma } from "../../_ui/conferma";

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
 * Il disegno la vuole a passi: collega l'app, conferma il codice, conserva i
 * codici di riserva; le azioni stanno in alto e nel piede del modulo.
 */

/** Riga del modulo: etichetta a sinistra, contenuto a destra. */
function Campo({ etichetta, children }: Readonly<{ etichetta: string; children: ReactNode }>) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(120px, 160px) minmax(0, 1fr)",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span className="rm-label" style={{ textAlign: "right" }}>{etichetta}</span>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

/** Le sei caselle del codice: una cifra per casella, come nel disegno. */
function SeiCifre({
  valore,
  onChange,
  disabilitato,
}: Readonly<{ valore: string; onChange: (v: string) => void; disabilitato?: boolean }>) {
  const caselle = useRef<Array<HTMLInputElement | null>>([]);

  const scrivi = (i: number, testo: string) => {
    const cifre = testo.replace(/\D/g, "");
    if (!cifre) {
      onChange(valore.slice(0, i) + valore.slice(i + 1));
      return;
    }
    const nuovo = (valore.slice(0, i) + cifre + valore.slice(i + cifre.length)).slice(0, 6);
    onChange(nuovo);
    const prossima = Math.min(5, i + cifre.length);
    caselle.current[prossima]?.focus();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <div style={{ display: "flex", gap: 1 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <input
            key={i}
            ref={(el) => { caselle.current[i] = el; }}
            aria-label={`Cifra ${i + 1} di 6`}
            className="rm-input rm-mono"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={6}
            disabled={disabilitato}
            value={valore[i] || ""}
            onChange={(e) => scrivi(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !valore[i] && i > 0) caselle.current[i - 1]?.focus();
              if (e.key === "ArrowLeft" && i > 0) caselle.current[i - 1]?.focus();
              if (e.key === "ArrowRight" && i < 5) caselle.current[i + 1]?.focus();
            }}
            style={{ width: 44, textAlign: "center", fontSize: 18, padding: 0 }}
          />
        ))}
      </div>
      <span className="rm-muted">quello che l&apos;app mostra adesso</span>
    </div>
  );
}

export default function TwoFactorAuthPage() {
  usePageTitle("Verifica in due passaggi");
  const { chiedi, dialogo } = useConferma();
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
  const handleVerifyCode = async () => {
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
        setSuccess("Verifica in due passaggi attiva. Conserva i codici di riserva: compaiono una volta sola.");
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
    const ok = await chiedi({
      titolo: "Disattivare la verifica in due passaggi",
      testo: "Per entrare bastera' di nuovo la sola password, e i codici di riserva che hai messo da parte smettono di funzionare.",
      conferma: "Disattiva",
      annulla: "Lascia attiva",
      pericolo: true,
    });
    if (!ok) return;

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
    const ok = await chiedi({
      titolo: "Generare nuovi codici di riserva",
      testo: "I codici di prima smettono subito di funzionare: se li hai stampati o salvati, buttali.",
      conferma: "Genera i nuovi codici",
      annulla: "Tieni quelli di adesso",
      pericolo: true,
    });
    if (!ok) return;
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

  const handleCopyCodes = async () => {
    if (!backupCodes.length) return;
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setSuccess("Codici copiati.");
    } catch {
      setError("Non è stato possibile copiare negli appunti.");
    }
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
        <TestataAzione
          indietro="/dashboard/security"
          occhiello="Sicurezza"
          titolo="Verifica in due passaggi"
        />
        <Contenuto>
          <div className="rm-note rm-note--info">
            La verifica in due passaggi è temporaneamente non disponibile: la
            stiamo completando su tutti i programmi, web e postazione, perché
            funzioni allo stesso modo ovunque.
          </div>
        </Contenuto>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <TestataAzione
          indietro="/dashboard/security"
          occhiello="Sicurezza"
          titolo="Verifica in due passaggi"
        />
        <Contenuto>
          <p className="rm-muted">Lettura dello stato in corso.</p>
        </Contenuto>
      </>
    );
  }

  const enrolling = !!factorId && !verified && !!qrCode;
  const chiaveLeggibile = secret ? secret.replace(/(.{4})/g, "$1 ").trim() : "";

  let azionePrincipale: ReactNode;
  if (verified) {
    azionePrincipale = (
      <button type="button" onClick={handleDisable2FA} disabled={working} className="rm-btn rm-btn--danger">
        <span>Disattiva</span>
      </button>
    );
  } else if (enrolling) {
    azionePrincipale = (
      <button
        type="button"
        onClick={handleVerifyCode}
        disabled={working || verificationCode.length !== 6}
        className="rm-btn rm-btn--primary"
      >
        <span>{working ? "Controllo in corso" : "Attiva"}</span>
      </button>
    );
  } else {
    azionePrincipale = (
      <button type="button" onClick={handleEnable2FA} disabled={working} className="rm-btn rm-btn--primary">
        <span>{working ? "Preparazione in corso" : "Attiva"}</span>
      </button>
    );
  }

  return (
    <>
      <TestataAzione
        indietro="/dashboard/security"
        occhiello="Sicurezza"
        titolo="Verifica in due passaggi"
        sotto="Un codice dall'app di autenticazione a ogni accesso nuovo"
        azioni={azionePrincipale}
      />

      <Contenuto>
        {error && <div className="rm-note rm-note--errore" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="rm-note rm-note--info" style={{ marginBottom: 16 }}>{success}</div>}

        {verified ? (
          <Sezione titolo="Stato" coda={<span className="rm-stato rm-stato--ok">attiva</span>}>
            <Campo etichetta="Accesso">
              <span>Servono la password e il codice che l&apos;app di autenticazione mostra.</span>
            </Campo>
            <Campo etichetta="Codici di riserva">
              <span>
                {backupUnused == null
                  ? "Stato non disponibile."
                  : backupUnused > 0
                    ? `Restano ${backupUnused} codici validi.`
                    : "Nessun codice valido: generane di nuovi."}
              </span>
            </Campo>
          </Sezione>
        ) : (
          <>
            <Sezione titolo="Primo passo, collega l'app">
              <Campo etichetta="Codice QR">
                {enrolling ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <div style={{ padding: 10, background: "#fff", flex: "0 0 auto" }}>
                      {/* Supabase ritorna il QR come SVG data URI */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCode} alt="Codice da inquadrare" style={{ width: 150, height: 150, display: "block" }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p>Inquadra il codice con Google Authenticator, Authy o 1Password.</p>
                      <p className="rm-muted" style={{ marginTop: 4 }}>
                        Oppure scrivi la chiave a mano: <span className="rm-mono">{chiaveLeggibile}</span>
                      </p>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="rm-btn rm-btn--tertiary"
                        style={{ marginTop: 10, height: 30, padding: "0 10px", gap: 0 }}
                      >
                        <span>Copia la chiave</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="rm-muted">
                    Premi Attiva in alto: viene generato il codice da inquadrare.
                  </p>
                )}
              </Campo>
            </Sezione>

            <Sezione titolo="Secondo passo, conferma">
              <Campo etichetta="Codice a 6 cifre">
                <SeiCifre
                  valore={verificationCode}
                  onChange={setVerificationCode}
                  disabilitato={!enrolling || working}
                />
              </Campo>
            </Sezione>
          </>
        )}

        {backupCodes.length > 0 && (
          <Sezione titolo="Codici di riserva">
            <Campo etichetta={`${backupCodes.length} codici`}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span className="rm-mono" style={{ flex: 1, minWidth: 220, wordBreak: "break-word" }}>
                  {backupCodes.join(", ")}
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={handleCopyCodes}
                    className="rm-btn rm-btn--tertiary"
                    style={{ height: 30, padding: "0 10px", gap: 0 }}
                  >
                    <span>Copia</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadBackupCodes}
                    className="rm-btn rm-btn--tertiary"
                    style={{ height: 30, padding: "0 10px", gap: 0 }}
                  >
                    <span>Scarica</span>
                  </button>
                </div>
              </div>
            </Campo>
            <p className="rm-muted" style={{ padding: "10px 16px", textAlign: "center" }}>
              Servono se perdi il telefono. Conservali dove tieni le password. Ognuno vale una volta.
            </p>
          </Sezione>
        )}

        {verified && backupCodes.length === 0 && (
          <Sezione titolo="Codici di riserva">
            <Campo etichetta="Nuovi codici">
              <button
                type="button"
                onClick={handleRegenerateBackupCodes}
                disabled={working}
                className="rm-btn rm-btn--tertiary"
              >
                <span>Genera nuovi codici</span>
              </button>
            </Campo>
          </Sezione>
        )}

        <PiedeModulo
          note="* obbligatori"
          azioni={
            <>
              <Link href="/dashboard/security" className="rm-btn rm-btn--secondary">
                <span>Annulla</span>
              </Link>
              {azionePrincipale}
            </>
          }
        />
      </Contenuto>
      {dialogo}
    </>
  );
}
