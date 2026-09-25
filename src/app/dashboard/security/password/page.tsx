"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Eye, EyeOff } from "lucide-react";
import { Contenuto, PiedeModulo, Sezione, TestataAzione } from "../../_ui/cornice";

/** Riga del modulo: etichetta a sinistra, campo a destra. */
function Campo({
  campo,
  etichetta,
  children,
}: Readonly<{ campo: string; etichetta: string; children: ReactNode }>) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(120px, 190px) minmax(0, 1fr)",
        alignItems: "center",
        gap: 12,
        padding: "8px 16px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <label className="rm-label" htmlFor={campo} style={{ textAlign: "right" }}>
        {etichetta} <span aria-hidden>*</span>
      </label>
      <div style={{ minWidth: 0, maxWidth: 420 }}>{children}</div>
    </div>
  );
}

export default function PasswordPage() {
  usePageTitle("Cambio password");
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

        // Usa la data reale di aggiornamento utente
        if (user.updated_at) {
          const updatedDate = new Date(user.updated_at);
          const diffDays = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
          setLastChanged(diffDays === 0 ? "oggi" : `${diffDays} giorni fa`);
        } else {
          setLastChanged(null);
        }
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

    if (!currentPassword) {
      setError("Inserisci la password attuale");
      setSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Le password non coincidono");
      setSaving(false);
      return;
    }

    if (newPassword === currentPassword) {
      setError("La nuova password deve essere diversa dall'attuale");
      setSaving(false);
      return;
    }

    if (passwordStrength < 60) {
      setError("La password non è abbastanza robusta");
      setSaving(false);
      return;
    }

    try {
      // 1. Verifica la password attuale lato server (Supabase updateUser non
      //    la richiede: chiunque con la sessione potrebbe cambiarla altrimenti).
      const verifyRes = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: currentPassword }),
      });
      const verifyJson = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || !verifyJson.ok) {
        setError(verifyJson.error || "Password attuale non corretta");
        return;
      }

      // 2. Aggiornamento password
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setError(error.message);
        return;
      }

      try {
        await fetch("/api/user/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "password.changed" }),
        });
      } catch { /* non bloccante */ }
      setSuccess("Password aggiornata.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Ricarica updated_at dell'utente per riflettere il cambio nel "Ultimo cambio"
      const { data: { user: fresh } } = await supabase.auth.getUser();
      if (fresh?.updated_at) {
        const diffDays = Math.floor((Date.now() - new Date(fresh.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        setLastChanged(diffDays === 0 ? "oggi" : `${diffDays} giorni fa`);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setError("Errore durante l'aggiornamento della password");
    } finally {
      setSaving(false);
    }
  };

  const robustezza = (strength: number) => {
    if (strength < 40) return "debole";
    if (strength < 70) return "media";
    return "robusta";
  };

  if (loading) {
    return (
      <>
        <TestataAzione indietro="/dashboard/security" occhiello="Sicurezza" titolo="Cambio password" />
        <Contenuto>
          <p className="rm-muted">Caricamento in corso.</p>
        </Contenuto>
      </>
    );
  }

  const nonSalvabile =
    saving || passwordStrength < 60 || newPassword !== confirmPassword || !currentPassword;

  const azioni = (
    <>
      <Link href="/dashboard/security" className="rm-btn rm-btn--secondary">
        <span>Annulla</span>
      </Link>
      <button type="submit" form="modulo-password" disabled={nonSalvabile} className="rm-btn rm-btn--primary">
        <span>{saving ? "Aggiornamento in corso" : "Cambia la password"}</span>
      </button>
    </>
  );

  /** Il pulsante che mostra o nasconde: sta dentro la cornice del campo. */
  const occhio = (visibile: boolean, cambia: () => void) => (
    <button
      type="button"
      onClick={cambia}
      className="rm-btn rm-btn--ghost"
      style={{ height: 38, padding: "0 10px", gap: 0 }}
      aria-label={visibile ? "Nascondi la password" : "Mostra la password"}
    >
      {visibile ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <>
      <TestataAzione
        indietro="/dashboard/security"
        occhiello="Sicurezza"
        titolo="Cambio password"
        sotto={lastChanged ? `Ultimo cambio ${lastChanged}` : "Serve la password attuale"}
        azioni={azioni}
      />

      <Contenuto>
        {error && <div className="rm-note rm-note--errore" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="rm-note rm-note--info" style={{ marginBottom: 16 }}>{success}</div>}

        <form id="modulo-password" onSubmit={handleChangePassword}>
          <Sezione titolo="Nuova password">
            <Campo campo="pwd-attuale" etichetta="Password attuale">
              <div className="rm-prefix">
                <input
                  id="pwd-attuale"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="rm-input"
                  placeholder="Password attuale"
                  autoComplete="current-password"
                  required
                />
                {occhio(showCurrentPassword, () => setShowCurrentPassword(!showCurrentPassword))}
              </div>
            </Campo>

            <Campo campo="pwd-nuova" etichetta="Nuova password">
              <div className="rm-prefix">
                <input
                  id="pwd-nuova"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rm-input"
                  placeholder="Nuova password"
                  autoComplete="new-password"
                  required
                />
                {occhio(showNewPassword, () => setShowNewPassword(!showNewPassword))}
              </div>
              {newPassword && (
                <p className="rm-muted" style={{ marginTop: 6 }}>
                  Robustezza {robustezza(passwordStrength)}.
                  {passwordStrength < 60 && " Serve almeno il livello medio per proseguire."}
                </p>
              )}
            </Campo>

            <Campo campo="pwd-conferma" etichetta="Ripeti la nuova password">
              <div className="rm-prefix">
                <input
                  id="pwd-conferma"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rm-input"
                  placeholder="Ripeti la nuova password"
                  autoComplete="new-password"
                  required
                />
                {occhio(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="rm-stato rm-stato--male" style={{ marginTop: 6 }}>
                  Le password non coincidono
                </p>
              )}
            </Campo>

            <p className="rm-muted" style={{ padding: "10px 16px", textAlign: "center" }}>
              Almeno dodici caratteri, con maiuscole, minuscole, numeri e simboli. Non
              riutilizzare password gia&apos; usate altrove. Le postazioni restano collegate.
            </p>
          </Sezione>
        </form>

        <PiedeModulo note="* obbligatori" azioni={azioni} />
      </Contenuto>
    </>
  );
}
