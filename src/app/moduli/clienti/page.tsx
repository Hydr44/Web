import Link from "next/link";
import { ArrowLeft, Users, Phone, Mail, FileText, TrendingUp, History, CheckCircle2 } from "lucide-react";

export default function ClientiPage() {
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
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Users className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mb-3 border border-blue-200">
                App Base
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Clienti & CRM</h1>
              <p className="text-xl text-gray-600 max-w-3xl">
                Anagrafica clienti completa con storico servizi, preventivi e gestione rapporti commerciali
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Gestione Clienti Completa</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Il modulo Clienti & CRM centralizza tutte le informazioni sui tuoi clienti: dati anagrafici, contatti, storico servizi, preventivi e fatture. Tutto in un unico posto per una gestione efficiente delle relazioni commerciali.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Perfetto per autodemolizioni, centri di soccorso e qualsiasi attività che necessiti di tracciare i rapporti con clienti privati, assicurazioni e aziende.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Incluso in tutti i piani
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Il modulo Clienti & CRM è parte dell'App Base e disponibile in tutti i piani di abbonamento senza costi aggiuntivi.
              </p>
              <Link
                href="/contatti"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
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
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Anagrafica completa</h3>
              <p className="text-sm text-gray-600">
                Dati anagrafici, P.IVA/CF, PEC, contatti multipli e categorizzazione clienti (privato, assicurazione, azienda).
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contatti multipli</h3>
              <p className="text-sm text-gray-600">
                Gestisci più numeri di telefono, email e referenti per ogni cliente. Click-to-call integrato.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <History className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Storico completo</h3>
              <p className="text-sm text-gray-600">
                Visualizza tutti i trasporti, preventivi, fatture e interazioni con ogni cliente in ordine cronologico.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Preventivi e offerte</h3>
              <p className="text-sm text-gray-600">
                Crea preventivi direttamente dalla scheda cliente, traccia stato (inviato, accettato, rifiutato).
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistiche cliente</h3>
              <p className="text-sm text-gray-600">
                Valore totale servizi, frequenza ordini, fatturato e marginalità per ogni cliente.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Note e promemoria</h3>
              <p className="text-sm text-gray-600">
                Aggiungi note interne, promemoria e tag per organizzare e segmentare i clienti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tipologie clienti */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Gestisci ogni tipo di cliente</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">Clienti privati</h3>
              <p className="text-sm text-gray-600">
                Gestisci privati cittadini con anagrafica semplificata, storico servizi e preferenze.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200">
              <h3 className="font-semibold text-gray-900 mb-2">Assicurazioni</h3>
              <p className="text-sm text-gray-600">
                Traccia convenzioni, tariffari dedicati, referenti e pratiche per ogni compagnia assicurativa.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-purple-50 border border-purple-200">
              <h3 className="font-semibold text-gray-900 mb-2">Aziende e flotte</h3>
              <p className="text-sm text-gray-600">
                Gestisci aziende con più sedi, flotte veicoli, contratti e condizioni commerciali dedicate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Migliora le relazioni con i tuoi clienti</h2>
          <p className="text-lg text-gray-600 mb-8">
            Richiedi una demo gratuita e scopri come centralizzare la gestione clienti
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contatti"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
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
