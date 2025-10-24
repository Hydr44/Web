"use client";

import { useState } from "react";
import { Bug, CheckCircle2, AlertCircle, X } from "lucide-react";

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
        className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
          isLoading
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : "bg-yellow-600 text-white hover:bg-yellow-700"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Debug Abbonamento</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {debugData?.error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Errore</span>
                  </div>
                  <p className="text-red-700 mt-2">{debugData.error}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Utente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">ID:</span>
                        <span className="ml-2 font-mono">{debugData?.user?.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2">{debugData?.user?.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Profilo Database</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Stripe Customer ID:</span>
                        <span className="ml-2 font-mono text-xs break-all">
                          {debugData?.profile?.stripe_customer_id || "Nessuno"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Piano Attuale:</span>
                        <span className="ml-2 font-semibold">
                          {debugData?.profile?.current_plan || "Nessuno"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stripe Customers */}
                  {debugData?.stripe?.customers?.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Customer Stripe</h4>
                      {debugData.stripe.customers.map((customer: any, index: number) => (
                        <div key={index} className="mb-3 last:mb-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">ID:</span>
                              <span className="ml-2 font-mono text-xs break-all">{customer.id}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <span className="ml-2">{customer.email}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Creato:</span>
                              <span className="ml-2">
                                {new Date(customer.created * 1000).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Metadata:</span>
                              <span className="ml-2 font-mono text-xs">
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
                    <div className="bg-purple-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Abbonamenti Stripe</h4>
                      {debugData.stripe.subscriptions.map((sub: any, index: number) => (
                        <div key={index} className="mb-4 last:mb-0 border border-purple-200 rounded-lg p-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">ID:</span>
                              <span className="ml-2 font-mono text-xs break-all">{sub.id}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Stato:</span>
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                sub.status === 'active' ? 'bg-green-100 text-green-800' :
                                sub.status === 'canceled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {sub.status}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Price ID:</span>
                              <span className="ml-2 font-mono text-xs break-all">
                                {sub.items?.data?.[0]?.price?.id || "N/A"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Scadenza:</span>
                              <span className="ml-2">
                                {new Date(sub.current_period_end * 1000).toLocaleString()}
                              </span>
                            </div>
                            <div className="md:col-span-2">
                              <span className="text-gray-600">Metadata:</span>
                              <span className="ml-2 font-mono text-xs break-all">
                                {JSON.stringify(sub.metadata)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Nessun abbonamento trovato</span>
                      </div>
                      <p className="text-yellow-700 mt-2">
                        Non sono stati trovati abbonamenti attivi su Stripe per questo utente.
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {debugData?.stripe?.error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Errore Stripe</span>
                      </div>
                      <p className="text-red-700 mt-2">{debugData.stripe.error}</p>
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
