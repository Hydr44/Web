"use client";

import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Preferenze notifiche utente (email + in-app).
 *
 * Sostituisce la pagina "coming soon". Persistenza in `user_preferences`
 * via `/api/user/preferences`. AUT/billing/support sono attive di default
 * e non disabilitabili per le notifiche di sicurezza critiche.
 */

interface Prefs {
  email_notifications: Record<string, boolean>;
  inapp_notifications: Record<string, boolean>;
  locale: string;
}

const EMAIL_FIELDS: { key: string; label: string; desc: string; locked?: boolean }[] = [
  {
    key: "security",
    label: "Sicurezza",
    desc: "Accessi anomali, cambi password, modifiche alle protezioni. Sempre attiva.",
    locked: true,
  },
  {
    key: "billing",
    label: "Fatturazione",
    desc: "Promemoria di pagamento, fatture, scadenze del canone.",
  },
  {
    key: "support",
    label: "Assistenza",
    desc: "Risposte alle richieste aperte.",
  },
  {
    key: "product_updates",
    label: "Novità del programma",
    desc: "Nuove funzioni e migliorie.",
  },
  {
    key: "marketing",
    label: "Comunicazioni commerciali",
    desc: "Offerte e iniziative. Si possono disdire in ogni momento.",
  },
];

const INAPP_FIELDS: { key: string; label: string; desc: string }[] = [
  { key: "security", label: "Sicurezza", desc: "Avvisi sugli eventi di sicurezza." },
  { key: "billing", label: "Fatturazione", desc: "Promemoria dei pagamenti." },
  { key: "support", label: "Assistenza", desc: "Nuove risposte alle richieste aperte." },
  { key: "system", label: "Servizio", desc: "Manutenzioni e comunicazioni di servizio." },
];

export default function NotificationsSettingsPage() {
  usePageTitle("Notifiche");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/user/preferences");
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) {
          setError(j.error || "Non è stato possibile leggere le preferenze");
        } else {
          setPrefs(j.preferences);
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Errore di rete");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleEmail = (key: string) => {
    if (!prefs) return;
    if (EMAIL_FIELDS.find((f) => f.key === key)?.locked) return;
    setPrefs({
      ...prefs,
      email_notifications: { ...prefs.email_notifications, [key]: !prefs.email_notifications[key] },
    });
  };
  const toggleInApp = (key: string) => {
    if (!prefs) return;
    setPrefs({
      ...prefs,
      inapp_notifications: { ...prefs.inapp_notifications, [key]: !prefs.inapp_notifications[key] },
    });
  };

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const r = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_notifications: prefs.email_notifications,
          inapp_notifications: prefs.inapp_notifications,
          locale: prefs.locale,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setError(j.error || "Non è stato possibile salvare");
        return;
      }
      setPrefs(j.preferences);
      setSuccess("Preferenze salvate.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore di rete");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="rm-area__intesta">
          <h1>Avvisi</h1>
        </div>
        <div className="rm-card">
          <p className="rm-muted">Caricamento delle preferenze.</p>
        </div>
      </>
    );
  }

  if (!prefs) {
    return (
      <>
        <div className="rm-area__intesta">
          <h1>Avvisi</h1>
        </div>
        <div className="rm-note rm-note--errore">
          {error || "Non è stato possibile leggere le preferenze."}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <p className="rm-eyebrow">Impostazioni</p>
          <h1 style={{ marginTop: 8 }}>Avvisi</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Quali email ricevere e quali avvisi mostrare dentro il programma.
            La scelta vale sia sul sito sia sulla postazione.
          </p>
        </div>
        <button onClick={save} disabled={saving} className="rm-btn rm-btn--primary">
          <span>{saving ? "Salvataggio in corso" : "Salva le preferenze"}</span>
        </button>
      </div>

      {error && <div className="rm-note rm-note--errore">{error}</div>}
      {success && <div className="rm-note rm-note--info">{success}</div>}

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Email</h3>
        </div>
        <div className="rm-righe">
          {EMAIL_FIELDS.map((f) => {
            const on = !!prefs.email_notifications[f.key] || f.locked;
            return (
              <div key={f.key} className="rm-riga">
                <span>
                  <label htmlFor={`email-${f.key}`} style={{ cursor: f.locked ? "default" : "pointer" }}>
                    {f.label}
                  </label>
                </span>
                <span className="flex items-start gap-3">
                  <input
                    id={`email-${f.key}`}
                    type="checkbox"
                    checked={on}
                    disabled={f.locked}
                    onChange={() => toggleEmail(f.key)}
                    style={{ accentColor: "var(--brand)", width: 16, height: 16, marginTop: 2 }}
                  />
                  <span className="rm-muted">{f.desc}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Dentro il programma</h3>
        </div>
        <div className="rm-righe">
          {INAPP_FIELDS.map((f) => {
            const on = !!prefs.inapp_notifications[f.key];
            return (
              <div key={f.key} className="rm-riga">
                <span>
                  <label htmlFor={`inapp-${f.key}`} style={{ cursor: "pointer" }}>
                    {f.label}
                  </label>
                </span>
                <span className="flex items-start gap-3">
                  <input
                    id={`inapp-${f.key}`}
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleInApp(f.key)}
                    style={{ accentColor: "var(--brand)", width: 16, height: 16, marginTop: 2 }}
                  />
                  <span className="rm-muted">{f.desc}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
