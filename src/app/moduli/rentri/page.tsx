import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, FileText, Layers, Scale, ShieldCheck, Truck, Warehouse } from "lucide-react";


export const metadata: Metadata = {
  title: "RENTRI per autodemolitori: registro di carico e scarico e FIR",
  description: "Registro RENTRI di carico e scarico con movimento guidato, FIR digitali, vidimazione e trasmissione: il modulo rifiuti del gestionale per autodemolizioni.",
  alternates: { canonical: "/moduli/rentri" },
};

const MODULI_COLLEGATI = [
  { href: "/moduli/rvfu", title: "Registro Veicoli Fuori Uso", desc: "Presa in carico, fasi di lavorazione, certificato di rottamazione e radiazione al Registro Unico Telematico." },
  { href: "/moduli/piazzale", title: "Custodia veicoli", desc: "Posizione nel piazzale e conto giorni per i veicoli in attesa di lavorazione." },
  { href: "/moduli/sdi", title: "Fatturazione elettronica", desc: "Fatture e autofatture trasmesse con le notifiche di esito, senza uscire dal gestionale." },
];

export default function RENTRIPage() {
  return (
    <div className="bg-white">
      {/* HERO */}
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
            Registro RENTRI per autodemolitori e trasportatori<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            RENTRI è il Registro Elettronico Nazionale per la Tracciabilità dei Rifiuti. Nel gestionale tieni il registro di carico e scarico, compili i formulari FIR (formulario di identificazione del rifiuto) e li trasmetti senza passare dal portale: per l’autodemolitore che gestisce i rifiuti del piazzale e per il trasportatore che li porta a destinazione.
          </p>
        </div>
      </section>


      <section className="py-5 bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">Obbligatorio dal 13 febbraio 2025, a scaglioni: sostituisce il registro cartaceo e i formulari cartacei per chi produce, trasporta e gestisce rifiuti.</p>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Obbligatorio dal 2025 per chi produce e gestisce rifiuti</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Dal 13 febbraio 2025 il registro cartaceo dei rifiuti e i formulari cartacei vengono sostituiti da RENTRI, il registro elettronico del Ministero dell’Ambiente. Chi produce e gestisce rifiuti, incluse le autodemolizioni, deve registrare ogni movimento di carico e scarico e trasmetterlo. Chi non si adegua rischia una sanzione per ogni violazione.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Nel gestionale il registro RENTRI è integrato con il resto del lavoro: dalla pratica di demolizione avvii il movimento guidato con i dati del veicolo già compilati, i formulari FIR si creano dall’anagrafica, si vidimano e si trasmettono. Se hai più registri o più siti autorizzati, li gestisci dalla stessa schermata.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500">
                <p className="text-sm font-semibold text-gray-900">Obbligo di legge, non ignorabile</p>
                <p className="text-sm text-gray-600 mt-1">Sono previste sanzioni per la mancata iscrizione e per ogni registrazione tardiva. I controlli sono in corso su tutto il territorio.</p>
              </div>
              <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-gray-900">Con RescueManager</p>
                <p className="text-sm text-gray-600 mt-1">Movimento guidato di carico e scarico, FIR digitali vidimati e trasmessi, annullamento e correzione dei movimenti, stampa del modulo del registro. Tutto dal gestionale, senza tenere aperto un portale a parte.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

            {/* FEATURES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nel modulo</h2>
          <p className="text-gray-500 text-center mb-10">Il registro, i formulari e la giacenza in un posto solo, con i controlli che ti dicono dove qualcosa non torna.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <FileText className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Registro di carico e scarico, con il movimento guidato</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni carico e ogni scarico si registra rispondendo a domande scritte in italiano, non compilando un modulo pieno di sigle. Puoi indicare il giorno in cui il movimento è davvero avvenuto, collegare trasportatore e destinatario quando la causale li richiede, e agganciare la pratica di demolizione da cui il rifiuto arriva. Correzioni e annullamenti restano tracciati.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Truck className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Formulari e vidimazione digitale</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Il formulario si compila dai dati che hai già nel registro: produttore, trasportatore, destinatario, codice EER e quantità. Vidimazione digitale, stampa e formato xFIR per chi te lo chiede. Gli esiti del viaggio tornano sul formulario, così sai quali sono chiusi e quali aspettano ancora la quarta copia.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Scale className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Giacenza quadrata, e il controllo che dice dove sbaglia</h3>
              <p className="text-sm text-gray-600 leading-relaxed">La giacenza per codice EER si aggiorna a ogni movimento, tenuta separata per unità di misura: chili e pezzi non si sommano mai fra loro. Quando un codice non torna, il controllo non si limita a segnalare l&rsquo;errore: ti indica il movimento che sbilancia il conto e da che data.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Layers className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Dal veicolo demolito al registro, in tre tappe</h3>
              <p className="text-sm text-gray-600 leading-relaxed">I rifiuti che escono da una demolizione (olii, batterie, pneumatici, vetri, plastiche) entrano nel registro partendo dalla pratica del veicolo. Non riscrivi né la targa né i codici: scegli cosa hai tolto, indichi le quantità, il movimento è pronto. Alla fine un riepilogo dice quanto hai prodotto nel periodo, codice per codice.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Warehouse className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Isole di bonifica e spedizioni agli impianti</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Le postazioni di messa in sicurezza hanno il loro registro: cosa entra, cosa esce, quanto c&rsquo;è adesso. Quando spedisci a un impianto di recupero il gestionale scarica nell&rsquo;ordine in cui il materiale è arrivato, così la giacenza resta coerente con quello che c&rsquo;è davvero in piazzale.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <ShieldCheck className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Trasmissioni, certificati e un consulente sui tuoi dati</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni invio al RENTRI resta elencato con il suo esito, quindi sai sempre cosa è passato e cosa no. I certificati di analisi hanno le loro scadenze, con l&rsquo;avviso prima che scadano. E un consulente risponde alle domande leggendo i tuoi dati reali: autorizzazioni, giacenze, codici. Non scrive nel registro e non trasmette niente: dice cosa fare, poi lo fai tu.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CODICI EER */}
      <section className="py-10 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-5">Codici EER principali per autodemolizioni</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[["16 01 06","Veicoli fuori uso","Non pericoloso: il più comune per autodemolizioni"],["16 01 03","Pneumatici fuori uso","Non pericoloso: smaltimento tramite Ecopneus/PFU"],["16 01 07*","Filtri olio","Pericoloso: limite di giacenza ridotto"],["13 02 08*","Oli motore esausti","Pericoloso: conferimento al CONOU"],["16 01 21*","Componenti pericolosi","Pericoloso: catalizzatori, airbag e simili"],["16 01 22","Componenti non pericolosi","Non pericoloso: materiali riutilizzabili non classificati"]].map(([code,label,note]) => (
              <div key={code} className="p-4 bg-gray-50">
                <div className="font-mono text-green-700 font-bold mb-1">{code}</div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-1">{note}</p>
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
              <h3 className="font-bold text-gray-900 mb-2">Meno errori nei movimenti</h3>
              <p className="text-sm text-gray-600 leading-relaxed">La procedura guidata ti chiede i dati nell’ordine giusto e li controlla prima della trasmissione. Dalla demolizione il movimento nasce già collegato al veicolo, così il registro rifiuti e la pratica restano allineati senza doppio inserimento.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">FIR in minuti invece che in ore</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Creare un formulario cartaceo, compilarlo correttamente, farlo firmare e archiviare una copia richiedeva mezz’ora o più. Con i FIR digitali il formulario si crea in pochi minuti con i dati già precompilati, si vidima e si trasmette con un click. La copia è subito nel gestionale.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">A fine anno i dati sono già tutti registrati</h3>
              <p className="text-sm text-gray-600 leading-relaxed">La parte lunga della dichiarazione annuale è raccogliere i dati: rimettere insieme i movimenti, fare le somme per codice, controllare le unità di misura. Con il registro nel gestionale i movimenti dell’anno sono già tutti dentro, e il riepilogo per codice EER li somma per te: quello che serve a chi compila la dichiarazione lo trovi in un posto solo.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Pronto per i controlli dell’ARPA</h3>
              <p className="text-sm text-gray-600 leading-relaxed">In caso di ispezione dell’ARPA o della Polizia Ambientale devi poter esibire il registro aggiornato, i FIR degli ultimi anni e la documentazione di ogni conferimento. Nel gestionale hai tutto archiviato, ricercabile per data, codice EER o trasportatore, e il modulo di ogni movimento si stampa quando serve.</p>
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

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Il registro RENTRI dentro il gestionale.</h2>
          <p className="text-blue-50 mb-8">Obbligatorio dal 2025. Demo gratuita di 30 minuti, installazione inclusa.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
