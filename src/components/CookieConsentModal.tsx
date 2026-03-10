"use client";
import { useEffect, useState } from "react";
import { Settings, Shield, Eye, Database } from "lucide-react";

export default function CookieConsentModal() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    functional: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (consent) {
      try {
        setPreferences(JSON.parse(consent));
      } catch {
        // ignora
      }
    } else {
      setTimeout(() => setVisible(true), 600);
    }
  }, []);

  const saveConsent = (prefs: typeof preferences) => {
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    setVisible(false);
  };

  const acceptAll = () => saveConsent({ essential: true, analytics: true, functional: true, marketing: true });
  const rejectNonEssential = () => saveConsent({ essential: true, analytics: false, functional: false, marketing: false });
  const savePreferences = () => saveConsent(preferences);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      style={{ position: "fixed" }}
    >
      <div
        className="w-full max-w-[480px] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white border-2 border-[#0f172a] shadow-2xl">
          {/* Header dark — stile sito */}
          <div className="bg-[#0f172a] px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-0.5">Privacy</p>
              <h2 className="text-lg font-extrabold text-white leading-tight">Utilizziamo i cookie</h2>
            </div>
            <button
              onClick={rejectNonEssential}
              className="text-slate-400 hover:text-white transition-colors text-xl font-bold leading-none"
              aria-label="Chiudi"
            >
              ×
            </button>
          </div>

          {/* Corpo */}
          <div className="px-6 py-5">
            {!showPreferences ? (
              <>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  Usiamo cookie tecnici (necessari) e analitici per migliorare il sito.
                  Puoi accettare tutto, scegliere solo gli essenziali o personalizzare.
                </p>
                <p className="text-xs text-gray-500 mb-5">
                  Leggi la{" "}
                  <a href="/cookie-policy" className="text-blue-600 hover:underline font-medium">Cookie Policy</a>
                  {" "}e la{" "}
                  <a href="/privacy-policy" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>.
                </p>

                {/* Tipi cookie — compatto */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    { icon: <Shield className="h-3.5 w-3.5" />, label: "Essenziali", desc: "Sempre attivi", color: "text-slate-700 bg-slate-50 border-slate-300" },
                    { icon: <Eye className="h-3.5 w-3.5" />, label: "Analytics", desc: "IP mascherato", color: "text-slate-700 bg-slate-50 border-slate-300" },
                    { icon: <Settings className="h-3.5 w-3.5" />, label: "Funzionali", desc: "Preferenze", color: "text-slate-700 bg-slate-50 border-slate-300" },
                    { icon: <Database className="h-3.5 w-3.5" />, label: "Marketing", desc: "Pubblicità", color: "text-slate-700 bg-slate-50 border-slate-300" },
                  ].map((c) => (
                    <div key={c.label} className={`border rounded px-3 py-2 flex items-center gap-2 ${c.color}`}>
                      {c.icon}
                      <div>
                        <p className="text-xs font-bold leading-tight">{c.label}</p>
                        <p className="text-xs opacity-75 leading-tight">{c.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottoni */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={acceptAll}
                    className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
                  >
                    ACCETTA TUTTI
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={rejectNonEssential}
                      className="px-4 py-2.5 border-2 border-[#0f172a] text-[#0f172a] hover:bg-gray-50 font-bold text-sm transition-colors"
                    >
                      Solo Essenziali
                    </button>
                    <button
                      onClick={() => setShowPreferences(true)}
                      className="px-4 py-2.5 border-2 border-gray-300 text-gray-600 hover:border-gray-400 font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Personalizza
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-400 text-center mt-4">
                  Conforme GDPR (UE 2016/679) · D.Lgs. 196/2003
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-xs text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1"
                >
                  ← Indietro
                </button>
                <h3 className="font-extrabold text-[#0f172a] text-base mb-1">Personalizza</h3>
                <p className="text-xs text-gray-500 mb-4">I cookie essenziali sono sempre attivi.</p>

                <div className="space-y-3 mb-5">
                  {/* Essenziali — fissi */}
                  <div className="flex items-center justify-between border border-gray-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-slate-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Essenziali</p>
                        <p className="text-xs text-gray-500">Autenticazione e sicurezza</p>
                      </div>
                    </div>
                    <div className="w-10 h-5 bg-slate-500 rounded-full flex items-center justify-end px-0.5 flex-shrink-0">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>

                  {/* Toggle row helper */}
                  {[
                    { key: "analytics" as const, icon: <Eye className="h-4 w-4 text-slate-600" />, label: "Analytics", desc: "Statistiche visita anonimizzate", color: "bg-blue-600" },
                    { key: "functional" as const, icon: <Settings className="h-4 w-4 text-slate-600" />, label: "Funzionali", desc: "Ricorda lingua e preferenze", color: "bg-blue-600" },
                    { key: "marketing" as const, icon: <Database className="h-4 w-4 text-slate-600" />, label: "Marketing", desc: "Contenuti e pubblicità mirati", color: "bg-blue-600" },
                  ].map((row) => (
                    <div key={row.key} className="flex items-center justify-between border border-gray-200 px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.icon}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                          <p className="text-xs text-gray-500">{row.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPreferences(p => ({ ...p, [row.key]: !p[row.key] }))}
                        className={`w-10 h-5 rounded-full flex items-center transition-colors flex-shrink-0 px-0.5 ${preferences[row.key] ? `${row.color} justify-end` : "bg-gray-300 justify-start"}`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={savePreferences}
                    className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
                  >
                    SALVA PREFERENZE
                  </button>
                  <button
                    onClick={acceptAll}
                    className="w-full px-5 py-2.5 border-2 border-gray-300 text-gray-600 hover:border-gray-400 font-medium text-sm transition-colors"
                  >
                    Accetta Tutti
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
