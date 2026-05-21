"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  Save,
  Shield,
  CreditCard,
  LifeBuoy,
  Sparkles,
  Megaphone,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { SkeletonPage } from "@/components/dashboard/ui/Skeleton";

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

const EMAIL_FIELDS: { key: string; label: string; desc: string; icon: any; locked?: boolean }[] = [
  {
    key: "security",
    label: "Sicurezza",
    desc: "Accessi sospetti, cambi password, modifiche 2FA. Sempre attivo.",
    icon: Shield,
    locked: true,
  },
  {
    key: "billing",
    label: "Fatturazione",
    desc: "Promemoria pagamento, fatture, scadenze abbonamento.",
    icon: CreditCard,
  },
  {
    key: "support",
    label: "Supporto",
    desc: "Risposte ai tuoi ticket e aggiornamenti dal team supporto.",
    icon: LifeBuoy,
  },
  {
    key: "product_updates",
    label: "Aggiornamenti prodotto",
    desc: "Nuove funzionalità e miglioramenti rilevanti.",
    icon: Sparkles,
  },
  {
    key: "marketing",
    label: "Promozioni e novità",
    desc: "Comunicazioni commerciali (puoi disiscriverti in qualsiasi momento).",
    icon: Megaphone,
  },
];

const INAPP_FIELDS: { key: string; label: string; desc: string }[] = [
  { key: "security", label: "Sicurezza", desc: "Notifiche in-app per eventi di sicurezza." },
  { key: "billing", label: "Fatturazione", desc: "Promemoria pagamenti in-app." },
  { key: "support", label: "Supporto", desc: "Nuove risposte ai tuoi ticket." },
  { key: "system", label: "Sistema", desc: "Avvisi di sistema, manutenzione, banner." },
];

export default function NotificationsSettingsPage() {
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
          setError(j.error || "Errore caricamento preferenze");
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
        setError(j.error || "Errore salvataggio");
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
    return <SkeletonPage variant="form" />;
  }

  if (!prefs) {
    return (
      <div className="p-4 rounded bg-red-50 border border-red-200">
        {error || "Impossibile caricare le preferenze."}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <div className="inline-flex items-center gap-2 text-sm rounded-full border border-blue-200 px-4 py-2 mb-4 bg-blue-50 text-blue-600 font-medium">
          <Bell className="h-4 w-4" />
          Notifiche
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Preferenze <span className="text-blue-600">notifiche</span>
        </h1>
        <p className="text-lg text-gray-500">
          Scegli quali email vuoi ricevere e quali notifiche mostrare in-app.
        </p>
      </header>

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

      {/* Email */}
      <section className="p-6 bg-white border border-gray-200 rounded">
        <div className="flex items-center gap-2 mb-5">
          <Mail className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Email</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {EMAIL_FIELDS.map((f) => {
            const Icon = f.icon;
            const on = !!prefs.email_notifications[f.key] || f.locked;
            return (
              <li key={f.key} className="py-3 flex items-center gap-4">
                <div className="w-9 h-9 rounded bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{f.label}</p>
                    {f.locked && (
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                        Sempre attivo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  disabled={f.locked}
                  onClick={() => toggleEmail(f.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    on ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      on ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* In-app */}
      <section className="p-6 bg-white border border-gray-200 rounded">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">In-app</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {INAPP_FIELDS.map((f) => {
            const on = !!prefs.inapp_notifications[f.key];
            return (
              <li key={f.key} className="py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{f.label}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => toggleInApp(f.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    on ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      on ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex items-center justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-gray-900 rounded hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Salvataggio…" : "Salva preferenze"}
        </button>
      </div>
    </div>
  );
}
