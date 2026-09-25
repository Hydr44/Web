// src/app/dashboard/billing/page.tsx
import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { planProfileName, complianceModuleLabels, planMonthlyEur } from "@/lib/plans";

export const dynamic = "force-dynamic";

const MODULES = [
  { key: "sdi", name: "Fatturazione elettronica", desc: "Invio e ricezione tramite SDI" },
  { key: "rvfu", name: "Demolizioni", desc: "Certificati e pratiche RVFU" },
  { key: "rentri", name: "Registro rifiuti", desc: "Carico, scarico e formulari RENTRI" },
  { key: "contabilita", name: "Contabilità", desc: "Prima nota e conti" },
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
    <>
      <div className="rm-area__intesta">
        <div>
          <h1>Abbonamento</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Piano in corso, moduli attivi e gestione del pagamento.
          </p>
        </div>
      </div>

      {sp.status === "success" && (
        <div className="rm-note rm-note--info">
          Abbonamento attivato. Il piano risulta in corso.
        </div>
      )}
      {sp.err && (
        <div className="rm-note rm-note--errore">
          {sp.err === "missing_price"
            ? "Prezzo non configurato. Contatta l'assistenza."
            : "Si è verificato un errore. Riprova più tardi."}
        </div>
      )}

      {hasActivePlan ? (
        <div className="rm-card">
          <div className="rm-cardhead">
            <div>
              <h2>{profileName}</h2>
              <p className="rm-muted" style={{ marginTop: 4 }}>{includesLabel}</p>
            </div>
            {hasStripeCustomer && (
              <Link href="/api/billing/portal" prefetch={false} className="rm-btn rm-btn--secondary">
                <span>Gestisci il pagamento</span>
              </Link>
            )}
          </div>
          <div className="rm-righe">
            <div className="rm-riga">
              <span>Stato</span>
              <span className="rm-stato rm-stato--ok">{isTrial ? "In prova" : "In corso"}</span>
            </div>
            <div className="rm-riga">
              <span>Importo</span>
              <span>{priceEur != null ? `${priceEur.toFixed(0)} euro al mese` : "—"}</span>
            </div>
            <div className="rm-riga">
              <span>Prossimo rinnovo</span>
              <span>{renewalDate || "—"}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rm-card">
          <h3>Nessun piano attivo</h3>
          <p className="rm-muted" style={{ marginTop: 8 }}>
            Contattaci per attivare il piano adatto all&apos;attività.
          </p>
        </div>
      )}

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Moduli</h3>
        </div>
        <div className="rm-righe">
          {MODULES.map((mod) => {
            const on = activeModules.includes(mod.key);
            return (
              <div key={mod.key} className="rm-riga">
                <span>{mod.name}</span>
                <span>
                  <span className={on ? "rm-stato rm-stato--ok" : "rm-stato rm-stato--fermo"}>
                    {on ? "Attivo" : "Non attivo"}
                  </span>
                  <br />
                  <span className="rm-muted">{mod.desc}</span>
                </span>
              </div>
            );
          })}
        </div>
        <p className="rm-muted" style={{ marginTop: 14 }}>
          Per attivare o togliere un modulo, scrivi all&apos;assistenza.
        </p>
      </div>

      {hasStripeCustomer && (
        <div className="rm-card">
          <div className="rm-cardhead">
            <div>
              <h3>Portale di fatturazione</h3>
              <p className="rm-muted" style={{ marginTop: 4 }}>
                Metodi di pagamento, ricevute e storico dell&apos;abbonamento.
              </p>
            </div>
            <Link href="/api/billing/portal" prefetch={false} className="rm-btn rm-btn--tertiary">
              <span>Apri il portale</span>
            </Link>
          </div>
        </div>
      )}

      <div className="rm-card">
        <div className="rm-cardhead">
          <h3>Assistenza</h3>
        </div>
        <p className="rm-muted">
          Per piani, prezzi e attivazione dei moduli scrivi a{" "}
          <a href="mailto:info@rescuemanager.eu">info@rescuemanager.eu</a>.
        </p>
      </div>
    </>
  );
}
