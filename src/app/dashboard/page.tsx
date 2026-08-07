"use client";

import Link from "next/link";
import {
  ArrowRight,
  Download,
  Building2,
  CreditCard,
  Shield as ShieldIcon,
  HeadphonesIcon,
  Settings,
  FileText,
  CheckCircle,
  Clock,
  Gauge,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { planProfileName, planMonthlyEur, complianceModuleLabels } from "@/lib/plans";

interface DashInvoice {
  id: string;
  number: string | null;
  date: string | null;
  total: number;
  currency: string;
  payment_status: string | null;
}

export default function DashboardPanoramica() {
  usePageTitle("Panoramica");
  const [currentOrg, setCurrentOrg] = useState<string>("RescueManager");
  const [loading, setLoading] = useState(true);
  const [hasOrganization, setHasOrganization] = useState<boolean>(true);
  const [subscription, setSubscription] = useState({
    status: "active",
    planProfile: "—",
    includes: "Gestionale completo",
    renewalDate: null as string | null,
    priceEur: null as number | null,
    isTrial: false,
  });
  const [orgInfo, setOrgInfo] = useState<{
    vat?: string;
    city?: string;
    province?: string;
    ibanLast4?: string;
    bankName?: string;
  }>({});
  const [invoices, setInvoices] = useState<DashInvoice[]>([]);
  const [latestDesktopVersion, setLatestDesktopVersion] = useState<string | null>(null);
  const [limits, setLimits] = useState<Record<string, number | boolean | string | null> | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const supabase = supabaseBrowser();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setCurrentOrg("RescueManager");
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("current_org")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.current_org) {
          setHasOrganization(false);
          setCurrentOrg("Nessuna organizzazione");
          setLoading(false);
          return;
        }

        const { data: org } = await supabase
          .from("orgs")
          .select("name")
          .eq("id", profile.current_org)
          .maybeSingle();
        setCurrentOrg(org?.name || "Organizzazione");

        // Moduli attivi PRIMA (servono al nome-profilo del piano).
        const { data: mods } = await supabase
          .from("org_modules")
          .select("module")
          .eq("org_id", profile.current_org)
          .eq("status", "active");
        const modKeys = (mods || []).map((m) => m.module);

        // Abbonamento — usa la colonna reale `plan` (NON plan_name, che non esiste).
        const { data: sub } = await supabase
          .from("org_subscriptions")
          .select("status, plan, current_period_end, trial_end, is_custom, custom_price")
          .eq("org_id", profile.current_org)
          .maybeSingle();

        if (sub) {
          const includes = complianceModuleLabels(modKeys);
          setSubscription({
            status: sub.status || "active",
            planProfile: planProfileName(sub.plan, modKeys),
            includes: includes.length ? `Gestionale + ${includes.join(", ")}` : "Gestionale completo",
            renewalDate: sub.current_period_end
              ? new Date(sub.current_period_end).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
              : null,
            priceEur: planMonthlyEur(sub.plan, sub.is_custom, sub.custom_price),
            isTrial: sub.status === "trial",
          });
        }

        // Info anagrafica sintetica (org_settings.company).
        const { data: companyRow } = await supabase
          .from("org_settings")
          .select("value")
          .eq("org_id", profile.current_org)
          .eq("key", "company")
          .maybeSingle();
        const c = companyRow?.value || {};
        const iban = (c.iban || "").replace(/\s+/g, "");
        setOrgInfo({
          vat: c.vat || "",
          city: c.address?.city || "",
          province: c.address?.province || "",
          ibanLast4: iban.length >= 4 ? iban.slice(-4) : "",
          bankName: c.bank_name || "",
        });

        // Ultime fatture fiscali RM emesse al cliente (via route service-role).
        try {
          const r = await fetch("/api/dashboard/invoices");
          const j = await r.json().catch(() => ({}));
          if (r.ok && j.ok) setInvoices((j.invoices || []).slice(0, 4));
        } catch { /* opzionale */ }

        // Limiti effettivi del piano (override cliente sopra default piano). Fase 1: solo inclusi.
        try {
          const r = await fetch("/api/dashboard/usage");
          const j = await r.json().catch(() => ({}));
          if (r.ok && j.ok && j.limits) setLimits(j.limits);
        } catch { /* opzionale */ }

        // Ultima versione desktop.
        const { data: relRow } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "app_release_mac_arm64_dmg")
          .maybeSingle();
        if (relRow?.value && typeof relRow.value === "object" && "version" in relRow.value) {
          setLatestDesktopVersion(String((relRow.value as { version: string }).version));
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setCurrentOrg("RescueManager");
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingPage />;
  }

  if (!hasOrganization) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 mx-auto mb-6">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Benvenuto in RescueManager!</h1>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">
            Per iniziare, crea la tua organizzazione. Ti permetterà di gestire la tua attività.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Inizia l&apos;onboarding
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Benvenuto in {currentOrg}</p>
      </div>

      {/* Abbonamento operativo */}
      <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-slate-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center border border-blue-100 bg-white text-blue-600 shadow-sm">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{subscription.planProfile}</h2>
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${
                    subscription.isTrial
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : subscription.status === "active"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  {subscription.isTrial ? "In prova" : subscription.status === "active" ? "Attivo" : subscription.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{subscription.includes}</p>
            </div>
          </div>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1.5 border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Gestisci <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 divide-x divide-slate-100 sm:grid-cols-3">
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Importo</p>
            <p className="mt-0.5 font-semibold text-slate-900">
              {subscription.priceEur != null ? `€ ${subscription.priceEur.toFixed(0)}` : "—"}
              {subscription.priceEur != null && <span className="text-xs font-normal text-slate-400"> /mese</span>}
            </p>
          </div>
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Prossimo rinnovo</p>
            <p className="mt-0.5 font-semibold text-slate-900">{subscription.renewalDate || "—"}</p>
          </div>
          <div className="col-span-2 border-t border-slate-100 p-4 sm:col-span-1 sm:border-t-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Stato</p>
            <p className="mt-0.5 font-semibold text-slate-900">
              {subscription.isTrial ? "In prova" : subscription.status === "active" ? "Attivo" : subscription.status}
            </p>
          </div>
        </div>
      </div>

      {/* Utilizzi e limiti del piano */}
      {limits && (
        <div className="border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Gauge className="h-4 w-4 text-slate-400" /> Utilizzi e limiti del piano
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {[
              { label: "Archivio", value: limits.storage_gb != null ? `${limits.storage_gb} GB` : "—" },
              { label: "Foto in linea", value: limits.photo_months != null ? `${limits.photo_months} mesi` : "—" },
              { label: "Compilazione auto.", value: limits.autocompile_month != null ? `${limits.autocompile_month} /mese` : "—" },
              { label: "SMS", value: limits.sms_month != null ? `${limits.sms_month} /mese` : "—" },
              { label: "Consulente IA", value: limits.ai_included ? (limits.ai_budget_eur != null ? `€ ${limits.ai_budget_eur} /mese` : "Incluso") : "Non incluso" },
              { label: "Documenti per posta", value: limits.postal_year != null ? `${limits.postal_year} /anno` : "—" },
              { label: "Sedi", value: limits.sites != null ? String(limits.sites) : "—" },
            ].map((m) => (
              <div key={m.label} className="border-b border-r border-slate-100 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{m.label}</p>
                <p className="mt-0.5 font-semibold text-slate-900">{m.value}</p>
              </div>
            ))}
          </div>
          <div className="px-5 py-2.5 text-[11px] text-slate-400">
            Limiti inclusi nel tuo piano. Il monitoraggio dei consumi in tempo reale arriverà a breve.
          </div>
        </div>
      )}

      {/* Ultime fatture */}
      <div className="border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FileText className="h-4 w-4 text-slate-400" /> Ultime fatture
          </h2>
          <Link href="/dashboard/invoices" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
            Vedi tutte <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {invoices.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">Nessuna fattura emessa al momento.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const paid = inv.payment_status === "paid";
              return (
                <li key={inv.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-slate-700">{inv.number || inv.id}</p>
                    <p className="text-xs text-slate-400">
                      {inv.date ? new Date(inv.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">
                      {new Intl.NumberFormat("it-IT", { style: "currency", currency: inv.currency || "EUR" }).format(inv.total || 0)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-medium ${
                        paid ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {paid ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {paid ? "Pagata" : "Da pagare"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Info organizzazione */}
      <div className="border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-slate-500">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-900 mb-1">{currentOrg}</h2>
            {orgInfo.vat || orgInfo.city || orgInfo.ibanLast4 ? (
              <div className="text-xs text-slate-500 mb-3 space-x-3">
                {orgInfo.vat && <span>P.IVA <span className="font-mono text-slate-700">{orgInfo.vat}</span></span>}
                {orgInfo.city && (
                  <span>Sede <span className="text-slate-700">{orgInfo.city}{orgInfo.province ? ` (${orgInfo.province})` : ""}</span></span>
                )}
                {orgInfo.ibanLast4 && (
                  <span>IBAN <span className="font-mono text-slate-700">****{orgInfo.ibanLast4}</span>
                    {orgInfo.bankName && <span className="text-slate-500"> · {orgInfo.bankName}</span>}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-3">
                Le funzionalità operative (soccorso, trasporti, mezzi) sono nell&apos;app desktop. Da qui gestisci abbonamento, fatture, supporto e download.
              </p>
            )}
            <Link href="/dashboard/org" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline">
              Dettagli organizzazione <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* App Desktop */}
      {latestDesktopVersion && (
        <div className="border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-emerald-100 bg-emerald-50 text-emerald-600">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-bold text-slate-900">App desktop</h2>
                <span className="border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-mono font-medium text-emerald-700">
                  v{latestDesktopVersion}
                </span>
              </div>
              <p className="text-sm text-slate-500 mb-3">
                Ultima versione per macOS e Windows. Se hai già l&apos;app, l&apos;aggiornamento parte da solo al prossimo avvio.
              </p>
              <Link href="/dashboard/download" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline">
                Scarica l&apos;app <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Link rapidi */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Gestione Account</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            { href: "/dashboard/invoices", icon: FileText, title: "Fatture", desc: "Scarica le tue fatture (PDF/XML)" },
            { href: "/dashboard/billing", icon: CreditCard, title: "Abbonamento", desc: "Piano, moduli e pagamenti" },
            { href: "/dashboard/support", icon: HeadphonesIcon, title: "Supporto", desc: "Richiedi assistenza tecnica" },
            { href: "/dashboard/org", icon: Building2, title: "Organizzazione", desc: "Visualizza e modifica dati aziendali" },
            { href: "/dashboard/security", icon: ShieldIcon, title: "Sicurezza", desc: "Password, 2FA e sessioni attive" },
            { href: "/dashboard/settings/notifications", icon: Settings, title: "Notifiche", desc: "Preferenze email e in-app" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
            >
              <div className="mr-3 flex h-9 w-9 items-center justify-center border border-slate-200 bg-slate-50">
                <a.icon className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-400">{a.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
