import Link from "next/link";
import { ArrowLeft, FileText, Calculator, Send, CheckCircle, Clock, TrendingUp, CheckCircle2 } from "lucide-react";

export default function PreventiviPage() {
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
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <FileText className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-3 border border-blue-200">
                App Base
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Preventivi</h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Crea preventivi professionali in pochi click, traccia lo stato e converti in fattura
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Preventivi Veloci e Professionali</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Il modulo Preventivi ti permette di creare offerte commerciali in modo rapido e professionale. Gestisci voci di costo, sconti, note e condizioni. Invia via email o stampa in PDF con il tuo logo aziendale.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Traccia lo stato di ogni preventivo (bozza, inviato, accettato, rifiutato) e converti in fattura con un click quando il cliente accetta.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
                Incluso in tutti i piani
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Il modulo Preventivi è parte dell'App Base e disponibile in tutti i piani di abbonamento senza costi aggiuntivi.
              </p>
              <Link
                href="/contatti"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-colors"
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
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <Calculator className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Calcolo automatico</h3>
              <p className="text-sm text-gray-600">
                Aggiungi voci, quantità e prezzi. Il sistema calcola automaticamente subtotali, IVA e totale.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Template personalizzabili</h3>
              <p className="text-sm text-gray-600">
                Crea template con voci ricorrenti per velocizzare la creazione di preventivi simili.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <Send className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Invio email e PDF</h3>
              <p className="text-sm text-gray-600">
                Invia il preventivo via email al cliente con PDF allegato, logo aziendale e testo personalizzato.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tracking stato</h3>
              <p className="text-sm text-gray-600">
                Traccia lo stato: bozza, inviato, visualizzato, accettato, rifiutato, scaduto.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversione in fattura</h3>
              <p className="text-sm text-gray-600">
                Quando il cliente accetta, converti il preventivo in fattura con un solo click.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistiche conversione</h3>
              <p className="text-sm text-gray-600">
                Analizza tasso di conversione, valore medio preventivi e tempi di risposta clienti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Come funziona</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="relative">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-4">
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Crea preventivo</h3>
                <p className="text-sm text-gray-600">
                  Seleziona cliente, aggiungi voci, prezzi e condizioni.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-300"></div>
            </div>

            <div className="relative">
              <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold mb-4">
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Invia al cliente</h3>
                <p className="text-sm text-gray-600">
                  Invia via email con PDF allegato o stampa e consegna.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-300"></div>
            </div>

            <div className="relative">
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold mb-4">
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Traccia risposta</h3>
                <p className="text-sm text-gray-600">
                  Monitora se il cliente ha visualizzato e la sua risposta.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gray-300"></div>
            </div>

            <div>
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold mb-4">
                  4
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Converti in fattura</h3>
                <p className="text-sm text-gray-600">
                  Se accettato, genera la fattura automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefici */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Vantaggi</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Risparmia tempo</h3>
              <p className="text-sm text-gray-600">
                Crea preventivi in pochi minuti invece di ore. Template e calcoli automatici velocizzano il processo.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Immagine professionale</h3>
              <p className="text-sm text-gray-600">
                PDF con logo aziendale, layout curato e condizioni chiare migliorano la tua immagine.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Nessun errore</h3>
              <p className="text-sm text-gray-600">
                Calcoli automatici eliminano errori di somma, IVA e totali. Tutto sempre corretto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Crea preventivi professionali in minuti</h2>
          <p className="text-lg text-gray-600 mb-8">
            Richiedi una demo gratuita e scopri come velocizzare le tue offerte commerciali
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contatti"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-500 transition-colors"
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
