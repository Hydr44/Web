"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Contenuto, PiedeModulo, Sezione, TestataAzione } from "../_ui/cornice";

/**
 * Profilo: i dati della persona, non quelli dell'azienda.
 *
 * Il disegno vuole il modulo sempre aperto, con Annulla e Salva in alto e in
 * fondo, e le righe etichetta-campo una sotto l'altra. L'email non si cambia
 * da qui: serve una conferma e si passa da Sicurezza.
 */

/** Riga del modulo: etichetta a sinistra, campo a destra. */
function Campo({
  campo,
  etichetta,
  obbligatorio,
  children,
}: Readonly<{ campo?: string; etichetta: string; obbligatorio?: boolean; children: ReactNode }>) {
  const testo = (
    <>
      {etichetta}
      {obbligatorio && <span aria-hidden> *</span>}
    </>
  );
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(120px, 160px) minmax(0, 1fr)",
        alignItems: "center",
        gap: 12,
        padding: "8px 16px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {campo ? (
        <label className="rm-label" htmlFor={campo} style={{ textAlign: "right" }}>
          {testo}
        </label>
      ) : (
        <span className="rm-label" style={{ textAlign: "right" }}>
          {testo}
        </span>
      )}
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

const DATA_LUNGA: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

export default function ProfilePage() {
  usePageTitle("Profilo");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userData, setUserData] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    website: "",
    timezone: "Europe/Rome",
    language: "it",
    avatar_url: "",
    created_at: "",
    last_login: ""
  });
  const [emailConfermata, setEmailConfermata] = useState(false);
  const [ultimoAccesso, setUltimoAccesso] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    bio: "",
    website: "",
    timezone: "Europe/Rome",
    language: "it"
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = supabaseBrowser();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("Error getting user:", userError);
          setLoading(false);
          return;
        }

        setEmailConfermata(!!(user.email_confirmed_at || user.confirmed_at));
        setUltimoAccesso(user.last_sign_in_at ?? null);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setUserData({
            full_name: profile.full_name || "",
            email: user.email || "",
            phone: profile.phone || "",
            location: profile.location || "",
            bio: profile.bio || "",
            website: profile.website || "",
            timezone: profile.timezone || "Europe/Rome",
            language: profile.language || "it",
            avatar_url: profile.avatar_url || "",
            created_at: profile.created_at || "",
            last_login: profile.last_login || ""
          });

          setFormData({
            full_name: profile.full_name || "",
            phone: profile.phone || "",
            location: profile.location || "",
            bio: profile.bio || "",
            website: profile.website || "",
            timezone: profile.timezone || "Europe/Rome",
            language: profile.language || "it"
          });
        }

      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSave = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        setError("Non e' stato possibile salvare i dati.");
        return;
      }

      setUserData(prev => ({ ...prev, ...formData }));
      setSuccess("Dati salvati.");
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Non e' stato possibile salvare i dati.");
    } finally {
      setSaving(false);
    }
  }, [formData]);

  const handleCancel = useCallback(() => {
    setFormData({
      full_name: userData.full_name,
      phone: userData.phone,
      location: userData.location,
      bio: userData.bio,
      website: userData.website,
      timezone: userData.timezone,
      language: userData.language
    });
    setError(null);
    setSuccess(null);
  }, [userData]);

  // Le scorciatoie scritte nel piede del modulo.
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleSave();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    };
    document.addEventListener("keydown", tasto);
    return () => document.removeEventListener("keydown", tasto);
  }, [handleSave, handleCancel]);

  if (loading) {
    return (
      <>
        <TestataAzione indietro="/dashboard" occhiello="Account" titolo="Profilo" />
        <Contenuto>
          <p className="rm-muted">Caricamento dei dati del profilo.</p>
        </Contenuto>
      </>
    );
  }

  const azioni = (
    <>
      <button type="button" onClick={handleCancel} disabled={saving} className="rm-btn rm-btn--secondary">
        <span>Annulla</span>
      </button>
      <button type="button" onClick={handleSave} disabled={saving} className="rm-btn rm-btn--primary">
        <span>{saving ? "Salvataggio in corso" : "Salva"}</span>
      </button>
    </>
  );

  const attivaDal = userData.created_at
    ? `Utenza attiva dal ${new Date(userData.created_at).toLocaleDateString("it-IT", DATA_LUNGA)}`
    : null;

  return (
    <>
      <TestataAzione
        indietro="/dashboard"
        occhiello="Account"
        titolo="Profilo"
        sotto={
          <>
            I tuoi dati personali, non quelli dell&apos;azienda
            {attivaDal && <span style={{ marginLeft: 16 }}>{attivaDal}</span>}
          </>
        }
        azioni={azioni}
      />

      <Contenuto>
        {error && <div className="rm-note rm-note--errore" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="rm-note rm-note--info" style={{ marginBottom: 16 }}>{success}</div>}

        <Sezione titolo="Dati personali">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <Campo campo="prof-nome" etichetta="Nome e cognome" obbligatorio>
              <input
                type="text"
                id="prof-nome"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="rm-input"
                placeholder="Nome e cognome"
                disabled={saving}
              />
            </Campo>

            <Campo campo="prof-telefono" etichetta="Telefono">
              <input
                type="tel"
                id="prof-telefono"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    // accetta solo cifre, +, -, spazio (max 20 caratteri)
                    phone: e.target.value.replace(/[^\d+\s-]/g, "").slice(0, 20),
                  }))
                }
                className="rm-input"
                placeholder="+39 333 1234567"
                pattern="[+0-9][0-9\s\-]{6,19}"
                inputMode="tel"
                autoComplete="tel"
                title="Numero di telefono valido, ad esempio +39 333 1234567"
                disabled={saving}
              />
            </Campo>

            <Campo campo="prof-localita" etichetta="Localita'">
              <input
                type="text"
                id="prof-localita"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="rm-input"
                placeholder="Gela"
                disabled={saving}
              />
            </Campo>

            <Campo campo="prof-fuso" etichetta="Fuso orario">
              <select
                id="prof-fuso"
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="rm-input"
                disabled={saving}
              >
                <option value="Europe/Rome">Italia, Europa/Roma</option>
                <option value="Europe/London">Europa/Londra</option>
                <option value="Europe/Paris">Europa/Parigi</option>
                <option value="Europe/Berlin">Europa/Berlino</option>
                <option value="Europe/Madrid">Europa/Madrid</option>
              </select>
            </Campo>
          </div>

          <Campo campo="prof-sito" etichetta="Sito internet">
            <input
              type="url"
              id="prof-sito"
                value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="rm-input"
              placeholder="https://"
              disabled={saving}
            />
          </Campo>

          <Campo campo="prof-note" etichetta="Note">
            <input
              type="text"
              id="prof-note"
                value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="rm-input"
              placeholder="Ruolo, reparto, riferimenti interni"
              disabled={saving}
            />
          </Campo>
        </Sezione>

        <Sezione titolo="Accesso">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <Campo etichetta="Email">
              <span>
                {userData.email}
                <span className="rm-muted" style={{ marginLeft: 10 }}>
                  {emailConfermata ? "confermata" : "da confermare"}
                </span>
              </span>
            </Campo>

            <Campo etichetta="Ultimo accesso">
              <span>
                {ultimoAccesso
                  ? new Date(ultimoAccesso).toLocaleString("it-IT", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : userData.last_login
                    ? new Date(userData.last_login).toLocaleDateString("it-IT", DATA_LUNGA)
                    : "Nessun accesso registrato"}
              </span>
            </Campo>
          </div>
          <p className="rm-muted" style={{ padding: "10px 16px", textAlign: "center" }}>
            L&apos;email non si cambia da qui: va in Sicurezza, perche&apos; serve una conferma.
          </p>
        </Sezione>

        <PiedeModulo
          note={
            <>
              * obbligatori
              <span style={{ marginLeft: 16 }}>Ctrl S salva</span>
              <span style={{ marginLeft: 16 }}>Esc esci</span>
            </>
          }
          azioni={azioni}
        />
      </Contenuto>
    </>
  );
}
