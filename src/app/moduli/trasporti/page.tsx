import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Users, BarChart3, CheckCircle2, ArrowRight } from "lucide-react";

export default function TrasportiPage() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">App Base</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            Gestione Trasporti<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Sistema completo per soccorso stradale e demolizioni: dispatch, tracking GPS in tempo reale, calendario turni e rapportini digitali.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: MapPin, color: "text-blue-600", title: "Tracking GPS Live", desc: "Monitora in tempo reale la posizione dei mezzi con aggiornamenti ogni 30 secondi. Supporto Teltonika, Queclink, Concox e OBD2." },
              { icon: Calendar, color: "text-green-600", title: "Pianificazione Avanzata", desc: "Calendario con vista settimana/mese, assegnazione automatica autisti e mezzi, gestione priorità e ottimizzazione percorsi." },
              { icon: Users, color: "text-blue-600", title: "Dispatch Intelligente", desc: "Assegnazione automatica su disponibilità autisti, posizione GPS e tipo mezzo. Notifiche push istantanee sull'app mobile." },
              { icon: BarChart3, color: "text-gray-600", title: "Report e Analytics", desc: "KPI in tempo reale, statistiche per autista/mezzo, tempi medi di intervento e export CSV per analisi avanzate." },
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

      {/* STATI */}
      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Stati Trasporto</h3>
          <div className="flex flex-wrap gap-6">
            {[["bg-amber-500","Da Fare"],["bg-blue-500","In Corso"],["bg-emerald-500","Completato"],["bg-slate-400","In Attesa"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${c}`} />
                <span className="text-sm text-gray-700">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INCLUSO */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start gap-3 p-6 border border-gray-200">
            <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-gray-900 mb-1">Incluso in tutti i piani</p>
              <p className="text-sm text-gray-600">Il modulo Trasporti fa parte dell'App Base ed è incluso in tutti i piani.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Gestisci i trasporti senza caos.</h2>
          <p className="text-blue-100 mb-8">Demo gratuita, 30 minuti, personalizzata per la tua attività.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
