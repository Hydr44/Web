import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, Car, ArrowRight } from "lucide-react";

export default function RVFUPage() {
  return (
    <main className="bg-white">
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Modulo Specializzato</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            RVFU<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Integrazione diretta con il sistema MIT per radiazioni e demolizioni di veicoli fuori uso. Conforme D.Lgs. 209/2003.
          </p>
        </div>
      </section>

      <section className="py-5 bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">Obbligatorio per autodemolitori autorizzati — integrazione certificata MIT/PRA.</p>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">La demolizione è un processo regolamentato</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Il D.Lgs. 209/2003 impone agli autodemolitori autorizzati un processo preciso: dalla presa in carico del veicolo fuori uso, alla messa in sicurezza, alla bonifica ambientale, fino alla radiazione al PRA entro 30 giorni. Ogni fase ha scadenze obbligatorie, e saltarne una o rispettarla in ritardo espone a sanzioni significative.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Il modulo RVFU ti guida step-by-step attraverso tutte le 9 fasi previste dalla normativa, con scadenze automatiche, checklist operative per ogni fase e generazione automatica dei documenti obbligatori. Non devi ricordare nulla a memoria — è il sistema a dirti cosa fare e quando.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border-l-4 border-red-400">
                <p className="text-sm font-semibold text-gray-900">Senza un sistema strutturato</p>
                <p className="text-sm text-gray-600 mt-1">Rischio di saltare fasi obbligatorie, radiazioni in ritardo (multa fino a €1.549), certificati di rottamazione mancanti, documenti non archiviati correttamente.</p>
              </div>
              <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-gray-900">Con RescueManager RVFU</p>
                <p className="text-sm text-gray-600 mt-1">Workflow guidato con checklist per ogni fase, notifiche automatiche per le scadenze, radiazione PRA con un click, certificato di rottamazione generato automaticamente.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nel modulo</h2>
          <p className="text-gray-500 text-center mb-10">Dal ricevimento del veicolo alla radiazione PRA, tutto tracciato e guidato.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <Car className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Workflow demolizione in 9 fasi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Il sistema implementa l'intero processo D.Lgs. 209/2003: accettazione veicolo, messa in sicurezza (entro 3 gg), bonifica ambientale (entro 5 gg), smontaggio ricambi (entro 10 gg), smontaggio componenti (entro 15 gg), pesatura e classificazione, radiazione PRA (entro 30 gg), conferimento a frantumatore (entro 60 gg) e chiusura pratica. Ogni fase ha la sua checklist operativa e la sua scadenza tracciata.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <FileText className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Radiazione PRA automatica</h3>
              <p className="text-sm text-gray-600 leading-relaxed">La radiazione al Pubblico Registro Automobilistico è obbligatoria entro 30 giorni dalla presa in carico. Con il modulo RVFU, quando arrivi alla fase di radiazione il sistema compila automaticamente il modello MIT con i dati già presenti nel gestionale, lo valida e lo trasmette telematicamente. Ricevi conferma e il certificato di radiazione viene archiviato automaticamente nella pratica.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <CheckCircle2 className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Certificato di rottamazione</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Al completamento della demolizione, il sistema genera automaticamente il certificato di rottamazione conforme alla normativa, con tutti i dati del veicolo, del proprietario, del numero di pratica RVFU e della data di demolizione. Il certificato può essere stampato o inviato direttamente al proprietario. Una copia firmata viene archiviata nel gestionale per 10 anni.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <AlertCircle className="h-6 w-6 text-amber-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Scadenze, notifiche e registro</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Per ogni pratica attiva il sistema calcola le scadenze di ogni fase e ti avvisa quando si avvicinano. Se una fase rischia di andare oltre il termine previsto dalla normativa, ricevi una notifica urgente. Il registro storico di tutte le demolizioni è sempre consultabile con filtri per targa, telaio, data o stato. In caso di ispezione, hai tutto pronto e verificabile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 9 FASI */}
      <section className="py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Le 9 fasi del workflow (D.Lgs. 209/2003)</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {[["1","Accettazione","Verifica documenti e presa in carico"],["2","Messa in sicurezza","Entro 3 giorni: batteria, GPL, airbag"],["3","Bonifica ambientale","Entro 5 giorni: drenaggio fluidi pericolosi"],["4","Smontaggio ricambi","Entro 10 giorni: componenti riutilizzabili"],["5","Smontaggio componenti","Entro 15 giorni: catalizzatori, pneumatici"],["6","Pesatura","Peso carcassa e classificazione rifiuti"],["7","Radiazione PRA","Entro 30 giorni: invio modello MIT"],["8","Conferimento frantumatore","Entro 60 giorni: consegna carcassa"],["9","Completato","Archiviazione pratica e documenti"]].map(([n,t,d]) => (
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
              <p className="text-sm text-gray-600 leading-relaxed">Il D.Lgs. 209/2003 è complesso e le scadenze sono stringenti. Con il workflow guidato non devi ricordare cosa fare e quando — il sistema ti porta passo-passo attraverso ogni fase, con le checklist delle operazioni obbligatorie per ciascuna. Basta aprire la pratica e seguire le istruzioni.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Radiazioni nei tempi, zero more</h3>
              <p className="text-sm text-gray-600 leading-relaxed">La radiazione PRA è la scadenza più critica: 30 giorni dalla presa in carico. In passato molti autodemolitori la dimenticavano o la ritardavano, con sanzioni dirette. Adesso il sistema ti avvisa in anticipo e, quando sei pronto, la trasmissione telematica al MIT avviene in pochi click.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Integrazione automatica con RENTRI</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Quando durante la demolizione vengono prodotti rifiuti (oli, fluidi, componenti pericolosi), il sistema crea automaticamente i movimenti di carico nel registro RENTRI con i codici EER corretti. Non devi fare doppio inserimento — la demolizione e il registro rifiuti sono collegati.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Pronto per le ispezioni</h3>
              <p className="text-sm text-gray-600 leading-relaxed">In caso di controllo ispettivo, hai immediatamente disponibile il registro completo di tutte le demolizioni, con date, operatori, fasi completate e documenti allegati. La tracciabilità completa ti protegge anche in caso di contestazioni su pratiche passate.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Radiazioni RVFU senza errori.</h2>
          <p className="text-blue-100 mb-8">Integrazione certificata MIT. Demo gratuita, 30 minuti.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
