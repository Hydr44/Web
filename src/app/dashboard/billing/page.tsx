// src/app/dashboard/billing/page.tsx
import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { planProfileName, planMonthlyEur } from "@/lib/plans";
import { Contenuto, Dato, DueColonne, Testata } from "../_ui/cornice";

export const dynamic = "force-dynamic";

/**
 * I moduli come li chiama il cliente, nell'ordine del disegno. Le chiavi sono
 * quelle di `org_modules.module`.
 */
const MODULES = [
  { key: "trasporti", name: "Soccorso e trasporti" },
  { key: "piazzale", name: "Custodia veicoli" },
  { key: "rvfu", name: "Demolizioni RVFU" },
  { key: "rentri", name: "Rifiuti RENTRI" },
  { key: "ricambi", name: "Ricambi" },
  { key: "marketplace", name: "Marketplace" },
  { key: "gps_tracking", name: "Tracking GPS" },
  { key: "sdi", name: "Fatturazione SDI" },
  { key: "unrae", name: "UNRAE" },
  { key: "contabilita", name: "Contabilità" },
];

const DATA_LUNGA: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };

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
  let postazioni: number | null = null;
  if (userOrgId) {
    const { data: mods } = await supabase
      .from("org_modules")
      .select("module")
      .eq("org_id", userOrgId)
      .eq("status", "active");
    activeModules = (mods || []).map((m) => m.module);

    const { count } = await supabase
      .from("org_members")
      .select("user_id", { count: "exact", head: true })
      .eq("org_id", userOrgId);
    if (typeof count === "number") postazioni = count;
  }

  const hasStripeCustomer = !!profile?.stripe_customer_id;
  const isTrial = subscription?.status === "trial";
  const isActive = subscription && (subscription.status === "active" || subscription.status === "trial");
  const hasActivePlan = !!subscription?.plan && isActive;

  // Nome "profilo" derivato dai moduli attivi (Soccorso e trasporti / Autodemolitore / Completo)
  const profileName = hasActivePlan ? planProfileName(subscription.plan, activeModules) : null;
  const priceEur = hasActivePlan
    ? planMonthlyEur(subscription.plan, subscription.is_custom, subscription.custom_price)
    : null;

  const rinnovo = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const giorniAlRinnovo = rinnovo
    ? Math.max(0, Math.ceil((rinnovo.getTime() - Date.now()) / 86_400_000))
    : null;

  const attivoDal = subscription?.created_at
    ? new Date(subscription.created_at).toLocaleDateString("it-IT", DATA_LUNGA)
    : null;

  let statoTesto = "Nessun piano";
  if (isTrial) statoTesto = "In prova";
  else if (hasActivePlan) statoTesto = "Attivo";
  else if (subscription?.status === "past_due") statoTesto = "In ritardo";
  else if (subscription?.status) statoTesto = "Disdetto";

  const attivi = MODULES.filter((m) => activeModules.includes(m.key)).length;

  const sottotitolo = [
    profileName ? `Piano ${profileName}` : "Nessun piano attivo",
    attivoDal ? `attivo dal ${attivoDal}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <Testata
        titolo="Abbonamento"
        sotto={sottotitolo}
        azioni={
          <>
            {hasStripeCustomer && (
              <Link href="/api/billing/portal" prefetch={false} className="rm-btn rm-btn--tertiary">
                <span>Portale di fatturazione</span>
              </Link>
            )}
            <Link href="/dashboard/support" className="rm-btn rm-btn--primary">
              <span>Cambia piano</span>
            </Link>
          </>
        }
      />

      <Contenuto>
        {sp.status === "success" && (
          <div className="rm-note rm-note--info" style={{ marginBottom: 16 }}>
            Abbonamento attivato. Il piano risulta in corso.
          </div>
        )}
        {sp.err && (
          <div className="rm-note rm-note--errore" style={{ marginBottom: 16 }}>
            {sp.err === "missing_price"
              ? "Prezzo non configurato. Contatta l'assistenza."
              : "Si è verificato un errore. Riprova più tardi."}
          </div>
        )}

        <div className="rm-griglia" style={{ marginBottom: 16 }}>
          <Dato
            etichetta="Importo"
            valore={priceEur != null ? `${priceEur.toFixed(0)} euro` : "—"}
            nota="al mese, IVA esclusa"
          />
          <Dato
            etichetta="Prossimo rinnovo"
            valore={rinnovo ? rinnovo.toLocaleDateString("it-IT", { day: "numeric", month: "long" }) : "—"}
            nota={giorniAlRinnovo != null ? `tra ${giorniAlRinnovo} giorni` : "data non disponibile"}
          />
          <Dato
            etichetta="Postazioni"
            valore={postazioni != null ? String(postazioni) : "—"}
            nota="persone collegate"
          />
          <Dato
            etichetta="Stato"
            valore={statoTesto}
            nota={hasStripeCustomer ? "pagamento con carta" : "pagamento concordato"}
            allarme={subscription?.status === "past_due"}
          />
        </div>

        <DueColonne
          principale={
            <section className="rm-card">
              <div className="rm-cardhead">
                <h2 style={{ fontSize: 14 }}>Moduli</h2>
                <span className="rm-muted">{`${attivi} di ${MODULES.length} attivi`}</span>
              </div>
              <div className="rm-righe">
                {MODULES.map((mod) => {
                  const on = activeModules.includes(mod.key);
                  return (
                    <div key={mod.key} className="rm-riga">
                      <span>{mod.name}</span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 12,
                        }}
                      >
                        <span className={on ? "rm-stato rm-stato--ok" : "rm-stato rm-stato--fermo"}>
                          {on ? "Attivo" : "Non attivo"}
                        </span>
                        {!on && (
                          <Link
                            href="/dashboard/support"
                            className="rm-btn rm-btn--tertiary"
                            style={{ height: 28, padding: "0 10px", gap: 0 }}
                          >
                            <span>Attiva</span>
                          </Link>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          }
          laterale={
            <section className="rm-card">
              <div className="rm-cardhead">
                <h2 style={{ fontSize: 14 }}>Assistenza</h2>
              </div>
              <p className="rm-muted">
                Per cambiare piano, aggiungere postazioni o avere una fattura
                diversa, scrivici: rispondiamo in giornata.
              </p>
              <div style={{ marginTop: 14 }}>
                <Link href="/dashboard/support" className="rm-btn rm-btn--tertiary">
                  <span>Apri una richiesta</span>
                </Link>
              </div>
            </section>
          }
        />
      </Contenuto>
    </>
  );
}
