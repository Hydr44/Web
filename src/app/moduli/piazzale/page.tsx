import Link from "next/link";
import { ArrowLeft, Package, MapPin, Calendar, Search, Filter, CheckCircle2, Clock } from "lucide-react";

export default function PiazzalePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gray-50 border-b border-gray-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-3 border border-blue-200">
                App Base
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Piazzale</h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Gestione completa del deposito veicoli con tracking posizione, stato e documentazione
              </p>
            </div>
          </div>
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
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Funzionalità principali</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Mappa del piazzale</h3>
              <p className="text-sm text-gray-600">
                Visualizza la posizione fisica di ogni veicolo nel deposito con mappa interattiva e assegnazione settori.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ricerca rapida</h3>
              <p className="text-sm text-gray-600">
                Trova immediatamente qualsiasi veicolo per targa, telaio, cliente o posizione nel piazzale.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <Filter className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Filtri avanzati</h3>
              <p className="text-sm text-gray-600">
                Filtra per stato (in deposito, in lavorazione, pronto), tipo veicolo, data ingresso e molto altro.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Storico movimenti</h3>
              <p className="text-sm text-gray-600">
                Traccia tutti i movimenti: ingresso, spostamenti interni, uscita e cambio stato.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Scadenze e alert</h3>
              <p className="text-sm text-gray-600">
                Notifiche automatiche per scadenze custodia, documenti mancanti e veicoli fermi oltre soglia.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fascicolo digitale</h3>
              <p className="text-sm text-gray-600">
                Allegati, foto, documenti e note per ogni veicolo, tutto in un unico posto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Casi d'uso */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Perfetto per</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">Autodemolizioni</h3>
              <p className="text-sm text-gray-600">
                Gestisci veicoli da demolire, traccia lo stato di lavorazione e la disponibilità ricambi.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200">
              <h3 className="font-semibold text-gray-900 mb-2">Depositi giudiziari</h3>
              <p className="text-sm text-gray-600">
                Traccia confische, sequestri e custodie con scadenze e documentazione completa.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-purple-50 border border-purple-200">
              <h3 className="font-semibold text-gray-900 mb-2">Centri soccorso</h3>
              <p className="text-sm text-gray-600">
                Gestisci veicoli in attesa di ritiro, riparazione o definizione pratica assicurativa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Pronto a organizzare il tuo piazzale?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Richiedi una demo gratuita e scopri come semplificare la gestione del deposito
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contatti"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
            >
              Richiedi demo gratuita
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50 transition-colors"
            >
              Torna alla home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
