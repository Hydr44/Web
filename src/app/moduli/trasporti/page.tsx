import Link from "next/link";
import { ArrowLeft, MapPin, Users, BarChart3, CheckCircle2, ArrowRight } from "lucide-react";

export default function TrasportiPage() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">App Base</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            Gestione Trasporti<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Sistema completo per soccorso stradale e demolizioni: creazione trasporti, assegnazione autisti/mezzi, tracking su mappa, stati e storico. Tutto sincronizzato e tracciabile.
          </p>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Il problema che risolve</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                In un'autodemolizione o in un centro soccorso, i trasporti si moltiplicano durante la giornata. Senza un sistema centrale, ogni intervento diventa una catena di telefonate: chi è libero? dov'è il carro attrezzi? è già partito? è arrivato? A fine giornata, ricostruire cosa è successo è quasi impossibile.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Il modulo Trasporti raccoglie tutto in un'unica schermata: ogni intervento ha un cliente, un indirizzo di ritiro e consegna, un autista, un mezzo e uno stato aggiornato in tempo reale. Non serve chiamare nessuno — basta aprire la lista e si vede tutto.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border-l-4 border-red-400">
                <p className="text-sm font-semibold text-gray-900">Senza RescueManager</p>
                <p className="text-sm text-gray-600 mt-1">Telefonate continue, post-it, fogli Excel, rischio di dimenticare interventi o di non sapere chi è sul posto.</p>
              </div>
              <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-gray-900">Con RescueManager</p>
                <p className="text-sm text-gray-600 mt-1">Lista aggiornata in tempo reale, stati visibili a tutti, storico completo per ogni trasporto, bozza fattura generata automaticamente a fine intervento.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nel modulo</h2>
          <p className="text-gray-500 text-center mb-10">Tutto quello che serve per gestire gli interventi dalla creazione alla chiusura.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <Users className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Creazione e gestione interventi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Crea ogni intervento in pochi secondi: selezioni il cliente dall'anagrafica (o ne inserisci uno nuovo al volo), inserisci l'indirizzo di ritiro e quello di consegna, aggiungi note operative per l'autista e assegni mezzo e autista disponibili. Puoi modificare o riaprire qualsiasi intervento in qualunque momento, e tutto rimane nel sistema con data e ora.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <CheckCircle2 className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Stati intervento in tempo reale</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni trasporto ha uno stato chiaro — Da Fare, Assegnato, In Corso, Completato — che avanza man mano che l'operazione procede. Lo stato è visibile a chiunque abbia accesso al gestionale: l'ufficio vede subito che l'autista ha preso in carico il lavoro, e quando l'intervento si chiude il registro è già aggiornato. Nessuna chiamata di conferma necessaria.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <MapPin className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Mappa interventi attivi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">La vista mappa mostra in un colpo d'occhio tutti i trasporti attivi: il punto di ritiro, il punto di consegna e, se disponibile, la posizione più recente del mezzo. Puoi cliccare su qualsiasi trasporto per vederne i dettagli, aprire l'indirizzo su Google Maps o contattare l'autista direttamente. Utile soprattutto nelle ore di punta quando ci sono più interventi contemporanei.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <BarChart3 className="h-6 w-6 text-gray-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Export, report e bozza fattura</h3>
              <p className="text-sm text-gray-600 leading-relaxed">A fine giornata, settimana o mese puoi esportare i dati degli interventi in CSV per analisi, consuntivi o controllo costi. In più, a chiusura di ogni trasporto puoi generare in un click una bozza di fattura già precompilata con i dati del cliente, dell'intervento e dell'importo — così non devi reinserire nulla nel modulo contabilità.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATI */}
      <section className="py-10 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Stati Trasporto</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            {[["bg-amber-500","Da Fare","Intervento creato, in attesa di assegnazione."],["bg-blue-500","Assegnato","Autista e mezzo assegnati, pronto a partire."],["bg-emerald-500","In Corso","Autista ha preso in carico, intervento attivo."],["bg-slate-400","Completato","Intervento chiuso, dati disponibili per fatturazione."]].map(([c,l,d]) => (
              <div key={l} className="flex gap-3 p-3 bg-gray-50">
                <div className={`w-3 h-3 rounded-full ${c} mt-0.5 shrink-0`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{l}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COME FUNZIONA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Come funziona in pratica</h2>
          <div className="space-y-4">
            {[
              { n: "1", title: "Crea l'intervento", desc: "Ricevi la chiamata o la richiesta, apri un nuovo trasporto, inserisci il cliente e gli indirizzi. In 30 secondi l'intervento è nel sistema." },
              { n: "2", title: "Assegna autista e mezzo", desc: "Vedi subito chi è disponibile tra i tuoi operatori e quale mezzo è libero. Assegni e aggiungi eventuali istruzioni o note per l'autista." },
              { n: "3", title: "L'autista prende in carico", desc: "L'autista vede l'intervento assegnato e aggiorna lo stato. L'ufficio vede in tempo reale che il lavoro è partito, senza bisogno di chiamare." },
              { n: "4", title: "Chiusura e consuntivo", desc: "A intervento completato, lo stato viene aggiornato. Puoi generare immediatamente la bozza fattura con i dati già compilati, oppure esportare i dati per i report mensili." },
            ].map((s) => (
              <div key={s.n} className="flex gap-4 p-5 bg-gray-50 border border-gray-200">
                <div className="w-9 h-9 bg-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0">{s.n}</div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">{s.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VANTAGGI */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Cosa cambia nella tua operatività</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Meno telefonate, più chiarezza</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Quando tutti gli operatori vedono la stessa lista aggiornata, le chiamate "sei libero?", "sei arrivato?", "hai finito?" spariscono quasi del tutto. Chi è in ufficio ha sempre la situazione sotto controllo senza dover inseguire nessuno.</p>
            </div>
            <div className="p-6 bg-white border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Interventi più rapidi da assegnare</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Con la lista interventi e i filtri per stato, in pochi secondi vedi chi ha il carico di lavoro più leggero e puoi assegnare subito senza perdere tempo a cercare o chiamare. Nei momenti di punta questo fa una differenza enorme.</p>
            </div>
            <div className="p-6 bg-white border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Storico completo sempre disponibile</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni intervento rimane nel sistema con tutti i dettagli: cliente, indirizzi, autista, mezzo, note, stato e data. Se un cliente chiama per contestare o per richiedere informazioni su un intervento passato, hai tutto a portata di mano in pochi secondi.</p>
            </div>
            <div className="p-6 bg-white border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Fatturazione integrata con i trasporti</h3>
              <p className="text-sm text-gray-600 leading-relaxed">A fine intervento, il gestionale ha già tutti i dati necessari per la fattura. Con un click generi la bozza precompilata e la passi al modulo contabilità. Niente doppio inserimento, niente errori di trascrizione, niente dati persi.</p>
            </div>
          </div>
        </div>
      </section>

      {/* INCLUSO */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start gap-3 p-6 border border-gray-200 bg-white">
            <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-gray-900 mb-1">Incluso in tutti i piani</p>
              <p className="text-sm text-gray-600">Il modulo Trasporti fa parte dell'App Base ed è incluso in tutti i piani.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Gestisci i trasporti senza caos.</h2>
          <p className="text-blue-100 mb-8">Demo gratuita, 30 minuti, personalizzata per la tua attività.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
