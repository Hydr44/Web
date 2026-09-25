import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, CreditCard, LayoutGrid, ListChecks, PenLine, Search, ShieldCheck } from "lucide-react";


export const metadata: Metadata = {
  title: "Registro veicoli fuori uso (RVFU): radiazione e rottamazione",
  description: "Modulo RVFU del gestionale per autodemolizioni: presa in carico, fasi di lavorazione, certificato di rottamazione e radiazione al Registro Unico Telematico.",
  alternates: { canonical: "/moduli/rvfu" },
};

const MODULI_COLLEGATI = [
  { href: "/moduli/rentri", title: "Registro RENTRI", desc: "Registro di carico e scarico e formulari FIR per i rifiuti prodotti dalla demolizione." },
  { href: "/moduli/ricambi", title: "Ricambi usati", desc: "I pezzi smontati dal veicolo vanno a magazzino, con scaffali, mappa e catalogo per compatibilità." },
  { href: "/moduli/piazzale", title: "Custodia veicoli", desc: "Posizione nel piazzale e conto giorni per ogni veicolo in attesa di lavorazione." },
];

export default function RVFUPage() {
  return (
    <div className="bg-white">
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">Modulo Specializzato</p>
          <div className="mb-5">
            <Link href="/autodemolizioni" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-white transition-colors">
              Fa parte del gestionale per autodemolizioni
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            Registro veicoli fuori uso (RVFU)<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Presa in carico del veicolo, fasi di lavorazione, certificato di rottamazione e radiazione trasmessa al Registro Unico Telematico dei veicoli fuori uso (RVFU), il collegamento con ACI e Ministero previsto dal D.Lgs. 209/2003.
          </p>
        </div>
      </section>

      <section className="py-5 bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">Per gli autodemolitori autorizzati: la radiazione del veicolo passa dal Registro Unico Telematico (RVFU), collegato al PRA, il Pubblico Registro Automobilistico, tramite ACI e Ministero.</p>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">La demolizione è un processo regolamentato</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Il D.Lgs. 209/2003 impone agli autodemolitori autorizzati un processo preciso: dalla presa in carico del veicolo fuori uso, alla messa in sicurezza, alla bonifica ambientale, fino alla radiazione al PRA entro 30 giorni. Ogni passaggio va documentato, e saltarne uno o arrivare in ritardo alla radiazione espone a sanzioni.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Il modulo RVFU del gestionale ti guida fase per fase nella lavorazione, con le fasi sempre visibili sulla pratica e i documenti generati dai dati già inseriti. Non devi ricordare nulla a memoria: apri la pratica e vedi a che punto sei e cosa resta da fare.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border-l-4 border-red-400">
                <p className="text-sm font-semibold text-gray-900">Senza un sistema strutturato</p>
                <p className="text-sm text-gray-600 mt-1">Rischio di saltare fasi obbligatorie, radiazioni in ritardo e relative sanzioni, certificati di rottamazione mancanti, documenti non archiviati correttamente.</p>
              </div>
              <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-gray-900">Con il modulo RVFU di RescueManager</p>
                <p className="text-sm text-gray-600 mt-1">Pratica guidata fase per fase, con la data di presa in carico sempre in vista per i 30 giorni della radiazione, radiazione trasmessa al Registro Unico Telematico con un click, certificato di rottamazione generato dalla pratica.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

            {/* FEATURES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nel modulo</h2>
          <p className="text-gray-500 text-center mb-10">La pratica di radiazione dalla targa al certificato, senza uscire dal gestionale.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <Search className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">La pratica parte dalla targa</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Cerchi il veicolo al PRA e i dati arrivano da soli: proprietario, marca, modello, telaio, situazione della targa. Se il veicolo non è radiabile lo scopri subito, non a metà pratica.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <ListChecks className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Le fasi del registro, una alla volta</h3>
              <p className="text-sm text-gray-600 leading-relaxed">La lavorazione mostra a che punto è la pratica e cosa manca per andare avanti. Ogni fase registra chi l&rsquo;ha fatta e quando, e i documenti restano attaccati alla pratica.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <LayoutGrid className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">La bacheca delle pratiche aperte</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Tutte le pratiche incolonnate per fase: vedi a colpo d&rsquo;occhio dove si stanno accumulando e quali sono ferme da troppo. Da lì apri la pratica e la sblocchi.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <PenLine className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Deleghe dei concessionari</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Le deleghe si creano, si consultano per codice fiscale, si revocano e si stampano. Ognuna ha il suo stato, così sai sempre per quali veicoli sei autorizzato a operare.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <CreditCard className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pagamenti PagoPA</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Gli avvisi di pagamento legati alle pratiche, con la loro situazione. Quello che va pagato si vede dalla pratica, senza aprire un altro portale e senza cercare il numero dell&rsquo;avviso.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <ShieldCheck className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Certificato di rottamazione</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Trasmessa la radiazione, il certificato per il cliente esce dalla pratica già compilato. Il proprietario se ne va con il documento in mano lo stesso giorno.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9 FASI */}
      <section className="py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Le fasi della pratica</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {[["1","Presa in carico","Verifica documenti, dati e foto del veicolo"],["2","Messa in sicurezza","Batteria, GPL, airbag"],["3","Bonifica ambientale","Drenaggio dei fluidi pericolosi"],["4","Smontaggio ricambi","Componenti riutilizzabili"],["5","Smontaggio componenti","Catalizzatori, pneumatici"],["6","Pesatura","Peso carcassa e classificazione rifiuti"],["7","Radiazione","Entro 30 giorni (D.Lgs. 209/2003): trasmissione al Registro Unico Telematico"],["8","Conferimento frantumatore","Consegna della carcassa"],["9","Completato","Archiviazione pratica e documenti"]].map(([n,t,d]) => (
              <div key={n} className="flex gap-3 p-3 bg-gray-50">
                <span className="text-xl font-extrabold text-blue-500 shrink-0 w-6">{n}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{t}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VANTAGGI */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Cosa cambia nella tua operatività</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Conformità normativa senza stress</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Il D.Lgs. 209/2003 è complesso. Con la pratica guidata non devi ricordare cosa fare e quando: la pratica ti porta passo dopo passo attraverso ogni fase e ti mostra cosa resta da fare. Basta aprirla e seguire l’ordine.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Radiazioni nei tempi, zero more</h3>
              <p className="text-sm text-gray-600 leading-relaxed">La radiazione al PRA è la scadenza più critica: 30 giorni dalla presa in carico. Dimenticarla o ritardarla significa sanzioni dirette. Nella pratica vedi da quanti giorni il veicolo è in carico e, quando sei pronto, la trasmissione al Registro Unico Telematico avviene in pochi click.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Collegato al registro RENTRI</h3>
              <p className="text-sm text-gray-600 leading-relaxed">I rifiuti prodotti durante la demolizione (oli, fluidi, componenti pericolosi) vanno nel registro di carico e scarico RENTRI. Dalla pratica di demolizione avvii il movimento guidato con i dati del veicolo già compilati: la demolizione e il registro rifiuti restano collegati, senza doppio inserimento.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Pronto per le ispezioni</h3>
              <p className="text-sm text-gray-600 leading-relaxed">In caso di controllo ispettivo hai subito disponibile l’archivio completo di tutte le demolizioni, con date, operatori, fasi completate e documenti allegati. La tracciabilità completa ti protegge anche in caso di contestazioni su pratiche passate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MODULI COLLEGATI */}
      <section className="py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Moduli collegati</h2>
          <div className="grid md:grid-cols-3 gap-4">
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

      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Radiazioni e certificati senza errori.</h2>
          <p className="text-blue-50 mb-8">Collegamento al Registro Unico Telematico, con ACI e Ministero dei Trasporti. Demo gratuita di 30 minuti, installazione inclusa.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
