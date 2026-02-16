import Link from "next/link";
import { ArrowLeft, Truck, UserCheck, Calendar, Wrench, MapPin, Clock, CheckCircle2 } from "lucide-react";

export default function MezziAutistiPage() {
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
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Truck className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-3 border border-blue-200">
                App Base
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Mezzi & Autisti</h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Gestione flotta veicoli e personale con tracking, manutenzioni e pianificazione turni
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Gestione Flotta e Personale</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Il modulo Mezzi & Autisti ti permette di gestire la tua flotta di veicoli e il personale operativo. Traccia manutenzioni, revisioni, assicurazioni e documenti per ogni mezzo. Gestisci turni, disponibilità e assegnazioni per ogni autista.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Essenziale per centri di soccorso, autodemolizioni con servizio trasporto e qualsiasi attività con flotta operativa.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                Incluso in tutti i piani
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Il modulo Mezzi & Autisti è parte dell'App Base e disponibile in tutti i piani di abbonamento senza costi aggiuntivi.
              </p>
              <Link
                href="/contatti"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors"
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
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="h-6 w-6 text-purple-600" />
                Gestione Mezzi
              </h3>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-1">Anagrafica completa</h4>
                  <p className="text-sm text-gray-600">
                    Targa, telaio, marca/modello, anno immatricolazione, documenti e foto.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-1">Scadenze automatiche</h4>
                  <p className="text-sm text-gray-600">
                    Alert per revisione, assicurazione, bollo e manutenzioni programmate.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-1">Storico manutenzioni</h4>
                  <p className="text-sm text-gray-600">
                    Traccia interventi, costi, km e fornitori per ogni mezzo.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-1">Tracking GPS</h4>
                  <p className="text-sm text-gray-600">
                    Posizione in tempo reale e storico percorsi per mezzi con GPS.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-blue-600" />
                Gestione Autisti
              </h3>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-1">Anagrafica personale</h4>
                  <p className="text-sm text-gray-600">
                    Dati anagrafici, contatti, documenti e patenti per ogni autista.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-1">Calendario turni</h4>
                  <p className="text-sm text-gray-600">
                    Pianifica turni, ferie, permessi e disponibilità con calendario visuale.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-1">Assegnazioni automatiche</h4>
                  <p className="text-sm text-gray-600">
                    Assegna trasporti in base a disponibilità, posizione e competenze.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-1">Statistiche performance</h4>
                  <p className="text-sm text-gray-600">
                    Trasporti completati, tempi medi, valutazioni clienti per autista.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <Wrench className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manutenzioni programmate</h3>
              <p className="text-sm text-gray-600">
                Pianifica interventi periodici e ricevi notifiche in base a km o scadenze temporali.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dispatch intelligente</h3>
              <p className="text-sm text-gray-600">
                Assegna il mezzo e l'autista più vicini e disponibili per ogni intervento.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ore lavoro e straordinari</h3>
              <p className="text-sm text-gray-600">
                Traccia ore lavorate, straordinari e pause per ogni autista automaticamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefici */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Perché è importante</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">Riduci i fermi macchina</h3>
              <p className="text-sm text-gray-600">
                Con le scadenze automatiche e le manutenzioni programmate, eviti sorprese e mantieni la flotta sempre operativa.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200">
              <h3 className="font-semibold text-gray-900 mb-2">Ottimizza le risorse</h3>
              <p className="text-sm text-gray-600">
                Assegna il personale in modo efficiente, riduci i tempi morti e migliora la produttività.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-purple-50 border border-purple-200">
              <h3 className="font-semibold text-gray-900 mb-2">Conformità normativa</h3>
              <p className="text-sm text-gray-600">
                Mantieni tutti i documenti in regola e ricevi alert prima delle scadenze.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-amber-50 border border-amber-200">
              <h3 className="font-semibold text-gray-900 mb-2">Controllo costi</h3>
              <p className="text-sm text-gray-600">
                Traccia i costi di gestione flotta e identifica i mezzi più costosi da mantenere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ottimizza la gestione della tua flotta</h2>
          <p className="text-lg text-gray-600 mb-8">
            Richiedi una demo gratuita e scopri come semplificare mezzi e personale
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contatti"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors"
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
