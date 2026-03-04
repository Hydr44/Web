// src/app/dpa/page.tsx
import { FileText, Shield, Lock, Database, Users, AlertTriangle } from "lucide-react";

export default function DPAPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-blue-200 px-4 py-2 mb-6 bg-blue-50 text-[#2563EB] font-medium">
            <Shield className="h-4 w-4" />
            Data Processing Agreement
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Data Processing Agreement (DPA)
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Contratto di Responsabile del Trattamento ex Art. 28 del Regolamento (UE) 2016/679 (GDPR)
          </p>
          
          <div className="mt-6 text-sm text-gray-500">
            Versione 3.0 — In vigore dal 23 febbraio 2026
          </div>
        </div>

        {/* Contenuto */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-8">
            
            {/* Premessa */}
            <section className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <p className="text-blue-900 text-sm leading-relaxed">
                  Il presente Data Processing Agreement ("DPA") è parte integrante dei Termini e Condizioni di Servizio conclusi tra il Cliente (di seguito "Titolare del Trattamento") e Emmanuel Salvatore Scozzarini, libero professionista operante sotto il nome commerciale RescueManager, P. IVA 02166430856 (di seguito "Responsabile del Trattamento" o "RescueManager"), e disciplina il trattamento dei dati personali effettuato da RescueManager per conto del Cliente nell'ambito dell'erogazione del Servizio SaaS, ai sensi dell'art. 28 del GDPR.
                </p>
              </div>
            </section>

            {/* 1. Ruoli e Responsabilità */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#2563EB]" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">1. Ruoli e Responsabilità</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">1.1 Definizione dei Ruoli</h3>
                <p>Le Parti concordano e riconoscono che, in relazione ai dati personali inseriti dal Cliente nella Piattaforma nell'esercizio della propria attività operativa:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Il Cliente</strong> agisce in qualità di <strong>Titolare del Trattamento</strong> ai sensi dell'art. 4, n. 7, GDPR, in quanto determina autonomamente le finalità e i mezzi del trattamento dei dati relativi alla propria attività;</li>
                  <li><strong>Emmanuel Salvatore Scozzarini</strong>, operante come RescueManager, agisce in qualità di <strong>Responsabile del Trattamento</strong> ai sensi dell'art. 4, n. 8, GDPR, in quanto tratta i predetti dati esclusivamente per conto del Cliente e nell'ambito dell'erogazione del Servizio contrattualmente previsto.</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mt-6">1.2 Nomina</h3>
                <p>
                  Con la sottoscrizione dei Termini e Condizioni (e la conseguente accettazione del presente DPA, che ne costituisce parte integrante), il Cliente nomina formalmente Emmanuel Salvatore Scozzarini quale Responsabile del Trattamento ai sensi dell'art. 28, par. 1, GDPR. Il Responsabile accetta tale nomina.
                </p>
              </div>
            </section>

            {/* 2. Oggetto, Natura e Finalità del Trattamento */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Database className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">2. Oggetto, Natura e Finalità del Trattamento</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">2.1 Oggetto</h3>
                <p>Il Responsabile del Trattamento tratta i dati personali per conto del Cliente limitatamente a quanto necessario per erogare i servizi, e in particolare per:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Gestire e archiviare le schede veicolo e i dati dei proprietari inseriti dal Cliente</li>
                  <li>Supportare il Cliente nella trasmissione telematica dei dati alle autorità competenti (RENTRI, MCTC per RVFU)</li>
                  <li>Consentire la gestione dell'anagrafica di dipendenti, clienti e fornitori del Cliente</li>
                  <li>Fornire funzionalità di reportistica e analisi sui dati del Cliente</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">2.2 Categorie dei Dati Trattati</h3>
                <p>I dati personali trattati dal Responsabile per conto del Cliente includono le seguenti categorie:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Dati identificativi e anagrafici dei proprietari dei veicoli conferiti per la demolizione (nome, cognome, codice fiscale, documento d'identità)</li>
                  <li>Dati relativi ai veicoli: targa, numero di telaio, dati della carta di circolazione</li>
                  <li>Dati dei dipendenti del Cliente: nome, cognome, ruolo, credenziali di accesso alla Piattaforma</li>
                  <li>Dati anagrafici e fiscali di clienti e fornitori del Cliente</li>
                  <li>Dati relativi alle pratiche ambientali: registrazioni RENTRI, documentazione per la radiazione dei veicoli (RVFU)</li>
                </ul>
                <p className="mt-4">
                  <strong>Nota:</strong> Non sono trattati, salvo diversa istruzione scritta del Cliente, dati appartenenti a categorie particolari ai sensi dell'art. 9 GDPR.
                </p>
              </div>
            </section>

            {/* 3. Istruzioni Documentate */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">3. Istruzioni Documentate</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">3.1 Obbligo di Seguire le Istruzioni</h3>
                <p>
                  Il Responsabile del Trattamento tratta i dati personali esclusivamente sulla base delle istruzioni documentate del Cliente, che consistono nelle istruzioni incorporate nel presente DPA e nei Termini e Condizioni, nelle configurazioni effettuate dal Cliente tramite la Piattaforma, e in eventuali istruzioni scritte aggiuntive comunicate dal Cliente.
                </p>
                <p>
                  Il Responsabile informa immediatamente il Cliente qualora ritenga che un'istruzione violi il GDPR o altra normativa applicabile.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">3.2 Divieto di Utilizzo per Finalità Proprie</h3>
                <p>
                  Il Responsabile si impegna a non utilizzare i dati personali trattati per conto del Cliente per finalità proprie o di terzi, né a comunicarli a terzi senza previa autorizzazione scritta del Cliente, salvo quanto imposto dalla legge applicabile.
                </p>
              </div>
            </section>

            {/* 4. Misure di Sicurezza */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">4. Misure di Sicurezza Tecniche e Organizzative</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>Ai sensi dell'art. 32 GDPR, il Responsabile del Trattamento adotta le seguenti misure tecniche e organizzative per garantire un livello di sicurezza proporzionato al rischio:</p>
                
                <h3 className="text-lg font-semibold text-gray-900">4.1 Misure Adottate dal Responsabile</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Crittografia in transito:</strong> i dati personali sono trasmessi attraverso connessioni cifrate con protocollo TLS 1.3</li>
                  <li><strong>Crittografia a riposo:</strong> i dati archiviati sono cifrati con standard AES-256</li>
                  <li><strong>Controllo degli accessi:</strong> accesso ai dati riservato al personale strettamente autorizzato, con autenticazione forte (password complesse, autenticazione a due fattori)</li>
                  <li><strong>Backup e continuità operativa:</strong> backup automatici giornalieri con conservazione per almeno 30 giorni</li>
                  <li><strong>Monitoraggio e log di audit:</strong> sistemi di rilevamento delle anomalie e audit trail delle operazioni sui dati</li>
                  <li><strong>Valutazione periodica dei rischi:</strong> analisi periodica delle minacce e aggiornamento delle contromisure</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">4.2 Misure di Sicurezza dei Sub-responsabili</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 rounded-lg text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Sub-responsabile</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Certificazioni</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Localizzazione</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">Vercel Inc.</td>
                        <td className="border border-gray-300 px-3 py-2">SOC 2 Type 2, ISO 27001</td>
                        <td className="border border-gray-300 px-3 py-2">USA (DPF + SCC)</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">IONOS SE</td>
                        <td className="border border-gray-300 px-3 py-2">ISO 27001</td>
                        <td className="border border-gray-300 px-3 py-2">Germania / UE (SEE)</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">Supabase, Inc.</td>
                        <td className="border border-gray-300 px-3 py-2">SOC 2 Type 2</td>
                        <td className="border border-gray-300 px-3 py-2">USA / EU (SCC)</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">Stripe Payments Europe</td>
                        <td className="border border-gray-300 px-3 py-2">PCI-DSS Level 1</td>
                        <td className="border border-gray-300 px-3 py-2">Irlanda / UE</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 5. Riservatezza */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-orange-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">5. Riservatezza del Personale e dei Collaboratori</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>
                  Il Responsabile del Trattamento garantisce che le eventuali persone autorizzate al trattamento dei dati personali per conto del Cliente (collaboratori, consulenti, dipendenti) siano vincolate da obblighi di riservatezza adeguati (contrattuali o derivanti da obblighi di legge) e abbiano ricevuto adeguata formazione in materia di protezione dei dati personali.
                </p>
              </div>
            </section>

            {/* 6. Sub-responsabili */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Database className="h-4 w-4 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">6. Sub-responsabili del Trattamento</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">6.1 Autorizzazione Generale ed Elenco Aggiornato</h3>
                <p>Il Cliente autorizza il Responsabile, con il presente DPA, a nominare i seguenti sub-responsabili del trattamento:</p>
                
                <div className="space-y-4 mt-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Vercel Inc.</h4>
                    <ul className="text-sm space-y-1">
                      <li><strong>Ruolo:</strong> Hosting sito web e frontend</li>
                      <li><strong>Sede:</strong> 440 N Barranca Ave #4133, Covina, CA 91723, USA</li>
                      <li><strong>Localizzazione dati:</strong> USA</li>
                      <li><strong>Garanzia trasferimento:</strong> EU-U.S. DPF + SCC (DPA Vercel)</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">IONOS SE</h4>
                    <ul className="text-sm space-y-1">
                      <li><strong>Ruolo:</strong> Hosting API e backend</li>
                      <li><strong>Sede:</strong> Elgendorfer Str. 57, 56410 Montabaur, Germania</li>
                      <li><strong>Localizzazione dati:</strong> UE / SEE (Germania)</li>
                      <li><strong>Garanzia trasferimento:</strong> Non applicabile — trattamento in SEE</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Supabase, Inc.</h4>
                    <ul className="text-sm space-y-1">
                      <li><strong>Ruolo:</strong> Database e autenticazione</li>
                      <li><strong>Localizzazione dati:</strong> USA / EU</li>
                      <li><strong>Garanzia trasferimento:</strong> SCC</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Stripe Payments Europe, Ltd.</h4>
                    <ul className="text-sm space-y-1">
                      <li><strong>Ruolo:</strong> Elaborazione pagamenti</li>
                      <li><strong>Sede:</strong> 1 Grand Canal Street Lower, Dublin 2, Irlanda</li>
                      <li><strong>Localizzazione dati:</strong> UE</li>
                      <li><strong>Garanzia trasferimento:</strong> Non applicabile — trattamento in UE</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">6.2 Obblighi verso i Sub-responsabili</h3>
                <p>
                  Il Responsabile impone ai sub-responsabili gli stessi obblighi in materia di protezione dei dati previsti dal presente DPA, mediante contratti scritti conformi all'art. 28, par. 4, GDPR. Il Responsabile rimane pienamente responsabile nei confronti del Cliente per il rispetto degli obblighi da parte dei sub-responsabili.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">6.3 Modifica dei Sub-responsabili</h3>
                <p>
                  Il Responsabile informa il Cliente di eventuali modifiche relative all'aggiunta o alla sostituzione di sub-responsabili con un preavviso di almeno 30 (trenta) giorni. Il Cliente può opporsi alla modifica entro tale termine per ragioni motivate legate alla protezione dei dati.
                </p>
              </div>
            </section>

            {/* 7. Notifica Violazioni */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">7. Notifica di Violazioni dei Dati</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">7.1 Obbligo di Notifica</h3>
                <p>
                  Il Responsabile notifica al Cliente, senza ingiustificato ritardo e comunque entro 72 (settantadue) ore dalla scoperta, qualsiasi violazione dei dati personali (data breach) che lo riguardi, ai sensi dell'art. 33 GDPR.
                </p>
                <p>La notifica contiene almeno:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Descrizione della natura della violazione, delle categorie e del numero approssimativo di interessati e di registrazioni di dati coinvolti</li>
                  <li>Dati di contatto del Responsabile per ulteriori informazioni</li>
                  <li>Descrizione delle probabili conseguenze della violazione</li>
                  <li>Descrizione delle misure adottate o proposte per rimediare alla violazione e per limitarne gli effetti negativi</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">7.2 Collaborazione</h3>
                <p>
                  Il Responsabile collabora con il Cliente per consentire il rispetto degli obblighi di notifica all'autorità di controllo e di comunicazione agli interessati previsti dagli artt. 33 e 34 GDPR.
                </p>
              </div>
            </section>

            {/* 8. Assistenza al Titolare */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">8. Assistenza al Titolare</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>Il Responsabile del Trattamento assiste il Cliente, nei limiti delle proprie competenze e delle informazioni disponibili, per:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Rispondere alle richieste di esercizio dei diritti degli interessati (artt. 15-22 GDPR)</li>
                  <li>Adempiere agli obblighi previsti dagli artt. 32-36 GDPR (sicurezza, notifica violazioni, valutazione d'impatto sulla protezione dei dati — DPIA)</li>
                  <li>Effettuare le verifiche di conformità richieste dal Cliente, incluse audit e ispezioni, con un preavviso ragionevole</li>
                </ul>
              </div>
            </section>

            {/* 9. Cancellazione o Restituzione */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                  <Database className="h-4 w-4 text-gray-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">9. Cancellazione o Restituzione dei Dati</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>Alla cessazione del contratto di servizio, il Responsabile del Trattamento:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Rende disponibile al Cliente, per un periodo di 90 (novanta) giorni dalla cessazione, l'export completo dei dati in formato standard (CSV, JSON o equivalente)</li>
                  <li>Decorso tale termine, procede alla cancellazione definitiva e alla distruzione sicura di tutti i dati personali del Cliente presenti sui propri sistemi e su quelli dei sub-responsabili, salvo obblighi di conservazione previsti dalla legge applicabile</li>
                  <li>Fornisce, su richiesta del Cliente, attestazione scritta dell'avvenuta cancellazione, comprensiva della conferma dell'avvenuta cancellazione presso i principali sub-responsabili</li>
                </ul>
              </div>
            </section>

            {/* Contatti */}
            <section className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Contatti per Questioni Relative al DPA</h3>
                <div className="text-blue-800 text-sm space-y-2">
                  <p><strong>Emmanuel Salvatore Scozzarini — RescueManager</strong></p>
                  <p><strong>Domicilio Professionale:</strong> Via dello Smeraldo 18, Gela (CL), Sicilia</p>
                  <p><strong>P. IVA:</strong> 02166430856</p>
                  <p><strong>Email:</strong> <a href="mailto:rescuemanager@legalmail.it" className="underline">rescuemanager@legalmail.it</a></p>
                  <p><strong>Sito web:</strong> <a href="https://www.rescuemanager.eu" className="underline" target="_blank" rel="noopener noreferrer">www.rescuemanager.eu</a></p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
