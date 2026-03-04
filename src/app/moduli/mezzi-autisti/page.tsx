import Link from "next/link";
import { ArrowLeft, Truck, UserCheck, Wrench, MapPin, Clock, ArrowRight } from "lucide-react";

export default function MezziAutistiPage() {
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
            Mezzi & Autisti<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Gestione flotta veicoli e personale operativo. Scadenze automatiche, tracking GPS, turni e dispatch intelligente.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200">
              <Truck className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Anagrafica Mezzi</h3>
              <p className="text-sm text-gray-600">Targa, telaio, marca/modello, documenti e foto. Scadenze automatiche per revisione, assicurazione e bollo.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <UserCheck className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Gestione Autisti</h3>
              <p className="text-sm text-gray-600">Anagrafica personale, patenti, turni e disponibilità. Assegnazioni automatiche in base a posizione e competenze.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <Wrench className="h-6 w-6 text-amber-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Manutenzioni</h3>
              <p className="text-sm text-gray-600">Pianifica interventi periodici, ricevi notifiche per km o scadenze temporali. Storico costi per mezzo.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <MapPin className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Dispatch Intelligente</h3>
              <p className="text-sm text-gray-600">Assegna mezzo e autista più vicini e disponibili per ogni intervento. Tracking GPS in tempo reale.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Scadenze Monitorate</h3>
          <div className="grid sm:grid-cols-4 gap-3">
            {["Revisione","Assicurazione","Bollo","Tachigrafo"].map((s) => (
              <div key={s} className="flex items-center gap-2 p-3 border border-gray-200 bg-white">
                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-sm font-medium text-gray-800">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Flotta sempre operativa.</h2>
          <p className="text-blue-100 mb-8">Scadenze, turni, dispatch automatico. Demo gratuita, 30 minuti.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
