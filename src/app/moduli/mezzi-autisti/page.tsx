import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BellRing, Clock, ShieldCheck, Smartphone, Truck, Wrench } from "lucide-react";


export const metadata: Metadata = {
  title: "Mezzi e autisti",
  description: "Gestisci flotta e autisti: disponibilità, assegnazioni, scadenze e tracking dei mezzi in tempo reale.",
  alternates: { canonical: "/moduli/mezzi-autisti" },
};

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
          <p className="text-gray-500 text-center mb-10">Chi è libero, quale mezzo puoi mandare e cosa scade la settimana prossima.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <Truck className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Anagrafica dei mezzi</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Carri attrezzi, autogru, furgoni e vetture di servizio con targa, telaio, allestimento, portata e note. Ogni mezzo ha la sua scheda con lo storico degli interventi che ha fatto e dei costi che ha generato.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <BellRing className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Le scadenze ti avvisano prima</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Revisione, assicurazione, bollo e tachigrafo per i mezzi; patente, CQC e carta tachigrafica per gli autisti. Il gestionale le tiene d&rsquo;occhio e te le mette davanti prima che scadano, non il giorno dopo.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Clock className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Chi è libero adesso</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Mezzi e autisti hanno uno stato sempre aggiornato: disponibile, in uso, in manutenzione, fuori servizio, non in linea. Quando arriva la chiamata non devi telefonare a nessuno per sapere chi può partire.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Smartphone className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">L&rsquo;app del telefono per gli autisti</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Ogni autista si collega alla sua app con le proprie credenziali e vede solo i moduli che gli hai dato. Da lì riceve gli interventi, apre il navigatore, aggiorna lo stato, scatta le foto e raccoglie la firma del cliente.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Wrench className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Manutenzioni e costi per mezzo</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Registri gli interventi di manutenzione, i ricambi montati e le spese. Alla fine sai quanto ti costa davvero ogni carro, non quanto pensavi che costasse.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <ShieldCheck className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Chi entra nel gestionale e cosa può fare</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Utenti e ruoli: chi vede le fatture, chi tocca il registro dei rifiuti, chi può solo prendere le chiamate. Ognuno entra con le proprie credenziali e resta traccia di chi ha fatto cosa.</p>
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
          <p className="text-blue-50 mb-8">Scadenze, turni, dispatch automatico. Demo gratuita, 30 minuti.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
