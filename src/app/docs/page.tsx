import Link from "next/link";
import { ArrowLeft, BookOpen, FileText, Video, Code, HelpCircle, Zap } from "lucide-react";

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#141c27] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna alla home
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
            Documentazione
          </h1>
          <p className="text-lg text-slate-400 max-w-3xl">
            Guide, tutorial e risorse per sfruttare al massimo RescueManager. Tutto quello che ti serve per iniziare e diventare un esperto.
          </p>
        </div>

        {/* Quick Start */}
        <div className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border border-blue-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-100 mb-2">Quick Start</h2>
              <p className="text-slate-400 mb-4">
                Inizia subito con RescueManager. Segui la nostra guida rapida per configurare il tuo account e iniziare a gestire i trasporti.
              </p>
              <Link
                href="/docs/quick-start"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
              >
                Inizia Ora
              </Link>
            </div>
          </div>
        </div>

        {/* Categorie documentazione */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Guide Introduttive */}
          <Link
            href="/docs/guide"
            className="group p-6 rounded-2xl bg-[#1a2536] border border-[#243044] hover:border-blue-500/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Guide Introduttive</h3>
            <p className="text-sm text-slate-400">
              Impara le basi di RescueManager con guide passo-passo per ogni funzionalità.
            </p>
          </Link>

          {/* Tutorial Video */}
          <Link
            href="/docs/video"
            className="group p-6 rounded-2xl bg-[#1a2536] border border-[#243044] hover:border-emerald-500/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Video className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Tutorial Video</h3>
            <p className="text-sm text-slate-400">
              Video tutorial per imparare visivamente come utilizzare ogni modulo.
            </p>
          </Link>

          {/* API Reference */}
          <Link
            href="/docs/api"
            className="group p-6 rounded-2xl bg-[#1a2536] border border-[#243044] hover:border-purple-500/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Code className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">API Reference</h3>
            <p className="text-sm text-slate-400">
              Documentazione completa delle API per integrazioni personalizzate.
            </p>
          </Link>

          {/* FAQ */}
          <Link
            href="/docs/faq"
            className="group p-6 rounded-2xl bg-[#1a2536] border border-[#243044] hover:border-amber-500/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HelpCircle className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">FAQ</h3>
            <p className="text-sm text-slate-400">
              Risposte alle domande più frequenti su funzionalità e abbonamenti.
            </p>
          </Link>

          {/* Moduli */}
          <Link
            href="/docs/moduli"
            className="group p-6 rounded-2xl bg-[#1a2536] border border-[#243044] hover:border-blue-500/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Documentazione Moduli</h3>
            <p className="text-sm text-slate-400">
              Guide dettagliate per RVFU, RENTRI, SDI, Contabilità e tutti i moduli.
            </p>
          </Link>

          {/* Best Practices */}
          <Link
            href="/docs/best-practices"
            className="group p-6 rounded-2xl bg-[#1a2536] border border-[#243044] hover:border-emerald-500/50 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Best Practices</h3>
            <p className="text-sm text-slate-400">
              Consigli e strategie per ottimizzare il tuo flusso di lavoro.
            </p>
          </Link>
        </div>

        {/* Articoli popolari */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-slate-100 mb-6">Articoli Popolari</h2>
          <div className="space-y-4">
            <Link
              href="/docs/guide/primo-trasporto"
              className="block p-6 rounded-xl bg-[#1a2536] border border-[#243044] hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-slate-100 mb-2">Come creare il tuo primo trasporto</h3>
                  <p className="text-sm text-slate-400">
                    Guida passo-passo per registrare un nuovo trasporto, assegnare autista e mezzo, e tracciare il servizio.
                  </p>
                </div>
                <span className="text-xs text-blue-400 font-medium whitespace-nowrap">5 min</span>
              </div>
            </Link>

            <Link
              href="/docs/moduli/rentri-setup"
              className="block p-6 rounded-xl bg-[#1a2536] border border-[#243044] hover:border-emerald-500/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-slate-100 mb-2">Configurare il modulo RENTRI</h3>
                  <p className="text-sm text-slate-400">
                    Setup iniziale del registro rifiuti, configurazione codici EER e creazione del primo formulario.
                  </p>
                </div>
                <span className="text-xs text-emerald-400 font-medium whitespace-nowrap">8 min</span>
              </div>
            </Link>

            <Link
              href="/docs/moduli/sdi-certificati"
              className="block p-6 rounded-xl bg-[#1a2536] border border-[#243044] hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-slate-100 mb-2">Installare i certificati SDI</h3>
                  <p className="text-sm text-slate-400">
                    Come ottenere e configurare i certificati digitali per la fatturazione elettronica via SDI.
                  </p>
                </div>
                <span className="text-xs text-purple-400 font-medium whitespace-nowrap">10 min</span>
              </div>
            </Link>
          </div>
        </div>

        {/* CTA Supporto */}
        <div className="mt-16 p-8 rounded-2xl bg-[#1a2536] border border-[#243044]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-100 mb-3">Non trovi quello che cerchi?</h2>
            <p className="text-slate-400 mb-6">
              Il nostro team di supporto è sempre disponibile per aiutarti.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contatti"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
              >
                Contatta il Supporto
              </Link>
              <Link
                href="/docs/faq"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#243044] bg-[#1a2536] text-slate-300 font-medium hover:bg-[#243044] transition-colors"
              >
                Leggi le FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
