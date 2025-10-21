// src/app/privacy-policy/page.tsx
import { Shield, Eye, Lock, Database, Users, Mail, Phone } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50/50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-sm rounded-full ring-1 ring-primary/30 px-4 py-2 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
            <Shield className="h-4 w-4" />
            Privacy Policy
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Privacy Policy</span>
          </h1>
          
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            La tua privacy è importante per noi. Questa policy spiega come raccogliamo, utilizziamo e proteggiamo le tue informazioni personali.
          </p>
          
          <div className="mt-6 text-sm text-gray-500">
            Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
          </div>
        </div>

        {/* Contenuto */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            
            {/* 1. Introduzione */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">1. Introduzione</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>
                  RescueManager ("noi", "nostro" o "l'azienda") si impegna a proteggere la privacy e la sicurezza delle informazioni personali dei nostri utenti. Questa Privacy Policy descrive come raccogliamo, utilizziamo, conserviamo e proteggiamo le tue informazioni quando utilizzi i nostri servizi.
                </p>
                <p>
                  Utilizzando i nostri servizi, accetti le pratiche descritte in questa Privacy Policy. Se non sei d'accordo con questa policy, ti preghiamo di non utilizzare i nostri servizi.
                </p>
              </div>
            </section>

            {/* 2. Informazioni che raccogliamo */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Database className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">2. Informazioni che Raccogliamo</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">2.1 Informazioni fornite direttamente</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Nome e cognome</li>
                  <li>Indirizzo email</li>
                  <li>Numero di telefono</li>
                  <li>Informazioni aziendali (nome azienda, partita IVA, indirizzo)</li>
                  <li>Informazioni di fatturazione</li>
                  <li>Password e credenziali di accesso</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">2.2 Informazioni raccolte automaticamente</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Indirizzo IP e informazioni di geolocalizzazione</li>
                  <li>Tipo di browser e sistema operativo</li>
                  <li>Pagine visitate e tempo trascorso sul sito</li>
                  <li>Informazioni sui dispositivi utilizzati</li>
                  <li>Cookie e tecnologie simili</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">2.3 Informazioni sui servizi</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Dati sui veicoli e autisti gestiti</li>
                  <li>Informazioni sui trasporti e demolizioni</li>
                  <li>Dati di fatturazione elettronica</li>
                  <li>Log delle attività e utilizzo del sistema</li>
                </ul>
              </div>
            </section>

            {/* 3. Come utilizziamo le informazioni */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">3. Come Utilizziamo le Tue Informazioni</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>Utilizziamo le tue informazioni per:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fornire e migliorare i nostri servizi</li>
                  <li>Gestire il tuo account e le tue preferenze</li>
                  <li>Processare pagamenti e fatturazione</li>
                  <li>Comunicare con te riguardo ai nostri servizi</li>
                  <li>Fornire supporto tecnico e assistenza clienti</li>
                  <li>Rispettare obblighi legali e normativi</li>
                  <li>Prevenire frodi e garantire la sicurezza</li>
                  <li>Analizzare l'utilizzo dei servizi per miglioramenti</li>
                </ul>
              </div>
            </section>

            {/* 4. Condivisione delle informazioni */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">4. Condivisione delle Informazioni</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>Non vendiamo, affittiamo o condividiamo le tue informazioni personali con terze parti, eccetto nei seguenti casi:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Fornitori di servizi:</strong> Condividiamo informazioni con fornitori fidati che ci aiutano a fornire i nostri servizi</li>
                  <li><strong>Obblighi legali:</strong> Quando richiesto da legge o autorità competenti</li>
                  <li><strong>Protezione dei diritti:</strong> Per proteggere i nostri diritti, proprietà o sicurezza</li>
                  <li><strong>Consenso:</strong> Quando hai dato il tuo consenso esplicito</li>
                </ul>
              </div>
            </section>

            {/* 5. Sicurezza */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-red-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">5. Sicurezza dei Dati</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>Implementiamo misure di sicurezza appropriate per proteggere le tue informazioni:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Crittografia SSL/TLS per tutte le comunicazioni</li>
                  <li>Crittografia dei dati sensibili a riposo</li>
                  <li>Accesso limitato alle informazioni personali</li>
                  <li>Monitoraggio continuo della sicurezza</li>
                  <li>Backup regolari e sistemi di recupero</li>
                  <li>Formazione del personale sulla privacy</li>
                </ul>
              </div>
            </section>

            {/* 6. I tuoi diritti */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-orange-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">6. I Tuoi Diritti</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>Hai i seguenti diritti riguardo alle tue informazioni personali:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Accesso:</strong> Richiedere una copia delle tue informazioni</li>
                  <li><strong>Rettifica:</strong> Correggere informazioni inesatte o incomplete</li>
                  <li><strong>Cancellazione:</strong> Richiedere la cancellazione delle tue informazioni</li>
                  <li><strong>Limitazione:</strong> Limitare l'elaborazione delle tue informazioni</li>
                  <li><strong>Portabilità:</strong> Ricevere le tue informazioni in formato strutturato</li>
                  <li><strong>Opposizione:</strong> Opporti all'elaborazione delle tue informazioni</li>
                </ul>
                <p className="mt-4">
                  Per esercitare questi diritti, contattaci all'indirizzo: <a href="mailto:privacy@rescuemanager.it" className="text-primary hover:underline">privacy@rescuemanager.it</a>
                </p>
              </div>
            </section>

            {/* 7. Cookie */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">7. Cookie e Tecnologie Simili</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>
                  Utilizziamo cookie e tecnologie simili per migliorare la tua esperienza. Per maggiori dettagli, consulta la nostra <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>.
                </p>
              </div>
            </section>

            {/* 8. Modifiche */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-gray-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">8. Modifiche a Questa Policy</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>
                  Potremmo aggiornare questa Privacy Policy periodicamente. Ti notificheremo eventuali modifiche significative tramite email o attraverso i nostri servizi. Ti consigliamo di rivedere questa policy regolarmente.
                </p>
              </div>
            </section>

            {/* 9. Contatti */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">9. Contatti</h2>
              </div>
              <div className="text-gray-700 space-y-4">
                <p>Per domande riguardo a questa Privacy Policy, contattaci:</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p><strong>Email:</strong> <a href="mailto:privacy@rescuemanager.it" className="text-primary hover:underline">privacy@rescuemanager.it</a></p>
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
