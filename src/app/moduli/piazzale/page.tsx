import Link from "next/link";
import { ArrowLeft, MapPin, Filter, Car, ArrowRight, AlertTriangle } from "lucide-react";

export default function PiazzalePage() {
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
            Gestione Piazzale<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Mappa interattiva del piazzale, posizioni veicoli, tracciamento movimentazioni e ottimizzazione degli spazi.
          </p>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Il problema del piazzale non tracciato</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                In un'autodemolizione il piazzale può contenere decine o centinaia di veicoli. Senza un registro organizzato, trovare una specifica auto richiede di girare fisicamente tra le file, chiedere ai colleghi, cercare su fogli scritti a mano. Se un cliente chiama per sapere quando può ritirare il suo veicolo, non sai rispondergli senza andare a controllare di persona.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Il modulo Piazzale registra ogni veicolo con la sua posizione nel deposito, lo stato corrente e tutte le scadenze. In qualsiasi momento, da qualsiasi postazione, puoi vedere dove si trova ogni auto, da quanto tempo è lì e cosa serve fare.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border-l-4 border-red-400">
                <p className="text-sm font-semibold text-gray-900">Senza il gestionale</p>
                <p className="text-sm text-gray-600 mt-1">Fogli di carta, memoria e giri fisici per trovare i veicoli. Scadenze custodia dimenticate, spazio occupato da auto che andavano già spostate.</p>
              </div>
              <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-gray-900">Con il gestionale</p>
                <p className="text-sm text-gray-600 mt-1">Lista digitale aggiornata, posizione per settore, storico movimenti, avvisi automatici per scadenze. Nessun veicolo perso, nessuna scadenza dimenticata.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nel modulo</h2>
          <p className="text-gray-500 text-center mb-10">Tutto per gestire il deposito veicoli in modo ordinato e tracciabile.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <Car className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Registro veicoli in deposito</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni veicolo che entra nel piazzale viene registrato con targa, marca e modello, cliente di riferimento, data di ingresso, settore assegnato e stato. Puoi aggiungere foto, documenti allegati e note operative. Il registro è sempre aggiornato e accessibile da qualsiasi postazione — ufficio, magazzino o smartphone.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <MapPin className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Posizioni e settori</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Il piazzale è diviso in settori configurabili (A1, B3, zona nord, ecc.). Quando registri un veicolo, assegni il settore e la posizione specifica. Quando il veicolo viene spostato, aggiorni la posizione in 10 secondi. Così chiunque può trovare qualsiasi auto senza dover fare il giro del piazzale o chiamare il collega che l'ha parcheggiata.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Filter className="h-6 w-6 text-purple-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Stati e filtri avanzati</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni veicolo ha uno stato che riflette la sua situazione: In attesa, In lavorazione, Pronto per ritiro, Demolito, Uscito. Puoi filtrare la lista per stato, cliente, data ingresso, settore o tipo veicolo. In pochi secondi vedi solo i veicoli che ti servono — ad esempio tutti quelli "pronti per ritiro" o tutti quelli in un certo settore.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <AlertTriangle className="h-6 w-6 text-amber-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Scadenze e notifiche automatiche</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Per i depositi giudiziari o le custodie con scadenza, il sistema ti avvisa automaticamente quando si avvicina la data limite. Puoi configurare notifiche per veicoli fermi oltre un certo numero di giorni, documenti mancanti o pratiche in attesa di definizione. Nessuna scadenza viene dimenticata perché il gestionale te la ricorda prima.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ADATTO A */}
      <section className="py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Adatto a queste attività</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 bg-gray-50">
              <p className="font-bold text-gray-900 mb-2">Autodemolizioni</p>
              <p className="text-sm text-gray-600 leading-relaxed">Traccia lo stato di lavorazione di ogni veicolo: appena entrato, in bonifica, smontaggio ricambi, pronto per frantumatore. Collega il piazzale al modulo RVFU per avere tutto integrato in un'unica schermata.</p>
            </div>
            <div className="p-5 bg-gray-50">
              <p className="font-bold text-gray-900 mb-2">Depositi giudiziari</p>
              <p className="text-sm text-gray-600 leading-relaxed">Gestisci confische, sequestri e custodie con scadenze precise. Ogni veicolo ha il numero di provvedimento, il magistrato di riferimento, la data di scadenza custodia e lo stato della pratica. Notifiche automatiche prima delle scadenze.</p>
            </div>
            <div className="p-5 bg-gray-50">
              <p className="font-bold text-gray-900 mb-2">Centri soccorso</p>
              <p className="text-sm text-gray-600 leading-relaxed">Veicoli recuperati dopo incidenti in attesa di ritiro dal proprietario o dall'assicurazione. Tieni traccia di chi deve ritirare cosa, entro quando, e con quali documenti. Il sistema ti avvisa se un veicolo è fermo da troppo tempo senza notizie.</p>
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
              <h3 className="font-bold text-gray-900 mb-2">Trova ogni veicolo in secondi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Invece di fare il giro fisico del piazzale o chiamare il collega, cerchi la targa nel gestionale e vedi subito: settore A3, fila 2, da 5 giorni, stato "in attesa demolizione". Risparmia decine di minuti al giorno, soprattutto nei periodi di punta con il piazzale pieno.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Spazio gestito meglio</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Vedere quanti veicoli sono in ogni settore e quali sono fermi da più tempo ti aiuta a ottimizzare lo spazio. Puoi identificare subito i veicoli che occupano posto senza che ci sia un'azione in corso e prioritizzare la lavorazione o l'uscita di quelli più vecchi.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Nessuna scadenza dimenticata</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Per i depositi giudiziari o le custodie a termine, dimenticarsi di una scadenza può avere conseguenze legali serie. Le notifiche automatiche del gestionale ti avvisano con anticipo, così hai il tempo di agire senza trovarti in situazioni di inadempienza.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Storico completo per ogni veicolo</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni spostamento, cambio stato e operazione viene registrata con data, ora e operatore responsabile. Se nasce una contestazione su quando è entrato un veicolo o cosa è stato fatto, hai uno storico preciso e verificabile. Questo è fondamentale anche in caso di controlli ispettivi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Il piazzale sempre sotto controllo.</h2>
          <p className="text-blue-100 mb-8">Mappa veicoli, stati, operatori. Demo gratuita, 30 minuti.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
