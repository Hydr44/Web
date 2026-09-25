"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { usePageTitle } from "@/hooks/usePageTitle";
import { planMonthlyEur } from "@/lib/plans";
import { Contenuto, Dato, TD, TH, Testata } from "../_ui/cornice";

/**
 * Fatture del portale cliente — le FATTURE FISCALI emesse da RescueManager
 * verso l'org del cliente (serie RM/YYYY), con scaricamento in PDF e XML.
 * Le ricevute dell'abbonamento restano nel portale di fatturazione.
 */

interface PortalInvoice {
  id: string;
  number: string | null;
  date: string | null;
  total: number;
  currency: string;
  sdi_status: string | null;
  payment_status: string | null;
  tipo_documento: string | null;
}

function fmtMoney(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: currency || "EUR" }).format(
    amount || 0,
  );
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

/** Le fatture RM sono il canone: la descrizione e' il mese di competenza. */
function descrizione(inv: PortalInvoice) {
  if (!inv.date) return "Canone del servizio";
  const d = new Date(inv.date);
  if (Number.isNaN(d.getTime())) return "Canone del servizio";
  return `Canone di ${d.toLocaleDateString("it-IT", { month: "long" })}`;
}

export default function InvoicesPage() {
  usePageTitle("Fatture");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [prossimo, setProssimo] = useState<{ data: string; importo: string } | null>(null);
  const [codiceSdi, setCodiceSdi] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    setWorking(true);
    try {
      const r = await fetch("/api/dashboard/invoices");
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) {
        setError(j.error || "Non è stato possibile leggere le fatture");
        setInvoices([]);
        return;
      }
      setInvoices(j.invoices || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore di rete");
      setInvoices([]);
    } finally {
      setWorking(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();

      // Prossimo addebito e codice destinatario: stanno nei riquadri in alto.
      try {
        const supabase = supabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("current_org")
            .eq("id", user.id)
            .maybeSingle();
          if (profile?.current_org) {
            const [{ data: sub }, { data: righe }] = await Promise.all([
              supabase
                .from("org_subscriptions")
                .select("plan, current_period_end, is_custom, custom_price")
                .eq("org_id", profile.current_org)
                .maybeSingle(),
              supabase.from("org_settings").select("value").eq("org_id", profile.current_org),
            ]);

            if (sub?.current_period_end) {
              const netto = planMonthlyEur(sub.plan, sub.is_custom, sub.custom_price);
              setProssimo({
                data: new Date(sub.current_period_end).toLocaleDateString("it-IT", {
                  day: "numeric",
                  month: "long",
                }),
                importo: netto != null ? `${fmtMoney(netto * 1.22)} con IVA` : "importo da definire",
              });
            }

            const unite: Record<string, unknown> = {};
            (righe || []).forEach((r) => {
              if (r.value && typeof r.value === "object") Object.assign(unite, r.value);
            });
            const codice = unite.codice_destinatario;
            if (typeof codice === "string" && codice) setCodiceSdi(codice);
          }
        }
      } catch { /* opzionale */ }

      setLoading(false);
    })();
  }, [refresh]);

  if (loading) {
    return (
      <>
        <Testata titolo="Fatture" sotto="Le fatture di RescueManager alla tua organizzazione" />
        <Contenuto>
          <p className="rm-muted">Caricamento delle fatture.</p>
        </Contenuto>
      </>
    );
  }

  const anno = new Date().getFullYear();
  const delAnno = invoices.filter((i) => i.date && new Date(i.date).getFullYear() === anno);
  const totaleAnno = delAnno.reduce((s, i) => s + (i.total || 0), 0);

  return (
    <>
      <Testata
        titolo="Fatture"
        sotto="Le fatture di RescueManager alla tua organizzazione"
        azioni={
          <button
            type="button"
            onClick={refresh}
            disabled={working}
            className="rm-btn rm-btn--tertiary"
            style={{ gap: 14 }}
          >
            <span>{working ? "Aggiornamento" : "Aggiorna"}</span>
            <RefreshCw size={15} />
          </button>
        }
      />

      <Contenuto>
        {error && <div className="rm-note rm-note--errore" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="rm-griglia" style={{ marginBottom: 16 }}>
          <Dato
            etichetta={`Anno ${anno}`}
            valore={fmtMoney(totaleAnno)}
            nota={delAnno.length === 1 ? "1 fattura" : `${delAnno.length} fatture`}
          />
          <Dato
            etichetta="Prossimo addebito"
            valore={prossimo?.data || "—"}
            nota={prossimo?.importo || "nessun rinnovo programmato"}
          />
          <Dato
            etichetta="Inviate anche a"
            valore={codiceSdi || "—"}
            nota="codice destinatario SDI"
          />
        </div>

        {invoices.length === 0 ? (
          <div className="rm-card">
            <p className="rm-muted">Nessuna fattura emessa al momento.</p>
          </div>
        ) : (
          <>
            <div className="rm-scroll">
              <table className="rm-tab">
                <thead>
                  <tr>
                    <th style={TH}>Numero</th>
                    <th style={TH}>Data</th>
                    <th style={TH}>Descrizione</th>
                    <th style={TH}>Totale</th>
                    <th style={TH}>Stato</th>
                    <th style={TH}>Documenti</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const pagata = inv.payment_status === "paid";
                    return (
                      <tr key={inv.id}>
                        <td style={TD} className="rm-mono">{inv.number || inv.id}</td>
                        <td style={TD}>{fmtDate(inv.date)}</td>
                        <td style={TD}>{descrizione(inv)}</td>
                        <td style={TD}>{fmtMoney(inv.total, inv.currency)}</td>
                        <td style={TD}>
                          <span className={pagata ? "rm-stato rm-stato--fermo" : "rm-stato rm-stato--corso"}>
                            {pagata ? "Pagata" : "Da pagare"}
                          </span>
                        </td>
                        <td style={TD}>
                          <a
                            href={`/api/dashboard/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            PDF
                          </a>
                          <span className="rm-muted"> e </span>
                          <a
                            href={`/api/dashboard/invoices/${inv.id}/xml`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            XML
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="rm-muted" style={{ marginTop: 12 }}>
              {delAnno.length === 1 ? `1 fattura nel ${anno}` : `${delAnno.length} fatture nel ${anno}`}
            </p>
          </>
        )}
      </Contenuto>
    </>
  );
}
