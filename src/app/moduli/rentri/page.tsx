import Link from "next/link";
import { ArrowLeft, Recycle, FileCheck, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";

export default function RENTRIPage() {
  return (
    <main className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla home
        </Link>

        <div className="mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-green-50 border border-green-200 mb-6">
            <Recycle className="h-5 w-5 text-[#10B981]" />
            <span className="text-sm font-medium text-[#10B981]">Modulo Specializzato</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            RENTRI - Registro Rifiuti
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Registro Elettronico Nazionale per la Tracciabilità dei Rifiuti. Integrazione completa con il sistema MASE per formulari digitali e movimentazione rifiuti.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-8 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-gray-700 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Obbligatorio dal 13 Febbraio 2025</h3>
            <p className="text-xs text-gray-600">
              Il RENTRI sostituisce il registro cartaceo e i FIR cartacei. Obbligatorio per tutti i produttori, trasportatori e gestori di rifiuti.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-4">
              <FileCheck className="h-6 w-6 text-[#10B981]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Formulari Digitali (FIR)</h3>
            <p className="text-sm text-gray-600">
              Creazione e invio telematico dei Formulari di Identificazione Rifiuti. Firma digitale, tracciamento stato e archiviazione automatica.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <Recycle className="h-6 w-6 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Registro Cronologico</h3>
            <p className="text-sm text-gray-600">
              Registro automatico di carico e scarico rifiuti con calcolo giacenze in tempo reale. Sincronizzazione bidirezionale con portale RENTRI.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">MUD Automatico</h3>
            <p className="text-sm text-gray-600">
              Generazione automatica del Modello Unico di Dichiarazione ambientale dai dati RENTRI. Export pre-compilato per invio telematico.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Alert Limiti Giacenza</h3>
            <p className="text-sm text-gray-600">
              Monitoraggio automatico dei limiti di giacenza per codice EER. Notifiche preventive per evitare superamento soglie e sanzioni.
            </p>
          </div>
        </div>

        {/* Codici EER supportati */}
        <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Codici EER Autodemolizioni</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="text-sm">
              <span className="font-mono text-[#10B981]">16 01 06</span>
              <span className="text-gray-600 ml-2">Veicoli fuori uso</span>
            </div>
            <div className="text-sm">
              <span className="font-mono text-[#10B981]">16 01 03</span>
              <span className="text-gray-600 ml-2">Pneumatici fuori uso</span>
            </div>
            <div className="text-sm">
              <span className="font-mono text-[#10B981]">16 01 07*</span>
              <span className="text-gray-600 ml-2">Filtri olio</span>
            </div>
            <div className="text-sm">
              <span className="font-mono text-[#10B981]">13 02 08*</span>
              <span className="text-gray-600 ml-2">Oli motore esausti</span>
            </div>
            <div className="text-sm">
              <span className="font-mono text-[#10B981]">16 01 21*</span>
              <span className="text-gray-600 ml-2">Componenti pericolosi</span>
            </div>
            <div className="text-sm">
              <span className="font-mono text-[#10B981]">16 01 22</span>
              <span className="text-gray-600 ml-2">Componenti non pericolosi</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            * Rifiuti pericolosi - gestione con limiti di giacenza ridotti
          </p>
        </div>

        {/* Flusso operativo */}
        <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Flusso Operativo</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-[#10B981]">1</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">Carico Rifiuto</div>
                <div className="text-xs text-gray-500">Registrazione automatica da demolizione veicolo</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-[#10B981]">2</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">Creazione FIR</div>
                <div className="text-xs text-gray-500">Compilazione formulario con dati trasportatore e destinatario</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-[#10B981]">3</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">Invio Telematico</div>
                <div className="text-xs text-gray-500">Trasmissione al portale RENTRI con firma digitale</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-[#2563EB]">4</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">Scarico Automatico</div>
                <div className="text-xs text-gray-500">Aggiornamento giacenze alla ricezione conferma</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#10B981] mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Modulo a scelta nei piani</h3>
              <p className="text-sm text-gray-600">
                Disponibile come modulo selezionabile nei piani Starter (1 modulo), Professional (2 moduli), Business (3 moduli) o incluso nel piano Full.
              </p>
            </div>
          </div>
        </div>

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
