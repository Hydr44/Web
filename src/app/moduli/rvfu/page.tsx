import Link from "next/link";
import { ArrowLeft, FileText, Shield, CheckCircle2, AlertCircle } from "lucide-react";

export default function RVFUPage() {
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
            <Shield className="h-5 w-5 text-[#10B981]" />
            <span className="text-sm font-medium text-[#10B981]">Modulo Specializzato</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            RVFU - Registro Veicoli Fuori Uso
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Integrazione diretta con il sistema MIT per la gestione completa delle radiazioni e demolizioni di veicoli fuori uso secondo normativa italiana.
          </p>
        </div>

        {/* Alert normativa */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-8 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-gray-700 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Normativa D.Lgs. 209/2003</h3>
            <p className="text-xs text-gray-600">
              Obbligatorio per autodemolitori autorizzati. Integrazione certificata con il sistema del Ministero delle Infrastrutture e dei Trasporti.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Radiazione Automatica</h3>
            <p className="text-sm text-gray-600">
              Compilazione guidata del modulo MIT con validazione in tempo reale. Invio telematico diretto al PRA e ricezione certificato di radiazione.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-[#10B981]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Certificato Demolizione</h3>
            <p className="text-sm text-gray-600">
              Generazione automatica del certificato di rottamazione conforme alla normativa. Archiviazione digitale con firma elettronica e conservazione sostitutiva.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Registro Cronologico</h3>
            <p className="text-sm text-gray-600">
              Registro completo di tutti i veicoli demoliti con ricerca avanzata per targa, telaio, data. Export per controlli ispettivi e verifiche.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Validazione Dati</h3>
            <p className="text-sm text-gray-600">
              Controllo automatico di targa, telaio e dati proprietario. Verifica conformità documentale e alert per documenti mancanti o scaduti.
            </p>
          </div>
        </div>

        {/* Flusso operativo */}
        <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Flusso Operativo</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-[#2563EB]">1</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">Acquisizione Veicolo</div>
                <div className="text-xs text-gray-500">Inserimento dati targa, telaio e proprietario</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-[#2563EB]">2</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">Compilazione Modulo MIT</div>
                <div className="text-xs text-gray-500">Form guidato con validazione automatica campi</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-[#2563EB]">3</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">Invio Telematico</div>
                <div className="text-xs text-gray-500">Trasmissione sicura al sistema MIT/PRA</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-[#10B981]">4</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">Ricezione Certificato</div>
                <div className="text-xs text-gray-500">Download automatico certificato di radiazione</div>
              </div>
            </div>
          </div>
        </div>

        {/* Disponibilità */}
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
