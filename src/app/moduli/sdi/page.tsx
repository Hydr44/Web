import Link from "next/link";
import { ArrowLeft, FileText, Send, CheckCircle2, AlertCircle, Download } from "lucide-react";

export default function SDIPage() {
  return (
    <main className="min-h-screen bg-[#141c27] pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla home
        </Link>

        <div className="mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 mb-6">
            <FileText className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Modulo Specializzato</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
            SDI - Fatturazione Elettronica
          </h1>
          <p className="text-lg text-slate-400 max-w-3xl">
            Sistema completo per la fatturazione elettronica via Sistema di Interscambio. Generazione XML FatturaPA, invio telematico e gestione notifiche SDI.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-8 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-blue-400 mb-1">Nodo SDI Certificato</h3>
            <p className="text-xs text-slate-400">
              Integrazione diretta con il Sistema di Interscambio tramite nodo SFTP certificato. Trasmissione sicura con certificati digitali qualificati.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Generazione XML FatturaPA</h3>
            <p className="text-sm text-slate-400">
              Creazione automatica file XML conforme alle specifiche tecniche v1.7.1. Validazione pre-invio e controllo errori formali.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
              <Send className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Invio Telematico SFTP</h3>
            <p className="text-sm text-slate-400">
              Trasmissione sicura via protocollo SFTP al Sistema di Interscambio. Firma digitale P7M e cifratura automatica dei file.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Gestione Notifiche SDI</h3>
            <p className="text-sm text-slate-400">
              Ricezione automatica di ricevute di consegna (RC), notifiche di accettazione (NS), mancata consegna (MC) e scarti (EC).
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
              <Download className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Fatture Passive</h3>
            <p className="text-sm text-slate-400">
              Import automatico fatture fornitori dal canale SDI. Parsing XML e registrazione in prima nota con collegamento contabile.
            </p>
          </div>
        </div>

        {/* Funzionalità avanzate */}
        <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044] mb-12">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Funzionalità Avanzate</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-200">Bollo Virtuale</div>
                <div className="text-xs text-slate-500">Gestione imposta di bollo da €2,00 con annotazione automatica nel XML</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-200">Ritenuta d'Acconto</div>
                <div className="text-xs text-slate-500">Calcolo automatico ritenuta 20% per professionisti con causale A</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-200">Cassa Previdenziale</div>
                <div className="text-xs text-slate-500">Gestione contributi previdenziali con aliquote personalizzabili</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-200">Conservazione Sostitutiva</div>
                <div className="text-xs text-slate-500">Archiviazione digitale a norma con marca temporale e firma elettronica</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-200">Numerazione Automatica</div>
                <div className="text-xs text-slate-500">Contatori progressivi per anno con gestione sezionali e note di credito</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stati fattura */}
        <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044] mb-12">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Stati Fattura SDI</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-slate-500"></div>
              <span className="text-sm text-slate-300">Bozza</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-slate-300">Inviata</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-slate-300">In Elaborazione</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-slate-300">Consegnata</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-slate-300">Scartata</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-slate-300">Mancata Consegna</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-slate-100 mb-2">Modulo a scelta nei piani</h3>
              <p className="text-sm text-slate-400">
                Disponibile come modulo selezionabile nei piani Starter (1 modulo), Professional (2 moduli), Business (3 moduli) o incluso nel piano Full.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex gap-4">
          <Link
            href="/contatti"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
          >
            Richiedi Demo
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#243044] bg-[#1a2536] text-slate-300 font-medium hover:bg-[#243044] transition-colors"
          >
            Scopri altri moduli
          </Link>
        </div>
      </div>
    </main>
  );
}
