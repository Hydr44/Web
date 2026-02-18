import Link from "next/link";
import { ArrowLeft, Truck, MapPin, Calendar, Users, BarChart3, CheckCircle2 } from "lucide-react";

export default function TrasportiPage() {
  return (
    <main className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 mb-6">
            <Truck className="h-5 w-5 text-[#2563EB]" />
            <span className="text-sm font-medium text-[#2563EB]">App Base</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Gestione Trasporti
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Sistema completo per la gestione dei trasporti di soccorso stradale e demolizioni, con tracking GPS in tempo reale e dispatch automatico.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tracking GPS Live</h3>
            <p className="text-sm text-gray-600">
              Monitora in tempo reale la posizione dei mezzi di soccorso con aggiornamenti automatici ogni 30 secondi. Supporto dispositivi Teltonika, Queclink, Concox e OBD2.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-[#10B981]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pianificazione Avanzata</h3>
            <p className="text-sm text-gray-600">
              Calendario integrato con vista settimana/mese, assegnazione automatica autisti e mezzi, gestione priorità e ottimizzazione percorsi.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dispatch Intelligente</h3>
            <p className="text-sm text-gray-600">
              Assegnazione automatica basata su disponibilità autisti, posizione GPS e tipo di mezzo. Notifiche push istantanee all'app mobile.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Report e Analytics</h3>
            <p className="text-sm text-gray-600">
              KPI in tempo reale, statistiche per autista/mezzo, analisi percorsi, tempi medi di intervento e export CSV per analisi avanzate.
            </p>
          </div>
        </div>

        {/* Stati trasporto */}
        <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stati Trasporto</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-gray-700">Da Fare</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-700">In Corso</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-700">Completato</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-slate-500"></div>
              <span className="text-sm text-gray-700">In Attesa</span>
            </div>
          </div>
        </div>

        {/* Incluso in */}
        <div className="p-6 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#2563EB] mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Incluso in tutti i piani</h3>
              <p className="text-sm text-gray-600">
                Il modulo Trasporti fa parte dell'App Base ed è incluso in tutti i piani: Starter, Professional, Business e Full.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 flex gap-4">
          <Link
            href="/contatti"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
          >
            Richiedi Demo
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            Scopri altri moduli
          </Link>
        </div>
      </div>
    </main>
  );
}
