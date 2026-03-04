import Link from "next/link";
import { ArrowLeft, Recycle, FileCheck, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";

export default function RENTRIPage() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Modulo Specializzato</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            RENTRI<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Registro Elettronico Nazionale Rifiuti. Formulari digitali, registri carico/scarico, sincronizzazione con portale MASE. Obbligatorio dal 2025.
          </p>
        </div>
      </section>


      <section className="py-5 bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">Obbligatorio dal 13 Febbraio 2025 — sostituisce il registro cartaceo e i FIR per tutti i gestori di rifiuti.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 border border-gray-200">
            <FileCheck className="h-6 w-6 text-green-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Formulari Digitali (FIR)</h3>
            <p className="text-sm text-gray-600">
              Creazione e invio telematico dei Formulari di Identificazione Rifiuti. Firma digitale, tracciamento stato e archiviazione automatica.
            </p>
          </div>

          <div className="p-6 border border-gray-200">
            <Recycle className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Registro Cronologico</h3>
            <p className="text-sm text-gray-600">
              Registro automatico di carico e scarico rifiuti con calcolo giacenze in tempo reale. Sincronizzazione bidirezionale con portale RENTRI.
            </p>
          </div>

          <div className="p-6 border border-gray-200">
            <TrendingUp className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">MUD Automatico</h3>
            <p className="text-sm text-gray-600">
              Generazione automatica del Modello Unico di Dichiarazione ambientale dai dati RENTRI. Export pre-compilato per invio telematico.
            </p>
          </div>

          <div className="p-6 border border-gray-200">
            <AlertCircle className="h-6 w-6 text-gray-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Alert Limiti Giacenza</h3>
            <p className="text-sm text-gray-600">
              Monitoraggio automatico dei limiti di giacenza per codice EER. Notifiche preventive per evitare superamento soglie e sanzioni.
            </p>
          </div>
        </div>
        </div>
      </section>

      <section className="py-10 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Codici EER Autodemolizioni</h3>
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
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Flusso Operativo</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            {[["1","Carico Rifiuto","Da demolizione veicolo"],["2","Creazione FIR","Con dati trasportatore"],["3","Invio Telematico","Firma digitale RENTRI"],["4","Scarico Auto","Aggiornamento giacenze"]].map(([n,t,d]) => (
              <div key={n} className="p-4 border border-gray-200">
                <span className="text-2xl font-extrabold text-green-500">{n}</span>
                <p className="font-bold text-gray-900 mt-1 mb-0.5 text-sm">{t}</p>
                <p className="text-xs text-gray-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Conformità RENTRI garantita.</h2>
          <p className="text-blue-100 mb-8">Obbligatorio dal 2025. Noi lo gestiamo per te. Demo gratuita.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
