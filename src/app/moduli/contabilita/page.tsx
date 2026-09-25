import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Coins, FileText, Receipt, Scale, TrendingUp } from "lucide-react";


export const metadata: Metadata = {
  title: "Contabilità",
  description: "Prima nota, partita doppia e piano dei conti, collegati alla fatturazione elettronica, con il riepilogo IVA del periodo e i registri per il commercialista.",
  alternates: { canonical: "/moduli/contabilita" },
};

export default function ContabilitaPage() {
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
            Contabilità<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Prima nota, partita doppia, piano dei conti. Le fatture diventano movimenti da sole, e a fine trimestre il riepilogo IVA e i registri sono pronti per il commercialista.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nel modulo</h2>
          <p className="text-gray-500 text-center mb-10">La prima nota che si riempie da sola dalle fatture, e i conti che tornano.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200">
              <Coins className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Prima nota e piano dei conti</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni entrata e ogni uscita finisce sul suo conto. Il piano dei conti parte già impostato per un&rsquo;attività come la tua e lo adatti come vuoi: aggiungi conti, li disattivi, li rinomini.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <Scale className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Movimenti in partita doppia</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni movimento manuale nasce con le sue due gambe, dare e avere, e i totali si vedono mentre scrivi. Quando qualcosa non quadra te ne accorgi subito, non a fine anno davanti al commercialista.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <Receipt className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Le fatture entrano da sole</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Le fatture emesse e quelle ricevute diventano movimenti senza riscriverle. La prima nota resta allineata a quello che hai davvero fatturato e pagato.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <TrendingUp className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">La sintesi del mese</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Entrate, uscite, risultato e fatture ancora da registrare, con i conti principali e gli ultimi movimenti. In dieci secondi sai come sta andando il mese senza aprire un foglio di calcolo.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <FileText className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Riepilogo IVA e registri</h3>
              <p className="text-sm text-gray-600 leading-relaxed">IVA a debito sulle vendite, a credito sugli acquisti, saldo del periodo, con i registri esportabili. È il pacchetto che il commercialista ti chiede ogni tre mesi, pronto da mandare.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <Clock className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Incassi e pagamenti con le loro date</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Quello che deve entrare e quello che deve uscire, con le scadenze. Collegato allo scadenzario delle fatture, così il conto in banca non è mai una sorpresa.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Causali Predefinite</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {["Fattura Emessa","Fattura Ricevuta","Incasso Cliente","Pagamento Fornitore","Nota Spese","Stipendi"].map((c) => (
              <div key={c} className="flex items-center gap-2 p-3 border border-gray-200 bg-white">
                <span className="h-1.5 w-1.5 shrink-0 bg-blue-500" />
                <span className="text-sm font-medium text-gray-800">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Contabilità sempre in ordine.</h2>
          <p className="text-blue-50 mb-8">Prima nota, IVA, report. Tutto automatico. Demo gratuita.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
