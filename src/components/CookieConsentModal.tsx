"use client";
import { useEffect, useState } from "react";
import { Cookie, Settings, Shield, Eye, Database } from "lucide-react";

export default function CookieConsentModal() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Sempre attivi
    analytics: false,
    functional: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Mostra il banner dopo un breve delay per non essere invasivo
      setTimeout(() => setVisible(true), 1000);
    } else {
      // Carica le preferenze salvate
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
      } catch (e) {
        console.error("Errore caricamento preferenze cookie:", e);
      }
    }
  }, []);

  const saveConsent = (prefs: typeof preferences) => {
    localStorage.setItem("cookie-consent", JSON.stringify(prefs));
    setVisible(false);
    // Qui puoi aggiungere logica per attivare/disattivare i cookie in base alle preferenze
    if (prefs.analytics) {
      // Attiva Google Analytics o altri strumenti analytics
      console.log("Analytics cookies enabled");
    }
    if (prefs.marketing) {
      // Attiva cookie di marketing
      console.log("Marketing cookies enabled");
    }
  };

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      functional: true,
      marketing: true,
    };
    saveConsent(allAccepted);
  };

  const rejectNonEssential = () => {
    const onlyEssential = {
      essential: true,
      analytics: false,
      functional: false,
      marketing: false,
    };
    saveConsent(onlyEssential);
  };

  const savePreferences = () => {
    saveConsent(preferences);
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Cookie className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Gestione Cookie</h2>
                  <p className="text-sm text-gray-500">Rispettiamo la tua privacy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {!showPreferences ? (
              <>
                {/* Messaggio principale */}
                <div className="mb-6">
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Utilizziamo cookie e tecnologie simili per migliorare la tua esperienza di navigazione, 
                    analizzare il traffico del sito e personalizzare i contenuti. Alcuni cookie sono essenziali 
                    per il funzionamento del sito, mentre altri ci aiutano a capire come utilizzi i nostri servizi.
                  </p>
                  <p className="text-sm text-gray-600">
                    Puoi scegliere quali cookie accettare. Per maggiori informazioni, consulta la nostra{" "}
                    <a href="/cookie-policy" className="text-blue-600 hover:underline font-medium">
                      Cookie Policy
                    </a>
                    {" "}e la{" "}
                    <a href="/privacy-policy" className="text-blue-600 hover:underline font-medium">
                      Privacy Policy
                    </a>.
                  </p>
                </div>

                {/* Info rapida sui tipi di cookie */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-900">Cookie Essenziali</span>
                    </div>
                    <p className="text-xs text-green-700">Necessari per il funzionamento del sito (sempre attivi)</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">Cookie Analytics</span>
                    </div>
                    <p className="text-xs text-blue-700">Ci aiutano a capire come usi il sito</p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Settings className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-900">Cookie Funzionali</span>
                    </div>
                    <p className="text-xs text-purple-700">Ricordano le tue preferenze</p>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-semibold text-orange-900">Cookie Marketing</span>
                    </div>
                    <p className="text-xs text-orange-700">Personalizzano contenuti e pubblicità</p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={acceptAll}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Accetta Tutti i Cookie
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={rejectNonEssential}
                      className="px-4 py-2.5 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Solo Essenziali
                    </button>
                    <button
                      onClick={() => setShowPreferences(true)}
                      className="px-4 py-2.5 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Personalizza
                    </button>
                  </div>
                </div>

                {/* Conformità GDPR */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    🇪🇺 Conforme al GDPR (Regolamento UE 2016/679) e al D.Lgs. 196/2003
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Preferenze dettagliate */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-1"
                  >
                    ← Torna indietro
                  </button>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalizza le Tue Preferenze</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Scegli quali categorie di cookie desideri attivare. I cookie essenziali sono sempre attivi 
                    perché necessari per il funzionamento del sito.
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Cookie Essenziali */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-gray-900">Cookie Essenziali</h4>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            Sempre attivi
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Necessari per l'autenticazione, la sicurezza e il funzionamento base del sito. 
                          Non possono essere disabilitati.
                        </p>
                      </div>
                      <div className="ml-4">
                        <div className="w-12 h-6 bg-green-500 rounded-full flex items-center justify-end px-1">
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cookie Analytics */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">Cookie Analytics</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          Ci aiutano a capire come i visitatori interagiscono con il sito raccogliendo 
                          informazioni in forma anonima (es. Google Analytics con IP mascherato).
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                          className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                            preferences.analytics ? "bg-blue-500 justify-end" : "bg-gray-300 justify-start"
                          } px-1`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cookie Funzionali */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Settings className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">Cookie Funzionali</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          Permettono al sito di ricordare le tue scelte (lingua, tema, preferenze) 
                          per offrirti un'esperienza personalizzata.
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => setPreferences(p => ({ ...p, functional: !p.functional }))}
                          className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                            preferences.functional ? "bg-purple-500 justify-end" : "bg-gray-300 justify-start"
                          } px-1`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cookie Marketing */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-5 w-5 text-orange-600" />
                          <h4 className="font-semibold text-gray-900">Cookie Marketing</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                          Utilizzati per mostrarti pubblicità rilevanti e misurare l'efficacia 
                          delle campagne pubblicitarie.
                        </p>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                          className={`w-12 h-6 rounded-full flex items-center transition-colors ${
                            preferences.marketing ? "bg-orange-500 justify-end" : "bg-gray-300 justify-start"
                          } px-1`}
                        >
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={savePreferences}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Salva Preferenze
                  </button>
                  <button
                    onClick={acceptAll}
                    className="w-full px-6 py-2.5 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Accetta Tutti
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
