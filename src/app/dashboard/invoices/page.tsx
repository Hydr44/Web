"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";

/**
 * Pagina fatture — integrazione reale con Stripe Invoices.
 * Sostituisce la tabella mock con link "#" morti.
 */

interface InvoiceRow {
  id: string;
  number: string | null;
  created: number;
  due_date: number | null;
  total: number;
  currency: string;
  status: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  period_start: number | null;
  period_end: number | null;
}

const STATUS_META: Record<string, { label: string; cls: string; icon: any }> = {
  paid: { label: "Pagata", cls: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
  open: { label: "Da pagare", cls: "bg-amber-50 text-amber-800 border-amber-200", icon: Clock },
  draft: { label: "Bozza", cls: "bg-gray-50 text-gray-600 border-gray-200", icon: FileText },
  void: { label: "Annullata", cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  uncollectible: { label: "Non riscuotibile", cls: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
};

function fmtMoney(amountInCents: number, currency: string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency || "EUR",
  }).format((amountInCents || 0) / 100);
}

function fmtDate(unix: number | null) {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function InvoicesPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setError(null);
    try {
      const r = await fetch("/api/billing/invoices");
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
        <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-white border border-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Fatture</h1>
          <p className="mt-2 text-gray-500">Storico fatture e ricevute Stripe.</p>
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
        <div className="p-4 rounded bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="p-8 text-center bg-white border border-gray-200 rounded">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            Nessuna fattura disponibile. Le fatture appariranno qui dopo il primo pagamento.
          </p>
        </div>
      ) : (
        <div className="border rounded overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Numero</th>
                <th className="text-left px-4 py-2 font-medium">Data</th>
                <th className="text-left px-4 py-2 font-medium">Periodo</th>
                <th className="text-right px-4 py-2 font-medium">Totale</th>
                <th className="text-left px-4 py-2 font-medium">Stato</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => {
                const meta = STATUS_META[inv.status || ""] || {
                  label: inv.status || "—",
                  cls: "bg-gray-50 text-gray-600 border-gray-200",
                  icon: FileText,
                };
                const Icon = meta.icon;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-mono text-xs">{inv.number || inv.id}</td>
                    <td className="px-4 py-3">{fmtDate(inv.created)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {fmtMoney(inv.total, inv.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${meta.cls}`}
                      >
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        {inv.invoice_pdf && (
                          <a
                            className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                            href={inv.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            PDF
                          </a>
                        )}
                        {inv.hosted_invoice_url && (
                          <a
                            className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800 text-xs"
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Web
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
