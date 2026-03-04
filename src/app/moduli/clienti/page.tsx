import Link from "next/link";
import { ArrowLeft, Users, Phone, Mail, FileText, TrendingUp, History, ArrowRight } from "lucide-react";

export default function ClientiPage() {
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
            Clienti & CRM<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Anagrafica completa, storico servizi, preventivi e fatture. Tutto in un unico posto per privati, assicurazioni e aziende.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Users, color: "text-blue-600", title: "Anagrafica completa", desc: "Dati anagrafici, P.IVA/CF, PEC, contatti multipli e categorizzazione (privato, assicurazione, azienda)." },
              { icon: Phone, color: "text-green-600", title: "Contatti multipli", desc: "Gestisci più numeri di telefono, email e referenti per ogni cliente. Click-to-call integrato." },
              { icon: History, color: "text-purple-600", title: "Storico completo", desc: "Visualizza trasporti, preventivi, fatture e interazioni in ordine cronologico." },
              { icon: FileText, color: "text-amber-600", title: "Preventivi e offerte", desc: "Crea preventivi dalla scheda cliente, traccia stato: inviato, accettato, rifiutato." },
              { icon: TrendingUp, color: "text-red-600", title: "Statistiche cliente", desc: "Valore totale servizi, frequenza ordini, fatturato e marginalità per ogni cliente." },
              { icon: Mail, color: "text-blue-600", title: "Note e promemoria", desc: "Note interne, promemoria e tag per organizzare e segmentare i clienti." },
            ].map((f) => (
              <div key={f.title} className="p-6 border border-gray-200">
                <f.icon className={`h-6 w-6 ${f.color} mb-3`} />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Tipologie di Clienti</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[["Clienti Privati","Anagrafica semplificata, storico servizi e preferenze."],["Assicurazioni","Convenzioni, tariffari dedicati e referenti per ogni compagnia."],["Aziende & Flotte","Più sedi, flotte veicoli, contratti e condizioni dedicate."]].map(([t,d]) => (
              <div key={t} className="p-4 border border-gray-200 bg-white">
                <p className="font-bold text-gray-900 mb-1 text-sm">{t}</p>
                <p className="text-xs text-gray-500">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Centralizza tutti i tuoi clienti.</h2>
          <p className="text-blue-100 mb-8">CRM completo incluso in tutti i piani. Demo gratuita.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
