"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  FileText,
  Download,
  FileCode,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  CreditCard,
} from "lucide-react";

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

function paymentBadge(status: string | null) {
  const paid = status === "paid";
  return paid
    ? { label: "Pagata", cls: "bg-green-50 text-green-700 border-green-200", Icon: CheckCircle }
    : { label: "Da pagare", cls: "bg-amber-50 text-amber-800 border-amber-200", Icon: Clock };
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
        setError(j.error || "Errore caricamento fatture");
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
      <div className="space-y-6">
        <div className="w-48 h-8 bg-gray-200 animate-pulse" />
        <div className="h-64 bg-white border border-gray-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Fatture</h1>
          <p className="mt-2 text-gray-500">Le fatture emesse da RescueManager verso la tua organizzazione.</p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Aggiorna
        </button>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="p-8 text-center bg-white border border-gray-200 ">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nessuna fattura emessa al momento.</p>
        </div>
      ) : (
        <div className="border overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Numero</th>
                <th className="text-left px-4 py-2 font-medium">Data</th>
                <th className="text-right px-4 py-2 font-medium">Totale</th>
                <th className="text-left px-4 py-2 font-medium">Stato</th>
                <th className="px-4 py-2 text-right font-medium">Documenti</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => {
                const pay = paymentBadge(inv.payment_status);
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-mono text-xs">{inv.number || inv.id}</td>
                    <td className="px-4 py-3">{fmtDate(inv.date)}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmtMoney(inv.total, inv.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 border ${pay.cls}`}>
                        <pay.Icon className="h-3 w-3" />
                        {pay.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-3">
                        <a
                          className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                          href={`/api/dashboard/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </a>
                        <a
                          className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800 text-xs"
                          href={`/api/dashboard/invoices/${inv.id}/xml`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileCode className="h-3.5 w-3.5" />
                          XML
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Le ricevute dell'abbonamento (Stripe) restano nella pagina Abbonamento. */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <CreditCard className="h-3.5 w-3.5" />
        <span>
          Cerchi le ricevute dell&apos;abbonamento? Sono nel{" "}
          <Link href="/dashboard/billing" className="text-blue-600 hover:underline font-medium">
            Portale Fatturazione
          </Link>
          .
        </span>
      </div>
    </div>
  );
}
