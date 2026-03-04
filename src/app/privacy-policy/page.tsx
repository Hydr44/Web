// src/app/privacy-policy/page.tsx
import { Shield, Eye, Lock, Database, Users, Globe, AlertTriangle } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-[#0f172a] pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 text-sm rounded-full border border-blue-500/30 px-4 py-2 mb-6 bg-blue-500/10 text-blue-400 font-medium">
            <Shield className="h-4 w-4" />
            Documento II — Privacy Policy
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Informativa sulla Privacy
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Informativa sul trattamento dei dati personali ex artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR)
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500">
            <span>Versione 3.0</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>In vigore dal 23 febbraio 2026</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span>GDPR Conforme</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">

        {/* Premessa */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm text-blue-900 leading-relaxed">
            La presente Informativa descrive le modalità con cui <strong>Emmanuel Salvatore Scozzarini</strong>, libero professionista operante sotto il nome commerciale <strong>RescueManager</strong> (di seguito &quot;Titolare&quot;), tratta i dati personali degli utenti e dei rappresentanti delle aziende clienti che accedono e utilizzano la Piattaforma RescueManager, in conformità al Regolamento (UE) 2016/679 (GDPR), al D.Lgs. 30 giugno 2003, n. 196 (Codice Privacy) come modificato dal D.Lgs. 101/2018, e a ogni altra normativa applicabile.
          </p>
        </div>

        <div className="space-y-6">

          {/* 1. Titolare del Trattamento */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">1. Titolare del Trattamento e Dati di Contatto</h2>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-lg p-5 text-sm space-y-2">
              <p><strong>Titolare del Trattamento:</strong> Emmanuel Salvatore Scozzarini</p>
              <p><strong>Nome commerciale:</strong> RescueManager</p>
              <p><strong>Qualifica:</strong> Libero Professionista / Imprenditore Individuale</p>
              <p><strong>Domicilio Professionale:</strong> Via dello Smeraldo 18, Gela (CL), Sicilia</p>
              <p><strong>Partita IVA:</strong> 02166430856</p>
              <p><strong>Indirizzo e-mail (PEC):</strong> <a href="mailto:rescuemanager@legalmail.it" className="text-blue-600 hover:underline">rescuemanager@legalmail.it</a></p>
              <p><strong>Sito web:</strong> <a href="https://www.rescuemanager.eu" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">www.rescuemanager.eu</a></p>
            </div>
            <p className="text-xs text-gray-500 mt-3">Il Titolare del Trattamento è una persona fisica; gestisce direttamente le richieste relative alla protezione dei dati personali.</p>
          </section>

          {/* 2. Dati Personali Raccolti */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-purple-600/10 flex items-center justify-center flex-shrink-0">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">2. Dati Personali Raccolti e Trattati</h2>
            </div>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">2.1 Dati dei Referenti e Rappresentanti del Cliente (raccolti direttamente)</h3>
              <ul className="list-disc list-inside space-y-1 ml-3">
                <li><strong>Dati identificativi e anagrafici:</strong> nome, cognome, qualifica professionale, ruolo aziendale</li>
                <li><strong>Dati di contatto:</strong> indirizzo e-mail professionale, numero di telefono</li>
                <li><strong>Dati fiscali e societari:</strong> denominazione sociale, P. IVA, codice fiscale, indirizzo sede legale e operativa, codice destinatario SDI o PEC</li>
                <li><strong>Dati di pagamento:</strong> gestiti in forma pseudonimizzata tramite Stripe; il Titolare non archivia dati della carta di credito in chiaro</li>
                <li><strong>Dati di accesso:</strong> username, password (conservata in forma crittografata), registro degli accessi</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">2.2 Dati Tecnici (raccolti automaticamente)</h3>
              <ul className="list-disc list-inside space-y-1 ml-3">
                <li>Indirizzo IP e dati di connessione alla Piattaforma</li>
                <li>Log di accesso e di utilizzo: timestamp, azioni effettuate, sessioni utente</li>
                <li>Informazioni sul dispositivo e browser: sistema operativo, browser, risoluzione schermo, lingua</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-4">2.3 Dati Inseriti dal Cliente nella Piattaforma</h3>
              <p>Per i dati che il Cliente inserisce nella Piattaforma nell&apos;esercizio della propria attività (dati dei proprietari dei veicoli, dei dipendenti, dei clienti/fornitori, delle pratiche RENTRI/RVFU), il Titolare agisce in qualità di <strong>Responsabile del Trattamento</strong> per conto del Cliente, che rimane Titolare del Trattamento ai sensi dell&apos;art. 4, n. 7, GDPR. Tale rapporto è disciplinato dal <a href="/dpa" className="text-blue-600 hover:underline">Data Processing Agreement (DPA)</a>.</p>
            </div>
          </section>

          {/* 3. Finalità e Basi Giuridiche */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-green-600/10 flex items-center justify-center flex-shrink-0">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">3. Finalità e Basi Giuridiche del Trattamento</h2>
            </div>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="font-semibold text-blue-900 mb-2">3.1 Esecuzione del Contratto — Art. 6(1)(b) GDPR</p>
                  <p className="text-blue-800 text-xs">Attivazione, gestione ed erogazione del Servizio SaaS; fatturazione; supporto tecnico; comunicazioni operative (aggiornamenti, manutenzioni, notifiche di rinnovo).</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <p className="font-semibold text-green-900 mb-2">3.2 Adempimento di Obblighi Legali — Art. 6(1)(c) GDPR</p>
                  <p className="text-green-800 text-xs">Normativa fiscale e contabile (fatturazione elettronica tramite SDI, conservazione per legge), normativa anti-riciclaggio (D.Lgs. 231/2007), obblighi informativi (D.Lgs. 70/2003).</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                  <p className="font-semibold text-purple-900 mb-2">3.3 Legittimo Interesse del Titolare — Art. 6(1)(f) GDPR</p>
                  <p className="text-purple-800 text-xs">Sicurezza informatica (monitoraggio accessi, incident response); analisi aggregate anonime per miglioramento del Servizio; accertamento e tutela dei diritti in sede giudiziaria.</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                  <p className="font-semibold text-orange-900 mb-2">3.4 Consenso — Art. 6(1)(a) GDPR</p>
                  <p className="text-orange-800 text-xs">Per finalità di marketing diretto e comunicazioni promozionali, previo consenso esplicito e separato. Il consenso può essere revocato in qualsiasi momento.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Destinatari e Sub-responsabili */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/10 flex items-center justify-center flex-shrink-0">
                <Globe className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">4. Destinatari, Sub-responsabili e Trasferimento dei Dati</h2>
            </div>
            <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
              <h3 className="font-semibold text-gray-900">4.1 Categorie di Destinatari</h3>
              <ul className="list-disc list-inside space-y-1 ml-3">
                <li>Sub-responsabili del trattamento (fornitori tecnici, nominati ex art. 28 GDPR)</li>
                <li>Autorità pubbliche: Agenzia delle Entrate (SDI), autorità ambientali (RENTRI/RVFU), forze dell&apos;ordine, autorità giudiziaria</li>
                <li>Consulenti professionali del Titolare (avvocati, commercialisti), vincolati al segreto professionale</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mt-5">4.2 Sub-responsabili del Trattamento</h3>
              <div className="space-y-3">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Vercel Inc.</span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">USA — Trasferimento extra-UE</span>
                  </div>
                  <div className="px-4 py-3 text-xs space-y-1">
                    <p><strong>Ruolo:</strong> Hosting sito web e frontend della Piattaforma</p>
                    <p><strong>Sede:</strong> 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
                    <p><strong>Garanzia trasferimento:</strong> EU-U.S. Data Privacy Framework (DPF) + Clausole Contrattuali Standard (SCC)</p>
                    <p><strong>Certificazioni:</strong> SOC 2 Type 2, ISO 27001</p>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">IONOS SE</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Germania — Solo UE/SEE</span>
                  </div>
                  <div className="px-4 py-3 text-xs space-y-1">
                    <p><strong>Ruolo:</strong> Hosting API e backend applicativo</p>
                    <p><strong>Sede:</strong> Elgendorfer Str. 57, 56410 Montabaur, Germania — HRB 24498</p>
                    <p><strong>Localizzazione dati:</strong> Esclusivamente all&apos;interno dello Spazio Economico Europeo (SEE), nessun trasferimento verso Paesi terzi</p>
                    <p><strong>Certificazioni:</strong> ISO 27001</p>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Supabase, Inc.</span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">USA/EU — SCC</span>
                  </div>
                  <div className="px-4 py-3 text-xs space-y-1">
                    <p><strong>Ruolo:</strong> Database e autenticazione degli utenti</p>
                    <p><strong>Garanzia trasferimento:</strong> Clausole Contrattuali Standard (SCC)</p>
                    <p><strong>Certificazioni:</strong> SOC 2 Type 2</p>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Stripe Payments Europe, Ltd.</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Irlanda — Solo UE</span>
                  </div>
                  <div className="px-4 py-3 text-xs space-y-1">
                    <p><strong>Ruolo:</strong> Elaborazione pagamenti</p>
                    <p><strong>Sede:</strong> 1 Grand Canal Street Lower, Dublin 2, Irlanda (UE)</p>
                    <p><strong>Localizzazione dati:</strong> Unione Europea, nessun trasferimento verso Paesi terzi</p>
                    <p><strong>Certificazioni:</strong> PCI-DSS Level 1</p>
                  </div>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mt-5">4.3 Riepilogo Trasferimenti Dati verso Paesi Terzi</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 rounded-lg text-xs">
                  <thead><tr className="bg-gray-50"><th className="border border-gray-200 px-3 py-2 text-left">Sub-responsabile</th><th className="border border-gray-200 px-3 py-2 text-left">Sede</th><th className="border border-gray-200 px-3 py-2 text-left">Trasferimento extra-UE</th><th className="border border-gray-200 px-3 py-2 text-left">Garanzia</th></tr></thead>
                  <tbody>
                    <tr><td className="border border-gray-200 px-3 py-2">Vercel Inc.</td><td className="border border-gray-200 px-3 py-2">USA</td><td className="border border-gray-200 px-3 py-2 text-orange-600">Sì (hosting frontend)</td><td className="border border-gray-200 px-3 py-2">EU-U.S. DPF + SCC</td></tr>
                    <tr><td className="border border-gray-200 px-3 py-2">IONOS SE</td><td className="border border-gray-200 px-3 py-2">Germania (UE)</td><td className="border border-gray-200 px-3 py-2 text-green-600">No</td><td className="border border-gray-200 px-3 py-2">Trattamento in SEE</td></tr>
                    <tr><td className="border border-gray-200 px-3 py-2">Supabase, Inc.</td><td className="border border-gray-200 px-3 py-2">USA / EU</td><td className="border border-gray-200 px-3 py-2 text-orange-600">Sì (configurazione)</td><td className="border border-gray-200 px-3 py-2">SCC</td></tr>
                    <tr><td className="border border-gray-200 px-3 py-2">Stripe Payments Europe</td><td className="border border-gray-200 px-3 py-2">Irlanda (UE)</td><td className="border border-gray-200 px-3 py-2 text-green-600">No</td><td className="border border-gray-200 px-3 py-2">Trattamento in UE</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 5. Periodo di Conservazione */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-teal-600/10 flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">5. Periodo di Conservazione dei Dati</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 rounded-lg text-sm">
                <thead><tr className="bg-gray-50"><th className="border border-gray-200 px-3 py-2 text-left">Categoria di dato</th><th className="border border-gray-200 px-3 py-2 text-left">Periodo di conservazione</th></tr></thead>
                <tbody>
                  <tr><td className="border border-gray-200 px-3 py-2">Dati contrattuali e di fatturazione</td><td className="border border-gray-200 px-3 py-2">10 anni dalla cessazione (obbligo fiscale ex D.P.R. 600/1973 e 633/1972)</td></tr>
                  <tr><td className="border border-gray-200 px-3 py-2">Dati di accesso e log di sistema (sicurezza)</td><td className="border border-gray-200 px-3 py-2">12 mesi dalla registrazione del log</td></tr>
                  <tr><td className="border border-gray-200 px-3 py-2">Dati di traffico (fatturazione)</td><td className="border border-gray-200 px-3 py-2">6 mesi (art. 123, D.Lgs. 196/2003)</td></tr>
                  <tr><td className="border border-gray-200 px-3 py-2">Dati per marketing (con consenso)</td><td className="border border-gray-200 px-3 py-2">Fino alla revoca del consenso o 24 mesi dall&apos;ultimo contatto</td></tr>
                  <tr><td className="border border-gray-200 px-3 py-2">Dati del periodo di prova (mancata conversione)</td><td className="border border-gray-200 px-3 py-2">30 giorni dalla scadenza del periodo di prova</td></tr>
                  <tr><td className="border border-gray-200 px-3 py-2">Dati inseriti dal Cliente nella Piattaforma</td><td className="border border-gray-200 px-3 py-2">90 giorni dalla cessazione del contratto, poi cancellazione definitiva</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-3">Alla scadenza dei termini, i dati sono cancellati o anonimizzati in modo irreversibile.</p>
          </section>

          {/* 6. Diritti dell'Interessato */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-orange-600/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">6. Diritti dell&apos;Interessato</h2>
            </div>
            <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
              <p>Ai sensi degli artt. 15-22 del GDPR, l&apos;interessato ha il diritto di:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { art: "Art. 15", name: "Accesso", desc: "Ottenere conferma dell'esistenza di un trattamento e accedere ai propri dati" },
                  { art: "Art. 16", name: "Rettifica", desc: "Ottenere la rettifica dei dati inesatti o l'integrazione di quelli incompleti" },
                  { art: "Art. 17", name: "Cancellazione", desc: "Ottenere la cancellazione dei propri dati nei casi previsti (\"diritto all'oblio\")" },
                  { art: "Art. 18", name: "Limitazione", desc: "Ottenere la limitazione del trattamento nei casi previsti dalla legge" },
                  { art: "Art. 20", name: "Portabilità", desc: "Ricevere i propri dati in formato strutturato, leggibile da dispositivo automatico" },
                  { art: "Art. 21", name: "Opposizione", desc: "Opporsi al trattamento basato sul legittimo interesse del Titolare" },
                  { art: "Art. 7", name: "Revoca consenso", desc: "Revocare in qualsiasi momento il consenso prestato, senza effetto retroattivo" },
                ].map((d) => (
                  <div key={d.art} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">{d.art}</span>
                      <span className="font-semibold text-gray-900 text-sm">{d.name}</span>
                    </div>
                    <p className="text-xs text-gray-600">{d.desc}</p>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                <p className="text-sm text-blue-900">Per esercitare i tuoi diritti: <a href="mailto:rescuemanager@legalmail.it" className="font-semibold hover:underline">rescuemanager@legalmail.it</a>. Risposta entro 30 giorni (prorogabili a 90 in caso di complessità). Hai altresì il diritto di proporre reclamo al <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">Garante per la Protezione dei Dati Personali</a>.</p>
              </div>
            </div>
          </section>

          {/* Alert sicurezza misure */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-red-600/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">7. Misure di Sicurezza</h2>
            </div>
            <div className="text-gray-700 space-y-2 text-sm leading-relaxed">
              <p>Il Titolare adotta le seguenti misure di sicurezza ai sensi dell&apos;art. 32 GDPR:</p>
              <ul className="list-disc list-inside space-y-1 ml-3">
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
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-xl p-6 text-white">
            <h3 className="font-bold text-lg mb-4">Contatti per Questioni relative alla Privacy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Titolare del Trattamento</p>
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
            <a href="/cookie-policy" className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50">Cookie Policy</a>
            <a href="/dpa" className="text-sm text-blue-600 hover:underline border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50">Data Processing Agreement</a>
          </div>

        </div>
      </div>
    </div>
  );
}
