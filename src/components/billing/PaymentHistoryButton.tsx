"use client";

import { useState } from "react";
import { FileText, X, ExternalLink, Loader2 } from "lucide-react";

export default function PaymentHistoryButton() {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Array<{
    id: string;
    number: string;
    status: string;
    amount_paid: number;
    currency: string;
    paid_at: string | null;
    invoice_pdf: string | null;
    hosted_invoice_url: string | null;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    setInvoices([]);
    setShowModal(true);
    try {
      const res = await fetch("/api/billing/invoices?limit=20");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore caricamento");
      if (data.ok && data.invoices) {
        setInvoices(data.invoices);
      } else {
        setError(data.message || "Nessun dato");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
          <FileText className="h-4 w-4" />
          Test: storico pagamenti
        </div>
        <p className="text-slate-500 text-xs mb-2">
          Mostra le ultime fatture pagate su Stripe per il tuo account.
        </p>
        <button
          onClick={handleLoad}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-200 rounded-lg hover:bg-blue-500/30 disabled:opacity-60 transition"
        >
          {loading ? "Caricamento..." : "Vedi storico pagamenti"}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2536] border border-[#243044] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#243044]">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Storico pagamenti
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                </div>
              )}
              {!loading && error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}
              {!loading && !error && invoices.length === 0 && (
                <p className="text-slate-500 text-sm py-6 text-center">
                  Nessuna fattura pagata trovata.
                </p>
              )}
              {!loading && !error && invoices.length > 0 && (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#141c27] border border-[#243044]"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          Fattura {inv.number}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {inv.paid_at
                            ? new Date(inv.paid_at).toLocaleDateString("it-IT", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })
                            : "-"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium text-emerald-400">
                          €{inv.amount_paid.toFixed(2)}
                        </span>
                        {inv.invoice_pdf && (
                          <a
                            href={inv.invoice_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                            title="Scarica PDF"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
