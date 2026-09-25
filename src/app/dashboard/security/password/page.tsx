"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordPage() {
  usePageTitle("Password");
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
          setLastChanged(diffDays === 0 ? "Oggi" : `${diffDays} giorni fa`);
        } else {
          setLastChanged("Sconosciuto");
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
        setLastChanged(diffDays === 0 ? "Oggi" : `${diffDays} giorni fa`);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setError("Errore durante l'aggiornamento della password");
    } finally {
      setSaving(false);
    }
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 40) return "Debole";
    if (strength < 70) return "Media";
    return "Robusta";
  };

  if (loading) {
    return (
      <>
        <div className="rm-area__intesta">
          <h1>Cambio password</h1>
        </div>
        <div className="rm-card">
          <p className="rm-muted">Caricamento in corso.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <p className="rm-eyebrow">Sicurezza</p>
          <h1 style={{ marginTop: 8 }}>Cambio password</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Ultimo cambio: {lastChanged || "sconosciuto"}.
          </p>
        </div>
        <Link href="/dashboard/security" className="rm-btn rm-btn--ghost">
          <span>Torna a Sicurezza</span>
        </Link>
      </div>

      {error && <div className="rm-note rm-note--errore">{error}</div>}
      {success && <div className="rm-note rm-note--info">{success}</div>}

      <form onSubmit={handleChangePassword}>
        <div className="rm-card">
          <div className="rm-cardhead">
            <h3>Nuova password</h3>
          </div>

          <div className="flex flex-col gap-4" style={{ maxWidth: 460 }}>
            <div className="rm-field">
              <label className="rm-label" htmlFor="pwd-attuale">Password attuale</label>
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
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="rm-btn rm-btn--ghost"
                  style={{ height: 38, padding: "0 10px", gap: 0 }}
                  aria-label={showCurrentPassword ? "Nascondi la password" : "Mostra la password"}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="rm-field">
              <label className="rm-label" htmlFor="pwd-nuova">Nuova password</label>
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
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="rm-btn rm-btn--ghost"
                  style={{ height: 38, padding: "0 10px", gap: 0 }}
                  aria-label={showNewPassword ? "Nascondi la password" : "Mostra la password"}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword && (
                <p className="rm-muted">
                  Robustezza: {getPasswordStrengthText(passwordStrength)}.
                  {passwordStrength < 60 && " Serve almeno il livello Media per proseguire."}
                </p>
              )}
            </div>

            <div className="rm-field">
              <label className="rm-label" htmlFor="pwd-conferma">Conferma la nuova password</label>
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
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="rm-btn rm-btn--ghost"
                  style={{ height: 38, padding: "0 10px", gap: 0 }}
                  aria-label={showConfirmPassword ? "Nascondi la password" : "Mostra la password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="rm-stato rm-stato--male">Le password non coincidono</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={saving || passwordStrength < 60 || newPassword !== confirmPassword || !currentPassword}
                className="rm-btn rm-btn--primary"
              >
                <span>{saving ? "Aggiornamento in corso" : "Cambia la password"}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Come sceglierla</h3>
        </div>
        <div className="rm-righe">
          <div className="rm-riga">
            <span>Lunghezza</span>
            <span>Almeno dodici caratteri</span>
          </div>
          <div className="rm-riga">
            <span>Composizione</span>
            <span>Maiuscole, minuscole, numeri e simboli</span>
          </div>
          <div className="rm-riga">
            <span>Riuso</span>
            <span>Non riutilizzare password già usate altrove</span>
          </div>
        </div>
      </div>
    </>
  );
}
