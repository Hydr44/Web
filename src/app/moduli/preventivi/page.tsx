import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, Flag, ListChecks, Receipt, ShieldCheck, Users } from "lucide-react";


export const metadata: Metadata = {
  title: "Preventivi",
  description: "Crea preventivi professionali e convertili in interventi e fatture, senza reinserire i dati.",
  alternates: { canonical: "/moduli/preventivi" },
};

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

      {/* FEATURES */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nel modulo</h2>
          <p className="text-gray-500 text-center mb-10">Il preventivo si scrive in due minuti e diventa fattura senza riscrivere una riga.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200">
              <ListChecks className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Le voci che usi sempre, già pronte</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Voci preimpostate e prezzi dal listino: scegli, metti la quantità e il totale si fa da solo, IVA compresa. I lavori che preventivi ogni settimana non si riscrivono ogni volta.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <Users className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Il cliente arriva dall&rsquo;anagrafica</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Nome, indirizzo e dati fiscali sono già quelli giusti. Se il cliente è nuovo lo crei mentre scrivi il preventivo, senza perdere quello che hai già messo.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <ShieldCheck className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Si salva da solo mentre scrivi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">La bozza resta anche se chiudi il gestionale, se ti chiamano o se salta la corrente. Non hai mai bisogno di ricominciare da capo.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <FileText className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">PDF con il tuo marchio, e invio per email</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Il preventivo esce impaginato con il tuo logo e i tuoi dati, si stampa o parte per email senza uscire dal gestionale.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <Flag className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Stati e storico per cliente</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Bozza, inviato, accettato, rifiutato: sai sempre quali preventivi aspettano risposta. E dalla scheda del cliente vedi tutti quelli che gli hai fatto.</p>
            </div>
            <div className="p-6 border border-gray-200">
              <Receipt className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Duplica, oppure diventa ordine o fattura</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Un preventivo simile a uno già fatto si duplica in un attimo. Quando il cliente accetta, quello stesso preventivo diventa ordine o fattura: le righe non si riscrivono e non si sbagliano.</p>
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
          <p className="text-blue-50 mb-8">Calcolo automatico, PDF, conversione in fattura. Demo gratuita.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
