import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin, Filter, Car, ClipboardCheck, ArrowRight } from "lucide-react";


export const metadata: Metadata = {
  title: "Custodia veicoli e depositeria",
  description: "Custodia veicoli per soccorso stradale e autodemolizioni: posizioni nel piazzale, conto giorni, depositeria e verbale di riconsegna con firma via link.",
  alternates: { canonical: "/moduli/piazzale" },
};

const MODULI_COLLEGATI = [
  { href: "/moduli/trasporti", title: "Soccorso & trasporti", desc: "Dispatch degli interventi, app autisti e posizione dei mezzi sulla mappa: il veicolo recuperato entra in custodia direttamente dall’intervento." },
  { href: "/moduli/rvfu", title: "Registro Veicoli Fuori Uso", desc: "Dal piazzale alla pratica di demolizione: fasi di lavorazione, certificato di rottamazione e radiazione." },
];

export default function PiazzalePage() {
  return (
    <div className="bg-white">
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">App Base</p>
          <div className="mb-5 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/soccorso-stradale" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-white transition-colors">
              Fa parte del gestionale per il soccorso stradale
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/autodemolizioni" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-white transition-colors">
              Fa parte del gestionale per autodemolizioni
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            Custodia veicoli e depositeria<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Ogni veicolo in custodia ha una posizione, una data di ingresso e un conto giorni. Vale per il piazzale dell’autodemolizione e per la depositeria del soccorso stradale.
          </p>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Il problema della custodia veicoli non tracciata</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                In un’autodemolizione o in una depositeria il piazzale può contenere decine o centinaia di veicoli. Senza un registro organizzato, trovare una specifica auto richiede di girare fisicamente tra le file, chiedere ai colleghi, cercare su fogli scritti a mano. Se un cliente chiama per sapere quando può ritirare il suo veicolo, o quanto deve per i giorni di custodia, non sai rispondergli senza andare a controllare di persona.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Il modulo Custodia veicoli registra ogni veicolo con la sua posizione nel deposito, lo stato corrente e il conto giorni dall’ingresso. In qualsiasi momento, da qualsiasi postazione, vedi dove si trova ogni auto, da quanto tempo è lì e cosa serve fare per riconsegnarla.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border-l-4 border-red-400">
                <p className="text-sm font-semibold text-gray-900">Senza il gestionale</p>
                <p className="text-sm text-gray-600 mt-1">Fogli di carta, memoria e giri fisici per trovare i veicoli. Giorni di custodia contati a mano, riconsegne senza un verbale, spazio occupato da auto che andavano già spostate.</p>
              </div>
              <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-gray-900">Con il gestionale</p>
                <p className="text-sm text-gray-600 mt-1">Lista digitale aggiornata, posizione per settore, conto giorni automatico, storico movimenti e verbale di riconsegna firmato via link. Nessun veicolo perso, nessuna riconsegna senza traccia.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nel modulo</h2>
          <p className="text-gray-500 text-center mb-10">Tutto per gestire il deposito veicoli in modo ordinato e tracciabile.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <Car className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Registro veicoli in deposito</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni veicolo che entra in custodia viene registrato con targa, marca e modello, cliente di riferimento, data di ingresso, settore assegnato e stato. Puoi aggiungere foto, documenti allegati e note operative. Il registro è sempre aggiornato e accessibile da qualsiasi computer dell’ufficio.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <MapPin className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Posizioni e settori</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Il piazzale è diviso in settori configurabili (A1, B3, zona nord e così via). Quando registri un veicolo, assegni il settore e la posizione specifica. Quando il veicolo viene spostato, aggiorni la posizione in pochi secondi. Così chiunque può trovare qualsiasi auto senza fare il giro del piazzale o chiamare il collega che l’ha parcheggiata.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Filter className="h-6 w-6 text-purple-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Stati e filtri</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni veicolo ha uno stato che riflette la sua situazione: in attesa, in lavorazione, pronto per il ritiro, demolito, uscito. Puoi filtrare la lista per stato, cliente, data di ingresso, settore o tipo di veicolo. In pochi secondi vedi solo i veicoli che ti servono, per esempio tutti quelli pronti per il ritiro o tutti quelli in un certo settore.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <ClipboardCheck className="h-6 w-6 text-amber-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Conto giorni e verbale di riconsegna</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Per ogni veicolo il conto giorni parte dalla data di ingresso: sai sempre da quanto è fermo e quanti giorni di custodia vanno addebitati. Alla riconsegna generi il verbale con i dati del veicolo, di chi ritira e delle condizioni al momento dell’uscita, e lo fai firmare via link dal proprietario o dal delegato. La copia firmata resta nella scheda del veicolo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ADATTO A */}
      <section className="py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Adatto a queste attività</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 bg-gray-50">
              <p className="font-bold text-gray-900 mb-2">Autodemolizioni</p>
              <p className="text-sm text-gray-600 leading-relaxed">Traccia lo stato di lavorazione di ogni veicolo: appena entrato, in bonifica, smontaggio ricambi, pronto per il frantumatore. Collega la custodia al Registro Veicoli Fuori Uso (RVFU) per avere tutto in un’unica schermata.</p>
            </div>
            <div className="p-5 bg-gray-50">
              <p className="font-bold text-gray-900 mb-2">Depositeria</p>
              <p className="text-sm text-gray-600 leading-relaxed">Veicoli affidati in custodia in attesa del ritiro. Registri l’ingresso con i documenti, il conto giorni parte subito e alla riconsegna hai il verbale firmato. Tutto lo storico resta nella scheda del veicolo, pronto se serve ricostruire cosa è successo.</p>
            </div>
            <div className="p-5 bg-gray-50">
              <p className="font-bold text-gray-900 mb-2">Soccorso stradale</p>
              <p className="text-sm text-gray-600 leading-relaxed">Veicoli recuperati dopo un incidente o un guasto, in attesa del ritiro da parte del proprietario o dell’assicurazione. Sai chi deve ritirare cosa e da quanti giorni è fermo; alla consegna il verbale di riconsegna con firma via link chiude la pratica.</p>
            </div>
          </div>
        </div>
      </section>

      {/* VANTAGGI */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Cosa cambia nella tua operatività</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Trova ogni veicolo in secondi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Invece di fare il giro del piazzale o chiamare il collega, cerchi la targa nel gestionale e vedi subito: settore A3, fila 2, da 5 giorni, stato “in attesa di demolizione”. Risparmi decine di minuti al giorno, soprattutto nei periodi di punta con il piazzale pieno.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Spazio gestito meglio</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Vedere quanti veicoli ci sono in ogni settore e quali sono fermi da più tempo ti aiuta a usare meglio lo spazio. Individui subito i veicoli che occupano posto senza un’azione in corso e dai precedenza alla lavorazione o all’uscita di quelli più vecchi.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Conto giorni chiaro per ogni custodia</h3>
              <p className="text-sm text-gray-600 leading-relaxed">In depositeria i giorni di custodia sono soldi e responsabilità. Il conto parte dall’ingresso e si vede nella scheda del veicolo: niente calcoli a mano quando arriva il momento di riconsegnare o di addebitare la custodia.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Storico completo per ogni veicolo</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni spostamento, cambio di stato e operazione viene registrato con data, ora e operatore. Il verbale di riconsegna firmato chiude lo storico. Se nasce una contestazione su quando è entrato un veicolo, in che condizioni era o chi lo ha ritirato, hai una ricostruzione precisa e verificabile, utile anche in caso di controlli.</p>
            </div>
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
          <h2 className="text-3xl font-extrabold text-white mb-4">La custodia veicoli sempre sotto controllo.</h2>
          <p className="text-blue-50 mb-8">Posizioni, conto giorni, verbale di riconsegna. Demo gratuita di 30 minuti.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
