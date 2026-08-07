// src/app/cookie-policy/page.tsx

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#0f172a] pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Cookie Policy
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Informativa sull&apos;uso di cookie e strumenti di tracciamento ai sensi dell&apos;art. 122 del D.Lgs. 196/2003 e del Provvedimento Garante n. 231/2021
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-slate-500">
            <span>Versione 4.0</span>
            <span className="text-slate-600">·</span>
            <span>In vigore dal 10 settembre 2026</span>
            <span className="text-slate-600">·</span>
            <span>GDPR + ePrivacy</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-6">

          {/* Premessa normativa */}
          <div className="border-l-2 border-[#0f172a] bg-slate-50 p-5 text-sm text-slate-700 leading-relaxed">
            La presente Cookie Policy è redatta in conformità all&apos;art. 122 del D.Lgs. 30 giugno 2003, n. 196 (Codice Privacy), al Provvedimento del Garante n. 231 del 10 giugno 2021 (&quot;Linee Guida Cookie&quot;), alla Direttiva 2002/58/CE (Direttiva ePrivacy) e al GDPR. Si riferisce all&apos;utilizzo di cookie e strumenti di tracciamento sul sito web e sulla Piattaforma web gestiti da <strong>RescueManager S.r.l.</strong>, P.IVA 02176370852.
          </div>

          {/* 1. Identificazione del Titolare */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Identificazione del Titolare</h2>
            <div className="bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 leading-relaxed">
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li><strong>RescueManager S.r.l.</strong> — società a responsabilità limitata di diritto italiano</li>
                <li><strong>P. IVA:</strong> 02176370852 (visibile in modo permanente nel footer di ogni pagina, in conformità all&apos;art. 35 del D.P.R. 633/1972)</li>
                <li><strong>Sede legale:</strong> Via dello Smeraldo 18, 93012 Gela (CL), Italia</li>
                <li><strong>E-mail (PEC):</strong> <a href="mailto:rescuemanager@legalmail.it" className="underline">rescuemanager@legalmail.it</a></li>
                <li><strong>Sito web:</strong> <a href="https://www.rescuemanager.eu" className="underline" target="_blank" rel="noopener noreferrer">www.rescuemanager.eu</a></li>
              </ul>
            </div>
          </section>

          {/* 2. Infrastruttura di Hosting */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Infrastruttura di Hosting e Implicazioni per i Cookie</h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-4">
              <div className="bg-slate-50 border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">Vercel Inc. <span className="font-normal text-slate-500">— USA — Trasferimento extra-UE</span></p>
                <p className="mt-1">Hosting sito web e frontend. I dati tecnici di connessione (incluso indirizzo IP e log di accesso) sono trattati sui server USA. Trasferimento lecito: EU-U.S. Data Privacy Framework (DPF) + SCC.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">IONOS SE <span className="font-normal text-slate-500">— Germania — Solo UE/SEE</span></p>
                <p className="mt-1">Hosting API e backend. I log generati dalle chiamate API sono trattati esclusivamente nello Spazio Economico Europeo. Nessun trasferimento verso Paesi terzi.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">Supabase, Inc. <span className="font-normal text-slate-500">— USA/EU — SCC</span></p>
                <p className="mt-1">Servizi di database e autenticazione della Piattaforma. Gli identificativi tecnici di sessione e i token di autenticazione necessari al login sono gestiti tramite l&apos;infrastruttura Supabase. Trasferimento lecito: Clausole Contrattuali Standard (SCC).</p>
              </div>
              <p>Ulteriori dettagli sui fornitori e sulla giurisdizione dell&apos;infrastruttura sono disponibili nella Privacy Policy e nella pagina &quot;Trasparenza e Switching&quot;.</p>
            </div>
          </section>

          {/* 3. Cosa sono i Cookie */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Cosa Sono i Cookie e gli Strumenti di Tracciamento</h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              I cookie sono piccoli file di testo che un sito web memorizza sul dispositivo dell&apos;utente (computer, tablet, smartphone) quando quest&apos;ultimo lo visita. Insieme ai cookie, possono essere impiegati altri strumenti di tracciamento analoghi, come pixel, tag, SDK, local storage e fingerprinting, che svolgono funzioni simili. Ai fini della presente Policy, tutti tali strumenti sono indicati collettivamente come <strong>&quot;strumenti di tracciamento&quot;</strong>.
            </p>
          </section>

          {/* 4. Tipologie di Strumenti di Tracciamento */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Tipologie di Strumenti di Tracciamento Utilizzati</h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-5">
              <p>Conformemente al Provvedimento del Garante n. 231/2021, gli strumenti di tracciamento si distinguono in tecnici (esenti da consenso) e non tecnici (subordinati a consenso preventivo).</p>

              {/* 4.1 Cookie Tecnici */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">4.1 Cookie e Strumenti Tecnici — Esenti da Consenso</h3>
                <p className="mb-3">Strettamente necessari per il funzionamento del sito e della Piattaforma. Esenti ex art. 122, comma 1, Codice Privacy.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="border border-slate-200 px-3 py-2 text-left">Nome / Categoria</th>
                        <th className="border border-slate-200 px-3 py-2 text-left">Finalità</th>
                        <th className="border border-slate-200 px-3 py-2 text-left">Durata</th>
                        <th className="border border-slate-200 px-3 py-2 text-left">Parte</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-200 px-3 py-2">Cookie di sessione autenticazione</td>
                        <td className="border border-slate-200 px-3 py-2">Mantengono la sessione autenticata, evitando la ripetizione del login</td>
                        <td className="border border-slate-200 px-3 py-2">Sessione</td>
                        <td className="border border-slate-200 px-3 py-2">Prima parte</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-3 py-2">Token di autenticazione (local storage — Supabase)</td>
                        <td className="border border-slate-200 px-3 py-2">Gestione tecnica del login e del rinnovo della sessione</td>
                        <td className="border border-slate-200 px-3 py-2">Fino al logout o alla scadenza del token</td>
                        <td className="border border-slate-200 px-3 py-2">Prima parte / Supabase, Inc.</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-3 py-2">Cookie di preferenze</td>
                        <td className="border border-slate-200 px-3 py-2">Memorizzano preferenze di navigazione (lingua, impostazioni UI)</td>
                        <td className="border border-slate-200 px-3 py-2">12 mesi</td>
                        <td className="border border-slate-200 px-3 py-2">Prima parte</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-3 py-2">Cookie CSRF token</td>
                        <td className="border border-slate-200 px-3 py-2">Proteggono da attacchi Cross-Site Request Forgery</td>
                        <td className="border border-slate-200 px-3 py-2">Sessione</td>
                        <td className="border border-slate-200 px-3 py-2">Prima parte</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-3 py-2">Cookie di sicurezza</td>
                        <td className="border border-slate-200 px-3 py-2">Rilevamento comportamenti anomali e prevenzione accessi fraudolenti</td>
                        <td className="border border-slate-200 px-3 py-2">Sessione / 24h</td>
                        <td className="border border-slate-200 px-3 py-2">Prima parte</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-3 py-2">Cookie bilanciamento del carico</td>
                        <td className="border border-slate-200 px-3 py-2">Distribuiscono il traffico tra i server Vercel (CDN routing)</td>
                        <td className="border border-slate-200 px-3 py-2">Sessione</td>
                        <td className="border border-slate-200 px-3 py-2">Vercel Inc.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3">Vercel Inc. potrebbe installare autonomamente cookie tecnici strettamente necessari per il funzionamento dell&apos;infrastruttura CDN. Per l&apos;elenco aggiornato: <a href="https://vercel.com/legal/privacy-policy" className="underline" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a>.</p>
                <div className="bg-slate-50 border border-slate-200 p-4 mt-3">
                  <p><strong>Pagine di pagamento di terzi.</strong> Durante le operazioni di pagamento l&apos;utente può essere reindirizzato a pagine gestite da Stripe (carta) o GoCardless (mandato di addebito SDD), che operano quali titolari autonomi per i cookie installati sui rispettivi domini; si rinvia alle relative informative (<a href="https://stripe.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>, <a href="https://gocardless.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">gocardless.com/privacy</a>).</p>
                </div>
              </div>

              {/* 4.2 Cookie Analytics */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">4.2 Cookie di Analytics — Subordinati a Consenso o Misure di Minimizzazione</h3>
                <p className="mb-3">I cookie analytics sono equiparati ai cookie tecnici ed esenti da consenso <strong>solo se</strong> vengono adottate le seguenti misure di minimizzazione (punto 7.2 Linee Guida Garante n. 231/2021):</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                  <li>Mascheramento dell&apos;indirizzo IP (ultimo ottetto rimosso prima di qualsiasi elaborazione)</li>
                  <li>Elaborazione esclusivamente in forma aggregata, senza profilazione individuale</li>
                  <li>Limitazione alle interazioni con il solo Sito/Piattaforma del Titolare</li>
                </ul>
                <p className="mt-3">In assenza delle predette misure, il Titolare acquisirà il consenso esplicito dell&apos;utente prima di installare tali strumenti.</p>
                <div className="bg-slate-50 border border-slate-200 p-4 mt-3">
                  <p><strong>Analytics aggregati</strong> (es. Matomo in-house o Google Analytics con IP anonimizzato) — Finalità: analisi statistica visite — Durata: 13 mesi — Prima/Terza parte (con IP mascherato)</p>
                </div>
              </div>

              {/* 4.3 Cookie Profilazione */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">4.3 Cookie di Profilazione e Marketing — Soggetti a Consenso Preventivo</h3>
                <p>Il Titolare <strong>non utilizza attualmente</strong> cookie di profilazione o di remarketing pubblicitario. Qualora in futuro tale utilizzo fosse introdotto, la presente Cookie Policy sarà aggiornata e il consenso esplicito dell&apos;utente sarà acquisito preventivamente attraverso il banner di gestione del consenso.</p>
              </div>
            </div>
          </section>

          {/* 5. Dati Tecnici e Log */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Dati Tecnici e Log di Accesso</h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">5.1 Trattamento dei Log di Accesso</h3>
                <p>Indipendentemente dall&apos;utilizzo di cookie, i sistemi informatici della Piattaforma acquisiscono automaticamente log di accesso e connessione (incluso l&apos;indirizzo IP) per: sicurezza informatica, funzionamento e manutenzione, fatturazione.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">5.2 Localizzazione del Trattamento dei Log</h3>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                  <li><strong>Log frontend (sito web):</strong> trattati anche da Vercel Inc. (USA), con garanzie di trasferimento EU-U.S. DPF + SCC.</li>
                  <li><strong>Log API (backend):</strong> trattati da IONOS SE (Germania), esclusivamente all&apos;interno dell&apos;Unione Europea.</li>
                  <li><strong>Log di autenticazione:</strong> trattati tramite Supabase, Inc. (USA/EU), con garanzia SCC.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">5.3 Periodo di Conservazione dei Log</h3>
                <p>In conformità all&apos;art. 123 del D.Lgs. 196/2003: log di traffico per fatturazione — max <strong>6 mesi</strong>; log di sicurezza — max <strong>12 mesi</strong>. Al termine, cancellazione o anonimizzazione irreversibile.</p>
              </div>
            </div>
          </section>

          {/* 6. Gestione del Consenso */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">6. Gestione del Consenso</h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">6.1 Banner di Gestione del Consenso</h3>
                <p>Al primo accesso al Sito, agli utenti non ancora autenticati è presentato un banner informativo conforme alle prescrizioni del Provvedimento del Garante n. 231/2021, che:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700 mt-2">
                  <li>Fornisce una prima informativa sintetica sull&apos;utilizzo degli strumenti di tracciamento</li>
                  <li>Consente di accettare o rifiutare il consenso mediante azioni equivalenti e paritetiche (pulsanti di pari rilievo grafico)</li>
                  <li>Consente di chiudere il banner mantenendo le impostazioni predefinite (solo cookie tecnici attivi)</li>
                  <li>Non implementa meccanismi di &quot;cookie wall&quot; (blocco dell&apos;accesso in mancanza di consenso)</li>
                </ul>
                <div className="bg-slate-50 border border-slate-200 p-4 mt-3">
                  <p><strong>Privacy by Default (art. 25 GDPR):</strong> nessun cookie non tecnico è installato prima che l&apos;utente abbia espresso consenso attraverso un&apos;azione positiva e inequivocabile. Il semplice proseguimento della navigazione (scroll) non costituisce consenso valido.</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">6.2 Revoca del Consenso e Gestione delle Preferenze</h3>
                <p>L&apos;utente può revocare il consenso in qualsiasi momento tramite:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700 mt-2">
                  <li>Il pannello di gestione delle preferenze cookie accessibile tramite il link &quot;Gestisci Cookie&quot; nel footer</li>
                  <li>Le impostazioni del browser (Google Chrome, Mozilla Firefox, Safari, Microsoft Edge — link alle istruzioni dei principali browser)</li>
                </ul>
                <p className="mt-3">La revoca del consenso non pregiudica la liceità del trattamento effettuato prima della revoca. La disabilitazione dei cookie tecnici potrebbe pregiudicare il corretto funzionamento della Piattaforma.</p>
              </div>
            </div>
          </section>

          {/* 7. Aggiornamenti */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">7. Aggiornamenti della Cookie Policy</h2>
            <p className="text-slate-700 text-sm leading-relaxed">
              Il Titolare, RescueManager S.r.l. (P.IVA 02176370852), si riserva il diritto di modificare la presente Cookie Policy in qualsiasi momento, in risposta a modifiche normative, tecnologiche o operative (ivi incluse variazioni nell&apos;infrastruttura di hosting o nei fornitori di servizi). Le modifiche sono comunicate agli utenti tramite avviso sul Sito e, ove opportuno, tramite nuova richiesta di consenso.
            </p>
          </section>

          {/* 8. Contatti */}
          <div className="bg-[#0f172a] p-6 text-white">
            <h2 className="text-xl font-bold mb-4">8. Contatti e Diritti degli Interessati</h2>
            <p className="text-slate-300 text-sm mb-4">Per qualsiasi richiesta relativa alla presente Cookie Policy o all&apos;esercizio dei diritti in materia di dati personali:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Titolare del Trattamento</p>
                <p className="font-semibold">RescueManager S.r.l.</p>
                <p className="text-slate-400 text-xs mt-1">P.IVA 02176370852 — Capitale sociale € 100,00</p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Recapiti</p>
                <p>Via dello Smeraldo 18, 93012 Gela (CL)</p>
                <p><a href="mailto:rescuemanager@legalmail.it" className="text-slate-200 underline">rescuemanager@legalmail.it</a></p>
                <p><a href="https://www.rescuemanager.eu" className="text-slate-200 underline" target="_blank" rel="noopener noreferrer">www.rescuemanager.eu</a></p>
                <p className="text-slate-400 text-xs mt-2">Reclamo: <a href="https://www.garanteprivacy.it" className="text-slate-200 underline" target="_blank" rel="noopener noreferrer">Garante Privacy (www.garanteprivacy.it)</a></p>
              </div>
            </div>
          </div>

          {/* Link altre policy */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/privacy-policy" className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5">Privacy Policy</a>
            <a href="/terms-of-use" className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5">Termini e Condizioni</a>
            <a href="/dpa" className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5">Data Processing Agreement</a>
            <a href="/trasparenza" className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5">Trasparenza e Switching</a>
          </div>

        </div>
      </div>
    </div>
  );
}
