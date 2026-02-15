"use client";

import { useState } from "react";
import { Bug, AlertCircle, X } from "lucide-react";

export default function DebugButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDebug = async () => {
    setIsLoading(true);
    setDebugData(null);

    try {
      const response = await fetch("/api/billing/debug", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.ok) {
        setDebugData(data.debug);
        setShowModal(true);
      } else {
        setDebugData({ error: data.error || "Errore durante il debug" });
        setShowModal(true);
      }
    } catch (error) {
      console.error("Debug error:", error);
      setDebugData({ error: "Errore di connessione" });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDebug}
        disabled={isLoading}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
          isLoading
            ? "bg-slate-600 text-slate-400 cursor-not-allowed"
            : "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
        }`}
      >
        {isLoading ? (
          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Bug className="h-4 w-4" />
        )}
        {isLoading ? "Debug..." : "Debug"}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2536] border border-[#243044] rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#243044]">
              <h3 className="text-lg font-semibold text-slate-100">Debug Abbonamento</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {debugData?.error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Errore</span>
                  </div>
                  <p className="text-red-400/80 mt-2">{debugData.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* User Info */}
                  <div className="bg-[#141c27] rounded-xl p-4 border border-[#243044]">
                    <h4 className="font-semibold text-slate-200 mb-3">Utente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">ID:</span>
                        <span className="ml-2 font-mono text-slate-300 text-xs break-all">{debugData?.user?.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Email:</span>
                        <span className="ml-2 text-slate-300">{debugData?.user?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                    <h4 className="font-semibold text-slate-200 mb-3">Profilo Database</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Stripe Customer ID:</span>
                        <span className="ml-2 font-mono text-xs break-all text-slate-300">
                          {debugData?.profile?.stripe_customer_id || "Nessuno"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Piano Attuale:</span>
                        <span className="ml-2 font-semibold text-slate-200">
                          {debugData?.profile?.current_plan || "Nessuno"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stripe Customers */}
                  {debugData?.stripe?.customers?.length > 0 && (
                    <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                      <h4 className="font-semibold text-slate-200 mb-3">Customer Stripe</h4>
                      {debugData.stripe.customers.map((customer: any, index: number) => (
                        <div key={index} className="mb-3 last:mb-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">ID:</span>
                              <span className="ml-2 font-mono text-xs break-all text-slate-300">{customer.id}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Email:</span>
                              <span className="ml-2 text-slate-300">{customer.email}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Creato:</span>
                              <span className="ml-2 text-slate-300">
                                {new Date(customer.created * 1000).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Metadata:</span>
                              <span className="ml-2 font-mono text-xs text-slate-400 break-all">
                                {JSON.stringify(customer.metadata)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stripe Subscriptions */}
                  {debugData?.stripe?.subscriptions?.length > 0 ? (
                    <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                      <h4 className="font-semibold text-slate-200 mb-3">Abbonamenti Stripe</h4>
                      {debugData.stripe.subscriptions.map((sub: any, index: number) => (
                        <div key={index} className="mb-4 last:mb-0 border border-[#243044] rounded-lg p-3 bg-[#141c27]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">ID:</span>
                              <span className="ml-2 font-mono text-xs break-all text-slate-300">{sub.id}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Stato:</span>
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                sub.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                sub.status === 'canceled' ? 'bg-red-500/20 text-red-400' :
                                'bg-amber-500/20 text-amber-400'
                              }`}>
                                {sub.status}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Price ID:</span>
                              <span className="ml-2 font-mono text-xs break-all text-slate-300">
                                {sub.items?.data?.[0]?.price?.id || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">Scadenza:</span>
                              <span className="ml-2 text-slate-300">
                                {new Date(sub.current_period_end * 1000).toLocaleString()}
                              </span>
                            </div>
                            <div className="md:col-span-2">
                              <span className="text-slate-500">Metadata:</span>
                              <span className="ml-2 font-mono text-xs break-all text-slate-400">
                                {JSON.stringify(sub.metadata)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-amber-400">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Nessun abbonamento trovato</span>
                      </div>
                      <p className="text-amber-400/80 mt-2">
                        Non sono stati trovati abbonamenti attivi su Stripe per questo utente.
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {debugData?.stripe?.error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Errore Stripe</span>
                      </div>
                      <p className="text-red-400/80 mt-2">{debugData.stripe.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
