// src/app/privacy-policy/page.tsx

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#0f172a] pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Informativa sulla Privacy
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Informativa sul trattamento dei dati personali ex artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR)
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-slate-500">
            <span>Versione 4.0</span>
            <span className="text-slate-600">·</span>
            <span>In vigore dal 10 settembre 2026</span>
            <span className="text-slate-600">·</span>
            <span>Reg. UE 2016/679</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-6">

          {/* Premessa */}
          <div className="border-l-2 border-[#0f172a] bg-slate-50 p-5 text-sm text-slate-700 leading-relaxed">
            La presente Informativa descrive le modalità con cui <strong>RescueManager S.r.l.</strong> (di seguito &quot;Titolare&quot;), tratta i dati personali degli utenti e dei rappresentanti delle aziende clienti che accedono e utilizzano la Piattaforma RescueManager, in conformità al Regolamento (UE) 2016/679 (GDPR), al D.Lgs. 30 giugno 2003, n. 196 (Codice Privacy) come modificato dal D.Lgs. 101/2018, e a ogni altra normativa applicabile.
          </div>

          {/* 1. Titolare del Trattamento */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Titolare del Trattamento e Dati di Contatto</h2>
            <div className="text-slate-700 leading-relaxed text-sm space-y-4">
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li><strong>Titolare del Trattamento:</strong> RescueManager S.r.l., società a responsabilità limitata di diritto italiano</li>
                <li><strong>Sede legale:</strong> Via dello Smeraldo 18, 93012 Gela (CL), Italia</li>
                <li><strong>Partita IVA:</strong> 02176370852 — Capitale sociale € 100,00 i.v.</li>
                <li><strong>Indirizzo e-mail (PEC):</strong> <a href="mailto:rescuemanager@legalmail.it" className="text-slate-900 underline">rescuemanager@legalmail.it</a></li>
                <li><strong>Sito web:</strong> <a href="https://www.rescuemanager.eu" className="text-slate-900 underline" target="_blank" rel="noopener noreferrer">www.rescuemanager.eu</a></li>
              </ul>
              <p>Il Titolare non ha nominato un Responsabile della Protezione dei Dati (DPO), non ricorrendone i presupposti ex art. 37 GDPR; le richieste relative alla protezione dei dati personali sono gestite direttamente dal Titolare ai recapiti sopra indicati.</p>
            </div>
          </section>

          {/* 2. Dati Personali Raccolti */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Dati Personali Raccolti e Trattati</h2>
            <div className="text-slate-700 leading-relaxed text-sm space-y-4">
              <h3 className="font-semibold text-slate-900">2.1 Dati dei Referenti e Rappresentanti del Cliente (raccolti direttamente)</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li><strong>Dati identificativi e anagrafici:</strong> nome, cognome, qualifica professionale, ruolo aziendale</li>
                <li><strong>Dati di contatto:</strong> indirizzo e-mail professionale, numero di telefono</li>
                <li><strong>Dati fiscali e societari:</strong> denominazione sociale, P. IVA, codice fiscale, indirizzo sede legale e operativa, codice destinatario SDI o PEC</li>
                <li><strong>Dati di pagamento:</strong> i dati della carta sono gestiti in forma tokenizzata da Stripe e non sono archiviati in chiaro sui sistemi del Titolare; le coordinate bancarie (IBAN) e i dati del mandato di addebito diretto SEPA (SDD) sono gestiti tramite GoCardless; in caso di bonifico, il Titolare tratta i soli dati risultanti dalla contabile bancaria</li>
                <li><strong>Dati di accesso:</strong> username, password (conservata in forma crittografata), registro degli accessi</li>
                <li><strong>Evidenze contrattuali:</strong> log della conclusione del contratto e della sottoscrizione con OTP delle clausole ex art. 1341, comma 2, c.c. (data, ora, recapito utilizzato)</li>
              </ul>

              <h3 className="font-semibold text-slate-900">2.2 Dati Tecnici (raccolti automaticamente)</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li>Indirizzo IP e dati di connessione alla Piattaforma</li>
                <li>Log di accesso e di utilizzo: timestamp, azioni effettuate, sessioni utente</li>
                <li>Informazioni sul dispositivo e browser: sistema operativo, browser, risoluzione schermo, lingua</li>
              </ul>

              <h3 className="font-semibold text-slate-900">2.3 Dati Inseriti dal Cliente nella Piattaforma</h3>
              <p>Per i dati che il Cliente inserisce nella Piattaforma nell&apos;esercizio della propria attività (dati dei proprietari dei veicoli, dei dipendenti, dei clienti/fornitori, delle pratiche RENTRI/RVFU, degli interventi di soccorso stradale), il Titolare agisce in qualità di <strong>Responsabile del Trattamento</strong> per conto del Cliente, che rimane Titolare del Trattamento ai sensi dell&apos;art. 4, n. 7, GDPR. Tale rapporto è disciplinato dal <a href="/dpa" className="text-slate-900 underline">Data Processing Agreement (DPA)</a>.</p>
            </div>
          </section>

          {/* 3. Finalità e Basi Giuridiche */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Finalità e Basi Giuridiche del Trattamento</h2>
            <div className="text-slate-700 leading-relaxed text-sm space-y-3">
              <div className="bg-slate-50 border border-slate-200 p-4">
                <p className="font-semibold text-slate-900 mb-2">3.1 Esecuzione del Contratto — Art. 6(1)(b) GDPR</p>
                <p>Attivazione, gestione ed erogazione del Servizio SaaS; gestione dei pagamenti (carta, addebito SDD, bonifico); fatturazione; supporto tecnico; comunicazioni operative (aggiornamenti, manutenzioni, notifiche di rinnovo).</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4">
                <p className="font-semibold text-slate-900 mb-2">3.2 Adempimento di Obblighi Legali — Art. 6(1)(c) GDPR</p>
                <p>Normativa fiscale e contabile (fatturazione elettronica tramite SDI, conservazione per legge), normativa anti-riciclaggio (D.Lgs. 231/2007), obblighi informativi (D.Lgs. 70/2003), obblighi di portabilità e trasparenza ex Regolamento (UE) 2023/2854 (Data Act).</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4">
                <p className="font-semibold text-slate-900 mb-2">3.3 Legittimo Interesse del Titolare — Art. 6(1)(f) GDPR</p>
                <p>Sicurezza informatica (monitoraggio accessi, incident response); analisi aggregate anonime per miglioramento del Servizio; accertamento e tutela dei diritti in sede giudiziaria; conservazione delle evidenze di conclusione del contratto.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4">
                <p className="font-semibold text-slate-900 mb-2">3.4 Consenso — Art. 6(1)(a) GDPR</p>
                <p>Per finalità di marketing diretto e comunicazioni promozionali, previo consenso esplicito e separato. Il consenso può essere revocato in qualsiasi momento.</p>
              </div>
            </div>
          </section>

          {/* 4. Destinatari e Sub-responsabili */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Destinatari, Sub-responsabili e Trasferimento dei Dati</h2>
            <div className="text-slate-700 leading-relaxed text-sm space-y-4">
              <h3 className="font-semibold text-slate-900">4.1 Categorie di Destinatari</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li>Sub-responsabili del trattamento (fornitori tecnici, nominati ex art. 28 GDPR)</li>
                <li>Autorità pubbliche: Agenzia delle Entrate (SDI), autorità ambientali (RENTRI/RVFU), forze dell&apos;ordine, autorità giudiziaria</li>
                <li>Consulenti professionali del Titolare (avvocati, commercialisti), vincolati al segreto professionale</li>
              </ul>

              <h3 className="font-semibold text-slate-900">4.2 Sub-responsabili del Trattamento</h3>
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900 mb-1">Vercel Inc. — USA — Trasferimento extra-UE</p>
                  <p><strong>Ruolo:</strong> hosting sito web e frontend della Piattaforma</p>
                  <p><strong>Sede:</strong> 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
                  <p><strong>Garanzia trasferimento:</strong> EU-U.S. Data Privacy Framework (DPF) + Clausole Contrattuali Standard (SCC)</p>
                  <p><strong>Certificazioni:</strong> SOC 2 Type 2, ISO 27001</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900 mb-1">IONOS SE — Germania — Solo UE/SEE</p>
                  <p><strong>Ruolo:</strong> hosting API e backend applicativo</p>
                  <p><strong>Sede:</strong> Elgendorfer Str. 57, 56410 Montabaur, Germania — HRB 24498</p>
                  <p><strong>Localizzazione dati:</strong> esclusivamente all&apos;interno dello Spazio Economico Europeo (SEE), nessun trasferimento verso Paesi terzi</p>
                  <p><strong>Certificazioni:</strong> ISO 27001</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900 mb-1">Supabase, Inc. — USA/EU — SCC</p>
                  <p><strong>Ruolo:</strong> database e autenticazione degli utenti</p>
                  <p><strong>Garanzia trasferimento:</strong> Clausole Contrattuali Standard (SCC)</p>
                  <p><strong>Certificazioni:</strong> SOC 2 Type 2</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900 mb-1">Stripe Payments Europe, Ltd. — Irlanda — Solo UE</p>
                  <p><strong>Ruolo:</strong> elaborazione pagamenti con carta</p>
                  <p><strong>Sede:</strong> 1 Grand Canal Street Lower, Dublin 2, Irlanda (UE)</p>
                  <p><strong>Localizzazione dati:</strong> Unione Europea, nessun trasferimento verso Paesi terzi</p>
                  <p><strong>Certificazioni:</strong> PCI-DSS Level 1</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900 mb-1">GoCardless Ltd. — Regno Unito — Decisione di adeguatezza UE</p>
                  <p><strong>Ruolo:</strong> gestione degli addebiti diretti SEPA (SDD) e dei relativi mandati</p>
                  <p><strong>Sede:</strong> Sutton Yard, 65 Goswell Road, Londra EC1V 7EN, Regno Unito</p>
                  <p><strong>Garanzia trasferimento:</strong> decisione di adeguatezza della Commissione Europea per il Regno Unito</p>
                  <p><strong>Certificazioni/vigilanza:</strong> ISO 27001; istituto di pagamento autorizzato</p>
                </div>
              </div>

              <h3 className="font-semibold text-slate-900">4.3 Riepilogo Trasferimenti Dati verso Paesi Terzi</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-200 px-3 py-2 text-left">Sub-responsabile</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">Sede</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">Trasferimento extra-UE</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">Garanzia</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Vercel Inc.</td>
                      <td className="border border-slate-200 px-3 py-2">USA</td>
                      <td className="border border-slate-200 px-3 py-2">Sì (hosting frontend)</td>
                      <td className="border border-slate-200 px-3 py-2">EU-U.S. DPF + SCC</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">IONOS SE</td>
                      <td className="border border-slate-200 px-3 py-2">Germania (UE)</td>
                      <td className="border border-slate-200 px-3 py-2">No</td>
                      <td className="border border-slate-200 px-3 py-2">Trattamento in SEE</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Supabase, Inc.</td>
                      <td className="border border-slate-200 px-3 py-2">USA / EU</td>
                      <td className="border border-slate-200 px-3 py-2">Sì (configurazione)</td>
                      <td className="border border-slate-200 px-3 py-2">SCC</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Stripe Payments Europe</td>
                      <td className="border border-slate-200 px-3 py-2">Irlanda (UE)</td>
                      <td className="border border-slate-200 px-3 py-2">No</td>
                      <td className="border border-slate-200 px-3 py-2">Trattamento in UE</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">GoCardless Ltd.</td>
                      <td className="border border-slate-200 px-3 py-2">Regno Unito</td>
                      <td className="border border-slate-200 px-3 py-2">Sì</td>
                      <td className="border border-slate-200 px-3 py-2">Decisione di adeguatezza UE</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>Ulteriori informazioni sulla giurisdizione dell&apos;infrastruttura ICT e sulle misure contro accessi governativi di Paesi terzi sono pubblicate nella pagina <a href="/trasparenza" className="text-slate-900 underline">&quot;Trasparenza e Switching&quot;</a> (art. 28 Data Act).</p>
            </div>
          </section>

          {/* 5. Periodo di Conservazione */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Periodo di Conservazione dei Dati</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 text-left">Categoria di dato</th>
                    <th className="border border-slate-200 px-3 py-2 text-left">Periodo di conservazione</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2">Dati contrattuali e di fatturazione</td>
                    <td className="border border-slate-200 px-3 py-2">10 anni dalla cessazione (obbligo fiscale ex D.P.R. 600/1973 e 633/1972)</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2">Evidenze della sottoscrizione OTP delle clausole contrattuali</td>
                    <td className="border border-slate-200 px-3 py-2">10 anni dalla cessazione (termine di prescrizione ordinaria)</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2">Dati di accesso e log di sistema (sicurezza)</td>
                    <td className="border border-slate-200 px-3 py-2">12 mesi dalla registrazione del log</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2">Dati di traffico (fatturazione)</td>
                    <td className="border border-slate-200 px-3 py-2">6 mesi (art. 123, D.Lgs. 196/2003)</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2">Dati dei mandati SDD</td>
                    <td className="border border-slate-200 px-3 py-2">Durata del mandato + termini di legge applicabili ai rapporti bancari</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2">Dati per marketing (con consenso)</td>
                    <td className="border border-slate-200 px-3 py-2">Fino alla revoca del consenso o 24 mesi dall&apos;ultimo contatto</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2">Dati del periodo di prova (mancata conversione)</td>
                    <td className="border border-slate-200 px-3 py-2">30 giorni dalla scadenza del periodo di prova</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2">Dati inseriti dal Cliente nella Piattaforma</td>
                    <td className="border border-slate-200 px-3 py-2">90 giorni dalla cessazione del contratto, poi cancellazione definitiva</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mt-4">Alla scadenza dei termini, i dati sono cancellati o anonimizzati in modo irreversibile.</p>
          </section>

          {/* 6. Diritti dell'Interessato */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">6. Diritti dell&apos;Interessato</h2>
            <div className="text-slate-700 leading-relaxed text-sm space-y-4">
              <p>Ai sensi degli artt. 15-22 del GDPR, l&apos;interessato ha il diritto di:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li><strong>Accesso (art. 15):</strong> ottenere conferma dell&apos;esistenza di un trattamento e accedere ai propri dati</li>
                <li><strong>Rettifica (art. 16):</strong> ottenere la rettifica dei dati inesatti o l&apos;integrazione di quelli incompleti</li>
                <li><strong>Cancellazione (art. 17):</strong> ottenere la cancellazione dei propri dati nei casi previsti (&quot;diritto all&apos;oblio&quot;)</li>
                <li><strong>Limitazione (art. 18):</strong> ottenere la limitazione del trattamento nei casi previsti dalla legge</li>
                <li><strong>Portabilità (art. 20):</strong> ricevere i propri dati in formato strutturato, leggibile da dispositivo automatico</li>
                <li><strong>Opposizione (art. 21):</strong> opporsi al trattamento basato sul legittimo interesse del Titolare</li>
                <li><strong>Revoca del consenso (art. 7):</strong> revocare in qualsiasi momento il consenso prestato, senza effetto retroattivo</li>
              </ul>
              <div className="bg-slate-50 border border-slate-200 p-4">
                <p>Per esercitare i tuoi diritti: <a href="mailto:rescuemanager@legalmail.it" className="text-slate-900 underline">rescuemanager@legalmail.it</a>. Risposta entro 1 mese dalla richiesta, prorogabile di 2 mesi nei casi di particolare complessità (art. 12, par. 3, GDPR), con informazione all&apos;interessato entro il primo mese. Hai altresì il diritto di proporre reclamo al <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-slate-900 underline">Garante per la Protezione dei Dati Personali</a>.</p>
              </div>
            </div>
          </section>

          {/* 7. Misure di Sicurezza */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">7. Misure di Sicurezza</h2>
            <div className="text-slate-700 leading-relaxed text-sm space-y-4">
              <p>Il Titolare adotta le seguenti misure di sicurezza ai sensi dell&apos;art. 32 GDPR:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li><strong>Crittografia in transito:</strong> connessioni cifrate con protocollo TLS 1.3</li>
                <li><strong>Crittografia a riposo:</strong> dati archiviati con standard AES-256</li>
                <li><strong>Controllo degli accessi:</strong> autenticazione forte (password complesse + 2FA)</li>
                <li><strong>Backup automatici:</strong> giornalieri, conservati per almeno 30 giorni</li>
                <li><strong>Monitoraggio e log di audit:</strong> rilevamento anomalie e audit trail</li>
                <li><strong>Valutazione periodica dei rischi:</strong> analisi delle minacce e aggiornamento contromisure</li>
              </ul>
            </div>
          </section>

          {/* Contatti */}
          <div className="bg-[#0f172a] p-6 text-white">
            <h3 className="font-bold text-lg mb-4">Contatti per Questioni relative alla Privacy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Titolare del Trattamento</p>
                <p className="font-semibold">RescueManager S.r.l.</p>
                <p className="text-slate-300">P.IVA 02176370852 — Capitale sociale € 100,00</p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Recapiti</p>
                <p>Via dello Smeraldo 18, 93012 Gela (CL)</p>
                <p><a href="mailto:rescuemanager@legalmail.it" className="text-slate-300 underline">rescuemanager@legalmail.it</a></p>
                <p><a href="https://www.rescuemanager.eu" className="text-slate-300 underline" target="_blank" rel="noopener noreferrer">www.rescuemanager.eu</a></p>
              </div>
            </div>
          </div>

          {/* Link altre policy */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/cookie-policy" className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5">Cookie Policy</a>
            <a href="/terms-of-use" className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5">Termini e Condizioni</a>
            <a href="/dpa" className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5">Data Processing Agreement</a>
            <a href="/trasparenza" className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5">Trasparenza e Switching</a>
          </div>

        </div>
      </div>
    </div>
  );
}
