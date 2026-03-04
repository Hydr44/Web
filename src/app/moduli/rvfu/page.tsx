import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, Car, ArrowRight } from "lucide-react";

export default function RVFUPage() {
  return (
    <main className="bg-white">
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Modulo Specializzato</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            RVFU<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Integrazione diretta con il sistema MIT per radiazioni e demolizioni di veicoli fuori uso. Conforme D.Lgs. 209/2003.
          </p>
        </div>
      </section>

      <section className="py-5 bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">Obbligatorio per autodemolitori autorizzati — integrazione certificata MIT/PRA.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200">
              <FileText className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Radiazione Automatica</h3>
              <p className="text-sm text-gray-600">Compilazione guidata del modulo MIT con validazione in tempo reale. Invio telematico diretto al PRA e ricezione certificato di radiazione.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <Car className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Certificato Demolizione</h3>
              <p className="text-sm text-gray-600">Generazione automatica del certificato di rottamazione conforme alla normativa. Archiviazione digitale con firma elettronica.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <CheckCircle2 className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Registro Cronologico</h3>
              <p className="text-sm text-gray-600">Registro completo di tutti i veicoli demoliti con ricerca avanzata per targa, telaio, data. Export per controlli ispettivi.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <AlertCircle className="h-6 w-6 text-gray-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Validazione Dati</h3>
              <p className="text-sm text-gray-600">Controllo automatico di targa, telaio e dati proprietario. Alert per documenti mancanti o scaduti.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Flusso Operativo</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            {[["1","Acquisizione","Targa, telaio, proprietario"],["2","Modulo MIT","Form con validazione"],["3","Invio Telematico","Trasmissione sicura MIT/PRA"],["4","Certificato","Download automatico"]].map(([n,t,d]) => (
              <div key={n} className="p-4 border border-gray-200 bg-white">
                <span className="text-2xl font-extrabold text-blue-500">{n}</span>
                <p className="font-bold text-gray-900 mt-1 mb-0.5 text-sm">{t}</p>
                <p className="text-xs text-gray-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Radiazioni RVFU senza errori.</h2>
          <p className="text-blue-100 mb-8">Integrazione certificata MIT. Demo gratuita, 30 minuti.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
