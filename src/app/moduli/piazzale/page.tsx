import Link from "next/link";
import { ArrowLeft, MapPin, Filter, Clock, Car, ArrowRight } from "lucide-react";

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

      {/* Descrizione */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cos'è il Piazzale</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Il modulo Piazzale è il cuore della gestione del deposito veicoli. Permette di tracciare ogni veicolo presente nel tuo piazzale, dalla sua posizione fisica fino allo stato amministrativo e alla documentazione associata.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Ideale per autodemolizioni, depositi giudiziari, centri di soccorso e qualsiasi attività che necessiti di gestire un parco veicoli in deposito.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
                Incluso in tutti i piani
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Il modulo Piazzale è parte dell'App Base e disponibile in tutti i piani di abbonamento senza costi aggiuntivi.
              </p>
              <Link
                href="/contatti"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
              >
                Richiedi demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Funzionalità */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200">
              <MapPin className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Mappa Interattiva</h3>
              <p className="text-sm text-gray-600">
                Visualizza la posizione fisica di ogni veicolo nel deposito con mappa interattiva e assegnazione settori.
              </p>
            </div>

            <div className="p-6 border border-gray-200">
              <Car className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Posizioni Veicoli</h3>
              <p className="text-sm text-gray-600">
                Traccia tutti i movimenti: ingresso, spostamenti interni, uscita e cambio stato.
              </p>
            </div>

            <div className="p-6 border border-gray-200">
              <Clock className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Tracciamento Tempi</h3>
              <p className="text-sm text-gray-600">
                Notifiche automatiche per scadenze custodia, documenti mancanti e veicoli fermi oltre soglia.
              </p>
            </div>

            <div className="p-6 border border-gray-200">
              <Filter className="h-6 w-6 text-purple-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Filtri Avanzati</h3>
              <p className="text-sm text-gray-600">
                Filtra per stato (in deposito, in lavorazione, pronto), tipo veicolo, data ingresso e molto altro.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Adatto a</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[["Autodemolizioni","Stato lavorazione veicoli e disponibilità ricambi."],["Depositi giudiziari","Confische, sequestri e custodie con scadenze."],["Centri soccorso","Veicoli in attesa di ritiro o definizione pratica."]].map(([t,d]) => (
              <div key={t} className="p-4 border border-gray-200 bg-white">
                <p className="font-bold text-gray-900 mb-1 text-sm">{t}</p>
                <p className="text-xs text-gray-500">{d}</p>
              </div>
            ))}
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
