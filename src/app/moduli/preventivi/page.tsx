import Link from "next/link";
import { ArrowLeft, FileText, Calculator, Send, CheckCircle, Clock, TrendingUp, ArrowRight } from "lucide-react";

export default function PreventiviPage() {
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
            Preventivi<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Preventivi professionali in pochi click. Calcolo automatico, PDF con logo, invio email e conversione diretta in fattura.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 border border-gray-200">
              <Calculator className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Calcolo automatico</h3>
              <p className="text-sm text-gray-600">Aggiungi voci, quantità e prezzi. Subtotali, IVA e totale calcolati automaticamente.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <FileText className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Template personalizzabili</h3>
              <p className="text-sm text-gray-600">Template con voci ricorrenti per velocizzare la creazione di preventivi simili.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <Send className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Invio email e PDF</h3>
              <p className="text-sm text-gray-600">Invia via email con PDF allegato, logo aziendale e testo personalizzato.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <Clock className="h-6 w-6 text-purple-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Tracking stato</h3>
              <p className="text-sm text-gray-600">Traccia stato: bozza, inviato, visualizzato, accettato, rifiutato, scaduto.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <CheckCircle className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Conversione in fattura</h3>
              <p className="text-sm text-gray-600">Quando il cliente accetta, converti in fattura con un solo click.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <TrendingUp className="h-6 w-6 text-amber-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Statistiche conversione</h3>
              <p className="text-sm text-gray-600">Tasso di conversione, valore medio e tempi di risposta clienti.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Flusso Operativo</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            {[["1","Crea","Cliente, voci, prezzi"],["2","Invia","Email + PDF con logo"],["3","Traccia","Stato e visualizzazioni"],["4","Converti","In fattura SDI"]].map(([n,t,d]) => (
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
          <h2 className="text-3xl font-extrabold text-white mb-4">Preventivi professionali in minuti.</h2>
          <p className="text-blue-100 mb-8">Calcolo automatico, PDF, conversione in fattura. Demo gratuita.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
