"use client";

import { useState, useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Contenuto, DueColonne, Testata } from "../../_ui/cornice";

/**
 * Preferenze di avviso dell'utente: email e avvisi dentro il programma.
 *
 * Persistenza in `user_preferences` via `/api/user/preferences`. Gli avvisi di
 * sicurezza restano sempre accesi e non si possono togliere.
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
    label: "Novita' del programma",
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

/** Riga con la casella di spunta a destra, come le altre righe del portale. */
function RigaSpunta({
  campo,
  etichetta,
  descrizione,
  acceso,
  bloccato,
  onCambia,
}: Readonly<{
  campo: string;
  etichetta: string;
  descrizione: string;
  acceso: boolean;
  bloccato?: boolean;
  onCambia: () => void;
}>) {
  return (
    <div className="rm-riga">
      <span>
        <label htmlFor={campo} style={{ cursor: bloccato ? "default" : "pointer" }}>
          {etichetta}
        </label>
        <br />
        <span className="rm-muted">{descrizione}</span>
      </span>
      <span style={{ textAlign: "right" }}>
        <input
          id={campo}
          type="checkbox"
          checked={acceso}
          disabled={bloccato}
          onChange={onCambia}
        />
      </span>
    </div>
  );
}

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
        <Testata titolo="Notifiche" sotto="Quali email ricevere e quali avvisi mostrare" />
        <Contenuto>
          <p className="rm-muted">Caricamento delle preferenze.</p>
        </Contenuto>
      </>
    );
  }

  if (!prefs) {
    return (
      <>
        <Testata titolo="Notifiche" sotto="Quali email ricevere e quali avvisi mostrare" />
        <Contenuto>
          <div className="rm-note rm-note--errore">
            {error || "Non è stato possibile leggere le preferenze."}
          </div>
        </Contenuto>
      </>
    );
  }

  return (
    <>
      <Testata
        titolo="Notifiche"
        sotto="Quali email ricevere e quali avvisi mostrare. La scelta vale sul sito e sulla postazione."
        azioni={
          <button type="button" onClick={save} disabled={saving} className="rm-btn rm-btn--primary">
            <span>{saving ? "Salvataggio in corso" : "Salva"}</span>
          </button>
        }
      />

      <Contenuto>
        {error && <div className="rm-note rm-note--errore" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="rm-note rm-note--info" style={{ marginBottom: 16 }}>{success}</div>}

        <DueColonne
          principale={
            <section className="rm-card">
              <div className="rm-cardhead">
                <h2 style={{ fontSize: 14 }}>Email</h2>
              </div>
              <div className="rm-righe">
                {EMAIL_FIELDS.map((f) => (
                  <RigaSpunta
                    key={f.key}
                    campo={`email-${f.key}`}
                    etichetta={f.label}
                    descrizione={f.desc}
                    acceso={!!prefs.email_notifications[f.key] || !!f.locked}
                    bloccato={f.locked}
                    onCambia={() => toggleEmail(f.key)}
                  />
                ))}
              </div>
            </section>
          }
          laterale={
            <section className="rm-card">
              <div className="rm-cardhead">
                <h2 style={{ fontSize: 14 }}>Dentro il programma</h2>
              </div>
              <div className="rm-righe">
                {INAPP_FIELDS.map((f) => (
                  <RigaSpunta
                    key={f.key}
                    campo={`inapp-${f.key}`}
                    etichetta={f.label}
                    descrizione={f.desc}
                    acceso={!!prefs.inapp_notifications[f.key]}
                    onCambia={() => toggleInApp(f.key)}
                  />
                ))}
              </div>
            </section>
          }
        />
      </Contenuto>
    </>
  );
}
