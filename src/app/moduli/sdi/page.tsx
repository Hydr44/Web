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

      {/* FEATURES */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 border border-gray-200">
            <FileText className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Generazione XML FatturaPA</h3>
            <p className="text-sm text-gray-600">
              Creazione automatica file XML conforme alle specifiche tecniche v1.7.1. Validazione pre-invio e controllo errori formali.
            </p>
          </div>

          <div className="p-6 border border-gray-200">
            <Send className="h-6 w-6 text-green-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Invio Telematico SFTP</h3>
            <p className="text-sm text-gray-600">
              Trasmissione sicura via protocollo SFTP al Sistema di Interscambio. Firma digitale P7M e cifratura automatica dei file.
            </p>
          </div>

          <div className="p-6 border border-gray-200">
            <CheckCircle2 className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Gestione Notifiche SDI</h3>
            <p className="text-sm text-gray-600">
              Ricezione automatica di ricevute di consegna (RC), notifiche di accettazione (NS), mancata consegna (MC) e scarti (EC).
            </p>
          </div>

          <div className="p-6 border border-gray-200">
            <Download className="h-6 w-6 text-gray-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Fatture Passive</h3>
            <p className="text-sm text-gray-600">
              Import automatico fatture fornitori dal canale SDI. Parsing XML e registrazione in prima nota con collegamento contabile.
            </p>
          </div>
        </div>
        </div>
      </section>

      {/* AVANZATE */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Funzionalità Avanzate</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-800">Bollo Virtuale</div>
                <div className="text-xs text-gray-500">Gestione imposta di bollo da €2,00 con annotazione automatica nel XML</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-800">Ritenuta d'Acconto</div>
                <div className="text-xs text-gray-500">Calcolo automatico ritenuta 20% per professionisti con causale A</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-800">Cassa Previdenziale</div>
                <div className="text-xs text-gray-500">Gestione contributi previdenziali con aliquote personalizzabili</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-800">Conservazione Sostitutiva</div>
                <div className="text-xs text-gray-500">Archiviazione digitale a norma con marca temporale e firma elettronica</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-800">Numerazione Automatica</div>
                <div className="text-xs text-gray-500">Contatori progressivi per anno con gestione sezionali e note di credito</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATI */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Stati Fattura SDI</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-slate-500"></div>
              <span className="text-sm text-gray-700">Bozza</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-700">Inviata</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-gray-700">In Elaborazione</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-700">Consegnata</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-700">Scartata</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-sm text-gray-700">Mancata Consegna</span>
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
