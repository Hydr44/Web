// src/app/terms-of-use/page.tsx
import { FileText, Shield, CreditCard, Users, AlertTriangle, Scale, Phone } from "lucide-react";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
            <FileText className="h-4 w-4" />
            Termini d'Uso
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Termini d'Uso</span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Questi Termini d'Uso regolano l'utilizzo dei servizi RescueManager. Leggili attentamente prima di utilizzare i nostri servizi.
          </p>
          
          <div className="mt-6 text-sm text-gray-500">
            Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
          </div>
        </div>

        {/* Contenuto */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            
            {/* 1. Accettazione dei termini */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">1. Accettazione dei Termini</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>
                  Benvenuto su RescueManager. Questi Termini d'Uso ("Termini") costituiscono un accordo legale tra te ("Utente" o "Cliente") e RescueManager ("noi", "nostro" o "l'Azienda") riguardo all'utilizzo dei nostri servizi.
                </p>
                <p>
                  Utilizzando i nostri servizi, accetti di essere vincolato da questi Termini. Se non accetti questi Termini, ti preghiamo di non utilizzare i nostri servizi.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 font-medium">
                    <strong>Importante:</strong> Questi Termini si applicano a tutti gli utenti dei nostri servizi, inclusi i clienti con abbonamenti a pagamento.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Descrizione dei servizi */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">2. Descrizione dei Servizi</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>RescueManager fornisce servizi software per la gestione di officine di soccorso stradale, inclusi:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Gestione della flotta veicoli</li>
                  <li>Coordinamento degli autisti</li>
                  <li>Gestione dei trasporti e demolizioni RVFU</li>
                  <li>Fatturazione elettronica</li>
                  <li>App mobile per autisti</li>
                  <li>Magazzino ricambi</li>
                  <li>Piazzale auto</li>
                  <li>Gestione clienti e reportistica</li>
                </ul>
                <p>
                  I servizi sono forniti tramite piattaforma web, applicazioni desktop e mobile, e possono includere supporto tecnico e aggiornamenti.
                </p>
              </div>
            </section>

            {/* 3. Registrazione e account */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">3. Registrazione e Account</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">3.1 Creazione Account</h3>
                <p>Per utilizzare i nostri servizi, devi:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fornire informazioni accurate e complete</li>
                  <li>Mantenere aggiornate le tue informazioni</li>
                  <li>Essere maggiorenne o avere il consenso dei genitori</li>
                  <li>Creare una password sicura</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">3.2 Responsabilità dell'Account</h3>
                <p>Sei responsabile di:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Mantenere la sicurezza del tuo account</li>
                  <li>Tutte le attività che avvengono nel tuo account</li>
                  <li>Notificarci immediatamente di qualsiasi uso non autorizzato</li>
                  <li>Garantire che le informazioni fornite siano accurate</li>
                </ul>
              </div>
            </section>

            {/* 4. Pagamenti e fatturazione */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">4. Pagamenti e Fatturazione</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">4.1 Piani di Abbonamento</h3>
                <p>Offriamo diversi piani di abbonamento:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Starter:</strong> Piano base per piccole officine</li>
                  <li><strong>Flotta:</strong> Piano completo per officine medie</li>
                  <li><strong>Enterprise:</strong> Piano avanzato per grandi aziende</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">4.2 Pagamenti</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>I pagamenti sono dovuti in anticipo</li>
                  <li>Accettiamo pagamenti tramite carta di credito e bonifico</li>
                  <li>I prezzi sono espressi in euro e includono IVA</li>
                  <li>I prezzi possono essere modificati con preavviso di 30 giorni</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">4.3 Rinnovo Automatico</h3>
                <p>
                  Gli abbonamenti si rinnovano automaticamente alla scadenza, a meno che non vengano disdetti con almeno 30 giorni di preavviso.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">4.4 Rimborsi</h3>
                <p>
                  I rimborsi sono disponibili entro 14 giorni dall'acquisto, purché il servizio non sia stato utilizzato in modo significativo.
                </p>
              </div>
            </section>

            {/* 5. Uso accettabile */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">5. Uso Accettabile</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">5.1 Uso Consentito</h3>
                <p>Puoi utilizzare i nostri servizi per:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Gestire la tua attività di soccorso stradale</li>
                  <li>Coordinare veicoli e autisti</li>
                  <li>Gestire clienti e fatturazione</li>
                  <li>Utilizzare le funzionalità previste dal tuo piano</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">5.2 Uso Proibito</h3>
                <p>È vietato utilizzare i nostri servizi per:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Attività illegali o fraudolente</li>
                  <li>Violare diritti di proprietà intellettuale</li>
                  <li>Interferire con il funzionamento dei servizi</li>
                  <li>Creare account falsi o multipli</li>
                  <li>Distribuire malware o contenuti dannosi</li>
                  <li>Spam o comunicazioni non autorizzate</li>
                </ul>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800 font-medium">
                    <strong>Violazione:</strong> La violazione di questi termini può comportare la sospensione o la cancellazione del tuo account.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Proprietà intellettuale */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Scale className="h-4 w-4 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">6. Proprietà Intellettuale</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">6.1 Nostra Proprietà</h3>
                <p>
                  Tutti i diritti di proprietà intellettuale sui nostri servizi, inclusi software, design, marchi e contenuti, appartengono a RescueManager o ai nostri licenzianti.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">6.2 Licenza d'Uso</h3>
                <p>
                  Ti concediamo una licenza limitata, non esclusiva e non trasferibile per utilizzare i nostri servizi secondo questi Termini.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">6.3 I Tuoi Dati</h3>
                <p>
                  Mantieni la proprietà dei tuoi dati. Ti concediamo il diritto di esportare i tuoi dati in qualsiasi momento.
                </p>
              </div>
            </section>

            {/* 7. Privacy e protezione dati */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">7. Privacy e Protezione Dati</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>
                  La raccolta e l'utilizzo delle tue informazioni personali sono regolati dalla nostra <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>, che fa parte integrante di questi Termini.
                </p>
                <p>
                  Ci impegniamo a proteggere i tuoi dati secondo il GDPR e le normative italiane sulla privacy.
                </p>
              </div>
            </section>

            {/* 8. Limitazione di responsabilità */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">8. Limitazione di Responsabilità</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ Disclaimer</h3>
                  <p className="text-yellow-700">
                    I nostri servizi sono forniti "così come sono". Non garantiamo che i servizi siano privi di errori o interruzioni.
                  </p>
                </div>
                
                <p>La nostra responsabilità è limitata nei seguenti casi:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Interruzioni temporanee del servizio</li>
                  <li>Perdita di dati dovuta a cause di forza maggiore</li>
                  <li>Danni indiretti o consequenziali</li>
                  <li>Perdita di profitti o opportunità commerciali</li>
                </ul>

                <p>
                  La nostra responsabilità totale non supererà l'importo pagato per i servizi nei 12 mesi precedenti all'evento che ha causato il danno.
                </p>
              </div>
            </section>

            {/* 9. Sospensione e cancellazione */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">9. Sospensione e Cancellazione</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">9.1 Cancellazione da Parte Tua</h3>
                <p>
                  Puoi cancellare il tuo account in qualsiasi momento tramite le impostazioni del tuo profilo o contattando il supporto.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">9.2 Sospensione da Parte Nostra</h3>
                <p>Possiamo sospendere o cancellare il tuo account se:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violi questi Termini</li>
                  <li>Non paghi le fatture</li>
                  <li>Utilizzi i servizi in modo improprio</li>
                  <li>Richiediamo di farlo per motivi legali</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">9.3 Effetti della Cancellazione</h3>
                <p>
                  Alla cancellazione, perderai l'accesso ai servizi e i tuoi dati potrebbero essere cancellati dopo un periodo di grazia di 30 giorni.
                </p>
              </div>
            </section>

            {/* 10. Modifiche ai termini */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">10. Modifiche ai Termini</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>
                  Possiamo modificare questi Termini periodicamente. Le modifiche significative saranno comunicate tramite email o attraverso i nostri servizi con almeno 30 giorni di preavviso.
                </p>
                <p>
                  L'utilizzo continuato dei servizi dopo le modifiche costituisce accettazione dei nuovi Termini.
                </p>
              </div>
            </section>

            {/* 11. Legge applicabile */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Scale className="h-4 w-4 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">11. Legge Applicabile e Foro</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>
                  Questi Termini sono regolati dalla legge italiana. Qualsiasi controversia sarà di competenza esclusiva del Tribunale di Milano.
                </p>
                <p>
                  Prima di intraprendere azioni legali, le parti si impegnano a tentare una risoluzione amichevole della controversia.
                </p>
              </div>
            </section>

            {/* 12. Contatti */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">12. Contatti</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>Per domande riguardo a questi Termini d'Uso, contattaci:</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p><strong>Email:</strong> <a href="mailto:legal@rescuemanager.it" className="text-primary hover:underline">legal@rescuemanager.it</a></p>
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
