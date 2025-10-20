// src/components/dashboard/settings/SettingsClient.tsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Check, Loader2, Shield, Globe, Bell, Building2, User, Mail, KeyRound, TriangleAlert, Save } from "lucide-react";

type Profile = {
  user_id: string;
  full_name: string | null;
  company_name: string | null;
  vat_number: string | null;
  billing_address: string | null;
  phone: string | null;
  locale: string | null;
  timezone: string | null;
  notifications: any | null;
};

export default function SettingsClient({
  userId,
  email,
  initialProfile,
}: {
  userId: string;
  email: string;
  initialProfile: Profile | null;
}) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [pending, startTransition] = useTransition();

  // form state
  const [fullName, setFullName] = useState(initialProfile?.full_name ?? "");
  const [phone, setPhone] = useState(initialProfile?.phone ?? "");
  const [company, setCompany] = useState(initialProfile?.company_name ?? "");
  const [vat, setVat] = useState(initialProfile?.vat_number ?? "");
  const [addr, setAddr] = useState(initialProfile?.billing_address ?? "");
  const [locale, setLocale] = useState(initialProfile?.locale ?? "it-IT");
  const [tz, setTz] = useState(initialProfile?.timezone ?? "Europe/Rome");
  const [notifBilling, setNotifBilling] = useState<boolean>(
    initialProfile?.notifications?.billing ?? true
  );
  const [notifAlerts, setNotifAlerts] = useState<boolean>(
    initialProfile?.notifications?.alerts ?? true
  );

  // sicurezza
  const [newEmail, setNewEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");

  // feedback
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!initialProfile) {
      // se il profilo non esiste, lo creeremo al primo salvataggio
    }
  }, [initialProfile]);

  const saveProfile = async () => {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: userId,
          full_name: fullName || null,
          phone: phone || null,
          company_name: company || null,
          vat_number: vat || null,
          billing_address: addr || null,
          locale,
          timezone: tz,
          notifications: { billing: notifBilling, alerts: notifAlerts },
        })
        .eq("user_id", userId);
      if (error) {
        setErr(error.message);
      } else {
        setMsg("Impostazioni salvate ✅");
      }
    });
  };

  const updateEmail = async () => {
    setMsg(null);
    setErr(null);
    if (!newEmail || newEmail === email) {
      setErr("Inserisci una nuova email diversa da quella attuale.");
      return;
    }
    startTransition(async () => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
        options: { emailRedirectTo: `${origin}/dashboard/settings` },
      });
      if (error) {
        setErr(error.message);
      } else {
        setMsg(
          "Email aggiornata. Controlla la casella per confermare la modifica."
        );
      }
    });
  };

  const updatePassword = async () => {
    setMsg(null);
    setErr(null);
    if (!pass || pass.length < 8) {
      setErr("La password deve avere almeno 8 caratteri.");
      return;
    }
    if (pass !== pass2) {
      setErr("Le password non coincidono.");
      return;
    }
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) setErr(error.message);
      else setMsg("Password aggiornata ✅");
      setPass("");
      setPass2("");
    });
  };

  return (
    <div className="space-y-8">
      {/* feedback */}
      {(msg || err) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            err ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {err || msg}
        </div>
      )}

      {/* PROFILO */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-2 text-gray-800 font-medium">
          <User className="h-5 w-5" /> Profilo & contatti
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-600">Nome e cognome</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Mario Rossi"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Telefono</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+39 ..."
            />
          </div>
        </div>
      </section>

      {/* AZIENDA / FATTURAZIONE */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-2 text-gray-800 font-medium">
          <Building2 className="h-5 w-5" /> Dati azienda & fatturazione
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-600">Ragione sociale</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Rescue Srl"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">P.IVA / CF</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={vat}
              onChange={(e) => setVat(e.target.value)}
              placeholder="IT00000000000"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Indirizzo fatturazione</label>
            <textarea
              className="mt-1 w-full rounded-lg border px-3 py-2"
              rows={3}
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="Via…, CAP, Città, Provincia"
            />
          </div>
        </div>
      </section>

      {/* PREFERENZE */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-2 text-gray-800 font-medium">
          <Globe className="h-5 w-5" /> Preferenze
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-600">Lingua</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              <option value="it-IT">Italiano</option>
              <option value="en-US">English</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Fuso orario</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              placeholder="Europe/Rome"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 text-gray-800 font-medium">
            <Bell className="h-5 w-5" /> Notifiche
          </div>
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifBilling}
                onChange={(e) => setNotifBilling(e.target.checked)}
              />
              Email di fatturazione (pagamenti, ricevute)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifAlerts}
                onChange={(e) => setNotifAlerts(e.target.checked)}
              />
              Avvisi operativi (errori integrazioni, ecc.)
            </label>
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={pending}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white text-sm disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salva impostazioni
        </button>
      </section>

      {/* SICUREZZA */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-2 text-gray-800 font-medium">
          <Shield className="h-5 w-5" /> Sicurezza
        </div>

        {/* cambio email */}
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <div>
            <label className="text-sm text-gray-600">Email attuale</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2 bg-gray-50" value={email} disabled />
          </div>
          <div />
          <div>
            <label className="text-sm text-gray-600">Nuova email</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nuova@email.it"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={updateEmail}
              disabled={pending}
              className="rounded-lg ring-1 ring-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              Aggiorna email
            </button>
          </div>
        </div>

        {/* cambio password */}
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="text-sm text-gray-600">Nuova password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Min. 8 caratteri"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Conferma password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
              placeholder="Ripeti password"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={updatePassword}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg ring-1 ring-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" /> Aggiorna password
            </button>
          </div>
        </div>
      </section>

      {/* DANGER ZONE (placeholder) */}
      <section className="rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-2 text-red-700 font-medium">
          <TriangleAlert className="h-5 w-5" /> Zona pericolosa
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Disattiva l’account o richiedi l’esportazione dei dati. (Funzione in arrivo: al momento contattaci).
        </p>
        <a
          href="mailto:info@rescuemanager.eu"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white text-sm"
        >
          Richiedi disattivazione
        </a>
      </section>
    </div>
  );
}
