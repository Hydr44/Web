"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { usePageTitle } from "@/hooks/usePageTitle";
import { planProfileName, planMonthlyEur, complianceModuleLabels } from "@/lib/plans";

/**
 * Panoramica dell'area cliente.
 *
 * Qui si guarda l'abbonamento, il consumo del piano, le fatture emesse e i
 * dati dell'azienda: il lavoro di ogni giorno sta nell'applicazione desktop.
 * Le classi (rm-card, rm-riga, rm-tab, rm-note) vengono da `prodotto.css`.
 */

interface DashInvoice {
  id: string;
  number: string | null;
  date: string | null;
  total: number;
  currency: string;
  payment_status: string | null;
}

/** Stato dell'abbonamento scritto a parole, come nel desktop. */
function statoAbbonamento(status: string, isTrial: boolean): { testo: string; classe: string } {
  if (isTrial) return { testo: "In prova", classe: "rm-stato rm-stato--corso" };
  switch (status) {
    case "active":
      return { testo: "Attivo", classe: "rm-stato rm-stato--ok" };
    case "past_due":
      return { testo: "Pagamento in ritardo", classe: "rm-stato rm-stato--male" };
    case "canceled":
    case "cancelled":
      return { testo: "Disdetto", classe: "rm-stato rm-stato--fermo" };
    default:
      return { testo: status || "—", classe: "rm-stato rm-stato--fermo" };
  }
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
  const [usage, setUsage] = useState<Record<string, number>>({});

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
          if (r.ok && j.ok && j.usage && typeof j.usage === "object") setUsage(j.usage);
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
    return <p className="rm-muted">Caricamento dei dati in corso</p>;
  }

  if (!hasOrganization) {
    return (
      <div style={{ maxWidth: 560 }}>
        <div className="rm-area__intesta">
          <h1>Nessuna organizzazione</h1>
        </div>
        <section className="rm-card">
          <p>
            Prima di usare il portale serve creare l&apos;organizzazione: e&apos; l&apos;azienda
            a cui vengono intestati abbonamento, fatture e utenti.
          </p>
          <div style={{ marginTop: 16 }}>
            <Link href="/onboarding" className="rm-btn rm-btn--primary">
              Crea l&apos;organizzazione
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // Fase 2 — consumo delle metriche con contatore mensile, scritto a parole.
  const numVal = (v: unknown): number => (typeof v === "number" && isFinite(v) ? v : 0);
  const fmtBytes = (b: number): string => {
    if (!(b > 0)) return "0 MB";
    if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`;
    if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
    return `${(b / 1024).toFixed(0)} KB`;
  };
  const meteredRows = (limits
    ? [
        {
          key: "storage",
          label: "Archivio",
          used: numVal(usage.storage_bytes),
          limit: numVal(limits.storage_gb) * 1024 ** 3, // limite in byte
          fmtUsed: (n: number) => fmtBytes(n),
          fmtLimit: (n: number) => `${Math.round(n / 1024 ** 3)} GB`,
          show: true,
        },
        {
          key: "autocompile",
          label: "Compilazione automatica",
          used: numVal(usage.autocompile),
          limit: numVal(limits.autocompile_month),
          fmtUsed: (n: number) => `${n}`,
          fmtLimit: (n: number) => `${n} al mese`,
          show: true,
        },
        {
          key: "sms",
          label: "SMS",
          used: numVal(usage.sms),
          limit: numVal(limits.sms_month),
          fmtUsed: (n: number) => `${n}`,
          fmtLimit: (n: number) => `${n} al mese`,
          show: true,
        },
        {
          key: "ai_eur",
          label: "Consulente IA",
          used: numVal(usage.ai_eur),
          limit: numVal(limits.ai_budget_eur),
          fmtUsed: (n: number) => `€ ${n}`,
          fmtLimit: (n: number) => `€ ${n} al mese`,
          show: !!limits.ai_included,
        },
      ].filter((r) => r.show)
    : []);
  // Avvisi "superamento morbido": metriche con consumo ≥ 80% del limite.
  const usageAlerts = meteredRows
    .filter((r) => r.limit > 0)
    .map((r) => ({ label: r.label, pct: (r.used / r.limit) * 100 }))
    .filter((a) => a.pct >= 80);
  const anyOver = usageAlerts.some((a) => a.pct >= 100);
  // Metriche solo-incluse (nessun contatore): mostrano il valore del piano.
  const includedTiles = limits
    ? [
        { label: "Foto in linea", value: limits.photo_months != null ? `${limits.photo_months} mesi` : "—" },
        { label: "Documenti per posta", value: limits.postal_year != null ? `${limits.postal_year} all'anno` : "—" },
        { label: "Sedi", value: limits.sites != null ? String(limits.sites) : "—" },
        ...(!limits.ai_included ? [{ label: "Consulente IA", value: "Non incluso" }] : []),
      ]
    : [];

  const stato = statoAbbonamento(subscription.status, subscription.isTrial);

  return (
    <div>
      <div className="rm-area__intesta">
        <div>
          <h1>Panoramica</h1>
          <p className="rm-muted" style={{ marginTop: 4 }}>{currentOrg}</p>
        </div>
      </div>

      {/* Avviso di consumo: nessun blocco, solo un avvertimento scritto. */}
      {usageAlerts.length > 0 && (
        <div className={`rm-note ${anyOver ? "rm-note--errore" : "rm-note--info"}`} style={{ marginBottom: 16 }}>
          {anyOver
            ? "Hai raggiunto alcuni limiti del piano: "
            : "Ti stai avvicinando ad alcuni limiti del piano: "}
          {usageAlerts.map((a) => `${a.label} al ${Math.round(a.pct)} per cento`).join(", ")}.
          {" "}Il servizio continua a funzionare senza interruzioni.{" "}
          <Link href="/dashboard/billing">Valuta un pacchetto o un piano superiore</Link>.
        </div>
      )}

      {/* Abbonamento */}
      <section className="rm-card">
        <div className="rm-cardhead">
          <h2>{subscription.planProfile}</h2>
          <Link href="/dashboard/billing">Gestisci l&apos;abbonamento</Link>
        </div>
        <div className="rm-righe">
          <div className="rm-riga">
            <span>Stato</span>
            <span className={stato.classe}>{stato.testo}</span>
          </div>
          <div className="rm-riga">
            <span>Importo</span>
            <span>
              {subscription.priceEur != null ? `€ ${subscription.priceEur.toFixed(0)} al mese` : "—"}
            </span>
          </div>
          <div className="rm-riga">
            <span>Prossimo rinnovo</span>
            <span>{subscription.renewalDate || "—"}</span>
          </div>
          <div className="rm-riga">
            <span>Cosa comprende</span>
            <span>{subscription.includes}</span>
          </div>
        </div>
      </section>

      {/* Consumi e limiti del piano */}
      {limits && (
        <section className="rm-card">
          <div className="rm-cardhead">
            <h2>Consumi del piano</h2>
            <span className="rm-muted">si azzerano ogni mese</span>
          </div>
          {meteredRows.length > 0 && (
            <div className="rm-righe">
              {meteredRows.map((row) => {
                const hasLimit = row.limit > 0;
                const pct = hasLimit ? Math.round((row.used / row.limit) * 100) : 0;
                return (
                  <div key={row.key} className="rm-riga">
                    <span>{row.label}</span>
                    <span>
                      {hasLimit
                        ? `${row.fmtUsed(row.used)} su ${row.fmtLimit(row.limit)}`
                        : row.fmtUsed(row.used)}
                      {hasLimit && (
                        <span className={pct >= 100 ? "rm-stato rm-stato--male" : "rm-muted"}>
                          {` · ${pct} per cento`}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {includedTiles.length > 0 && (
            <>
              <div className="rm-sep" />
              <div className="rm-eyebrow" style={{ marginBottom: 8 }}>Compreso nel piano</div>
              <div className="rm-righe">
                {includedTiles.map((m) => (
                  <div key={m.label} className="rm-riga">
                    <span>{m.label}</span>
                    <span>{m.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Ultime fatture */}
      <section className="rm-card">
        <div className="rm-cardhead">
          <h2>Ultime fatture</h2>
          <Link href="/dashboard/invoices">Tutte le fatture</Link>
        </div>
        {invoices.length === 0 ? (
          <p className="rm-muted">Nessuna fattura emessa finora.</p>
        ) : (
          <div className="rm-scroll">
            <table className="rm-tab">
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Data</th>
                  <th>Importo</th>
                  <th>Stato</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const paid = inv.payment_status === "paid";
                  return (
                    <tr key={inv.id}>
                      <td className="rm-mono">{inv.number || inv.id}</td>
                      <td>
                        {inv.date
                          ? new Date(inv.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td>
                        {new Intl.NumberFormat("it-IT", { style: "currency", currency: inv.currency || "EUR" }).format(inv.total || 0)}
                      </td>
                      <td className={paid ? "rm-stato rm-stato--ok" : "rm-stato rm-stato--corso"}>
                        {paid ? "Pagata" : "Da pagare"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Azienda */}
      <section className="rm-card">
        <div className="rm-cardhead">
          <h2>{currentOrg}</h2>
          <Link href="/dashboard/org">Dati dell&apos;azienda</Link>
        </div>
        {orgInfo.vat || orgInfo.city || orgInfo.ibanLast4 ? (
          <div className="rm-righe">
            {orgInfo.vat && (
              <div className="rm-riga">
                <span>Partita IVA</span>
                <span className="rm-mono">{orgInfo.vat}</span>
              </div>
            )}
            {orgInfo.city && (
              <div className="rm-riga">
                <span>Sede</span>
                <span>{orgInfo.city}{orgInfo.province ? ` (${orgInfo.province})` : ""}</span>
              </div>
            )}
            {orgInfo.ibanLast4 && (
              <div className="rm-riga">
                <span>Conto corrente</span>
                <span>
                  <span className="rm-mono">{`****${orgInfo.ibanLast4}`}</span>
                  {orgInfo.bankName ? ` · ${orgInfo.bankName}` : ""}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="rm-muted">
            Soccorso, trasporti e mezzi si gestiscono nell&apos;applicazione desktop. Da qui
            si seguono abbonamento, fatture, assistenza e scaricamento delle app.
          </p>
        )}
      </section>

      {/* Applicazione desktop */}
      {latestDesktopVersion && (
        <section className="rm-card">
          <div className="rm-cardhead">
            <h2>Applicazione desktop</h2>
            <Link href="/dashboard/download">Scarica le app</Link>
          </div>
          <div className="rm-righe">
            <div className="rm-riga">
              <span>Ultima versione</span>
              <span className="rm-mono">{latestDesktopVersion}</span>
            </div>
            <div className="rm-riga">
              <span>Aggiornamento</span>
              <span>Se l&apos;applicazione e&apos; gia&apos; installata si aggiorna da sola al prossimo avvio.</span>
            </div>
          </div>
        </section>
      )}

      {/* Dove si trovano le altre cose */}
      <section className="rm-card">
        <div className="rm-cardhead">
          <h2>Gestione dell&apos;account</h2>
        </div>
        <div className="rm-righe">
          {[
            { href: "/dashboard/invoices", title: "Fatture", desc: "Scarica le fatture in PDF e XML" },
            { href: "/dashboard/billing", title: "Abbonamento", desc: "Piano, moduli e pagamenti" },
            { href: "/dashboard/support", title: "Supporto", desc: "Richiedi assistenza tecnica" },
            { href: "/dashboard/org", title: "Organizzazione", desc: "Dati aziendali e utenti" },
            { href: "/dashboard/security", title: "Sicurezza", desc: "Password, verifica in due passaggi e sessioni" },
            { href: "/dashboard/settings/notifications", title: "Notifiche", desc: "Preferenze per email e avvisi" },
          ].map((a) => (
            <div key={a.href} className="rm-riga">
              <span><Link href={a.href}>{a.title}</Link></span>
              <span className="rm-muted">{a.desc}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
