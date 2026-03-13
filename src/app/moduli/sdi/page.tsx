import Link from "next/link";
import { ArrowLeft, FileText, Send, CheckCircle2, AlertCircle, Download, ArrowRight } from "lucide-react";

export default function SDIPage() {
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
            Fatturazione SDI<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            XML FatturaPA, invio telematico via nodo SFTP certificato, gestione notifiche e fatture passive. Tutto automatico.
          </p>
        </div>
      </section>


      {/* ALERT */}
      <section className="py-6 bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800 font-medium">Nodo SDI Certificato — integrazione diretta via SFTP con certificati digitali qualificati.</p>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Fattura elettronica obbligatoria per tutti, ma spesso fatta male</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Dal 2019 tutte le fatture tra soggetti IVA italiani devono transitare per il Sistema di Interscambio dell'Agenzia delle Entrate. Non puoi usare PDF via email, non puoi usare carta. Solo XML FatturaPA inviato tramite canale certificato SDI. Se il formato è sbagliato, o se usi il codice fiscale anziché la P.IVA nel campo giusto, la fattura viene scartata — e devi ricominciare da capo.
              </p>
              <p className="text-gray-600 leading-relaxed">
                RescueManager gestisce la fatturazione elettronica completamente integrata con il gestionale: la fattura si crea dai dati già presenti (cliente, intervento, importo), l'XML viene generato e validato automaticamente, l'invio avviene via SFTP sul nostro nodo SDI certificato, e le notifiche di risposta vengono scaricate e associate alla fattura in automatico. Zero errori di formato, zero accessi manuali al portale AdE.
              </p>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 border-l-4 border-red-400">
                <p className="text-sm font-semibold text-gray-900">Il problema comune</p>
                <p className="text-sm text-gray-600 mt-1">Fatture scartate da SDI per errori XML, notifiche non gestite, archiviazione non organizzata, reinvii manuali. Tempo perso e rischio di sanzioni per mancato invio nei termini.</p>
              </div>
              <div className="p-4 bg-gray-50 border-l-4 border-blue-500">
                <p className="text-sm font-semibold text-gray-900">Con RescueManager</p>
                <p className="text-sm text-gray-600 mt-1">XML generato e validato prima dell'invio, nodo SDI certificato, notifiche scaricate automaticamente, archiviazione digitale sicura, numerazione progressiva automatica.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa trovi nel modulo</h2>
          <p className="text-gray-500 text-center mb-10">Dalla creazione della fattura all&apos;archiviazione digitale, tutto automatico.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-200 bg-white">
              <FileText className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Creazione fatture con validazione XML</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Compili la fattura con il form del gestionale: scegli il cliente (i dati fiscali sono già presenti), inserisci le righe con descrizione, quantità e importo, selezioni aliquota IVA. Il sistema genera automaticamente l'XML FatturaPA conforme alle specifiche v1.7.1 dell'Agenzia delle Entrate e lo valida prima dell'invio. Se c'è un errore di formato, te lo segnala immediatamente — prima di inviare, non dopo che SDI lo scarta.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Send className="h-6 w-6 text-green-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Invio via nodo SDI certificato</h3>
              <p className="text-sm text-gray-600 leading-relaxed">L'invio avviene tramite il nostro nodo SDI certificato, connesso al Sistema di Interscambio via protocollo SFTP con certificati digitali qualificati. La fattura viene firmata digitalmente (formato P7M), cifrata e trasmessa in modo sicuro. Ogni invio ha un ID di trasmissione univoco tracciato nel sistema. Non devi accedere al portale AdE, non devi fare niente manualmente — clicchi "Invia" e il sistema pensa a tutto.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <CheckCircle2 className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Notifiche SDI gestite automaticamente</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Dopo l'invio, SDI risponde con una serie di notifiche: Ricevuta di Consegna (RC, fattura consegnata al destinatario), Notifica di Scarto (NS, errore nella fattura — rarissimo con il sistema che valida prima), Mancata Consegna (MC, destinatario non raggiungibile), Notifica Esito (NE, il cliente accetta o rifiuta). Se il cliente non risponde entro 15 giorni, la fattura si considera automaticamente accettata (Decorrenza Termini). Il gestionale scarica tutte queste notifiche, le associa alla fattura e aggiorna lo stato — senza che tu debba controllare niente.</p>
            </div>
            <div className="p-6 border border-gray-200 bg-white">
              <Download className="h-6 w-6 text-gray-600 mb-3" />
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-gray-900">Fatture passive</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase tracking-wide">Prossimamente: import automatico</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">Le fatture che ricevi dai tuoi fornitori transitano anch&apos;esse per SDI. Con un click puoi sincronizzare le fatture ricevute: RescueManager le scarica dal nodo, analizza l&apos;XML ed estrae i dati pronti per la contabilità. L&apos;import completamente automatico in background è in arrivo. Tutte le fatture sono archiviate in modo sicuro e sempre accessibili — la conservazione sostitutiva a norma di legge è in sviluppo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FUNZIONI AVANZATE */}
      <section className="py-12 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Funzioni avanzate incluse</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50">
              <p className="font-bold text-gray-900 mb-2">Bollo virtuale</p>
              <p className="text-sm text-gray-600 leading-relaxed">Per le fatture esenti IVA, l'imposta di bollo da €2,00 viene annotata automaticamente nel campo corretto dell'XML. Il sistema calcola quando il bollo è dovuto e lo gestisce in modo conforme, inclusa la dichiarazione trimestrale F24.</p>
            </div>
            <div className="p-4 bg-gray-50">
              <p className="font-bold text-gray-900 mb-2">Nota di credito (TD04)</p>
              <p className="text-sm text-gray-600 leading-relaxed">Se devi stornare una fattura già accettata da SDI, non puoi eliminarla — devi emettere una Nota di Credito TD04. Il gestionale la crea automaticamente con tutti i dati della fattura originale, pronta per la validazione e l'invio. Il collegamento tra fattura originale e nota di credito è tracciato in modo bidirezionale.</p>
            </div>
            <div className="p-4 bg-gray-50">
              <p className="font-bold text-gray-900 mb-2">Numerazione automatica</p>
              <p className="text-sm text-gray-600 leading-relaxed">Il gestionale assegna automaticamente il numero progressivo a ogni fattura, con contatori separati per anno. Se usi più sezionali (es. FT per fatture, NC per note di credito), puoi configurarli nel sistema. Il numero non viene mai duplicato o saltato.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATI */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-5">Stati fattura nel ciclo SDI</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[["bg-slate-400","Bozza","Fattura creata, non ancora inviata a SDI."],["bg-blue-500","Inviata","Trasmessa al Sistema di Interscambio."],["bg-amber-500","In elaborazione","SDI sta processando la trasmissione."],["bg-emerald-500","Consegnata","Fattura consegnata al destinatario da SDI."],["bg-red-500","Scartata","Errore nel formato — richiede correzione e reinvio."],["bg-purple-500","Mancata consegna","Destinatario non raggiunto — attende silenzio assenso."]].map(([c,l,d]) => (
              <div key={l} className="flex gap-3 p-3 bg-gray-50">
                <div className={`w-3 h-3 rounded-full ${c} mt-0.5 shrink-0`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{l}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VANTAGGI */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Cosa cambia nella tua operatività</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Zero fatture scartate da SDI</h3>
              <p className="text-sm text-gray-600 leading-relaxed">La validazione XML prima dell'invio blocca tutti gli errori di formato prima che raggiungano SDI. Errori come codice fiscale sbagliato, formato data non corretto, partita IVA non valida vengono segnalati immediatamente. Nel normale funzionamento, le fatture inviate vengono sempre accettate senza scarto.</p>
            </div>
            <div className="p-6 bg-white border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Niente portale Agenzia Entrate</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Molti usano il portale web dell'AdE per inviare le fatture una per una, scaricare le notifiche a mano, archiviare i file manualmente. Con RescueManager tutto questo non serve. Il nodo SDI certificato gestisce tutto in modo automatico — tu crei la fattura nel gestionale e poi devi solo aspettare la conferma.</p>
            </div>
            <div className="p-6 bg-white border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Fatture integrate con il CRM e la contabilità</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Dal trasporto puoi aprire la fattura con i dati del cliente e dell&apos;intervento già precompilati — non reinserisci nulla. Una volta inviata e confermata, puoi registrare la fattura in prima nota con i dati già pronti. Un flusso unico dall&apos;intervento alla registrazione contabile.</p>
            </div>
            <div className="p-6 bg-white border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-2">Commercialista felice</h3>
              <p className="text-sm text-gray-600 leading-relaxed">A fine periodo puoi esportare il registro delle fatture emesse e ricevute, il giornale di prima nota e i dati IVA in formato CSV o PDF. Il commercialista riceve dati già organizzati, senza dover ricostruire niente da file sparsi. Meno lavoro per entrambi, meno errori, meno costi di contabilità.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Fatturazione elettronica automatica.</h2>
          <p className="text-blue-100 mb-8">Nodo SDI certificato, zero configurazioni manuali. Demo gratuita.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
