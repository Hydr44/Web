"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";

/**
 * Pagina Fatture del portale cliente — mostra le FATTURE FISCALI emesse da
 * RescueManager verso l'org del cliente (serie RM/YYYY), con download PDF/XML.
 * Le ricevute dell'abbonamento (Stripe) restano nel Portale Fatturazione (Abbonamento).
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

function fmtMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency || "EUR",
  }).format(amount || 0);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

function statoPagamento(status: string | null) {
  return status === "paid" ? "Pagata" : "Da pagare";
}

export default function InvoicesPage() {
  usePageTitle("Fatture");
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setError(null);
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
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <>
        <div className="rm-area__intesta">
          <h1>Fatture</h1>
        </div>
        <div className="rm-card">
          <p className="rm-muted">Caricamento delle fatture.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="rm-area__intesta">
        <div>
          <h1>Fatture</h1>
          <p className="rm-muted" style={{ marginTop: 6 }}>
            Le fatture emesse da RescueManager verso la tua azienda.
          </p>
        </div>
        <button onClick={refresh} className="rm-btn rm-btn--secondary">
          <span>Aggiorna</span>
        </button>
      </div>

      {error && <div className="rm-note rm-note--errore">{error}</div>}

      <div className="rm-card">
        {invoices.length === 0 ? (
          <p className="rm-muted">Nessuna fattura emessa al momento.</p>
        ) : (
          <div className="rm-scroll">
            <table className="rm-tab">
              <thead>
                <tr>
                  <th>Numero</th>
                  <th>Data</th>
                  <th>Totale</th>
                  <th>Stato</th>
                  <th>Documenti</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const pagata = inv.payment_status === "paid";
                  return (
                    <tr key={inv.id}>
                      <td className="rm-mono">{inv.number || inv.id}</td>
                      <td>{fmtDate(inv.date)}</td>
                      <td>{fmtMoney(inv.total, inv.currency)}</td>
                      <td>
                        <span className={pagata ? "rm-stato rm-stato--ok" : "rm-stato rm-stato--corso"}>
                          {statoPagamento(inv.payment_status)}
                        </span>
                      </td>
                      <td>
                        <a
                          href={`/api/dashboard/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Stampa
                        </a>
                        {" · "}
                        <a
                          href={`/api/dashboard/invoices/${inv.id}/xml`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          File per il commercialista
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Le ricevute dell'abbonamento (Stripe) restano nella pagina Abbonamento. */}
      <p className="rm-muted">
        Le ricevute del canone stanno nella pagina{" "}
        <Link href="/dashboard/billing">Abbonamento</Link>.
      </p>
    </>
  );
}
