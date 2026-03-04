import Link from "next/link";
import { ArrowLeft, TrendingUp, FileText, CheckCircle2, Receipt, PieChart, ArrowRight } from "lucide-react";

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
            Prima nota, partita doppia, piano dei conti. Report finanziari integrati con fatturazione SDI e IVA liquidazione automatica.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200">
              <Receipt className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Prima Nota</h3>
              <p className="text-sm text-gray-600">
                Piano dei conti personalizzabile con struttura gerarchica. Conti patrimoniali, economici, costi e ricavi. Codifica standard italiana.
              </p>
            </div>

            <div className="p-6 border border-gray-200">
              <PieChart className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Report Finanziari</h3>
              <p className="text-sm text-gray-600">
                Registrazione movimenti contabili con partita doppia automatica. Dare/Avere, causali predefinite e ricerca avanzata per periodo e conto.
              </p>
            </div>

            <div className="p-6 border border-gray-200">
              <TrendingUp className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Partita Doppia</h3>
              <p className="text-sm text-gray-600">
                Bilancio di verifica, conto economico e stato patrimoniale. Report personalizzabili per periodo con export Excel e PDF.
              </p>
            </div>

            <div className="p-6 border border-gray-200">
              <FileText className="h-6 w-6 text-gray-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">IVA e Liquidazioni</h3>
              <p className="text-sm text-gray-600">
                Registrazione automatica fatture attive e passive da SDI. Collegamento diretto tra fattura elettronica e movimento contabile.
              </p>
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
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm font-medium text-gray-800">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Contabilità sempre in ordine.</h2>
          <p className="text-blue-100 mb-8">Prima nota, IVA, report. Tutto automatico. Demo gratuita.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
