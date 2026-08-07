// src/app/trasparenza/page.tsx

export default function TrasparenzaPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#0f172a] pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Trasparenza e Portabilità dei Dati
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Informazioni su portabilità dei dati, cambio di fornitore e infrastruttura ICT ai sensi del Regolamento (UE) 2023/2854 (&quot;Data Act&quot;), artt. 23-31
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-500">
            <span>Versione 4.0</span>
            <span className="text-slate-600">·</span>
            <span>In vigore dal 10 settembre 2026</span>
            <span className="text-slate-600">·</span>
            <span>Reg. UE 2023/2854 (Data Act)</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">

        {/* Premessa */}
        <div className="border-l-2 border-[#0f172a] bg-slate-50 p-5 text-sm text-slate-700 leading-relaxed mb-8">
          La presente pagina è pubblicata da RescueManager S.r.l. (Via dello Smeraldo 18, 93012 Gela (CL), P.IVA 02176370852, PEC rescuemanager@legalmail.it) in qualità di fornitore di servizi di trattamento dei dati (SaaS), in adempimento degli obblighi informativi previsti dagli artt. 25, 26 e 28 del Data Act, applicabile dal 12 settembre 2025. Essa integra l&apos;art. 10 dei Termini e Condizioni di Servizio.
        </div>

        <div className="space-y-6">

          {/* 1. Il tuo diritto di cambiare fornitore (switching) */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">1. Il tuo diritto di cambiare fornitore (switching)</h2>
            <div className="text-slate-700 leading-relaxed space-y-3">
              <p>In qualità di cliente RescueManager hai il diritto, in qualsiasi momento e senza obbligo di motivazione, di:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li>passare a un altro fornitore di servizi di trattamento dei dati;</li>
                <li>passare a più fornitori contemporaneamente;</li>
                <li>migrare i tuoi dati verso una tua infrastruttura (on-premise);</li>
                <li>semplicemente esportare i tuoi dati, in ogni momento e gratuitamente, tramite le funzioni self-service della Piattaforma.</li>
              </ul>
            </div>
          </section>

          {/* 2. Come si attiva la procedura di switching */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">2. Come si attiva la procedura di switching</h2>
            <div className="text-slate-700 leading-relaxed space-y-3">
              <p>La richiesta si presenta tramite la funzione dedicata nella sezione &quot;Il mio account&quot; oppure via e-mail/PEC a rescuemanager@legalmail.it, indicando la destinazione della migrazione (nuovo fornitore o infrastruttura propria) e la data desiderata.</p>
              <p>Tempistiche:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-200 px-3 py-2 text-left">Fase</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">Durata massima</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Preavviso dalla richiesta</td>
                      <td className="border border-slate-200 px-3 py-2">2 mesi</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Periodo di transizione (migrazione assistita, servizio attivo)</td>
                      <td className="border border-slate-200 px-3 py-2">30 giorni</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Eventuale proroga per non fattibilità tecnica (comunicata entro 14 giorni lavorativi dalla richiesta, con motivazione)</td>
                      <td className="border border-slate-200 px-3 py-2">fino a 7 mesi complessivi</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Periodo di recupero dei dati dopo la cessazione</td>
                      <td className="border border-slate-200 px-3 py-2">90 giorni</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>Durante il periodo di transizione RescueManager presta ragionevole assistenza alla migrazione e mantiene la continuità del servizio. Decorso il periodo di recupero, i dati sono cancellati in modo definitivo, salvi gli obblighi di conservazione di legge.</p>
            </div>
          </section>

          {/* 3. Categorie di dati esportabili e formati */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">3. Categorie di dati esportabili e formati</h2>
            <div className="text-slate-700 leading-relaxed space-y-3">
              <p>Sono esportabili tutti i dati di input e di output del Cliente e i metadati generati dall&apos;uso del servizio, con esclusione dei beni protetti da diritti di proprietà intellettuale del Fornitore o da segreti commerciali di terzi:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-200 px-3 py-2 text-left">Categoria</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">Formato di esportazione</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Schede veicolo (targhe, telai, acquisti, cessioni, radiazioni RVFU)</td>
                      <td className="border border-slate-200 px-3 py-2">CSV, JSON</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Anagrafiche clienti, fornitori e proprietari dei veicoli</td>
                      <td className="border border-slate-200 px-3 py-2">CSV, JSON</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Magazzino ricambi e movimenti</td>
                      <td className="border border-slate-200 px-3 py-2">CSV, JSON</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Registri di carico/scarico e FIR digitali (RENTRI)</td>
                      <td className="border border-slate-200 px-3 py-2">CSV, JSON + XML nei tracciati RENTRI ove previsti</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Fatture elettroniche</td>
                      <td className="border border-slate-200 px-3 py-2">XML (tracciato SDI) e PDF di cortesia</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Interventi di soccorso stradale (commesse, mezzi, rendicontazione)</td>
                      <td className="border border-slate-200 px-3 py-2">CSV, JSON</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Documenti e allegati caricati dal Cliente</td>
                      <td className="border border-slate-200 px-3 py-2">Formato originale di caricamento</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>Tutti i formati strutturati sono di uso comune e leggibili da dispositivo automatico. L&apos;esportazione self-service è disponibile in ogni momento dalla Piattaforma.</p>
            </div>
          </section>

          {/* 4. Costi di switching */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">4. Costi di switching</h2>
            <div className="text-slate-700 leading-relaxed">
              <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                <li>Esportazione self-service dei dati: <strong>gratuita, sempre</strong>.</li>
                <li>Operazioni di switching assistite: fino all&apos;11 gennaio 2027 possono essere addebitati esclusivamente i costi effettivamente sostenuti da RescueManager, comunicati al Cliente prima dell&apos;avvio; <strong>dal 12 gennaio 2027 nessun costo di switching sarà addebitato</strong>.</li>
                <li>Non sono previste penali di uscita; restano dovuti i soli corrispettivi maturati fino alla cessazione (art. 10.5 dei Termini e Condizioni).</li>
              </ul>
            </div>
          </section>

          {/* 5. Infrastruttura ICT e giurisdizione (art. 28 Data Act) */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">5. Infrastruttura ICT e giurisdizione (art. 28 Data Act)</h2>
            <div className="text-slate-700 leading-relaxed space-y-3">
              <p>Il Servizio è erogato tramite i seguenti fornitori di infrastruttura:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-200 px-3 py-2 text-left">Fornitore</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">Ruolo</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">Giurisdizione dell&apos;infrastruttura</th>
                      <th className="border border-slate-200 px-3 py-2 text-left">Garanzie</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Vercel Inc.</td>
                      <td className="border border-slate-200 px-3 py-2">Hosting sito web e frontend</td>
                      <td className="border border-slate-200 px-3 py-2">USA</td>
                      <td className="border border-slate-200 px-3 py-2">EU-U.S. DPF + SCC; SOC 2 Type 2, ISO 27001</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">IONOS SE</td>
                      <td className="border border-slate-200 px-3 py-2">Hosting API e backend</td>
                      <td className="border border-slate-200 px-3 py-2">Germania (UE/SEE), nessun trasferimento extra-UE</td>
                      <td className="border border-slate-200 px-3 py-2">ISO 27001</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Supabase, Inc.</td>
                      <td className="border border-slate-200 px-3 py-2">Database e autenticazione</td>
                      <td className="border border-slate-200 px-3 py-2">USA / UE</td>
                      <td className="border border-slate-200 px-3 py-2">SCC; SOC 2 Type 2</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">Stripe Payments Europe, Ltd.</td>
                      <td className="border border-slate-200 px-3 py-2">Pagamenti con carta</td>
                      <td className="border border-slate-200 px-3 py-2">Irlanda (UE)</td>
                      <td className="border border-slate-200 px-3 py-2">PCI-DSS Level 1</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 px-3 py-2">GoCardless</td>
                      <td className="border border-slate-200 px-3 py-2">Addebiti diretti SEPA (SDD)</td>
                      <td className="border border-slate-200 px-3 py-2">Regno Unito (decisione di adeguatezza UE)</td>
                      <td className="border border-slate-200 px-3 py-2">ISO 27001, FCA/CRD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4">
                <p>
                  <strong>Misure contro accessi governativi illeciti di Paesi terzi ai dati non personali</strong> (art. 28, par. 1, lett. b, Data Act): cifratura dei dati in transito (TLS 1.3) e a riposo (AES-256); vincoli contrattuali con i sub-fornitori (SCC, DPF, DPA ex art. 28 GDPR); impegno a contestare, nei limiti di legge, le richieste di accesso di autorità di Paesi terzi in conflitto con il diritto dell&apos;Unione o nazionale e a informare il Cliente ove legalmente possibile; minimizzazione dei dati trattati su infrastrutture extra-UE.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Interoperabilità e restrizioni note */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">6. Interoperabilità e restrizioni note</h2>
            <div className="text-slate-700 leading-relaxed">
              <p>RescueManager utilizza formati aperti e documentati per l&apos;esportazione. Restrizioni note: le fatture elettroniche sono vincolate al tracciato XML SDI previsto dalla normativa italiana; i tracciati RENTRI seguono gli standard tecnici pubblicati dall&apos;Albo Gestori Ambientali/RENTRI; la reimportazione dei dati presso altri fornitori dipende dai formati da questi supportati.</p>
            </div>
          </section>

          {/* 7. Contatti */}
          <section className="bg-white border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">7. Contatti</h2>
            <div className="text-slate-700 leading-relaxed">
              <p>Per ogni richiesta relativa a portabilità, switching o alla presente pagina: rescuemanager@legalmail.it — oggetto &quot;Switching Data Act&quot;.</p>
            </div>
          </section>

          {/* Blocco Contatti — Titolare */}
          <div className="bg-[#0f172a] p-6 text-white">
            <h3 className="font-bold text-lg mb-4">Titolare del Trattamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Società</p>
                <p className="font-semibold">RescueManager S.r.l.</p>
                <p className="text-slate-300">P.IVA 02176370852</p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Recapiti</p>
                <p>Via dello Smeraldo 18, 93012 Gela (CL)</p>
                <p><a href="mailto:rescuemanager@legalmail.it" className="text-slate-200 hover:text-white underline">rescuemanager@legalmail.it</a></p>
                <p><a href="https://www.rescuemanager.eu" className="text-slate-200 hover:text-white underline" target="_blank" rel="noopener noreferrer">www.rescuemanager.eu</a></p>
              </div>
            </div>
          </div>

          {/* Link altre policy */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/privacy-policy" className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5">Privacy Policy</a>
            <a href="/cookie-policy" className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5">Cookie Policy</a>
            <a href="/terms-of-use" className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5">Termini e Condizioni</a>
            <a href="/dpa" className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 px-3 py-1.5">Data Processing Agreement</a>
          </div>

        </div>
      </div>
    </div>
  );
}
