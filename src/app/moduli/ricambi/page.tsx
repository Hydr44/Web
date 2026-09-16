import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Package, Search, Car, MapPin, ArrowRight } from "lucide-react";


export const metadata: Metadata = {
  title: "Gestionale ricambi usati per autodemolizioni",
  description: "Magazzino ricambi usati per autodemolizioni: ogni pezzo parte dal veicolo demolito, va a scaffale e si ritrova con la mappa e il catalogo RicambiPro.",
  alternates: { canonical: "/moduli/ricambi" },
};

const MODULI_COLLEGATI = [
  { href: "/moduli/rvfu", title: "Registro Veicoli Fuori Uso", desc: "La pratica di demolizione da cui partono i ricambi: presa in carico, fasi di lavorazione e radiazione." },
  { href: "/moduli/rentri", title: "Registro RENTRI", desc: "Registro di carico e scarico e formulari FIR per quello che non diventa ricambio." },
];

const PERCORSO = [
  { n: "1", title: "Veicolo in demolizione", desc: "Il veicolo entra con dati e foto; dalla pratica di demolizione parte lo smontaggio dei pezzi riutilizzabili." },
  { n: "2", title: "Registrazione del pezzo", desc: "Foto, condizioni, voce del catalogo per compatibilità e posizione a scaffale." },
  { n: "3", title: "Ricerca e prelievo", desc: "Cerchi per veicolo compatibile o per nome, trovi la posizione sulla mappa e prelevi il pezzo." },
];

const RICERCA = [
  { title: "Veicolo compatibile", desc: "Marca, modello e anno del veicolo del cliente: il catalogo per compatibilità mostra i pezzi che montano." },
  { title: "Nome o categoria", desc: "Ricerca libera per nome del ricambio o categoria (per esempio “alternatore”)." },
  { title: "Veicolo di origine", desc: "Targa o telaio del veicolo demolito da cui è stato smontato il pezzo." },
  { title: "Posizione a scaffale", desc: "Scaffale, ripiano o posizione sulla mappa del magazzino." },
];

export default function RicambiPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">App Base</p>
          <div className="mb-5">
            <Link href="/autodemolizioni" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-white transition-colors">
              Fa parte del gestionale per autodemolizioni
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            Ricambi usati, dal veicolo allo scaffale<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Ogni veicolo che demolisci diventa ricambi da vendere. Il gestionale li registra a partire dal veicolo di origine, li mette sullo scaffale giusto e li ritrova con il catalogo per compatibilità (RicambiPro).
          </p>
        </div>
      </section>


      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 border border-gray-200">
            <Car className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Dal veicolo allo scaffale</h3>
            <p className="text-sm text-gray-600">
              Il ricambio nasce dalla pratica del veicolo in demolizione: marca, modello, telaio e foto sono già nel gestionale. Lo smonti, lo registri con foto e condizioni, gli assegni una posizione. Di ogni pezzo sai sempre da quale veicolo viene.
            </p>
          </div>

          <div className="p-6 border border-gray-200">
            <Search className="h-6 w-6 text-green-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Catalogo ricambi (RicambiPro)</h3>
            <p className="text-sm text-gray-600">
              Il catalogo per compatibilità ti dice su quali marche, modelli e anni monta un ricambio. Quando registri un pezzo lo colleghi alla voce di catalogo; quando un cliente chiede un ricambio per la sua auto, cerchi per veicolo e vedi subito cosa hai a magazzino.
            </p>
          </div>

          <div className="p-6 border border-gray-200">
            <Package className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Scaffali e posizioni</h3>
            <p className="text-sm text-gray-600">
              Organizzi il magazzino per scaffali, ripiani e posizioni. Quando serve un pezzo, il gestionale ti dice dove si trova, e le giacenze si aggiornano a ogni carico e a ogni uscita.
            </p>
          </div>

          <div className="p-6 border border-gray-200">
            <MapPin className="h-6 w-6 text-gray-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Mappa del magazzino</h3>
            <p className="text-sm text-gray-600">
              La mappa mostra gli scaffali come sono disposti nel capannone, con quanti pezzi ci sono in ogni posizione. Utile per trovare un ricambio al volo e per capire dove c’è ancora spazio.
            </p>
          </div>
        </div>
        </div>
      </section>

      <section className="py-10 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Il percorso di un ricambio</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {PERCORSO.map((s) => (
              <div key={s.n} className="flex gap-3 p-4 border border-gray-200 bg-white">
                <div className="w-8 h-8 bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">{s.n}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{s.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Modalità di ricerca</h3>
          <div className="space-y-3">
            {RICERCA.map((r) => (
              <div key={r.title} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-blue-500" />
                <div>
                  <div className="text-sm font-medium text-gray-800">{r.title}</div>
                  <div className="text-xs text-gray-500">{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULI COLLEGATI */}
      <section className="py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Moduli collegati</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {MODULI_COLLEGATI.map((m) => (
              <Link key={m.href} href={m.href} className="flex items-start justify-between gap-4 p-5 bg-gray-50 border border-gray-200 hover:border-blue-600 transition-colors">
                <div>
                  <p className="font-bold text-gray-900 mb-1">{m.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{m.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-blue-600 shrink-0 mt-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Il tuo magazzino ricambi organizzato.</h2>
          <p className="text-blue-50 mb-8">Dal veicolo allo scaffale, con il catalogo per compatibilità. Demo gratuita di 30 minuti.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
