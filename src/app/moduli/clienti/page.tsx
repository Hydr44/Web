import Link from "next/link";
import { ArrowLeft, Users, Phone, TrendingUp, History, ArrowRight } from "lucide-react";

export default function ClientiPage() {
  return (
    <main className="bg-white">
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">App Base</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            Clienti & CRM<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Anagrafica completa, storico servizi, preventivi e fatture. Tutto in un unico posto per privati, assicurazioni e aziende.
          </p>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Un cliente, tutta la sua storia</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                In un'autodemolizione passano decine di clienti diversi: privati che portano un'auto da rottamare, assicurazioni che mandano richieste di soccorso, officine che cercano ricambi, aziende con flotte intere. Senza un registro organizzato, ogni chiamata parte da zero — chi è questo cliente? ha già fatto interventi con noi? c'è qualcosa da ricordare?
              </p>
              <p className="text-gray-600 leading-relaxed">
                Il modulo Clienti crea una scheda unica per ogni soggetto: dati anagrafici, contatti, storico completo di tutti gli interventi, preventivi e fatture emesse. Ogni volta che arriva una chiamata, apri la scheda e hai tutto davanti in 5 secondi.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border-l-4 border-red-400">
                <p className="text-sm font-semibold text-gray-900">Il problema comune</p>
                <p className="text-sm text-gray-600 mt-1">Il numero è salvato sul telefono, i dati fiscali sono su un foglio, l'ultimo intervento lo ricordi a memoria. Se manca il titolare, nessuno sa niente.</p>
              </div>
              <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-gray-900">Con il gestionale</p>
                <p className="text-sm text-gray-600 mt-1">Ogni operatore vede nome, numero, P.IVA, indirizzo, note, storico completo degli interventi e fatturato totale — aggiornato in tempo reale da chiunque del team.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nella scheda cliente</h2>
          <p className="text-gray-500 text-center mb-10">Tutte le informazioni in un posto solo, accessibili da qualsiasi postazione.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <Users className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Anagrafica completa</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Nome e cognome o ragione sociale, codice fiscale e Partita IVA, indirizzo completo, telefono, email e PEC. Puoi indicare se è un privato, un'assicurazione o un'azienda, così da applicare tariffe e condizioni diverse. I dati fiscali sono già pronti quando devi emettere una fattura — non devi cercarli ogni volta.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Phone className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Contatti multipli e referenti</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Per ogni cliente puoi salvare più numeri di telefono, più email e più referenti con ruoli diversi. Molto utile per le assicurazioni (hanno un referente sinistri, uno per i preventivi, uno per la fatturazione) o per le aziende con più sedi. Non serve più cercare il contatto giusto in rubrica — è tutto nella scheda.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <History className="h-6 w-6 text-purple-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Storico completo degli interventi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Nella scheda cliente vedi in ordine cronologico tutti i trasporti effettuati, i preventivi inviati con il loro stato (accettato, rifiutato, in attesa), le fatture emesse e le note interne. Se un cliente contesta un intervento di sei mesi fa, in 10 secondi hai tutto davanti. Il sistema non dimentica niente e non perde nessun dato.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <TrendingUp className="h-6 w-6 text-red-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Statistiche e valore cliente</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Per ogni cliente vedi il totale degli interventi effettuati, il fatturato generato nel periodo e la frequenza degli ordini. Questo ti permette di capire subito chi sono i clienti più importanti, chi vale la pena fidelizzare e dove conviene investire tempo commerciale. Utile soprattutto per le assicurazioni con cui hai convenzioni.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TIPOLOGIE */}
      <section className="py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Tipi di clienti gestiti</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 bg-gray-50">
              <p className="font-bold text-gray-900 mb-2">Clienti Privati</p>
              <p className="text-sm text-gray-600 leading-relaxed">Privati che portano l'auto da demolire, richiedono un soccorso stradale o comprano ricambi. Anagrafica semplificata, storico degli interventi e note operative. Il sistema ricorda automaticamente i veicoli già gestiti per quel cliente.</p>
            </div>
            <div className="p-5 bg-gray-50">
              <p className="font-bold text-gray-900 mb-2">Assicurazioni</p>
              <p className="text-sm text-gray-600 leading-relaxed">Compagnie assicurative che mandano richieste di soccorso o demolizione. Puoi salvare le condizioni della convenzione, i referenti per ogni tipo di pratica e le tariffe concordate. Il gestionale applica automaticamente le condizioni specifiche di ogni compagnia.</p>
            </div>
            <div className="p-5 bg-gray-50">
              <p className="font-bold text-gray-900 mb-2">Aziende & Flotte</p>
              <p className="text-sm text-gray-600 leading-relaxed">Officine, concessionari, trasportatori o aziende con flotte di veicoli. Puoi gestire più sedi, contratti dedicati e condizioni specifiche. Il sistema tiene separati gli interventi per sede ma li aggrega nel profilo azienda per il totale fatturato.</p>
            </div>
          </div>
        </div>
      </section>

      {/* VANTAGGI */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Cosa cambia nella tua operatività</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Risposta immediata al telefono</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Quando chiama un cliente, cerchi il nome nel gestionale e in 5 secondi hai: chi è, quanti interventi ha fatto, cosa aveva richiesto l'ultima volta, se ci sono fatture aperte. Non devi chiedere niente, non devi andare a cercare su fogli o email. Questo riduce il tempo di ogni telefonata e migliora l'immagine professionale della tua attività.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Nessun dato perso o dimenticato</h3>
              <p className="text-sm text-gray-600 leading-relaxed">La P.IVA, l'indirizzo di fatturazione, la PEC, il referente dell'assicurazione: una volta inseriti, sono sempre disponibili per tutta la tua squadra. Non devi chiedere al cliente di ridarteli ogni volta, e non rischi errori di trascrizione nella fattura perché i dati si copiano automaticamente.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Visione commerciale sui clienti migliori</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Con le statistiche per cliente capisci subito chi genera più fatturato, quale assicurazione vale di più, e quali clienti non tornano da tempo. Queste informazioni ti aiutano a prendere decisioni commerciali concrete: a chi offrire condizioni migliori, dove investire tempo di relazione, dove alzare i prezzi.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Fatturazione senza reinserimento</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Quando devi emettere una fattura, i dati del cliente sono già nel sistema e si compilano automaticamente nel documento. Non devi copiare nulla, non rischi di sbagliare codice fiscale o indirizzo. Meno tempo perso, meno errori, meno fatture da correggere e reinviare a SDI.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Centralizza tutti i tuoi clienti.</h2>
          <p className="text-blue-100 mb-8">CRM completo incluso in tutti i piani. Demo gratuita.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
