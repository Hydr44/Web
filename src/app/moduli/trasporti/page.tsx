import Link from "next/link";
import { ArrowLeft, MapPin, Users, BarChart3, CheckCircle2, ArrowRight, FileText, TrendingUp } from "lucide-react";

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
            Sistema completo per soccorso stradale e demolizioni: creazione trasporti, assegnazione autisti/mezzi, tracking su mappa, stati e storico. Tutto sincronizzato e tracciabile.
          </p>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Perché serve</h2>
          <p className="text-gray-600 mb-6">
            Ogni trasporto "fuori controllo" costa tempo: telefonate, messaggi, ritardi, dati persi.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-left mb-6">
            <div className="p-4 bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Non sai chi è disponibile</p>
            </div>
            <div className="p-4 bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Non sai dov'è il mezzo</p>
            </div>
            <div className="p-4 bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Non riesci a ricostruire tempi e responsabilità</p>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">
            Il modulo Trasporti centralizza tutto: richiesta, assegnazione, esecuzione e tracciamento.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Users, color: "text-blue-600", title: "Crea e gestisci trasporti", desc: "Creazione trasporto con cliente, indirizzo ritiro e consegna, note operative, assegnazione autista e mezzo. Modifica e gestione trasporti esistenti." },
              { icon: CheckCircle2, color: "text-green-600", title: "Stato trasporto", desc: "Ogni trasporto ha uno stato chiaro. Lo stato avanza in base alle azioni operative: quando assegni l'intervento, quando l'autista lo prende in carico e quando lo completa." },
              { icon: MapPin, color: "text-blue-600", title: "Tracking live su mappa", desc: "La mappa live mostra trasporti attivi, punti di ritiro e consegna, posizione più recente del mezzo/autista e selezione rapida del trasporto." },
              { icon: BarChart3, color: "text-gray-600", title: "GPS e posizioni", desc: "Quando il mezzo è configurato con il GPS, vedi la posizione precisa sulla mappa. Puoi aprire e verificare i punti anche su Google Maps." },
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

      {/* COME FUNZIONA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Come funziona</h2>
          <div className="space-y-4">
            {[
              { n: "1", title: "Crea un trasporto", desc: "Inserisci cliente, indirizzo di ritiro e consegna." },
              { n: "2", title: "Assegna autista e mezzo", desc: "Seleziona le risorse disponibili e aggiungi note operative." },
              { n: "3", title: "Segui l'esecuzione", desc: "Lo stato cambia automaticamente in base all'avanzamento dell'intervento." },
              { n: "4", title: "Controlla su mappa", desc: "Visualizza posizioni e percorso quando i dati GPS sono disponibili." },
              { n: "5", title: "Esporta e analizza", desc: "Porta i dati fuori dal gestionale per report e consuntivi. In più, a fine trasporto puoi generare una bozza fattura per il cliente." },
            ].map((s) => (
              <div key={s.n} className="flex gap-4 p-4 bg-white border border-gray-200">
                <div className="w-8 h-8 bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">{s.n}</div>
                <div>
                  <p className="font-bold text-gray-900 mb-1">{s.title}</p>
                  <p className="text-sm text-gray-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VANTAGGI */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Vantaggi</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Users, title: "Meno telefonate", desc: "Tutti vedono le stesse informazioni." },
              { icon: TrendingUp, title: "Tempi di intervento più rapidi", desc: "Assegnazione e gestione più ordinate." },
              { icon: FileText, title: "Tracciabilità", desc: "Storico trasporti, stati, note e posizione." },
              { icon: BarChart3, title: "Maggiore controllo costi", desc: "Dati pronti per report e analisi." },
            ].map((v) => (
              <div key={v.title} className="p-6 border border-gray-200">
                <v.icon className="h-6 w-6 text-blue-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INCLUSO */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start gap-3 p-6 border border-gray-200 bg-white">
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
