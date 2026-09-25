"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Download as IconaScarica, MonitorSmartphone } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { usePageTitle } from "@/hooks/usePageTitle";
import { planProfileName, planMonthlyEur, complianceModuleLabels } from "@/lib/plans";
import { Consumo, Contenuto, DueColonne, Riga, Testata } from "./_ui/cornice";

/**
 * Panoramica dell'area personale.
 *
 * Qui si guarda l'abbonamento, il consumo del mese, l'azienda, le protezioni e
 * le ultime fatture del servizio: il lavoro di ogni giorno sta
 * nell'applicazione sulla postazione. Le classi (rm-card, rm-riga, rm-barra)
 * vengono da `prodotto.css`.
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
  if (isTrial) return { testo: "in prova", classe: "rm-stato rm-stato--corso" };
  switch (status) {
    case "active":
      return { testo: "attivo", classe: "rm-stato rm-stato--ok" };
    case "past_due":
      return { testo: "pagamento in ritardo", classe: "rm-stato rm-stato--male" };
    case "canceled":
    case "cancelled":
      return { testo: "disdetto", classe: "rm-stato rm-stato--fermo" };
    default:
      return { testo: status || "—", classe: "rm-stato rm-stato--fermo" };
  }
}

const MESE_GIORNO: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };

export default function DashboardPanoramica() {
  usePageTitle("Panoramica");
  const [currentOrg, setCurrentOrg] = useState<string>("RescueManager");
  const [userName, setUserName] = useState<string>("");
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
  const [membri, setMembri] = useState<number | null>(null);
  const [protezioni, setProtezioni] = useState<{
    emailConfermata: boolean;
    duePassaggi: boolean;
    postazioni: number | null;
  }>({ emailConfermata: false, duePassaggi: false, postazioni: null });

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

        setProtezioni((p) => ({
          ...p,
          emailConfermata: !!(user.email_confirmed_at || user.confirmed_at),
        }));

        const { data: profile } = await supabase
          .from("profiles")
          .select("current_org, full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.full_name) setUserName(profile.full_name as string);

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
            includes: includes.length ? `Gestionale, ${includes.join(", ")}` : "Gestionale completo",
            renewalDate: sub.current_period_end
              ? new Date(sub.current_period_end).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
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

        // Quante persone usano l'organizzazione (il disegno lo chiede accanto
        // ai dati dell'azienda e alle postazioni del piano).
        const { count } = await supabase
          .from("org_members")
          .select("user_id", { count: "exact", head: true })
          .eq("org_id", profile.current_org);
        if (typeof count === "number") setMembri(count);

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

        // Protezioni: verifica in due passaggi e postazioni collegate.
        try {
          const { data: factors } = await supabase.auth.mfa.listFactors();
          const attiva = !!factors?.totp?.some((f) => f.status === "verified");
          setProtezioni((p) => ({ ...p, duePassaggi: attiva }));
        } catch { /* opzionale */ }
        try {
          const r = await fetch("/api/auth/sessions/list");
          const j = await r.json().catch(() => ({}));
          if (r.ok && j.ok && Array.isArray(j.sessions)) {
            setProtezioni((p) => ({ ...p, postazioni: j.sessions.length }));
          }
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
    return (
      <Contenuto>
        <p className="rm-muted">Caricamento dei dati in corso</p>
      </Contenuto>
    );
  }

  if (!hasOrganization) {
    return (
      <>
        <Testata titolo="Nessuna organizzazione" />
        <Contenuto>
          <section className="rm-card" style={{ maxWidth: 560 }}>
            <p>
              Prima di usare l&apos;area personale serve creare l&apos;organizzazione: e&apos;
              l&apos;azienda a cui vengono intestati abbonamento, fatture e utenti.
            </p>
            <div style={{ marginTop: 16 }}>
              <Link href="/onboarding" className="rm-btn rm-btn--primary">
                Crea l&apos;organizzazione
              </Link>
            </div>
          </section>
        </Contenuto>
      </>
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
          label: "Archivio documenti",
          nota: "Fotografie e formulari",
          used: numVal(usage.storage_bytes),
          limit: numVal(limits.storage_gb) * 1024 ** 3, // limite in byte
          fmtUsed: (n: number) => fmtBytes(n),
          fmtLimit: (n: number) => `${Math.round(n / 1024 ** 3)} GB`,
          show: true,
        },
        {
          key: "autocompile",
          label: "Compilazione automatica",
          nota: "Visure targa e registro imprese",
          used: numVal(usage.autocompile),
          limit: numVal(limits.autocompile_month),
          fmtUsed: (n: number) => `${n}`,
          fmtLimit: (n: number) => `${n}`,
          show: true,
        },
        {
          key: "sms",
          label: "SMS ai clienti",
          nota: "Il limite si rinnova il primo del mese",
          used: numVal(usage.sms),
          limit: numVal(limits.sms_month),
          fmtUsed: (n: number) => `${n}`,
          fmtLimit: (n: number) => `${n}`,
          show: true,
        },
        {
          key: "ai_eur",
          label: "Consulente IA",
          nota: "Preventivi e risposte RENTRI",
          used: numVal(usage.ai_eur),
          limit: numVal(limits.ai_budget_eur),
          fmtUsed: (n: number) => `${n} euro`,
          fmtLimit: (n: number) => `${n} euro`,
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
  const postazioniPiano = limits && limits.seats != null ? Number(limits.seats) : null;
  const inizioMese = new Date();
  inizioMese.setDate(1);

  return (
    <>
      <Testata
        titolo="Panoramica"
        sotto={userName ? `${currentOrg}, account di ${userName}` : currentOrg}
      />

      <Contenuto>
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

        <DueColonne
          principale={
            <>
              {/* Abbonamento */}
              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 style={{ fontSize: 13, fontWeight: 600 }}>Abbonamento</h2>
                  <Link href="/dashboard/billing">Gestisci</Link>
                </div>
                <p style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span className="rm-dato" style={{ margin: 0 }}>{subscription.planProfile}</span>
                  <span className={stato.classe}>{stato.testo}</span>
                </p>
                <div className="rm-righe" style={{ marginTop: 14 }}>
                  <Riga
                    etichetta="Importo"
                    valore={subscription.priceEur != null ? `${subscription.priceEur.toFixed(0)} euro al mese` : "—"}
                  />
                  <Riga etichetta="Prossimo rinnovo" valore={subscription.renewalDate || "—"} />
                  <Riga etichetta="Moduli" valore={subscription.includes} />
                  <Riga
                    etichetta="Postazioni"
                    valore={
                      membri == null
                        ? "—"
                        : postazioniPiano != null
                          ? `${membri} di ${postazioniPiano} in uso`
                          : `${membri} in uso`
                    }
                  />
                </div>
              </section>

              {/* Consumi del mese */}
              {meteredRows.length > 0 && (
                <section className="rm-card">
                  <div className="rm-cardhead">
                    <h2 style={{ fontSize: 13, fontWeight: 600 }}>Consumi del mese</h2>
                    <span className="rm-muted">
                      dal {inizioMese.toLocaleDateString("it-IT", MESE_GIORNO)}
                    </span>
                  </div>
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    {meteredRows.map((row) => {
                      const hasLimit = row.limit > 0;
                      const pct = hasLimit ? (row.used / row.limit) * 100 : null;
                      return (
                        <Consumo
                          key={row.key}
                          etichetta={row.label}
                          valore={
                            hasLimit
                              ? `${row.fmtUsed(row.used)} di ${row.fmtLimit(row.limit)}`
                              : row.fmtUsed(row.used)
                          }
                          percentuale={pct}
                          nota={row.nota}
                        />
                      );
                    })}
                  </div>

                  {includedTiles.length > 0 && (
                    <>
                      <div className="rm-eyebrow" style={{ margin: "16px 0 6px" }}>Compreso nel piano</div>
                      <div className="rm-righe">
                        {includedTiles.map((m) => (
                          <Riga key={m.label} etichetta={m.label} valore={m.value} />
                        ))}
                      </div>
                    </>
                  )}
                </section>
              )}
            </>
          }
          laterale={
            <>
              {/* Organizzazione */}
              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 style={{ fontSize: 13, fontWeight: 600 }}>Organizzazione</h2>
                  <Link href="/dashboard/org">Apri</Link>
                </div>
                <div className="rm-righe">
                  <Riga etichetta="Ragione sociale" valore={currentOrg} />
                  <Riga etichetta="Partita IVA" valore={orgInfo.vat ? `IT ${orgInfo.vat}` : "—"} mono />
                  <Riga
                    etichetta="Sede"
                    valore={
                      orgInfo.city
                        ? `${orgInfo.city}${orgInfo.province ? ` (${orgInfo.province})` : ""}`
                        : "—"
                    }
                  />
                  <Riga
                    etichetta="Utenti"
                    valore={membri == null ? "—" : membri === 1 ? "1 collegato" : `${membri} collegati`}
                  />
                </div>
              </section>

              {/* Applicazione sulla postazione */}
              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 style={{ fontSize: 13, fontWeight: 600 }}>App desktop</h2>
                  <span className="rm-muted">Windows e macOS</span>
                </div>
                <p>
                  {latestDesktopVersion
                    ? `Versione ${latestDesktopVersion} disponibile`
                    : "Versione disponibile su richiesta"}
                </p>
                <p className="rm-muted" style={{ marginTop: 4 }}>
                  Se l&apos;applicazione e&apos; gia&apos; installata si aggiorna da sola al prossimo avvio.
                </p>
                <div className="flex flex-wrap gap-1" style={{ marginTop: 14 }}>
                  <Link href="/dashboard/download" className="rm-btn rm-btn--primary" style={{ gap: 14 }}>
                    <span>Scarica</span>
                    <IconaScarica size={15} />
                  </Link>
                  <Link href="/dashboard/security/sessions" className="rm-btn rm-btn--tertiary" style={{ gap: 14 }}>
                    <span>Postazioni</span>
                    <MonitorSmartphone size={15} />
                  </Link>
                </div>
              </section>

              {/* Protezioni */}
              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 style={{ fontSize: 13, fontWeight: 600 }}>Sicurezza</h2>
                  <Link href="/dashboard/security">Apri</Link>
                </div>
                <div className="rm-righe">
                  <Riga
                    etichetta="Email"
                    valore={protezioni.emailConfermata ? "confermata" : "da confermare"}
                  />
                  <Riga
                    etichetta="Verifica in due passaggi"
                    valore={protezioni.duePassaggi ? "attiva" : "non attiva"}
                  />
                  <Riga
                    etichetta="Postazioni collegate"
                    valore={protezioni.postazioni == null ? "—" : String(protezioni.postazioni)}
                  />
                </div>
              </section>

              {/* Ultime fatture del servizio */}
              <section className="rm-card">
                <div className="rm-cardhead">
                  <h2 style={{ fontSize: 13, fontWeight: 600 }}>Ultime fatture del servizio</h2>
                  <Link href="/dashboard/invoices">Tutte</Link>
                </div>
                {invoices.length === 0 ? (
                  <p className="rm-muted">Nessuna fattura emessa finora.</p>
                ) : (
                  <div className="rm-righe">
                    {invoices.map((inv) => (
                      <Riga
                        key={inv.id}
                        etichetta={
                          inv.date
                            ? new Date(inv.date).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
                            : inv.number || inv.id
                        }
                        valore={`${new Intl.NumberFormat("it-IT", { style: "currency", currency: inv.currency || "EUR" }).format(inv.total || 0)}, ${inv.payment_status === "paid" ? "pagata" : "da pagare"}`}
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          }
        />
      </Contenuto>
    </>
  );
}
