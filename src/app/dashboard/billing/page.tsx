// src/app/dashboard/billing/page.tsx
import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileText,
  Truck,
  BookOpen,
  Calculator,
  Package,
  Check,
} from "lucide-react";
import { planProfileName, complianceModuleLabels, planMonthlyEur } from "@/lib/plans";

export const dynamic = "force-dynamic";

const MODULES = [
  { key: "sdi", name: "Fatturazione (SDI)", desc: "Fatturazione elettronica", Icon: FileText },
  { key: "rvfu", name: "Demolizioni (RVFU)", desc: "Demolizioni MIT", Icon: Truck },
  { key: "rentri", name: "RENTRI", desc: "Registro Rifiuti", Icon: BookOpen },
  { key: "contabilita", name: "Contabilità", desc: "Prima nota e conti", Icon: Calculator },
];

export default async function BillingPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ status?: string; err?: string; session_id?: string }>;
}>) {
  const sp = await searchParams;
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/dashboard/billing");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, current_org")
    .eq("id", user.id)
    .single();

  let userOrgId = profile?.current_org || null;
  if (!userOrgId) {
    const { data: mem } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    userOrgId = mem?.org_id || null;
  }

  // Solo owner può accedere a fatturazione/abbonamento (server-side guard)
  if (userOrgId) {
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", userOrgId)
      .maybeSingle();
    if (!membership || membership.role !== "owner") {
      redirect("/dashboard?err=role_forbidden_billing");
    }
  }

  let subscription: any = null;
  if (userOrgId) {
    const { data: orgSub } = await supabase
      .from("org_subscriptions")
      .select("*")
      .eq("org_id", userOrgId)
      .maybeSingle();
    subscription = orgSub;
  }

  let activeModules: string[] = [];
  if (userOrgId) {
    const { data: mods } = await supabase
      .from("org_modules")
      .select("module")
      .eq("org_id", userOrgId)
      .eq("status", "active");
    activeModules = (mods || []).map((m) => m.module);
  }

  const hasStripeCustomer = !!profile?.stripe_customer_id;
  const isTrial = subscription?.status === "trial";
  const isActive = subscription && (subscription.status === "active" || subscription.status === "trial");
  const hasActivePlan = !!subscription?.plan && isActive;

  // Nome "profilo" derivato dai moduli attivi (Soccorso e trasporti / Autodemolitore / Completo)
  const profileName = hasActivePlan ? planProfileName(subscription.plan, activeModules) : null;
  const includes = complianceModuleLabels(activeModules);
  const includesLabel = includes.length ? `Gestionale + ${includes.join(", ")}` : "Gestionale completo";
  const priceEur = hasActivePlan
    ? planMonthlyEur(subscription.plan, subscription.is_custom, subscription.custom_price)
    : null;

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Abbonamento</h1>
        <p className="mt-1 text-slate-500">
          Il tuo piano, i moduli attivi e il portale di fatturazione.
        </p>
      </div>

      {/* Success / Error */}
      {sp.status === "success" && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <span className="font-semibold text-emerald-800">Abbonamento attivato</span>
            <p className="mt-0.5 text-sm text-emerald-700/80">Il tuo piano è ora attivo. Buon lavoro!</p>
          </div>
        </div>
      )}
      {sp.err && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <div>
            <span className="font-semibold text-red-800">Errore</span>
            <p className="mt-0.5 text-sm text-red-700/80">
              {sp.err === "missing_price"
                ? "Prezzo non configurato. Contatta il supporto."
                : "Si è verificato un errore. Riprova più tardi."}
            </p>
          </div>
        </div>
      )}

      {/* Piano attuale */}
      {hasActivePlan ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50/60 to-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{profileName}</h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                        isTrial
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" /> {isTrial ? "In prova" : "Attivo"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{includesLabel}</p>
                </div>
              </div>
              {hasStripeCustomer && (
                <Link
                  href="/api/billing/portal"
                  prefetch={false}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
                >
                  <CreditCard className="h-4 w-4" />
                  Gestisci pagamento
                </Link>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Importo</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {priceEur != null ? `€ ${priceEur.toFixed(0)}` : "—"}
                {priceEur != null && <span className="text-sm font-normal text-slate-400"> /mese</span>}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Prossimo rinnovo</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{renewalDate || "—"}</p>
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stato</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{isTrial ? "In prova" : "Attivo"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Nessun piano attivo</h2>
              <p className="mt-1 text-sm text-slate-500">
                Contattaci per attivare il piano più adatto alla tua attività.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Moduli */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Moduli</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((mod) => {
            const on = activeModules.includes(mod.key);
            return (
              <div
                key={mod.key}
                className={`rounded-xl border p-4 transition-colors ${
                  on ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50/60"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <mod.Icon className={`h-4 w-4 ${on ? "text-blue-600" : "text-slate-300"}`} />
                    <span className={`text-sm font-medium ${on ? "text-slate-800" : "text-slate-400"}`}>
                      {mod.name}
                    </span>
                  </div>
                  {on ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                      <Check className="h-2.5 w-2.5" /> Attivo
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-300">Non attivo</span>
                  )}
                </div>
                <p className={`text-[11px] ${on ? "text-slate-400" : "text-slate-300"}`}>{mod.desc}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Per attivare o modificare i moduli, contatta il supporto.
        </p>
      </div>

      {/* Portale fatturazione */}
      {hasStripeCustomer && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Portale Fatturazione</h3>
              <p className="mt-1 text-sm text-slate-500">
                Gestisci metodi di pagamento, scarica le ricevute e vedi lo storico dell&apos;abbonamento.
              </p>
            </div>
            <Link
              href="/api/billing/portal"
              prefetch={false}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" />
              Apri Portale
            </Link>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Hai bisogno di aiuto?</h3>
            <p className="mt-1 mb-3 text-sm text-slate-500">
              Per informazioni su piani, prezzi e attivazione moduli contattaci.
            </p>
            <a
              href="mailto:info@rescuemanager.eu"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              info@rescuemanager.eu
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
