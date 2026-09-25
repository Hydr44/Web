import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bell, CalendarDays, MapPin, Phone, Receipt, Truck } from "lucide-react";


export const metadata: Metadata = {
  title: "Dispatch soccorso stradale: interventi, carro attrezzi e mappa",
  description: "Gestionale soccorso stradale: dispatch interventi, assegnazione autista e carro attrezzi, mappa dei mezzi, app autisti con navigatore e WhatsApp al cliente.",
  alternates: { canonical: "/moduli/trasporti" },
};

const MODULI_COLLEGATI = [
  { href: "/moduli/mezzi-autisti", title: "Mezzi e autisti", desc: "Disponibilità, turni e scadenze di revisione e assicurazione dei carri attrezzi." },
  { href: "/moduli/clienti", title: "Clienti e committenti", desc: "Anagrafica con convenzioni e tariffari: il prezzo dell’intervento si calcola da solo." },
  { href: "/moduli/piazzale", title: "Custodia veicoli", desc: "Il veicolo recuperato entra in deposito con posizione, conto giorni e verbale di riconsegna." },
];

export default function TrasportiPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">App Base</p>
          <div className="mb-5">
            <Link href="/soccorso-stradale" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-white transition-colors">
              Fa parte del gestionale per il soccorso stradale
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            Dispatch degli interventi di soccorso stradale<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Dalla chiamata alla fattura: crei l’intervento, assegni autista e carro attrezzi, segui stato e posizione dei mezzi sulla mappa. L’autista riceve tutto sull’app, il cliente riceve un messaggio WhatsApp con il link per seguire l’intervento.
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
                In un centro di soccorso stradale gli interventi si moltiplicano durante la giornata. Senza un sistema centrale, ogni chiamata diventa una catena di telefonate: chi è libero? dov’è il carro attrezzi? è già partito? è arrivato? A fine giornata, ricostruire cosa è successo è quasi impossibile.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Il modulo Soccorso & trasporti raccoglie tutto in un’unica schermata: ogni intervento ha un cliente, un punto di intervento e una destinazione, un autista, un carro attrezzi e uno stato aggiornato in tempo reale. Non serve chiamare nessuno: apri la lista e vedi tutto.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border-l-4 border-red-400">
                <p className="text-sm font-semibold text-gray-900">Senza RescueManager</p>
                <p className="text-sm text-gray-600 mt-1">Telefonate continue, post-it, fogli Excel, rischio di dimenticare interventi o di non sapere chi è sul posto.</p>
              </div>
              <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-gray-900">Con RescueManager</p>
                <p className="text-sm text-gray-600 mt-1">Lista aggiornata in tempo reale, stati visibili a tutti, storico completo per ogni intervento, prezzo calcolato in automatico dal tariffario e fattura pronta a fine mese.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

            {/* FEATURES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nel modulo</h2>
          <p className="text-gray-500 text-center mb-10">Dalla chiamata alla fattura, con l&rsquo;autista sul posto e il cliente che ti segue senza chiamarti.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <Phone className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">L&rsquo;intervento si crea in quattro passi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Chiamata, veicolo, percorso, riepilogo. Scegli il cliente dall&rsquo;anagrafica o lo crei mentre scrivi, indichi dove intervenire e dove portare il mezzo, e il prezzo si calcola dal listino già mentre compili. Per gli interventi che fai sempre uguali ci sono i preset, e il gestionale ti suggerisce l&rsquo;autista in base a chi è libero.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Bell className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Stati in tempo reale e il link per il cliente</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni intervento ha uno stato che tutto l&rsquo;ufficio vede aggiornarsi: da assegnare, assegnato, in viaggio, completato. Alla creazione e a ogni cambio il cliente riceve un messaggio WhatsApp con un link per seguire il carro sulla mappa. Le telefonate «a che punto siete?» finiscono da sole.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <MapPin className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">La mappa degli interventi attivi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Tutti gli interventi in corso su una mappa scura come il resto del gestionale, leggibile anche di sera: il punto di intervento, la destinazione e l&rsquo;ultima posizione di ogni mezzo. Nelle ore di punta è il modo più veloce per capire chi mandare dove.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Truck className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">L&rsquo;app degli autisti, sul loro telefono</h3>
              <p className="text-sm text-gray-600 leading-relaxed">L&rsquo;autista riceve la notifica, apre il navigatore passo passo, aggiorna lo stato, scatta le foto del veicolo e fa firmare il cliente sul posto. Tutto torna nella scheda dell&rsquo;intervento: niente fogli da riportare in ufficio e niente foto perse nelle chat.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Receipt className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Tre tariffari: privati, clienti, convenzionati</h3>
              <p className="text-sm text-gray-600 leading-relaxed">I privati hanno il tuo listino, i clienti abituali il loro, i committenti in convenzione il prezzo concordato. Il gestionale prende il prezzo dalla lista giusta senza che tu debba sceglierla. A fine mese emetti una fattura sola per committente con tutti i suoi interventi, e per ogni intervento stampi il DDT.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <CalendarDays className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Rendiconto per il committente e calendario</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Per ogni committente prepari il prospetto degli interventi del periodo, pronto da mandare insieme alla fattura. E i lavori programmati (trasporti, appuntamenti, scadenze) stanno sul calendario a giorno, settimana o mese, così sai già cosa ti aspetta domani.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATI */}
      <section className="py-10 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Stati dell’intervento</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            {[["bg-amber-500","Da fare","Intervento creato, in attesa di assegnazione."],["bg-blue-500","Assegnato","Autista e carro attrezzi assegnati, pronto a partire."],["bg-emerald-500","In corso","L’autista ha preso in carico, intervento attivo."],["bg-slate-400","Completato","Intervento chiuso, dati pronti per la fatturazione."]].map(([c,l,d]) => (
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
              { n: "1", title: "Crea l’intervento", desc: "Ricevi la chiamata o la richiesta del committente, apri un nuovo intervento, inserisci il cliente e gli indirizzi. In 30 secondi è nel sistema e il cliente riceve il messaggio WhatsApp con il link per seguirlo." },
              { n: "2", title: "Assegna autista e carro attrezzi", desc: "Vedi subito chi è disponibile tra i tuoi autisti e quale mezzo è libero. Assegni e aggiungi eventuali istruzioni o note per l’autista." },
              { n: "3", title: "L’autista prende in carico", desc: "L’autista riceve la notifica sull’app, apre il navigatore e aggiorna lo stato. L’ufficio vede in tempo reale che il lavoro è partito e il cliente lo segue dal link, senza bisogno di chiamare." },
              { n: "4", title: "Foto, firma e chiusura", desc: "Sul posto l’autista scatta le foto e fa firmare il cliente. Il prezzo è già calcolato dal tariffario, il DDT si stampa dalla scheda e a fine mese la fattura per il committente si genera in blocco." },
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
              <p className="text-sm text-gray-600 leading-relaxed">Quando tutti vedono la stessa lista aggiornata, le chiamate “sei libero?”, “sei arrivato?”, “hai finito?” spariscono quasi del tutto. E il cliente, che segue l’intervento dal link ricevuto su WhatsApp, non chiama per chiedere a che punto sei.</p>
            </div>
            <div className="p-6 bg-white border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Interventi più rapidi da assegnare</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Con la lista interventi e i filtri per stato, in pochi secondi vedi chi ha il carico di lavoro più leggero e puoi assegnare subito senza perdere tempo a cercare o chiamare. Nei momenti di punta questo fa una differenza enorme.</p>
            </div>
            <div className="p-6 bg-white border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Storico completo sempre disponibile</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni intervento resta nel sistema con tutti i dettagli: cliente, indirizzi, autista, mezzo, note, stati con data e ora, foto e firma del cliente. Se un committente contesta o chiede informazioni su un intervento passato, hai tutto a portata di mano in pochi secondi.</p>
            </div>
            <div className="p-6 bg-white border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Fatturazione integrata con gli interventi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">A fine intervento il gestionale ha già il prezzo calcolato dalla convenzione o dal tariffario. A fine mese emetti la fattura massiva per ogni committente e la trasmetti in fatturazione elettronica, con le notifiche di esito. Niente doppio inserimento, niente errori di trascrizione.</p>
            </div>
          </div>
        </div>
      </section>

      {/* INCLUSO */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start gap-3 p-6 border border-gray-200 bg-white">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-blue-500" />
            <div>
              <p className="font-bold text-gray-900 mb-1">Incluso in tutti i piani</p>
              <p className="text-sm text-gray-600">Il modulo Soccorso & trasporti fa parte dell’App Base ed è incluso in tutti i piani.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MODULI COLLEGATI */}
      <section className="py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Moduli collegati</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {MODULI_COLLEGATI.map((m) => (
              <Link key={m.href} href={m.href} className="flex items-start justify-between gap-4 p-5 bg-gray-50 border border-gray-200 hover:border-blue-600 transition-colors">
                <div>
                  <p className="font-bold text-gray-900 mb-1">{m.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{m.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-blue-600 shrink-0 mt-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Gestisci gli interventi senza caos.</h2>
          <p className="text-blue-50 mb-8">Demo gratuita, 30 minuti, personalizzata per la tua attività.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
