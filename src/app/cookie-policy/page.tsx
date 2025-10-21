// src/app/cookie-policy/page.tsx
import { Cookie, Settings, Shield, Eye, Database, Clock, Users } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
            <Cookie className="h-4 w-4" />
            Cookie Policy
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Cookie Policy</span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Questa Cookie Policy spiega come RescueManager utilizza i cookie e tecnologie simili per migliorare la tua esperienza di navigazione.
          </p>
          
          <div className="mt-6 text-sm text-gray-500">
            Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
          </div>
        </div>

        {/* Contenuto */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            
            {/* 1. Cosa sono i cookie */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cookie className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">1. Cosa Sono i Cookie</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>
                  I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo quando visiti un sito web. Questi file contengono informazioni che vengono utilizzate per migliorare la tua esperienza di navigazione e fornire funzionalità personalizzate.
                </p>
                <p>
                  I cookie possono essere "di sessione" (temporanei e cancellati quando chiudi il browser) o "persistenti" (rimangono sul tuo dispositivo per un periodo di tempo determinato).
                </p>
              </div>
            </section>

            {/* 2. Tipi di cookie che utilizziamo */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">2. Tipi di Cookie che Utilizziamo</h2>
              </div>
              <div className="text-gray-700 space-y-6">
                
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-500/10 flex items-center justify-center">
                      <Shield className="h-3 w-3 text-green-600" />
                    </div>
                    Cookie Essenziali
                  </h3>
                  <p className="mb-3">Questi cookie sono necessari per il funzionamento del sito web e non possono essere disabilitati.</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Cookie di autenticazione e sessione</li>
                    <li>Cookie per la sicurezza e prevenzione frodi</li>
                    <li>Cookie per le preferenze di base</li>
                    <li>Cookie per il carrello e-commerce</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center">
                      <Eye className="h-3 w-3 text-blue-600" />
                    </div>
                    Cookie di Prestazioni e Analytics
                  </h3>
                  <p className="mb-3">Questi cookie ci aiutano a capire come gli utenti interagiscono con il nostro sito.</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Google Analytics per statistiche di utilizzo</li>
                    <li>Cookie per il monitoraggio delle prestazioni</li>
                    <li>Cookie per l'analisi del comportamento utente</li>
                    <li>Cookie per il test A/B</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-500/10 flex items-center justify-center">
                      <Users className="h-3 w-3 text-purple-600" />
                    </div>
                    Cookie di Funzionalità
                  </h3>
                  <p className="mb-3">Questi cookie permettono al sito di ricordare le tue scelte e preferenze.</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Cookie per le preferenze di lingua</li>
                    <li>Cookie per le impostazioni di tema</li>
                    <li>Cookie per le preferenze di notifica</li>
                    <li>Cookie per la personalizzazione dell'interfaccia</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center">
                      <Database className="h-3 w-3 text-orange-600" />
                    </div>
                    Cookie di Marketing
                  </h3>
                  <p className="mb-3">Questi cookie vengono utilizzati per fornire pubblicità rilevante e misurare l'efficacia delle campagne.</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Cookie per il remarketing</li>
                    <li>Cookie per il targeting pubblicitario</li>
                    <li>Cookie per i social media</li>
                    <li>Cookie per il tracciamento delle conversioni</li>
                  </ul>
                </div>

              </div>
            </section>

            {/* 3. Durata dei cookie */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">3. Durata dei Cookie</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Tipo di Cookie</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Durata</th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Descrizione</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">Cookie di Sessione</td>
                        <td className="border border-gray-300 px-4 py-2">Fino alla chiusura del browser</td>
                        <td className="border border-gray-300 px-4 py-2">Temporanei, cancellati quando chiudi il browser</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">Cookie di Autenticazione</td>
                        <td className="border border-gray-300 px-4 py-2">30 giorni</td>
                        <td className="border border-gray-300 px-4 py-2">Mantengono la sessione di login</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">Cookie di Preferenze</td>
                        <td className="border border-gray-300 px-4 py-2">1 anno</td>
                        <td className="border border-gray-300 px-4 py-2">Ricordano le tue impostazioni</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-4 py-2">Cookie Analytics</td>
                        <td className="border border-gray-300 px-4 py-2">2 anni</td>
                        <td className="border border-gray-300 px-4 py-2">Raccolgono dati statistici</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 4. Cookie di terze parti */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Database className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">4. Cookie di Terze Parti</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>Utilizziamo servizi di terze parti che possono impostare cookie:</p>
                
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Google Analytics</h3>
                  <p className="mb-2">Utilizziamo Google Analytics per analizzare l'utilizzo del nostro sito.</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li><strong>Finalità:</strong> Analisi del traffico e comportamento utenti</li>
                    <li><strong>Durata:</strong> Fino a 2 anni</li>
                    <li><strong>Privacy Policy:</strong> <a href="https://policies.google.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Stripe</h3>
                  <p className="mb-2">Utilizziamo Stripe per i pagamenti online.</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li><strong>Finalità:</strong> Processamento pagamenti sicuro</li>
                    <li><strong>Durata:</strong> Variabile</li>
                    <li><strong>Privacy Policy:</strong> <a href="https://stripe.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a></li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Supabase</h3>
                  <p className="mb-2">Utilizziamo Supabase per l'autenticazione e il database.</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li><strong>Finalità:</strong> Gestione utenti e dati</li>
                    <li><strong>Durata:</strong> Sessione</li>
                    <li><strong>Privacy Policy:</strong> <a href="https://supabase.com/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a></li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. Gestione dei cookie */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">5. Come Gestire i Cookie</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>Hai diverse opzioni per gestire i cookie:</p>
                
                <h3 className="text-lg font-semibold text-gray-900">5.1 Impostazioni del Browser</h3>
                <p>Puoi controllare e cancellare i cookie attraverso le impostazioni del tuo browser:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Chrome:</strong> Impostazioni → Privacy e sicurezza → Cookie</li>
                  <li><strong>Firefox:</strong> Opzioni → Privacy e sicurezza → Cookie</li>
                  <li><strong>Safari:</strong> Preferenze → Privacy → Cookie</li>
                  <li><strong>Edge:</strong> Impostazioni → Cookie e autorizzazioni sito</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">5.2 Banner di Consenso</h3>
                <p>Quando visiti il nostro sito per la prima volta, vedrai un banner che ti permette di:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Accettare tutti i cookie</li>
                  <li>Rifiutare i cookie non essenziali</li>
                  <li>Personalizzare le tue preferenze</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">5.3 Strumenti di Opt-out</h3>
                <p>Puoi utilizzare questi strumenti per disabilitare specifici cookie:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Google Analytics:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a></li>
                  <li><strong>Network Advertising Initiative:</strong> <a href="http://www.networkadvertising.org/choices/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">NAI Opt-out</a></li>
                </ul>
              </div>
            </section>

            {/* 6. Impatto della disabilitazione */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">6. Impatto della Disabilitazione dei Cookie</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ Attenzione</h3>
                  <p className="text-yellow-700">
                    Disabilitare alcuni cookie potrebbe influire sul funzionamento del sito. I cookie essenziali sono necessari per:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 mt-3 text-yellow-700">
                    <li>Mantenere la sessione di login</li>
                    <li>Garantire la sicurezza del sito</li>
                    <li>Salvare le preferenze di base</li>
                    <li>Processare i pagamenti</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 7. Aggiornamenti */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">7. Aggiornamenti a Questa Policy</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>
                  Potremmo aggiornare questa Cookie Policy periodicamente per riflettere cambiamenti nelle nostre pratiche o per altri motivi operativi, legali o normativi. Ti consigliamo di rivedere questa policy regolarmente.
                </p>
              </div>
            </section>

            {/* 8. Contatti */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Cookie className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">8. Contatti</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>Per domande riguardo a questa Cookie Policy, contattaci:</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p><strong>Email:</strong> <a href="mailto:cookies@rescuemanager.it" className="text-primary hover:underline">cookies@rescuemanager.it</a></p>
                  <p><strong>Telefono:</strong> +39 02 1234 5678</p>
                  <p><strong>Indirizzo:</strong> Via Roma 123, 20100 Milano, Italia</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
