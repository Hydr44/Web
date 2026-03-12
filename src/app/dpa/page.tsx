// src/app/dpa/page.tsx

export default function DPAPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#0f172a] pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Data Processing Agreement (DPA)
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Contratto di Responsabile del Trattamento ex Art. 28 del Regolamento (UE) 2016/679 (GDPR)
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500">
            <span>Versione 3.0</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>In vigore dal 23 febbraio 2026</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>Art. 28 GDPR</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">

        {/* Premessa */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm text-blue-900 leading-relaxed">
            Il presente Data Processing Agreement (&quot;DPA&quot;) è parte integrante dei Termini e Condizioni di Servizio conclusi tra il Cliente (di seguito &quot;Titolare del Trattamento&quot;) e Emmanuel Salvatore Scozzarini, libero professionista operante sotto il nome commerciale RescueManager, P. IVA 02166430856 (di seguito &quot;Responsabile del Trattamento&quot; o &quot;RescueManager&quot;), e disciplina il trattamento dei dati personali effettuato da RescueManager per conto del Cliente nell&apos;ambito dell&apos;erogazione del Servizio SaaS, ai sensi dell&apos;art. 28 del GDPR.
          </p>
        </div>

        <div className="space-y-6">

          {/* 1. Ruoli e Responsabilità */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">1. Ruoli e Responsabilità</h2>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">1.1 Definizione dei Ruoli</h3>
              <p>Le Parti concordano e riconoscono che, in relazione ai dati personali inseriti dal Cliente nella Piattaforma nell&apos;esercizio della propria attività operativa:</p>
              <ul className="list-disc list-inside space-y-2 ml-3">
                <li><strong>Il Cliente</strong> agisce in qualità di <strong>Titolare del Trattamento</strong> ai sensi dell&apos;art. 4, n. 7, GDPR, in quanto determina autonomamente le finalità e i mezzi del trattamento dei dati relativi alla propria attività</li>
                <li><strong>Emmanuel Salvatore Scozzarini</strong>, operante come RescueManager, agisce in qualità di <strong>Responsabile del Trattamento</strong> ai sensi dell&apos;art. 4, n. 8, GDPR, in quanto tratta i predetti dati esclusivamente per conto del Cliente. Il Responsabile del Trattamento è una persona fisica; non sussiste pertanto alcuna distinzione tra la persona giuridica del fornitore e la persona fisica del titolare dell&apos;impresa.</li>
              </ul>
              <h3 className="font-semibold text-gray-900 mt-4">1.2 Nomina</h3>
              <p>Con la sottoscrizione dei Termini e Condizioni (e la conseguente accettazione del presente DPA, che ne costituisce parte integrante), il Cliente nomina formalmente Emmanuel Salvatore Scozzarini quale Responsabile del Trattamento ai sensi dell&apos;art. 28, par. 1, GDPR. Il Responsabile accetta tale nomina.</p>
            </div>
          </section>

          {/* 2. Oggetto e Finalità */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">2. Oggetto, Natura e Finalità del Trattamento</h2>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">2.1 Oggetto</h3>
              <p>Il Responsabile tratta i dati personali per conto del Cliente limitatamente a quanto necessario per erogare i servizi, e in particolare per:</p>
              <ul className="list-disc list-inside space-y-1 ml-3">
                <li>Gestire e archiviare le schede veicolo e i dati dei proprietari inseriti dal Cliente</li>
                <li>Supportare il Cliente nella trasmissione telematica dei dati alle autorità competenti (RENTRI, MCTC per RVFU)</li>
                <li>Consentire la gestione dell&apos;anagrafica di dipendenti, clienti e fornitori del Cliente</li>
                <li>Fornire funzionalità di reportistica e analisi sui dati del Cliente</li>
              </ul>
              <h3 className="font-semibold text-gray-900 mt-4">2.2 Categorie dei Dati Trattati</h3>
              <ul className="list-disc list-inside space-y-1 ml-3">
                <li>Dati identificativi e anagrafici dei proprietari dei veicoli (nome, cognome, codice fiscale, documento d&apos;identità)</li>
                <li>Dati relativi ai veicoli: targa, numero di telaio, dati della carta di circolazione</li>
                <li>Dati dei dipendenti del Cliente: nome, cognome, ruolo, credenziali di accesso alla Piattaforma</li>
                <li>Dati anagrafici e fiscali di clienti e fornitori del Cliente</li>
                <li>Dati relativi alle pratiche ambientali: registrazioni RENTRI, documentazione RVFU</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">Non sono trattati, salvo diversa istruzione scritta del Cliente, dati appartenenti a categorie particolari ai sensi dell&apos;art. 9 GDPR.</p>
            </div>
          </section>

          {/* 3. Istruzioni Documentate */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">3. Istruzioni Documentate</h2>
            <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
              <p><strong>3.1 Obbligo di Seguire le Istruzioni:</strong> Il Responsabile tratta i dati personali esclusivamente sulla base delle istruzioni documentate del Cliente (incorporate nel presente DPA, nei Termini e Condizioni, nelle configurazioni della Piattaforma, e in eventuali istruzioni scritte aggiuntive). Il Responsabile informa immediatamente il Cliente qualora ritenga che un&apos;istruzione violi il GDPR o altra normativa applicabile.</p>
              <p><strong>3.2 Divieto di Utilizzo per Finalità Proprie:</strong> Il Responsabile si impegna a non utilizzare i dati personali trattati per conto del Cliente per finalità proprie o di terzi, né a comunicarli a terzi senza previa autorizzazione scritta del Cliente, salvo quanto imposto dalla legge applicabile.</p>
            </div>
          </section>

          {/* 4. Misure di Sicurezza */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">4. Misure di Sicurezza Tecniche e Organizzative</h2>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">4.1 Misure Adottate dal Responsabile (Art. 32 GDPR)</h3>
              <ul className="list-disc list-inside space-y-1 ml-3">
                <li><strong>Crittografia in transito:</strong> connessioni cifrate con protocollo TLS 1.3</li>
                <li><strong>Crittografia a riposo:</strong> dati archiviati con standard AES-256</li>
                <li><strong>Controllo degli accessi:</strong> autenticazione forte (password complesse + 2FA)</li>
                <li><strong>Backup e continuità operativa:</strong> backup automatici giornalieri, conservati per almeno 30 giorni</li>
                <li><strong>Monitoraggio e log di audit:</strong> rilevamento anomalie e audit trail</li>
                <li><strong>Valutazione periodica dei rischi:</strong> analisi delle minacce e aggiornamento contromisure</li>
              </ul>
              <h3 className="font-semibold text-gray-900 mt-4">4.2 Misure di Sicurezza dei Sub-responsabili</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 text-xs">
                  <thead><tr className="bg-gray-50"><th className="border border-gray-200 px-3 py-2 text-left">Sub-responsabile</th><th className="border border-gray-200 px-3 py-2 text-left">Certificazioni</th><th className="border border-gray-200 px-3 py-2 text-left">Localizzazione</th><th className="border border-gray-200 px-3 py-2 text-left">Note sicurezza</th></tr></thead>
                  <tbody>
                    <tr><td className="border border-gray-200 px-3 py-2">Vercel Inc.</td><td className="border border-gray-200 px-3 py-2">SOC 2 Type 2, ISO 27001</td><td className="border border-gray-200 px-3 py-2">USA (DPF + SCC)</td><td className="border border-gray-200 px-3 py-2">Infrastruttura edge; cifratura TLS; auth avanzata</td></tr>
                    <tr><td className="border border-gray-200 px-3 py-2">IONOS SE</td><td className="border border-gray-200 px-3 py-2">ISO 27001</td><td className="border border-gray-200 px-3 py-2">Germania / UE (SEE)</td><td className="border border-gray-200 px-3 py-2">Data center certificati; nessun trasferimento extra-UE</td></tr>
                    <tr><td className="border border-gray-200 px-3 py-2">Supabase, Inc.</td><td className="border border-gray-200 px-3 py-2">SOC 2 Type 2</td><td className="border border-gray-200 px-3 py-2">USA / EU (SCC)</td><td className="border border-gray-200 px-3 py-2">Row-level security; cifratura database</td></tr>
                    <tr><td className="border border-gray-200 px-3 py-2">Stripe Payments Europe</td><td className="border border-gray-200 px-3 py-2">PCI-DSS Level 1</td><td className="border border-gray-200 px-3 py-2">Irlanda / UE</td><td className="border border-gray-200 px-3 py-2">Standard massimo per dati di pagamento</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 5. Riservatezza */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">5. Riservatezza del Personale</h2>
            <div className="text-gray-700 text-sm leading-relaxed">
              <p>Il Responsabile del Trattamento garantisce che le eventuali persone autorizzate al trattamento dei dati personali per conto del Cliente (collaboratori, consulenti, dipendenti) siano vincolate da obblighi di riservatezza adeguati (contrattuali o derivanti da obblighi di legge) e abbiano ricevuto adeguata formazione in materia di protezione dei dati personali.</p>
            </div>
          </section>

          {/* 6. Sub-responsabili */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">6. Sub-responsabili del Trattamento</h2>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">6.1 Autorizzazione Generale ed Elenco Aggiornato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {[
                  { name: "Vercel Inc.", role: "Hosting sito web e frontend", sede: "440 N Barranca Ave #4133, Covina, CA 91723, USA", loc: "USA", garanzia: "EU-U.S. DPF + SCC", badge: "USA", color: "orange" },
                  { name: "IONOS SE", role: "Hosting API e backend", sede: "Elgendorfer Str. 57, 56410 Montabaur, Germania", loc: "UE / SEE (Germania)", garanzia: "Non applicabile — trattamento in SEE", badge: "UE", color: "green" },
                  { name: "Supabase, Inc.", role: "Database e autenticazione", sede: "970 Toa Payoh North #07-04, Singapore (entità legale)", loc: "USA / EU", garanzia: "SCC", badge: "USA/EU", color: "orange" },
                  { name: "Stripe Payments Europe, Ltd.", role: "Elaborazione pagamenti", sede: "1 Grand Canal Street Lower, Dublin 2, Irlanda", loc: "UE", garanzia: "Non applicabile — trattamento in UE", badge: "UE", color: "green" },
                ].map((s) => (
                  <div key={s.name} className="border border-gray-200 rounded-lg p-4 text-xs space-y-1">
                    <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                    <p><strong>Ruolo:</strong> {s.role}</p>
                    <p><strong>Sede:</strong> {s.sede}</p>
                    <p><strong>Localizzazione dati:</strong> {s.loc}</p>
                    <p><strong>Garanzia:</strong> {s.garanzia}</p>
                  </div>
                ))}
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">6.2–6.4 Obblighi, Responsabilità e Modifiche</h3>
              <ul className="list-disc list-inside space-y-1 ml-3 text-sm">
                <li>Il Responsabile impone ai sub-responsabili gli stessi obblighi del presente DPA (art. 28, par. 4, GDPR) e rimane pienamente responsabile del loro rispetto</li>
                <li>Eventuali modifiche ai sub-responsabili (aggiunta o sostituzione) sono comunicate con preavviso di almeno <strong>30 giorni</strong></li>
                <li>Il Cliente può opporsi alla modifica entro tale termine per ragioni motivate legate alla protezione dei dati</li>
              </ul>
            </div>
          </section>

          {/* 7. Notifica Violazioni */}
          <section className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">7. Notifica di Violazioni dei Dati (Data Breach)</h2>
            <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-900 mb-1">Obbligo di notifica entro 72 ore (Art. 33 GDPR)</p>
                <p className="text-red-800 text-xs">Il Responsabile notifica al Cliente, senza ingiustificato ritardo e comunque entro 72 ore dalla scoperta, qualsiasi violazione dei dati personali che lo riguardi.</p>
              </div>
              <p>La notifica contiene almeno: descrizione della natura della violazione, categorie e numero approssimativo di interessati coinvolti, dati di contatto del Responsabile, probabili conseguenze, misure adottate per rimediare alla violazione.</p>
              <p>Il Responsabile si impegna a informare tempestivamente il Cliente anche in caso di violazioni comunicate dai propri sub-responsabili (inclusi Vercel Inc. e IONOS SE).</p>
              <p><strong>7.2 Collaborazione:</strong> Il Responsabile collabora con il Cliente per consentire il rispetto degli obblighi di notifica all&apos;autorità di controllo e di comunicazione agli interessati previsti dagli artt. 33 e 34 GDPR.</p>
            </div>
          </section>

          {/* 8. Assistenza al Titolare */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">8. Assistenza al Titolare</h2>
            <div className="text-gray-700 text-sm leading-relaxed">
              <p>Il Responsabile del Trattamento assiste il Cliente, nei limiti delle proprie competenze e delle informazioni disponibili, per:</p>
              <ul className="list-disc list-inside space-y-1 ml-3 mt-2">
                <li>Rispondere alle richieste di esercizio dei diritti degli interessati (artt. 15-22 GDPR)</li>
                <li>Adempiere agli obblighi previsti dagli artt. 32-36 GDPR (sicurezza, notifica violazioni, DPIA)</li>
                <li>Effettuare le verifiche di conformità richieste dal Cliente, incluse audit e ispezioni, con un preavviso ragionevole</li>
              </ul>
            </div>
          </section>

          {/* 9. Cancellazione o Restituzione */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">9. Cancellazione o Restituzione dei Dati</h2>
            <div className="text-gray-700 text-sm leading-relaxed">
              <p>Alla cessazione del contratto di servizio, il Responsabile del Trattamento:</p>
              <ul className="list-disc list-inside space-y-1 ml-3 mt-2">
                <li>Rende disponibile al Cliente, per un periodo di <strong>90 giorni</strong> dalla cessazione, l&apos;export completo dei dati in formato standard (CSV, JSON o equivalente)</li>
                <li>Decorso tale termine, procede alla cancellazione definitiva e alla distruzione sicura di tutti i dati personali del Cliente presenti sui propri sistemi e su quelli dei sub-responsabili, salvo obblighi di conservazione previsti dalla legge</li>
                <li>Fornisce, su richiesta del Cliente, attestazione scritta dell&apos;avvenuta cancellazione, comprensiva della conferma dell&apos;avvenuta cancellazione presso i principali sub-responsabili</li>
              </ul>
            </div>
          </section>

          {/* Contatti */}
          <div className="bg-[#0f172a] rounded-xl p-6 text-white">
            <h3 className="font-bold text-lg mb-4">Contatti per Questioni Relative al DPA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Responsabile del Trattamento</p>
                <p className="font-semibold">Emmanuel Salvatore Scozzarini</p>
                <p className="text-slate-300">RescueManager — P. IVA 02166430856</p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Recapiti</p>
                <p>Via dello Smeraldo 18, Gela (CL), Sicilia</p>
                <p><a href="mailto:rescuemanager@legalmail.it" className="text-blue-400 hover:underline">rescuemanager@legalmail.it</a></p>
                <p><a href="https://www.rescuemanager.eu" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">www.rescuemanager.eu</a></p>
              </div>
            </div>
          </div>

          {/* Link altre policy */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/terms-of-use" className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50">Termini e Condizioni</a>
            <a href="/privacy-policy" className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50">Privacy Policy</a>
            <a href="/cookie-policy" className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50">Cookie Policy</a>
          </div>

        </div>
      </div>
    </div>
  );
}
