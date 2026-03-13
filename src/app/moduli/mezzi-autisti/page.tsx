import Link from "next/link";
import { ArrowLeft, Truck, UserCheck, Wrench, Clock, ArrowRight } from "lucide-react";

export default function MezziAutistiPage() {
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
            Mezzi & Autisti<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Gestione flotta veicoli e personale operativo. Scadenze automatiche, turni e assegnazioni intelligenti.
          </p>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Perché serve</h2>
          <p className="text-gray-600 mb-6">
            Gestire mezzi e autisti senza un sistema centrale significa scadenze dimenticate, nessuna visibilità su disponibilità e costi fuori controllo.
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-left mb-6">
            <div className="p-4 bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Scadenze dimenticate (multe e fermi)</p>
            </div>
            <div className="p-4 bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Nessuna visibilità su chi è disponibile</p>
            </div>
            <div className="p-4 bg-white border border-gray-200">
              <p className="text-sm text-gray-600">Costi di manutenzione fuori controllo</p>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900">
            Il modulo Mezzi & Autisti centralizza tutto: anagrafica, scadenze, turni e posizioni in tempo reale.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nel modulo</h2>
          <p className="text-gray-500 text-center mb-10">Tutto per gestire flotta e personale senza telefonate e senza sorprese.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <Truck className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Anagrafica completa dei mezzi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Per ogni mezzo della flotta hai una scheda con targa, telaio, marca e modello, anno di immatricolazione, foto e documenti allegati. Puoi classificare il tipo di mezzo (carro attrezzi, pianale, furgone) così da assegnare sempre il veicolo giusto all'intervento giusto. Tutte le scadenze — revisione, assicurazione, bollo, tachigrafo — sono tracciate automaticamente e ti avvisano in anticipo.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <UserCheck className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Gestione autisti e personale</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Per ogni autista salvi nome, numero di telefono, email, tipo di patente e abilitazioni specifiche (es. patente C, CQC, abilitazione transpallet). Puoi impostare i turni di disponibilità e vedere chi è in servizio in un determinato momento. Il sistema ti avvisa anche quando una patente o un attestato è in scadenza, evitando che un autista lavori con documenti non validi.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Clock className="h-6 w-6 text-amber-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Scadenze automatiche su tutto</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Il sistema monitora in autonomia tutte le scadenze critiche: revisione del mezzo, scadenza assicurazione, bollo, taratura tachigrafo, validità delle patenti degli autisti. Puoi configurare con quanto anticipo ricevere la notifica — ad esempio 30 giorni prima della revisione. In questo modo nessun mezzo rischia di andare in giro fuori norma e nessuna multa arriva per sorpresa.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Wrench className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Manutenzioni e costi flotta</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Puoi pianificare le manutenzioni periodiche per ogni mezzo — tagliando, cambio gomme, controllo freni — in base ai chilometri percorsi o a una scadenza temporale. Lo storico degli interventi di manutenzione è sempre consultabile, con date e costi registrati. Questo ti permette di capire quali mezzi costano di più da mantenere e quando conviene sostituirli.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SCADENZE */}
      <section className="py-10 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-5">Scadenze monitorate automaticamente</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            {[["Revisione","Obbligatoria per legge ogni 1-2 anni. Il sistema ti avvisa 30 giorni prima."],["Assicurazione","Scadenza polizza RCA. Nessun mezzo circola scoperto per distrazione."],["Bollo","Tassa annuale. Il sistema ricorda la scadenza con anticipo configurabile."],["Tachigrafo","Taratura obbligatoria ogni 2 anni per i mezzi soggetti. Tracciata automaticamente."]].map(([t,d]) => (
              <div key={t} className="p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="text-sm font-bold text-gray-900">{t}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VANTAGGI */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Cosa cambia nella gestione operativa</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Nessuna multa per scadenza dimenticata</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Revisione, assicurazione, bollo, tachigrafo: sono tutte scadenze critiche che, se dimenticate, generano problemi legali e costi imprevisti. Con le notifiche automatiche configuri una volta le date e il sistema pensa a ricordartelo in anticipo, senza che tu debba tenere un calendario separato.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Assegnazioni più rapide e precise</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Quando arriva una richiesta di intervento, vedi subito quali autisti sono in turno e quali mezzi sono disponibili. Puoi filtrare per tipo di mezzo necessario (es. solo carri attrezzi) e assegnare in pochi secondi senza dover chiamare tutti uno per uno per capire chi è libero.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Controllo reale dei costi di flotta</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Tenere traccia di quanto costa ogni mezzo — assicurazione, manutenzioni, riparazioni straordinarie — è fondamentale per valutare quando conviene sostituirlo. Con lo storico manutenzioni e i costi registrati nel gestionale hai un quadro preciso per ogni veicolo, senza dover raccogliere i dati da fatture cartacee e scontrini.</p>
            </div>
            <div className="p-6 bg-gray-50 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Tutto accessibile anche da remoto</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Che tu sia in ufficio, in piazzale o fuori, puoi consultare la scheda di qualsiasi mezzo o autista dal gestionale. Se un autista ti chiama per un problema al mezzo, hai subito sotto mano la targa, il telaio e lo storico manutenzioni per parlare con l'officina — senza tornare in ufficio a cercare i documenti.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Flotta sempre operativa.</h2>
          <p className="text-blue-100 mb-8">Scadenze, turni, dispatch automatico. Demo gratuita, 30 minuti.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
