// src/app/cookie-policy/page.tsx
import { Cookie, Settings, Shield, Eye, Database, Clock } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#0f172a] pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 text-sm rounded-full border border-blue-500/30 px-4 py-2 mb-6 bg-blue-500/10 text-blue-400 font-medium">
            <Cookie className="h-4 w-4" />
            Documento IV — Cookie Policy
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Cookie Policy
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Informativa sull&apos;uso di cookie e strumenti di tracciamento ai sensi dell&apos;art. 122 del D.Lgs. 196/2003 e del Provvedimento Garante n. 231/2021
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500">
            <span>Versione 3.0</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>In vigore dal 23 febbraio 2026</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>GDPR + ePrivacy</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">

        <div className="space-y-6">

          {/* Premessa normativa */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="text-sm text-slate-900 leading-relaxed">
              La presente Cookie Policy è redatta in conformità all&apos;art. 122 del D.Lgs. 30 giugno 2003, n. 196 (Codice Privacy), al Provvedimento del Garante n. 231 del 10 giugno 2021 (&quot;Linee Guida Cookie&quot;), alla Direttiva 2002/58/CE (Direttiva ePrivacy) e al GDPR. Si riferisce all&apos;utilizzo di cookie e strumenti di tracciamento sul sito web e sulla Piattaforma web gestiti da <strong>Emmanuel Salvatore Scozzarini</strong>, libero professionista operante sotto il nome commerciale <strong>RescueManager</strong>, P. IVA 02166430856.
            </p>
          </div>

          {/* 1. Identificazione Titolare */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">1. Identificazione del Titolare</h2>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-sm space-y-2">
              <p><strong>Emmanuel Salvatore Scozzarini</strong> — Nome commerciale: <strong>RescueManager</strong></p>
              <p><strong>P. IVA:</strong> 02166430856 (visibile in modo permanente nel footer di ogni pagina, in conformità all&apos;art. 35 del D.P.R. 633/1972)</p>
              <p><strong>Domicilio Professionale:</strong> Via dello Smeraldo 18, Gela (CL), Sicilia</p>
              <p><strong>E-mail:</strong> <a href="mailto:rescuemanager@legalmail.it" className="text-blue-600 hover:underline">rescuemanager@legalmail.it</a></p>
              <p><strong>Sito web:</strong> <a href="https://www.rescuemanager.eu" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.rescuemanager.eu</a></p>
            </div>
          </section>

          {/* 2. Infrastruttura di Hosting */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Database className="h-5 w-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">2. Infrastruttura di Hosting e Implicazioni per i Cookie</h2>
            </div>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">USA — Trasferimento extra-UE</span>
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">Vercel Inc.</p>
                  <p className="text-xs text-gray-600">Hosting sito web e frontend. I dati tecnici di connessione (incluso indirizzo IP e log di accesso) sono trattati sui server USA. Trasferimento lecito: EU-U.S. Data Privacy Framework (DPF) + SCC.</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">Germania — Solo UE/SEE</span>
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">IONOS SE</p>
                  <p className="text-xs text-gray-600">Hosting API e backend. I log generati dalle chiamate API sono trattati esclusivamente nello Spazio Economico Europeo. Nessun trasferimento verso Paesi terzi.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Cosa sono i Cookie */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Cookie className="h-5 w-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">3. Cosa Sono i Cookie e gli Strumenti di Tracciamento</h2>
            </div>
            <div className="text-gray-700 text-sm leading-relaxed">
              <p>I cookie sono piccoli file di testo che un sito web memorizza sul dispositivo dell&apos;utente (computer, tablet, smartphone) quando quest&apos;ultimo lo visita. Insieme ai cookie, possono essere impiegati altri strumenti di tracciamento analoghi, come pixel, tag, SDK, local storage e fingerprinting, che svolgono funzioni simili. Ai fini della presente Policy, tutti tali strumenti sono indicati collettivamente come <strong>&quot;strumenti di tracciamento&quot;</strong>.</p>
            </div>
          </section>

          {/* 4. Tipologie di Cookie */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Settings className="h-5 w-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">4. Tipologie di Strumenti di Tracciamento Utilizzati</h2>
            </div>
            <div className="text-gray-700 space-y-5 text-sm leading-relaxed">
              <p>Conformemente al Provvedimento del Garante n. 231/2021, gli strumenti di tracciamento si distinguono in tecnici (esenti da consenso) e non tecnici (subordinati a consenso preventivo).</p>

              {/* 4.1 Cookie Tecnici */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-700" />
                  <h3 className="font-semibold text-slate-900">4.1 Cookie e Strumenti Tecnici — Esenti da Consenso</h3>
                </div>
                <div className="p-5">
                  <p className="text-xs text-slate-700 mb-4">Strettamente necessari per il funzionamento del sito e della Piattaforma. Esenti ex art. 122, comma 1, Codice Privacy.</p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200 text-xs">
                      <thead><tr className="bg-gray-50"><th className="border border-gray-200 px-3 py-2 text-left">Nome / Categoria</th><th className="border border-gray-200 px-3 py-2 text-left">Finalità</th><th className="border border-gray-200 px-3 py-2 text-left">Durata</th><th className="border border-gray-200 px-3 py-2 text-left">Parte</th></tr></thead>
                      <tbody>
                        <tr><td className="border border-gray-200 px-3 py-2">Cookie di sessione autenticazione</td><td className="border border-gray-200 px-3 py-2">Mantengono la sessione autenticata, evitando la ripetizione del login</td><td className="border border-gray-200 px-3 py-2">Sessione</td><td className="border border-gray-200 px-3 py-2">Prima parte</td></tr>
                        <tr><td className="border border-gray-200 px-3 py-2">Cookie di preferenze</td><td className="border border-gray-200 px-3 py-2">Memorizzano preferenze di navigazione (lingua, impostazioni UI)</td><td className="border border-gray-200 px-3 py-2">12 mesi</td><td className="border border-gray-200 px-3 py-2">Prima parte</td></tr>
                        <tr><td className="border border-gray-200 px-3 py-2">Cookie CSRF token</td><td className="border border-gray-200 px-3 py-2">Proteggono da attacchi Cross-Site Request Forgery</td><td className="border border-gray-200 px-3 py-2">Sessione</td><td className="border border-gray-200 px-3 py-2">Prima parte</td></tr>
                        <tr><td className="border border-gray-200 px-3 py-2">Cookie di sicurezza</td><td className="border border-gray-200 px-3 py-2">Rilevamento comportamenti anomali e prevenzione accessi fraudolenti</td><td className="border border-gray-200 px-3 py-2">Sessione / 24h</td><td className="border border-gray-200 px-3 py-2">Prima parte</td></tr>
                        <tr><td className="border border-gray-200 px-3 py-2">Cookie bilanciamento del carico</td><td className="border border-gray-200 px-3 py-2">Distribuiscono il traffico tra i server Vercel (CDN routing)</td><td className="border border-gray-200 px-3 py-2">Sessione</td><td className="border border-gray-200 px-3 py-2">Vercel Inc.</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Vercel Inc. potrebbe installare autonomamente cookie tecnici strettamente necessari per il funzionamento dell&apos;infrastruttura CDN. Per l&apos;elenco aggiornato: <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a>.</p>
                </div>
              </div>

              {/* 4.2 Cookie Analytics */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-slate-700" />
                  <h3 className="font-semibold text-slate-900">4.2 Cookie di Analytics — Subordinati a Consenso o Misure di Minimizzazione</h3>
                </div>
                <div className="p-5">
                  <p className="text-xs text-slate-700 mb-3">I cookie analytics sono equiparati ai cookie tecnici ed esenti da consenso <strong>solo se</strong> vengono adottate le seguenti misure di minimizzazione (punto 7.2 Linee Guida Garante n. 231/2021):</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-xs text-slate-700 mb-3">
                    <li>Mascheramento dell&apos;indirizzo IP (ultimo ottetto rimosso prima di qualsiasi elaborazione)</li>
                    <li>Elaborazione esclusivamente in forma aggregata, senza profilazione individuale</li>
                    <li>Limitazione alle interazioni con il solo Sito/Piattaforma del Titolare</li>
                  </ul>
                  <p className="text-xs text-slate-700">In assenza delle predette misure, il Titolare acquisirà il consenso esplicito dell&apos;utente prima di installare tali strumenti.</p>
                  <div className="mt-3 bg-white border border-slate-200 rounded-lg p-3 text-xs">
                    <p><strong>Analytics aggregati</strong> (es. Matomo in-house o Google Analytics con IP anonimizzato) — Finalità: analisi statistica visite — Durata: 13 mesi — Prima/Terza parte (con IP mascherato)</p>
                  </div>
                </div>
              </div>

              {/* 4.3 Cookie Profilazione */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 flex items-center gap-2">
                  <Database className="h-4 w-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">4.3 Cookie di Profilazione e Marketing — Soggetti a Consenso Preventivo</h3>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-700">Il Titolare <strong>non utilizza attualmente</strong> cookie di profilazione o di remarketing pubblicitario. Qualora in futuro tale utilizzo fosse introdotto, la presente Cookie Policy sarà aggiornata e il consenso esplicito dell&apos;utente sarà acquisito preventivamente attraverso il banner di gestione del consenso.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Dati Tecnici e Log */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">5. Dati Tecnici e Log di Accesso</h2>
            </div>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">5.1 Trattamento dei Log di Accesso</h3>
              <p>Indipendentemente dall&apos;utilizzo di cookie, i sistemi informatici della Piattaforma acquisiscono automaticamente log di accesso e connessione (incluso l&apos;indirizzo IP) per: sicurezza informatica, funzionamento e manutenzione, fatturazione.</p>
              <h3 className="font-semibold text-gray-900 mt-4">5.2 Localizzazione del Trattamento dei Log</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="font-semibold text-slate-900">Log frontend (sito web)</p>
                  <p className="text-slate-700 mt-1">Trattati anche da <strong>Vercel Inc. (USA)</strong>, con garanzie di trasferimento EU-U.S. DPF + SCC.</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="font-semibold text-slate-900">Log API (backend)</p>
                  <p className="text-slate-700 mt-1">Trattati da <strong>IONOS SE (Germania)</strong>, esclusivamente all&apos;interno dell&apos;Unione Europea.</p>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">5.3 Periodo di Conservazione dei Log</h3>
              <p>In conformità all&apos;art. 123 del D.Lgs. 196/2003: log di traffico per fatturazione — max <strong>6 mesi</strong>; log di sicurezza — max <strong>12 mesi</strong>. Al termine, cancellazione o anonimizzazione irreversibile.</p>
            </div>
          </section>

          {/* 6. Gestione del Consenso */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Eye className="h-5 w-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">6. Gestione del Consenso</h2>
            </div>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">6.1 Banner di Gestione del Consenso</h3>
              <p>Al primo accesso al Sito, agli utenti non ancora autenticati è presentato un banner informativo conforme alle prescrizioni del Provvedimento del Garante n. 231/2021, che:</p>
              <ul className="list-disc list-inside space-y-1 ml-3">
                <li>Fornisce una prima informativa sintetica sull&apos;utilizzo degli strumenti di tracciamento</li>
                <li>Consente di accettare o rifiutare il consenso mediante azioni equivalenti e paritetiche (pulsanti di pari rilievo grafico)</li>
                <li>Consente di chiudere il banner mantenendo le impostazioni predefinite (solo cookie tecnici attivi)</li>
                <li>Non implementa meccanismi di &quot;cookie wall&quot; (blocco dell&apos;accesso in mancanza di consenso)</li>
              </ul>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-2">
                <p className="text-xs text-slate-900"><strong>Privacy by Default (art. 25 GDPR):</strong> nessun cookie non tecnico è installato prima che l&apos;utente abbia espresso consenso attraverso un&apos;azione positiva e inequivocabile. Il semplice proseguimento della navigazione (scroll) non costituisce consenso valido.</p>
              </div>

              <h3 className="font-semibold text-gray-900 mt-5">6.2 Revoca del Consenso e Gestione delle Preferenze</h3>
              <p>L&apos;utente può revocare il consenso in qualsiasi momento tramite:</p>
              <ul className="list-disc list-inside space-y-1 ml-3">
                <li>Il pannello di gestione delle preferenze cookie accessibile tramite il link &quot;Gestisci Cookie&quot; nel footer</li>
                <li>Le impostazioni del browser (link alle istruzioni principali browser):</li>
              </ul>
              <div className="grid grid-cols-2 gap-2 ml-3 mt-2 text-xs">
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Chrome →</a>
                <a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mozilla Firefox →</a>
                <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Safari →</a>
                <a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Microsoft Edge →</a>
              </div>
              <p className="text-xs text-gray-500 mt-2">La revoca del consenso non pregiudica la liceità del trattamento effettuato prima della revoca. La disabilitazione dei cookie tecnici potrebbe pregiudicare il corretto funzionamento della Piattaforma.</p>
            </div>
          </section>

          {/* 7. Aggiornamenti */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-slate-700" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">7. Aggiornamenti della Cookie Policy</h2>
            </div>
            <div className="text-gray-700 text-sm leading-relaxed">
              <p>Il Titolare, Emmanuel Salvatore Scozzarini (P. IVA 02166430856), si riserva il diritto di modificare la presente Cookie Policy in qualsiasi momento, in risposta a modifiche normative, tecnologiche o operative (ivi incluse variazioni nell&apos;infrastruttura di hosting o nei fornitori di servizi). Le modifiche sono comunicate agli utenti tramite avviso sul Sito e, ove opportuno, tramite nuova richiesta di consenso.</p>
            </div>
          </section>

          {/* 8. Contatti */}
          <div className="bg-[#0f172a] rounded-xl p-6 text-white">
            <h3 className="font-bold text-lg mb-4">8. Contatti e Diritti degli Interessati</h3>
            <p className="text-slate-300 text-sm mb-4">Per qualsiasi richiesta relativa alla presente Cookie Policy o all&apos;esercizio dei diritti in materia di dati personali:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Titolare del Trattamento</p>
                <p className="font-semibold">Emmanuel Salvatore Scozzarini — RescueManager</p>
                <p className="text-slate-400 text-xs mt-1">P. IVA: 02166430856</p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Recapiti</p>
                <p>Via dello Smeraldo 18, Gela (CL), Sicilia</p>
                <p><a href="mailto:rescuemanager@legalmail.it" className="text-blue-400 hover:underline">rescuemanager@legalmail.it</a></p>
                <p><a href="https://www.rescuemanager.eu" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">www.rescuemanager.eu</a></p>
                <p className="text-slate-400 text-xs mt-2">Reclamo: <a href="https://www.garanteprivacy.it" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Garante Privacy (www.garanteprivacy.it)</a></p>
              </div>
            </div>
          </div>

          {/* Link altre policy */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/terms-of-use" className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50">Termini e Condizioni</a>
            <a href="/privacy-policy" className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50">Privacy Policy</a>
            <a href="/dpa" className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50">Data Processing Agreement</a>
          </div>

        </div>
      </div>
    </div>
  );
}
