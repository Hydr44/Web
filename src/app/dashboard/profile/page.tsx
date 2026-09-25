"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function ProfilePage() {
  usePageTitle("Profilo");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
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

  const handleSave = async () => {
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
        return;
      }

      setUserData(prev => ({ ...prev, ...formData }));
      setEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: userData.full_name,
      phone: userData.phone,
      location: userData.location,
      bio: userData.bio,
      website: userData.website,
      timezone: userData.timezone,
      language: userData.language
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <>
        <div className="rm-area__intesta">
          <h1>Profilo</h1>
        </div>
        <div className="rm-card">
          <p className="rm-muted">Caricamento dei dati del profilo.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <h1>Profilo</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Dati della persona che usa questa utenza.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {editing ? (
            <>
              <button onClick={handleSave} className="rm-btn rm-btn--primary">
                <span>Salva</span>
              </button>
              <button onClick={handleCancel} className="rm-btn rm-btn--secondary">
                <span>Annulla</span>
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="rm-btn rm-btn--secondary">
              <span>Modifica</span>
            </button>
          )}
        </div>
      </div>

      <div className="rm-card">
        <div className="rm-cardhead">
          <h2>{userData.full_name || "Nome non indicato"}</h2>
          <span className="rm-muted">{userData.email}</span>
        </div>
        <div className="rm-righe">
          <div className="rm-riga">
            <span>Utenza attiva dal</span>
            <span>
              {userData.created_at
                ? new Date(userData.created_at).toLocaleDateString("it-IT")
                : "—"}
            </span>
          </div>
          <div className="rm-riga">
            <span>Ultimo accesso</span>
            <span>
              {userData.last_login
                ? new Date(userData.last_login).toLocaleDateString("it-IT")
                : "Nessun accesso registrato"}
            </span>
          </div>
        </div>
      </div>

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Dati personali</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rm-field">
            <label className="rm-label">Nome e cognome</label>
            {editing ? (
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="rm-input"
                placeholder="Nome e cognome"
              />
            ) : (
              <p>{userData.full_name || "Non indicato"}</p>
            )}
          </div>

          <div className="rm-field">
            <label className="rm-label">Email</label>
            <input
              type="email"
              className="rm-input"
              value={userData.email}
              readOnly
              disabled
              title="L'email non si cambia dal profilo"
            />
            <p className="rm-muted">
              L&apos;email è legata alle credenziali di accesso. Per cambiarla
              apri una richiesta all&apos;assistenza.
            </p>
          </div>

          <div className="rm-field">
            <label className="rm-label">Telefono</label>
            {editing ? (
              <input
                type="tel"
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
              />
            ) : (
              <p>{userData.phone || "Non indicato"}</p>
            )}
          </div>

          <div className="rm-field">
            <label className="rm-label">Località</label>
            {editing ? (
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="rm-input"
                placeholder="Milano"
              />
            ) : (
              <p>{userData.location || "Non indicata"}</p>
            )}
          </div>

          <div className="rm-field">
            <label className="rm-label">Sito internet</label>
            {editing ? (
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="rm-input"
                placeholder="https://"
              />
            ) : userData.website ? (
              <p>
                <a href={userData.website} target="_blank" rel="noopener noreferrer">
                  {userData.website}
                </a>
              </p>
            ) : (
              <p>Non indicato</p>
            )}
          </div>

          <div className="rm-field">
            <label className="rm-label">Fuso orario</label>
            {editing ? (
              <select
                value={formData.timezone}
                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                className="rm-input"
              >
                <option value="Europe/Rome">Italia — Europa/Roma (GMT+1)</option>
                <option value="Europe/London">Europa/Londra (GMT+0)</option>
                <option value="Europe/Paris">Europa/Parigi (GMT+1)</option>
                <option value="Europe/Berlin">Europa/Berlino (GMT+1)</option>
                <option value="Europe/Madrid">Europa/Madrid (GMT+1)</option>
              </select>
            ) : (
              <p>{userData.timezone}</p>
            )}
          </div>
        </div>

        <div className="rm-sep" />

        <div className="rm-field">
          <label className="rm-label">Note</label>
          {editing ? (
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="rm-input"
              placeholder="Ruolo, reparto, riferimenti interni"
            />
          ) : (
            <p>{userData.bio || "Nessuna nota"}</p>
          )}
        </div>
      </div>
    </>
  );
}
