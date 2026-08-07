// src/app/terms-of-use/page.tsx

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-[#0f172a] pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Termini e Condizioni di Servizio
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Contratto SaaS tra RescueManager ed il Cliente professionale operante nel settore
            dell&apos;autodemolizione e del soccorso stradale.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-slate-500">
            <span>Versione 4.0</span>
            <span className="text-slate-600">·</span>
            <span>In vigore dal 10 settembre 2026</span>
            <span className="text-slate-600">·</span>
            <span>Contratto B2B</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Premessa / avviso B2B */}
        <div className="border-l-2 border-[#0f172a] bg-slate-50 p-5 text-sm text-slate-700 leading-relaxed">
          <p>
            <strong>Contratto B2B esclusivo.</strong> Il presente contratto è stipulato esclusivamente
            tra operatori professionali (D.Lgs. 206/2005 non applicabile). Il Cliente dichiara di agire
            per scopi rientranti nella propria attività imprenditoriale o professionale nel settore
            dell&apos;autodemolizione, dei veicoli fuori uso, del soccorso stradale e attività affini, e
            di essere titolare di partita IVA.
          </p>
          <p className="mt-3 text-slate-500">
            In vigore dal 10 settembre 2026 — per i clienti già attivi, almeno 30 giorni dopo la
            comunicazione di aggiornamento.
          </p>
        </div>

        <div className="space-y-6 mt-6">
          {/* 1. Identificazione delle Parti */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              1. Identificazione delle Parti e Oggetto del Contratto
            </h2>
            <div className="text-slate-700 leading-relaxed space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">1.1 Il Fornitore</h3>
                <p>
                  Il presente contratto è stipulato tra RescueManager S.r.l., società a responsabilità
                  limitata di diritto italiano con sede legale in Via dello Smeraldo 18, 93012 Gela (CL),
                  Italia, capitale sociale Euro 100,00 interamente versato, codice fiscale e P. IVA
                  02176370852, PEC{" "}
                  <a href="mailto:rescuemanager@legalmail.it" className="text-slate-900 underline underline-offset-2">
                    rescuemanager@legalmail.it
                  </a>{" "}
                  (di seguito &quot;Fornitore&quot; o &quot;RescueManager&quot;).
                </p>
                <p className="mt-2">
                  Il Fornitore è una società di capitali costituita ai sensi degli artt. 2462 e ss. del
                  Codice Civile. La responsabilità per le obbligazioni sociali è limitata al patrimonio
                  della società.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-1">1.2 Il Cliente</h3>
                <p>
                  Il Cliente è esclusivamente un soggetto professionale operante nel settore
                  dell&apos;autodemolizione, del commercio di veicoli fuori uso, della gestione di rottami,
                  del soccorso stradale e attività affini. Il presente contratto è esplicitamente escluso
                  dall&apos;ambito di applicazione del Codice del Consumo (D.Lgs. 206/2005). In fase di
                  registrazione il Cliente dichiara, sotto la propria responsabilità, la propria qualità di
                  professionista.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-1">1.3 Oggetto del Contratto</h3>
                <p>
                  Il Fornitore concede al Cliente l&apos;accesso e l&apos;utilizzo in modalità Software as a
                  Service (SaaS) della piattaforma denominata RescueManager, che integra le seguenti
                  funzionalità:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700 mt-2">
                  <li>
                    Gestione operativa del ciclo del veicolo fuori uso (schede, acquisto, cessione, targhe,
                    telai)
                  </li>
                  <li>
                    Compliance RENTRI (Registro Nazionale per la Tracciabilità dei Rifiuti), inclusi
                    registri di carico e scarico digitali e <strong>FIR digitale (xFIR)</strong> ai sensi
                    del D.M. 59/2023 e ss.mm.
                  </li>
                  <li>Procedure di Radiazione per Demolizione (RVFU) tramite sportello telematico</li>
                  <li>Gestione del soccorso stradale (interventi, mezzi, commesse e rendicontazione)</li>
                  <li>Fatturazione elettronica e integrazione SDI (Sistema di Interscambio)</li>
                  <li>Gestione magazzino ricambi, anagrafica clienti/fornitori, reportistica</li>
                  <li>Supporto tecnico nei modi e nei tempi descritti ai successivi articoli</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  1.4 Ruolo del Fornitore negli adempimenti normativi
                </h3>
                <p>
                  La Piattaforma costituisce uno strumento di supporto operativo agli adempimenti del
                  Cliente. Resta di esclusiva responsabilità del Cliente: (a) la veridicità, correttezza e
                  completezza dei dati inseriti o trasmessi tramite la Piattaforma (inclusi registri, FIR,
                  comunicazioni RENTRI, pratiche RVFU e fatture); (b) il rispetto della normativa
                  ambientale, fiscale e amministrativa applicabile alla propria attività; (c) il possesso
                  delle iscrizioni, autorizzazioni e abilitazioni richieste (inclusa l&apos;iscrizione al
                  RENTRI). Ove il Fornitore operi quale intermediario o soggetto delegato per la
                  trasmissione telematica, agisce su incarico e nell&apos;interesse del Cliente, senza
                  assunzione degli obblighi di legge propri del Cliente.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-1">1.5 Infrastruttura Tecnologica</h3>
                <p>Il Servizio è erogato tramite un&apos;infrastruttura distribuita che si avvale di:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700 mt-2">
                  <li>
                    <strong>Vercel Inc. (USA)</strong> — hosting sito web e frontend; certificato SOC 2 Type
                    2, ISO 27001; trasferimento dati extra-UE coperto da EU-U.S. Data Privacy Framework
                    (DPF) e SCC
                  </li>
                  <li>
                    <strong>IONOS SE (Germania)</strong> — hosting API e backend; certificato ISO 27001;
                    dati trattati esclusivamente nell&apos;Unione Europea (SEE), nessun trasferimento verso
                    Paesi terzi
                  </li>
                  <li>
                    <strong>Supabase, Inc. (USA/EU)</strong> — database e servizi di autenticazione;
                    certificato SOC 2 Type 2; eventuali trasferimenti extra-UE coperti da Clausole
                    Contrattuali Standard (SCC), come dettagliato nella Privacy Policy e nel DPA
                  </li>
                </ul>
                <p className="mt-2">
                  Ai sensi dell&apos;art. 28 del Regolamento (UE) 2023/2854 (&quot;Data Act&quot;), le
                  informazioni aggiornate sulla giurisdizione dell&apos;infrastruttura ICT e sulle misure
                  tecniche, organizzative e contrattuali adottate per impedire accessi governativi di Paesi
                  terzi ai dati non personali in conflitto con il diritto dell&apos;Unione sono pubblicate
                  nella pagina &quot;Trasparenza e Switching&quot; del sito ufficiale.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Conclusione del Contratto */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              2. Modalità di Conclusione del Contratto
            </h2>
            <div className="text-slate-700 leading-relaxed space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">2.1 Procedura Telematica</h3>
                <p>
                  Il contratto si conclude mediante procedura telematica interamente gestita tramite la
                  Piattaforma, ai sensi degli artt. 12 e 13 del D.Lgs. 70/2003. Il processo prevede:
                  registrazione, selezione del piano, presentazione delle condizioni contrattuali, inoltro
                  dell&apos;ordine e conferma via e-mail.
                </p>
                <p className="mt-2">
                  L&apos;approvazione specifica delle clausole vessatorie ex art. 1341, comma 2, c.c.
                  avviene mediante un <strong>passaggio separato e distinto</strong> dall&apos;accettazione
                  generale del contratto, nel quale le clausole di cui all&apos;art. 12 sono presentate
                  singolarmente e integralmente, e sono sottoscritte dal Cliente mediante{" "}
                  <strong>firma elettronica con codice OTP</strong> (one-time password) inviato al recapito
                  verificato del Cliente, ai sensi del Regolamento (UE) 910/2014 (eIDAS) e del D.Lgs.
                  82/2005 (CAD). La semplice selezione di caselle di spunta non sostituisce tale
                  sottoscrizione.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">2.2 Archiviazione e Lingua</h3>
                <p>
                  Il contratto, unitamente all&apos;evidenza informatica della sottoscrizione delle clausole
                  vessatorie, è archiviato elettronicamente e accessibile dal Cliente dalla sezione &quot;Il
                  mio account&quot;. La lingua del contratto è l&apos;italiano.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Licenza e Proprietà Intellettuale */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              3. Licenza d&apos;Uso e Proprietà Intellettuale
            </h2>
            <div className="text-slate-700 leading-relaxed space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">3.1 Concessione della Licenza</h3>
                <p>
                  Il Fornitore concede al Cliente una licenza d&apos;uso non esclusiva, non trasferibile,
                  non cedibile e revocabile per accedere alla Piattaforma durante il periodo di abbonamento,
                  nei limiti del piano sottoscritto (numero di utenze, sedi e volumi eventualmente indicati
                  nella sezione &quot;Prezzi&quot;). Il contratto SaaS non trasferisce alcun diritto di
                  proprietà sul software, codice sorgente, banche dati, loghi o marchi.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">3.2 Protezione del Software</h3>
                <p>
                  La Piattaforma RescueManager è di proprietà esclusiva di RescueManager S.r.l. ed è
                  protetta ai sensi degli artt. 1 e 2, n. 8, della Legge 22 aprile 1941, n. 633. Tutti i
                  diritti sono riservati.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  3.3 Diritti Inderogabili dell&apos;Utente
                </h3>
                <p>
                  In conformità all&apos;art. 64-ter della Legge 633/1941, il Cliente ha il diritto
                  inderogabile di effettuare copie di riserva dei propri dati e di osservare il
                  funzionamento del programma. Qualsiasi clausola contraria è nulla di diritto.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">3.4 Divieti e Uso Accettabile</h3>
                <p>
                  È vietato copiare, distribuire, decompilare, effettuare reverse engineering, rimuovere
                  avvisi di copyright o utilizzare la Piattaforma per finalità illecite o per conto di terzi
                  non autorizzati. È inoltre vietato l&apos;uso della Piattaforma in modo da comprometterne
                  la sicurezza, la stabilità o l&apos;integrità (a titolo esemplificativo: accessi
                  automatizzati non autorizzati, tentativi di elusione delle misure di sicurezza, carichi
                  anomali intenzionali).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">3.5 Credenziali di Accesso</h3>
                <p>
                  Il Cliente è responsabile della custodia e della riservatezza delle credenziali proprie e
                  dei propri utenti, nonché di ogni attività compiuta tramite esse. Il Cliente si impegna a
                  comunicare tempestivamente al Fornitore ogni uso non autorizzato o compromissione
                  sospetta.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">3.6 Dati del Cliente</h3>
                <p>
                  I dati inseriti dal Cliente restano di sua esclusiva proprietà. Le modalità di
                  esportazione, recupero e cancellazione dei dati alla cessazione del contratto sono
                  disciplinate dall&apos;art. 10 (Portabilità e Switching).
                </p>
              </div>
            </div>
          </section>

          {/* 4. Corrispettivi e Pagamenti */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              4. Corrispettivi, Fatturazione e Pagamenti
            </h2>
            <div className="text-slate-700 leading-relaxed space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">4.1 Corrispettivi</h3>
                <p>
                  I corrispettivi sono indicati nella sezione &quot;Prezzi&quot; del sito ufficiale,
                  espressi in Euro (€) IVA esclusa. Le tariffe possono essere modificate con preavviso di 60
                  giorni; in caso di aumento, il Cliente può recedere ai sensi dell&apos;art. 13.1 senza
                  penali con effetto dalla data di applicazione della nuova tariffa.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">4.2 Modalità di Pagamento</h3>
                <p>
                  I pagamenti possono essere effettuati, a scelta del Cliente tra le opzioni disponibili per
                  il piano sottoscritto:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700 mt-2">
                  <li>
                    <strong>Carta di credito/debito</strong> — gestita da Stripe Payments Europe, Ltd.
                    (Irlanda), certificato PCI-DSS; i dati della carta non sono archiviati sui server del
                    Fornitore;
                  </li>
                  <li>
                    <strong>Addebito diretto SEPA (SDD, ex RID)</strong> — gestito da GoCardless, tramite
                    mandato di addebito sottoscritto dal Cliente in fase di attivazione; il Cliente si
                    impegna a mantenere la capienza sul conto addebitato alle scadenze; l&apos;eventuale
                    storno o insoluto dell&apos;addebito è equiparato a mancato pagamento ai fini degli
                    artt. 4.4 e 4.5, con addebito delle spese bancarie documentate;
                  </li>
                  <li>
                    <strong>Bonifico bancario (IBAN)</strong> — con pagamento anticipato entro la data di
                    scadenza indicata in fattura; l&apos;attivazione o il rinnovo del servizio possono
                    essere subordinati alla ricezione del pagamento.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">4.3 Fatturazione Elettronica</h3>
                <p>
                  Il Fornitore, RescueManager S.r.l. P.IVA 02176370852, emette fattura elettronica tramite
                  SDI per ogni canone addebitato.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">4.4 Interessi di Mora</h3>
                <p>
                  In caso di ritardo, si applica il D.Lgs. 231/2002: interessi al tasso BCE + 8 punti
                  percentuali dal giorno successivo alla scadenza, più indennizzo forfettario di €40,00 per
                  fattura insoluta.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">4.5 Sospensione per Morosità</h3>
                <div className="bg-slate-50 border border-slate-200 p-4 mb-2">
                  <p className="text-slate-600 text-xs">
                    ⚠️ Clausola soggetta ad approvazione specifica ex art. 1341, comma 2, c.c. — v. art. 12
                  </p>
                </div>
                <p>
                  In caso di mancato pagamento, il Fornitore può sospendere l&apos;accesso dopo 15 giorni di
                  tolleranza, previo avviso via e-mail. Il servizio è ripristinato entro 2 giorni lavorativi
                  dalla regolarizzazione. La sospensione non pregiudica il diritto del Cliente di ottenere
                  l&apos;esportazione dei propri dati ai sensi dell&apos;art. 10.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">4.6 Periodo di Prova Gratuito</h3>
                <p>
                  Il Fornitore offre 14 giorni di prova gratuita. Al termine, salvo disdetta, il contratto
                  si converte automaticamente nell&apos;abbonamento selezionato. In caso di mancata
                  conversione, i dati inseriti durante la prova sono conservati per 30 giorni e quindi
                  cancellati, salvo diversa richiesta del Cliente.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Durata e Rinnovo */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Durata e Rinnovo Automatico</h2>
            <div className="text-slate-700 leading-relaxed space-y-4 text-sm">
              <div className="bg-slate-50 border border-slate-200 p-4">
                <p className="text-slate-600 text-xs mb-1">
                  ⚠️ Clausola soggetta ad approvazione specifica ex art. 1341, comma 2, c.c. — v. art. 12
                </p>
                <p className="italic text-slate-600">
                  Contenuto sintetico: il contratto si rinnova automaticamente alla scadenza, con ulteriore
                  addebito del corrispettivo, salvo disdetta nei termini di preavviso indicati.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">5.1 Durata</h3>
                <p>
                  Il contratto ha durata pari al periodo di abbonamento scelto (mensile o annuale), dalla
                  data di attivazione.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">5.2 Rinnovo Automatico</h3>
                <p>
                  Il contratto si rinnova automaticamente per un periodo uguale a quello originariamente
                  sottoscritto, salvo comunicazione di disdetta con preavviso di almeno{" "}
                  <strong>15 giorni</strong> (piani mensili) o <strong>30 giorni</strong> (piani annuali)
                  prima della scadenza, tramite funzione in-app o e-mail a{" "}
                  <a href="mailto:rescuemanager@legalmail.it" className="text-slate-900 underline underline-offset-2">
                    rescuemanager@legalmail.it
                  </a>
                  . Resta in ogni caso fermo il diritto del Cliente di attivare la procedura di switching di
                  cui all&apos;art. 10.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">5.3 Notifica di Cortesia</h3>
                <p>
                  Il Fornitore invia una notifica di cortesia almeno 7 giorni prima del rinnovo automatico
                  dei piani mensili e almeno 30 giorni prima del rinnovo dei piani annuali. Tale notifica è
                  informativa e non sostituisce la formale comunicazione di disdetta.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Recesso e Rimborsi */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">6. Recesso e Politiche di Rimborso</h2>
            <div className="text-slate-700 leading-relaxed space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">6.1 Diritto di Recesso</h3>
                <p>
                  Trattandosi di contratto B2B, non si applica il recesso di 14 giorni ex artt. 52 ss.
                  Codice del Consumo. Ciascuna Parte può recedere con preavviso di cui all&apos;art. 5.2
                  rispetto alla successiva data di rinnovo, o per giusta causa con effetto immediato previa
                  diffida scritta. Restano salvi il diritto di recesso per modifiche peggiorative (art.
                  13.1) e i diritti di switching di cui all&apos;art. 10.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  6.2 Garanzia &quot;Soddisfatti o Rimborsati&quot; — 14 giorni
                </h3>
                <p>
                  Il Cliente che non sia soddisfatto del Servizio può richiedere il rimborso integrale del
                  primo canone versato entro{" "}
                  <strong>14 giorni dalla prima attivazione a pagamento</strong> (il termine non decorre dal
                  periodo di prova gratuito), tramite funzione in-app o e-mail a{" "}
                  <a href="mailto:rescuemanager@legalmail.it" className="text-slate-900 underline underline-offset-2">
                    rescuemanager@legalmail.it
                  </a>
                  , senza obbligo di motivazione. Il rimborso è effettuato con lo stesso mezzo di pagamento
                  utilizzato, entro 14 giorni lavorativi dalla richiesta; il contratto cessa alla data della
                  richiesta e si applicano le previsioni sull&apos;esportazione e conservazione dei dati di
                  cui all&apos;art. 10.3.
                </p>
                <p className="mt-2">
                  La garanzia si applica una sola volta per Cliente, al primo abbonamento sottoscritto, e
                  non si applica ai rinnovi. Decorsi i 14 giorni, non è previsto alcun rimborso e il servizio
                  resta attivo fino alla scadenza del periodo pagato, salvo quanto previsto dagli artt. 4.1,
                  6.1 e 13.1.
                </p>
              </div>
            </div>
          </section>

          {/* 7. SLA e Limitazione Responsabilità */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              7. Livello di Servizio (SLA) e Limitazioni di Responsabilità
            </h2>
            <div className="text-slate-700 leading-relaxed space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">7.1 Livello di Servizio (SLA)</h3>
                <p>
                  Il Fornitore garantisce una disponibilità della Piattaforma pari ad almeno il 99,5% su
                  base mensile, escluse le finestre di manutenzione programmata (preavviso minimo 48 ore), le
                  cause di forza maggiore e i disservizi delle piattaforme di terzi (RENTRI, SDI, MCTC,
                  sportello telematico).
                </p>
                <p className="mt-2">
                  In caso di mancato rispetto, il Cliente ha diritto ai seguenti crediti sul canone del mese
                  interessato:
                </p>
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-sm border border-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="border border-slate-200 px-3 py-2 text-left">Disponibilità mensile</th>
                        <th className="border border-slate-200 px-3 py-2 text-left">Credito</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-200 px-3 py-2">dal 99,0% a meno del 99,5%</td>
                        <td className="border border-slate-200 px-3 py-2">5%</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-3 py-2">dal 95,0% a meno del 99,0%</td>
                        <td className="border border-slate-200 px-3 py-2">15%</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-200 px-3 py-2">inferiore al 95,0%</td>
                        <td className="border border-slate-200 px-3 py-2">30%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-2">
                  Il credito è richiesto dal Cliente entro 30 giorni dalla fine del mese interessato,
                  tramite funzione in-app o e-mail, ed è riconosciuto sul primo canone utile. Il credito
                  costituisce l&apos;unico ed esclusivo rimedio per il mancato rispetto dello SLA, salvo il
                  caso di dolo o colpa grave.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">7.2 Limitazione di Responsabilità</h3>
                <div className="bg-slate-50 border border-slate-200 p-4 mb-2">
                  <p className="text-slate-600 text-xs mb-1">
                    ⚠️ Clausola soggetta ad approvazione specifica ex art. 1341, comma 2, c.c. — v. art. 12
                  </p>
                  <p className="italic text-slate-600">
                    Contenuto sintetico: la responsabilità del Fornitore per danni diretti è limitata ai
                    corrispettivi versati negli ultimi 12 mesi; sono esclusi danni indiretti, perdita di
                    profitto e danni da cause di forza maggiore o da infrastrutture di terzi.
                  </p>
                </div>
                <p>
                  Fermo restando quanto inderogabilmente previsto dalla legge (inclusa la nullità ex art.
                  1229 c.c. per dolo/colpa grave), la responsabilità del Fornitore per danni diretti è
                  limitata all&apos;importo dei corrispettivi versati nei 12 mesi precedenti all&apos;evento
                  dannoso. Sono esclusi danni indiretti, consequenziali, perdita di profitto, perdita di
                  dati per cause non imputabili al Fornitore, e disservizi di sub-fornitori (Vercel, IONOS,
                  SDI, RENTRI, MCTC) o cause di forza maggiore.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">7.3 Obblighi di Backup</h3>
                <p>
                  Il Fornitore effettua backup automatici giornalieri conservati per almeno 30 giorni. Il
                  Cliente è invitato a eseguire periodicamente l&apos;export dei propri dati come misura di
                  sicurezza aggiuntiva.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">7.4 Forza Maggiore</h3>
                <p>
                  Nessuna Parte è responsabile per inadempimenti causati da eventi imprevedibili ed estranei
                  alla propria sfera di controllo, quali, a titolo esemplificativo: calamità naturali,
                  incendi, guerre, atti dell&apos;autorità, epidemie, scioperi generali, interruzioni estese
                  delle reti di telecomunicazione o dell&apos;energia elettrica, attacchi informatici su
                  larga scala non imputabili a negligenza della Parte colpita. La Parte colpita ne dà pronta
                  comunicazione all&apos;altra; se l&apos;evento perdura oltre 60 giorni, ciascuna Parte può
                  recedere senza penali.
                </p>
              </div>
            </div>
          </section>

          {/* 8. Sicurezza e Protezione dei Dati */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">8. Sicurezza e Protezione dei Dati</h2>
            <div className="text-slate-700 leading-relaxed space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">8.1 Misure di Sicurezza</h3>
                <p>
                  Il Fornitore adotta misure tecniche e organizzative adeguate ai sensi dell&apos;art. 32
                  GDPR, come dettagliate nel Data Processing Agreement (DPA), che costituisce parte
                  integrante del contratto.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">8.2 Notifica degli Incidenti</h3>
                <p>
                  Il Fornitore comunica al Cliente, senza ingiustificato ritardo, gli incidenti di sicurezza
                  che comportino violazione dei dati personali trattati per conto del Cliente, secondo quanto
                  previsto dal DPA e dagli artt. 33-34 GDPR.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">8.3 Riservatezza</h3>
                <p>
                  Ciascuna Parte mantiene riservate le informazioni non pubbliche dell&apos;altra di cui
                  venga a conoscenza in esecuzione del contratto, per tutta la durata dello stesso e per i 3
                  anni successivi.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Supporto Tecnico */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">9. Supporto Tecnico</h2>
            <div className="text-slate-700 leading-relaxed text-sm">
              <p>
                Il supporto tecnico è incluso nel canone ed è erogato nei giorni lavorativi, dalle 9:00 alle
                18:00 (ora italiana), tramite i canali indicati sul sito ufficiale (in-app, e-mail). Il
                Fornitore prende in carico le richieste entro 1 giorno lavorativo, con priorità alle
                segnalazioni che impediscono l&apos;operatività (blocco di trasmissioni RENTRI/FIR,
                fatturazione, RVFU). Il supporto non comprende consulenza normativa, fiscale o ambientale.
              </p>
            </div>
          </section>

          {/* 10. Portabilità e Switching */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              10. Portabilità, Switching e Interoperabilità (Data Act)
            </h2>
            <div className="text-slate-700 leading-relaxed space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">10.1 Diritto di Switching</h3>
                <p>
                  Il Cliente ha il diritto, in qualsiasi momento e senza necessità di motivazione, di
                  attivare la procedura di passaggio (switching) verso un diverso fornitore di servizi di
                  trattamento dei dati, verso più fornitori contemporaneamente, o verso un&apos;infrastruttura
                  propria (on-premise), mediante richiesta scritta tramite funzione in-app o e-mail a{" "}
                  <a href="mailto:rescuemanager@legalmail.it" className="text-slate-900 underline underline-offset-2">
                    rescuemanager@legalmail.it
                  </a>
                  .
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  10.2 Preavviso e Periodo di Transizione
                </h3>
                <p>
                  A seguito della richiesta di switching si applica un preavviso massimo di 2 mesi, decorso
                  il quale ha inizio un periodo di transizione massimo di 30 giorni durante il quale il
                  Fornitore presta ragionevole assistenza alla migrazione, mantenendo la continuità del
                  servizio. Ove il completamento entro 30 giorni sia tecnicamente non fattibile, il Fornitore
                  lo comunica al Cliente entro 14 giorni lavorativi dalla richiesta, indicando la durata
                  alternativa necessaria (comunque non superiore a 7 mesi) e motivandola.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  10.3 Esportazione e Recupero dei Dati
                </h3>
                <p>
                  Il Fornitore mette a disposizione l&apos;esportazione completa dei dati esportabili del
                  Cliente (dati di input e di output, metadati direttamente o indirettamente generati
                  dall&apos;uso del servizio, esclusi i beni protetti da diritti di proprietà intellettuale
                  del Fornitore o segreti commerciali di terzi) in formati strutturati, di uso comune e
                  leggibili da dispositivo automatico. L&apos;elenco aggiornato delle categorie di dati
                  esportabili e dei formati è pubblicato nella pagina &quot;Trasparenza e Switching&quot; del
                  sito ufficiale.
                </p>
                <p className="mt-2">
                  Dopo la conclusione del periodo di transizione — o dopo la cessazione del contratto per
                  qualsiasi causa — il Cliente dispone di un periodo di recupero dei dati di 90 giorni,
                  superiore al minimo di 30 giorni previsto dal Data Act. Decorso tale periodo, i dati sono
                  cancellati, salvi gli obblighi di conservazione di legge.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">10.4 Costi di Switching</h3>
                <p>
                  Fino all&apos;11 gennaio 2027, per le operazioni di switching possono essere addebitati
                  esclusivamente i costi effettivamente sostenuti dal Fornitore, resi noti al Cliente prima
                  dell&apos;avvio. Dal 12 gennaio 2027 nessun costo di switching sarà addebitato.
                  L&apos;esportazione ordinaria dei dati tramite le funzioni self-service della Piattaforma è
                  gratuita in ogni momento.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">10.5 Effetti sul Contratto</h3>
                <p>
                  L&apos;attivazione dello switching comporta la cessazione del contratto al termine del
                  periodo di transizione. Restano dovuti i soli corrispettivi maturati fino alla data di
                  cessazione; non sono applicate penali di uscita. Per i piani annuali già pagati, i canoni
                  relativi al periodo successivo alla cessazione sono rimborsati pro-rata.
                </p>
              </div>
            </div>
          </section>

          {/* 11. Legge e Foro */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              11. Legge Applicabile e Foro Competente
            </h2>
            <div className="text-slate-700 leading-relaxed space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">11.1 Legge Applicabile</h3>
                <p>
                  Il presente contratto è regolato dalla legge italiana. Si applicano il Codice Civile, il
                  D.Lgs. 70/2003, il D.Lgs. 231/2002, il Regolamento (UE) 2023/2854 e ogni altra norma
                  italiana ed europea applicabile.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">11.2 Foro Competente</h3>
                <div className="bg-slate-50 border border-slate-200 p-4 mb-2">
                  <p className="text-slate-600 text-xs">
                    ⚠️ Clausola soggetta ad approvazione specifica ex art. 1341, comma 2, c.c. — v. art. 12
                  </p>
                </div>
                <p>
                  Per qualsiasi controversia è competente in via esclusiva il Foro di Caltanissetta (luogo
                  della sede legale del Fornitore: Via dello Smeraldo 18, Gela, CL). Tale clausola deroga
                  alla competenza ordinaria ex artt. 18, 19, 20 c.p.c.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">11.3 Tentativo di Conciliazione</h3>
                <p>
                  Le Parti si impegnano a tentare in buona fede la risoluzione amichevole entro 30 giorni
                  dalla comunicazione scritta del disaccordo, prima di adire l&apos;Autorità Giudiziaria.
                </p>
              </div>
            </div>
          </section>

          {/* 12. Clausole soggette ad Approvazione Specifica */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              12. Clausole soggette ad Approvazione Specifica
            </h2>
            <div className="text-slate-700 leading-relaxed space-y-3 text-sm">
              <p>
                Ai sensi e per gli effetti dell&apos;art. 1341, comma 2, c.c., il Cliente approva
                specificamente, mediante la sottoscrizione qualificata di cui all&apos;art. 2.1, le seguenti
                clausole:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-700">
                <li>
                  <strong>Art. 4.5</strong> — Sospensione del servizio per morosità
                </li>
                <li>
                  <strong>Art. 5.2</strong> — Rinnovo automatico del contratto (tacita rinnovazione)
                </li>
                <li>
                  <strong>Art. 7.1</strong> — Credito SLA quale rimedio esclusivo
                </li>
                <li>
                  <strong>Art. 7.2</strong> — Limitazione di responsabilità del Fornitore
                </li>
                <li>
                  <strong>Art. 11.2</strong> — Foro esclusivo di Caltanissetta (deroga alla competenza
                  territoriale)
                </li>
                <li>
                  <strong>Art. 13.1</strong> — Facoltà del Fornitore di modificare unilateralmente i termini
                </li>
                <li>
                  <strong>Art. 13.2</strong> — Divieto di cessione del contratto da parte del Cliente
                </li>
              </ol>
            </div>
          </section>

          {/* 13. Disposizioni Generali */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">13. Disposizioni Generali</h2>
            <div className="text-slate-700 leading-relaxed space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">13.1 Modifiche ai Termini</h3>
                <div className="bg-slate-50 border border-slate-200 p-4 mb-2">
                  <p className="text-slate-600 text-xs">
                    ⚠️ Clausola soggetta ad approvazione specifica ex art. 1341, comma 2, c.c. — v. art. 12
                  </p>
                </div>
                <p>
                  Le modifiche ai presenti Termini sono comunicate con 30 giorni di preavviso via e-mail e
                  in-app. In caso di modifiche peggiorative per il Cliente, questi può recedere senza penali
                  con effetto dalla data di efficacia delle modifiche, con rimborso pro-rata dei periodi
                  pagati e non goduti. In assenza di recesso, le modifiche si applicano dalla data indicata.
                  Le modifiche imposte da obblighi di legge si applicano dalla data prevista dalla norma.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">13.2 Cessibilità</h3>
                <div className="bg-slate-50 border border-slate-200 p-4 mb-2">
                  <p className="text-slate-600 text-xs">
                    ⚠️ Clausola soggetta ad approvazione specifica ex art. 1341, comma 2, c.c. — v. art. 12
                  </p>
                </div>
                <p>
                  Il Cliente non può cedere il contratto senza consenso scritto. Il Fornitore può cedere
                  nell&apos;ambito di trasferimenti d&apos;azienda con preavviso di 30 giorni.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">13.3 Nullità Parziale</h3>
                <p>La nullità di una clausola non comporta la nullità dell&apos;intero contratto.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">13.4 Comunicazioni</h3>
                <p>
                  Le comunicazioni con valore legale sono effettuate: verso il Fornitore, alla PEC
                  rescuemanager@legalmail.it; verso il Cliente, all&apos;indirizzo PEC o e-mail indicato in
                  fase di registrazione (che il Cliente si impegna a mantenere aggiornato) o tramite notifica
                  in-app con conferma di lettura.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">13.5 Sopravvivenza</h3>
                <p>
                  Le clausole in materia di proprietà intellettuale (art. 3), riservatezza (art. 8.3),
                  recupero dati (art. 10.3), limitazione di responsabilità (art. 7.2), legge applicabile e
                  foro (art. 11) sopravvivono alla cessazione del contratto.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">13.6 Integralità e Archivio Versioni</h3>
                <p>
                  Il presente contratto, con Privacy Policy, DPA e Cookie Policy, costituisce l&apos;intero
                  accordo tra le Parti. Le versioni precedenti dei Termini, con le relative date di vigenza,
                  sono consultabili nell&apos;archivio pubblicato sul sito ufficiale.
                </p>
              </div>
            </div>
          </section>

          {/* Contatti */}
          <div className="bg-[#0f172a] p-6 text-white">
            <h3 className="font-bold text-lg mb-4">Contatti per Questioni Legali e Contrattuali</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Titolare / Fornitore</p>
                <p className="font-semibold">RescueManager S.r.l.</p>
                <p className="text-slate-300">P.IVA 02176370852</p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Recapiti</p>
                <p>Via dello Smeraldo 18, 93012 Gela (CL)</p>
                <p>
                  PEC{" "}
                  <a href="mailto:rescuemanager@legalmail.it" className="text-slate-200 underline underline-offset-2">
                    rescuemanager@legalmail.it
                  </a>
                </p>
                <p>
                  Email{" "}
                  <a href="mailto:info@rescuemanager.eu" className="text-slate-200 underline underline-offset-2">
                    info@rescuemanager.eu
                  </a>
                </p>
                <p>
                  <a
                    href="https://www.rescuemanager.eu"
                    className="text-slate-200 underline underline-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.rescuemanager.eu
                  </a>
                </p>
                <p className="text-slate-400 text-xs mt-1">Capitale sociale € 100,00</p>
              </div>
            </div>
          </div>

          {/* Link altre policy */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/privacy-policy"
              className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5"
            >
              Privacy Policy
            </a>
            <a
              href="/cookie-policy"
              className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5"
            >
              Cookie Policy
            </a>
            <a
              href="/dpa"
              className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5"
            >
              Data Processing Agreement
            </a>
            <a
              href="/trasparenza"
              className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5"
            >
              Trasparenza e Switching
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
