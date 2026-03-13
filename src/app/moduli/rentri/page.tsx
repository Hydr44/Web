import Link from "next/link";
import { ArrowLeft, Recycle, FileCheck, TrendingUp, AlertCircle, ArrowRight } from "lucide-react";

export default function RENTRIPage() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Modulo Specializzato</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            RENTRI<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Registro Elettronico Nazionale Rifiuti. Formulari digitali, registri carico/scarico, sincronizzazione con portale MASE. Obbligatorio dal 2025.
          </p>
        </div>
      </section>


      <section className="py-5 bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">Obbligatorio dal 13 Febbraio 2025 — sostituisce il registro cartaceo e i FIR per tutti i gestori di rifiuti.</p>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Obbligatorio dal 2025 per tutti i gestori di rifiuti</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Dal 13 febbraio 2025, il registro cartaceo dei rifiuti e i formulari cartacei non sono più accettati. Tutti i produttori e gestori di rifiuti — incluse le autodemolizioni — devono registrare ogni movimento di rifiuti (carico e scarico) in RENTRI, il Registro Elettronico Nazionale del Ministero dell'Ambiente. Chi non si adegua rischia sanzioni che partono da €2.600 e possono arrivare a €15.500 per singola violazione.
              </p>
              <p className="text-gray-600 leading-relaxed">
                RescueManager gestisce RENTRI in modo completamente integrato: ogni demolizione genera automaticamente i movimenti di carico rifiuti, i FIR vengono creati guidati e trasmessi con firma digitale, il registro è sempre aggiornato e sincronizzato col portale MASE. Non devi fare nulla a mano.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500">
                <p className="text-sm font-semibold text-gray-900">Obbligo di legge — non ignorabile</p>
                <p className="text-sm text-gray-600 mt-1">Sanzione per mancata iscrizione: da €2.600 a €15.500. Sanzione per registrazione tardiva: da €260 a €1.550 per movimento. I controlli sono in corso su tutto il territorio.</p>
              </div>
              <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-gray-900">Con RescueManager</p>
                <p className="text-sm text-gray-600 mt-1">Movimenti registrati automaticamente da ogni demolizione, FIR digitali con firma remota, sincronizzazione automatica col portale, avvisi su limiti di giacenza. Conformità garantita senza gestione manuale.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nel modulo</h2>
          <p className="text-gray-500 text-center mb-10">Tutto il necessario per la conformità RENTRI, senza gestione manuale.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <FileCheck className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Formulari digitali FIR</h3>
              <p className="text-sm text-gray-600 leading-relaxed">I Formulari di Identificazione Rifiuti sono obbligatori ogni volta che conferisci rifiuti a un trasportatore o a un impianto di destinazione. Con RescueManager li crei con un form guidato, tutti i dati del produttore, del rifiuto, del trasportatore e del destinatario sono già precompilati dal gestionale. Firma digitale integrata e invio telematico diretto a RENTRI, con tracciamento dello stato (inviato, accettato, firmato da controparte) e archiviazione automatica.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Recycle className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Registro carico e scarico automatico</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni demolizione che esegui genera automaticamente un movimento di carico nel registro RENTRI, con i codici EER corretti (16 01 06 per i veicoli fuori uso, 16 01 07* per i filtri olio, ecc.), il peso registrato e la data dell'operazione. Non devi inserire nulla manualmente. Il registro è sincronizzato in tempo reale col portale MASE e le giacenze per ogni codice EER sono sempre aggiornate.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <TrendingUp className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">MUD e dichiarazioni annuali</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Il Modello Unico di Dichiarazione ambientale si compila ogni anno entro il 30 aprile con i dati dell'anno precedente. Con RescueManager, tutti i movimenti registrati durante l'anno confluiscono automaticamente nel MUD. Puoi esportare il prospetto pre-compilato per il commercialista o per l'invio telematico diretto, senza dover raccogliere dati da fonti diverse o fare calcoli manuali.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <AlertCircle className="h-6 w-6 text-amber-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Alert limiti di giacenza</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Per i rifiuti pericolosi (codice EER con asterisco) il limite di giacenza è 10 giorni o quantità ridotte. Per i non pericolosi il limite è 30 m³ o 30 tonnellate. Superare questi limiti senza autorizzazione è una violazione. Il gestionale calcola automaticamente le giacenze per ogni codice EER e ti invia una notifica quando ti stai avvicinando alla soglia, in modo da poter organizzare un conferimento in tempo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CODICI EER */}
      <section className="py-10 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-5">Codici EER principali per autodemolizioni</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[["16 01 06","Veicoli fuori uso","Non pericoloso — il più comune per autodemolizioni"],["16 01 03","Pneumatici fuori uso","Non pericoloso — smaltimento tramite Ecopneus/PFU"],["16 01 07*","Filtri olio","Pericoloso — limite giacenza ridotto, 10 giorni"],["13 02 08*","Oli motore esausti","Pericoloso — gestione COOU obbligatoria"],["16 01 21*","Componenti pericolosi","Pericoloso — catalizzatori, airbag, ecc."],["16 01 22","Componenti non pericolosi","Non pericoloso — materiali riutilizzabili non classificati"]].map(([code,label,note]) => (
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
              <h3 className="font-bold text-gray-900 mb-2">Conformità automatica, zero errori</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Il registro si aggiorna automaticamente da ogni demolizione. I codici EER vengono assegnati in base al tipo di veicolo e ai componenti smontati. Non devi scegliere tu il codice giusto ogni volta — il sistema lo conosce già e lo applica in conformità con il catalogo europeo dei rifiuti (CER).</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">FIR in minuti invece che in ore</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Creare un formulario cartaceo, compilarlo correttamente, farlo firmare e archiviare una copia richiedeva mezz'ora o più. Con i FIR digitali di RescueManager, il formulario si crea in 5 minuti con i dati già precompilati, si firma digitalmente e si invia con un click. La copia archiviata è disponibile subito nel gestionale.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">MUD senza raccogliere dati da zero</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Chi gestisce il MUD manualmente sa quanto è lungo: raccogliere i dati da registri cartacei, fare somme, verificare i codici EER, controllare le giacenze. Con RescueManager tutto questo lavoro è già fatto — i movimenti dell'anno sono nel gestionale e il prospetto MUD si genera automaticamente.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Pronto per i controlli dell'ARPA</h3>
              <p className="text-sm text-gray-600 leading-relaxed">In caso di ispezione da parte dell'ARPA o della Polizia Ambientale, devi poter esibire il registro aggiornato, i FIR degli ultimi anni e la documentazione di ogni conferimento. Con RescueManager hai tutto archiviato digitalmente, ricercabile per data, codice EER o trasportatore, esportabile in qualsiasi momento.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Conformità RENTRI garantita.</h2>
          <p className="text-blue-100 mb-8">Obbligatorio dal 2025. Noi lo gestiamo per te. Demo gratuita.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
