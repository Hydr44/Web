// src/app/terms-of-use/page.tsx

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#0f172a] pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">

          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Termini e Condizioni di Servizio
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Contratto SaaS tra RescueManager ed il Cliente professionale operante nel settore dell&apos;autodemolizione.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500">
            <span>Versione 3.0</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>In vigore dal 23 febbraio 2026</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>Contratto B2B</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">

        {/* Avviso B2B */}
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm text-amber-800">
            <strong>Contratto B2B esclusivo.</strong> Il presente contratto è stipulato esclusivamente tra operatori professionali (D.Lgs. 206/2005 non applicabile). Il Cliente è un soggetto professionale operante nel settore dell&apos;autodemolizione, veicoli fuori uso e attività affini.
          </p>
        </div>

        <div className="space-y-6">

          {/* 1. Identificazione delle Parti */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">1. Identificazione delle Parti e Oggetto del Contratto</h2>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">1.1 Il Fornitore</h3>
              <p>Il presente contratto è stipulato tra <strong>Emmanuel Salvatore Scozzarini</strong>, libero professionista/imprenditore individuale, operante commercialmente sotto il nome <strong>RescueManager</strong>, con domicilio professionale in <strong>Via dello Smeraldo 18, Gela (CL), Sicilia</strong>, P. IVA <strong>02166430856</strong>.</p>
              <p>Il Fornitore è una persona fisica che esercita attività d&apos;impresa in forma individuale. Non sussiste pertanto alcuna separazione tra il patrimonio dell&apos;impresa e il patrimonio personale del titolare, ai sensi degli artt. 2082 e 2740 del Codice Civile.</p>

              <h3 className="font-semibold text-gray-900 mt-4">1.2 Il Cliente</h3>
              <p>Il Cliente è esclusivamente un soggetto professionale operante nel settore dell&apos;autodemolizione, del commercio di veicoli fuori uso, della gestione di rottami e attività affini. Il presente contratto è esplicitamente escluso dall&apos;ambito di applicazione del Codice del Consumo (D.Lgs. 206/2005).</p>

              <h3 className="font-semibold text-gray-900 mt-4">1.3 Oggetto del Contratto</h3>
              <p>Il Fornitore concede al Cliente l&apos;accesso e l&apos;utilizzo in modalità <strong>Software as a Service (SaaS)</strong> della piattaforma denominata RescueManager, che integra le seguenti funzionalità:</p>
              <ul className="list-disc list-inside space-y-1 ml-3">
                <li>Gestione operativa del ciclo del veicolo fuori uso (schede, acquisto, cessione, targhe, telai)</li>
                <li>Compliance RENTRI (Registro Nazionale per la Tracciabilità dei Rifiuti)</li>
                <li>Procedure di Radiazione per Demolizione (RVFU) tramite sportello telematico</li>
                <li>Fatturazione elettronica e integrazione SDI (Sistema di Interscambio)</li>
                <li>Gestione magazzino ricambi, anagrafica clienti/fornitori, reportistica</li>
                <li>Supporto tecnico nei modi e nei tempi descritti ai successivi articoli</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">1.4 Infrastruttura Tecnologica</h3>
              <p>Il Servizio è erogato tramite un&apos;infrastruttura distribuita che si avvale di:</p>
              <ul className="list-disc list-inside space-y-1 ml-3">
                <li><strong>Vercel Inc.</strong> (USA) — hosting sito web e frontend; certificato SOC 2 Type 2, ISO 27001; trasferimento dati extra-UE coperto da EU-U.S. Data Privacy Framework (DPF) e SCC</li>
                <li><strong>IONOS SE</strong> (Germania) — hosting API e backend; certificato ISO 27001; dati trattati esclusivamente nell&apos;Unione Europea (SEE), nessun trasferimento verso Paesi terzi</li>
              </ul>
            </div>
          </section>

          {/* 2. Conclusione del Contratto */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">2. Modalità di Conclusione del Contratto</h2>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">2.1 Procedura Telematica</h3>
              <p>Il contratto si conclude mediante procedura telematica interamente gestita tramite la Piattaforma, ai sensi degli artt. 12 e 13 del D.Lgs. 70/2003. Il processo prevede: registrazione, selezione del piano, presentazione delle condizioni contrattuali, approvazione specifica delle clausole vessatorie (art. 1341 c.c.), inoltro dell&apos;ordine e conferma via e-mail.</p>
              <h3 className="font-semibold text-gray-900 mt-4">2.2 Archiviazione e Lingua</h3>
              <p>Il contratto è archiviato elettronicamente e accessibile dal Cliente dalla sezione &quot;Il mio account&quot;. La lingua del contratto è l&apos;italiano.</p>
            </div>
          </section>

          {/* 3. Licenza e Proprietà Intellettuale */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">3. Licenza d&apos;Uso e Proprietà Intellettuale</h2>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">3.1 Concessione della Licenza</h3>
              <p>Il Fornitore concede al Cliente una licenza d&apos;uso <strong>non esclusiva, non trasferibile, non cedibile e revocabile</strong> per accedere alla Piattaforma durante il periodo di abbonamento. Il contratto SaaS non trasferisce alcun diritto di proprietà sul software, codice sorgente, banche dati, loghi o marchi.</p>
              <h3 className="font-semibold text-gray-900 mt-4">3.2 Protezione del Software</h3>
              <p>La Piattaforma RescueManager è di proprietà esclusiva di Emmanuel Salvatore Scozzarini ed è protetta ai sensi degli artt. 1 e 2, n. 8, della Legge 22 aprile 1941, n. 633. Tutti i diritti sono riservati.</p>
              <h3 className="font-semibold text-gray-900 mt-4">3.3 Diritti Inderogabili dell&apos;Utente</h3>
              <p>In conformità all&apos;art. 64-ter della Legge 633/1941, il Cliente ha il diritto inderogabile di effettuare copie di riserva dei propri dati e di osservare il funzionamento del programma. Qualsiasi clausola contraria è nulla di diritto.</p>
              <h3 className="font-semibold text-gray-900 mt-4">3.4 Divieti</h3>
              <p>È vietato copiare, distribuire, decompilare, effettuare reverse engineering, rimuovere avvisi di copyright o utilizzare la Piattaforma per finalità illecite o per conto di terzi non autorizzati.</p>
              <h3 className="font-semibold text-gray-900 mt-4">3.5 Dati del Cliente</h3>
              <p>I dati inseriti dal Cliente restano di sua esclusiva proprietà. In caso di cessazione, il Fornitore mette a disposizione un export completo per 90 giorni dalla cessazione del contratto.</p>
            </div>
          </section>

          {/* 4. Corrispettivi e Pagamenti */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">4. Corrispettivi, Fatturazione e Pagamenti</h2>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">4.1 Corrispettivi</h3>
              <p>I corrispettivi sono indicati nella sezione &quot;Prezzi&quot; del sito ufficiale, espressi in Euro (€) IVA esclusa. Le tariffe possono essere modificate con preavviso di 60 giorni.</p>
              <h3 className="font-semibold text-gray-900 mt-4">4.2 Pagamenti tramite Stripe</h3>
              <p>I pagamenti sono gestiti da <strong>Stripe Payments Europe, Ltd.</strong> (Irlanda), certificato PCI-DSS. I dati della carta non sono archiviati sui server del Fornitore.</p>
              <h3 className="font-semibold text-gray-900 mt-4">4.3 Fatturazione Elettronica</h3>
              <p>Il Fornitore, Emmanuel Salvatore Scozzarini P. IVA 02166430856, emette fattura elettronica tramite SDI per ogni canone addebitato.</p>
              <h3 className="font-semibold text-gray-900 mt-4">4.4 Interessi di Mora</h3>
              <p>In caso di ritardo, si applicano il D.Lgs. 231/2002: interessi al tasso BCE + 8 punti percentuali dal giorno successivo alla scadenza, più indennizzo forfettario di €40,00 per fattura insoluta.</p>
              <h3 className="font-semibold text-gray-900 mt-4">4.5 Sospensione per Morosità</h3>
              <p>In caso di mancato pagamento, il Fornitore può sospendere l&apos;accesso dopo 15 giorni di tolleranza, previo avviso via e-mail. Il servizio è ripristinato entro 2 giorni lavorativi dalla regolarizzazione.</p>
              <h3 className="font-semibold text-gray-900 mt-4">4.6 Periodo di Prova Gratuito</h3>
              <p>Il Fornitore offre 14 giorni di prova gratuita. Al termine, salvo disdetta, il contratto si converte automaticamente nell&apos;abbonamento selezionato.</p>
            </div>
          </section>

          {/* 5. Durata e Rinnovo */}
          <section className="bg-white rounded-xl border border-amber-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">5. Durata e Rinnovo Automatico</h2>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="font-semibold text-amber-900 mb-2">⚠️ Clausola Vessatoria — Art. 1341, comma 2, c.c.</p>
                <p className="text-amber-800"><strong>Contenuto sintetico:</strong> il contratto si rinnova automaticamente alla scadenza, con ulteriore addebito del corrispettivo, salvo disdetta inviata con almeno 30 giorni di preavviso.</p>
              </div>
              <h3 className="font-semibold text-gray-900">5.1 Durata</h3>
              <p>Il contratto ha durata pari al periodo di abbonamento scelto (mensile o annuale), dalla data di attivazione.</p>
              <h3 className="font-semibold text-gray-900 mt-4">5.2 Rinnovo Automatico</h3>
              <p>Il contratto si rinnova automaticamente per un periodo uguale a quello originariamente sottoscritto, salvo comunicazione di disdetta con preavviso di almeno <strong>30 giorni</strong> prima della scadenza, tramite funzione in-app o e-mail a <a href="mailto:rescuemanager@legalmail.it" className="text-blue-600 hover:underline">rescuemanager@legalmail.it</a>.</p>
              <h3 className="font-semibold text-gray-900 mt-4">5.3 Notifica di Cortesia</h3>
              <p>Il Fornitore invia una notifica di cortesia almeno 7 giorni prima del rinnovo automatico. Tale notifica è informativa e non sostituisce la formale comunicazione di disdetta.</p>
            </div>
          </section>

          {/* 6. Recesso e Rimborsi */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">6. Recesso e Politiche di Rimborso</h2>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">6.1 Diritto di Recesso</h3>
              <p>Trattandosi di contratto B2B, non si applica il recesso di 14 giorni ex artt. 52 ss. Codice del Consumo. Ciascuna Parte può recedere con preavviso di 30 giorni rispetto alla successiva data di rinnovo, o per giusta causa con effetto immediato previa diffida scritta.</p>
              <h3 className="font-semibold text-gray-900 mt-4">6.2 Politica di Rimborso Volontaria</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 rounded-lg text-sm">
                  <thead><tr className="bg-gray-50"><th className="border border-gray-200 px-3 py-2 text-left">Periodo dalla data di attivazione</th><th className="border border-gray-200 px-3 py-2 text-left">Rimborso riconosciuto</th></tr></thead>
                  <tbody>
                    <tr><td className="border border-gray-200 px-3 py-2">Fino a 30 giorni</td><td className="border border-gray-200 px-3 py-2">Rimborso integrale</td></tr>
                    <tr><td className="border border-gray-200 px-3 py-2">Dal 31° al 60° giorno</td><td className="border border-gray-200 px-3 py-2">Rimborso pro-rata ai giorni residui</td></tr>
                    <tr><td className="border border-gray-200 px-3 py-2">Oltre il 60° giorno</td><td className="border border-gray-200 px-3 py-2">Nessun rimborso; servizio attivo fino a scadenza</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500">La politica si applica una sola volta per Cliente. Rimborsi elaborati entro 14 giorni lavorativi.</p>
            </div>
          </section>

          {/* 7. SLA e Limitazione Responsabilità */}
          <section className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">7. Livello di Servizio (SLA) e Limitazioni di Responsabilità</h2>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">7.1 Livello di Servizio (SLA)</h3>
              <p>Il Fornitore garantisce una disponibilità della Piattaforma pari ad almeno il <strong>99,5%</strong> su base mensile, escluse le finestre di manutenzione programmata (preavviso minimo 48 ore). In caso di mancato rispetto, il Cliente ha diritto a un credito sul servizio proporzionale al disservizio.</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-900 mb-2">⚠️ Clausola Vessatoria — Art. 1341, comma 2, c.c.</p>
                <p className="text-red-800 text-xs"><strong>Contenuto sintetico:</strong> la responsabilità del Fornitore per danni diretti è limitata ai corrispettivi versati negli ultimi 12 mesi; sono esclusi danni indiretti, perdita di profitto e danni da cause di forza maggiore o da infrastrutture di terzi.</p>
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">7.2 Limitazione di Responsabilità</h3>
              <p>Fermo restando quanto inderogabilmente previsto dalla legge (inclusa la nullità ex art. 1229 c.c. per dolo/colpa grave), la responsabilità del Fornitore per danni diretti è limitata all&apos;importo dei corrispettivi versati nei <strong>12 mesi precedenti</strong> all&apos;evento dannoso. Sono esclusi danni indiretti, consequenziali, perdita di profitto, perdita di dati per cause non imputabili al Fornitore, e disservizi di sub-fornitori (Vercel, IONOS, SDI, RENTRI, MCTC) o cause di forza maggiore.</p>
              <h3 className="font-semibold text-gray-900 mt-4">7.3 Obblighi di Backup</h3>
              <p>Il Fornitore effettua backup automatici giornalieri conservati per almeno 30 giorni. Il Cliente è invitato a eseguire periodicamente l&apos;export dei propri dati come misura di sicurezza aggiuntiva.</p>
            </div>
          </section>

          {/* 8. Legge e Foro */}
          <section className="bg-white rounded-xl border border-indigo-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">8. Legge Applicabile e Foro Competente</h2>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">8.1 Legge Applicabile</h3>
              <p>Il presente contratto è regolato dalla legge italiana. Si applicano il Codice Civile, il D.Lgs. 70/2003, il D.Lgs. 231/2002 e ogni altra norma italiana ed europea applicabile.</p>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="font-semibold text-indigo-900 mb-2">⚠️ Clausola Vessatoria — Art. 1341, comma 2, c.c.</p>
                <p className="text-indigo-800 text-xs"><strong>Contenuto sintetico:</strong> qualsiasi controversia è devoluta in via esclusiva al Foro del domicilio professionale del Fornitore (Gela, CL), con deroga alla competenza territoriale ordinaria.</p>
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">8.2 Foro Competente</h3>
              <p>Per qualsiasi controversia è competente in via esclusiva il <strong>Foro di Caltanissetta</strong> (luogo del domicilio professionale del Fornitore: Via dello Smeraldo 18, Gela, CL). Tale clausola deroga alla competenza ordinaria ex artt. 18, 19, 20 c.p.c.</p>
              <h3 className="font-semibold text-gray-900 mt-4">8.3 Tentativo di Conciliazione</h3>
              <p>Le Parti si impegnano a tentare in buona fede la risoluzione amichevole entro 30 giorni dalla comunicazione scritta del disaccordo, prima di adire l&apos;Autorità Giudiziaria.</p>
            </div>
          </section>

          {/* 9. Disposizioni Generali */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">9. Disposizioni Generali</h2>
            <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
              <p><strong>9.1 Modifiche ai Termini:</strong> comunicate con 30 giorni di preavviso. L&apos;utilizzo continuato costituisce accettazione.</p>
              <p><strong>9.2 Cessibilità:</strong> il Cliente non può cedere il contratto senza consenso scritto. Il Fornitore può cedere nell&apos;ambito di trasferimenti d&apos;azienda con preavviso di 30 giorni.</p>
              <p><strong>9.3 Nullità Parziale:</strong> la nullità di una clausola non comporta la nullità dell&apos;intero contratto.</p>
              <p><strong>9.4 Integralità:</strong> il presente contratto, con Privacy Policy, DPA e Cookie Policy, costituisce l&apos;intero accordo tra le Parti.</p>
            </div>
          </section>

          {/* Contatti */}
          <div className="bg-[#0f172a] rounded-xl p-6 text-white">
            <h3 className="font-bold text-lg mb-4">Contatti per Questioni Legali e Contrattuali</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Titolare / Fornitore</p>
                <p className="font-semibold">Emmanuel Salvatore Scozzarini</p>
                <p className="text-slate-300">RescueManager</p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Recapiti</p>
                <p>Via dello Smeraldo 18, Gela (CL)</p>
                <p><a href="mailto:rescuemanager@legalmail.it" className="text-blue-400 hover:underline">rescuemanager@legalmail.it</a></p>
                <p><a href="https://www.rescuemanager.eu" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">www.rescuemanager.eu</a></p>
                <p className="text-slate-400 text-xs mt-1">P. IVA: 02166430856</p>
              </div>
            </div>
          </div>

          {/* Link altre policy */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/privacy-policy" className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50">Privacy Policy</a>
            <a href="/cookie-policy" className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50">Cookie Policy</a>
            <a href="/dpa" className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50">Data Processing Agreement</a>
          </div>

        </div>
      </div>
    </div>
  );
}
