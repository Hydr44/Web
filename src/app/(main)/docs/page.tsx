import Link from "next/link";
import { BookOpen, FileText, Video, Code, HelpCircle, Zap } from "lucide-react";

export default function DocsPage() {
  return (
    <main className="hero-bg">
      {/* HERO */}
      <section className="relative overflow-hidden pt-18 md:pt-24 pb-16 bg-gradient-to-br from-primary/5 via-white to-blue-50/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />

        <div className="rm-container relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-primary/30 px-3 py-1.5 mb-6 bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary font-medium">
              <BookOpen className="h-3 w-3" />
              Guide e Risorse
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-4">
              Documentazione
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Guide, tutorial e risorse per sfruttare al massimo RescueManager. Tutto quello che ti serve per iniziare e diventare un esperto.
            </p>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-16 bg-white">
        <div className="rm-container">
          {/* Quick Start */}
          <div className="mb-12 p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-100 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Quick Start</h2>
                <p className="text-gray-600 mb-4">
                  Inizia subito con RescueManager. Segui la nostra guida rapida per configurare il tuo account e iniziare a gestire i trasporti.
                </p>
                <Link
                  href="/docs/quick-start"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Inizia Ora
                </Link>
              </div>
            </div>
          </div>

          {/* Categorie documentazione */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Guide Introduttive */}
            <Link
              href="/docs/guide"
              className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-primary/50 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Guide Introduttive</h3>
              <p className="text-sm text-gray-600">
                Impara le basi di RescueManager con guide passo-passo per ogni funzionalità.
              </p>
            </Link>

            {/* Tutorial Video */}
            <Link
              href="/docs/video"
              className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500/50 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Video className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Tutorial Video</h3>
              <p className="text-sm text-gray-600">
                Video tutorial per imparare visivamente come utilizzare ogni modulo.
              </p>
            </Link>

            {/* API Reference */}
            <Link
              href="/docs/api"
              className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-purple-500/50 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Code className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API Reference</h3>
              <p className="text-sm text-gray-600">
                Documentazione completa delle API per integrazioni personalizzate.
              </p>
            </Link>

            {/* FAQ */}
            <Link
              href="/docs/faq"
              className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-amber-500/50 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <HelpCircle className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">FAQ</h3>
              <p className="text-sm text-gray-600">
                Risposte alle domande più frequenti su funzionalità e abbonamenti.
              </p>
            </Link>

            {/* Moduli */}
            <Link
              href="/docs/moduli"
              className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-blue-500/50 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentazione Moduli</h3>
              <p className="text-sm text-gray-600">
                Guide dettagliate per RVFU, RENTRI, SDI, Contabilità e tutti i moduli.
              </p>
            </Link>

            {/* Best Practices */}
            <Link
              href="/docs/best-practices"
              className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500/50 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Best Practices</h3>
              <p className="text-sm text-gray-600">
                Consigli e strategie per ottimizzare il tuo flusso di lavoro.
              </p>
            </Link>
          </div>

          {/* Articoli popolari */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Articoli Popolari</h2>
            <div className="space-y-4">
              <Link
                href="/docs/guide/primo-trasporto"
                className="block p-6 rounded-xl bg-white border border-gray-200 hover:border-primary/50 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Come creare il tuo primo trasporto</h3>
                    <p className="text-sm text-gray-600">
                      Guida passo-passo per registrare un nuovo trasporto, assegnare autista e mezzo, e tracciare il servizio.
                    </p>
                  </div>
                  <span className="text-xs text-primary font-medium whitespace-nowrap">5 min</span>
                </div>
              </Link>

              <Link
                href="/docs/moduli/rentri-setup"
                className="block p-6 rounded-xl bg-white border border-gray-200 hover:border-emerald-500/50 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Configurare il modulo RENTRI</h3>
                    <p className="text-sm text-gray-600">
                      Setup iniziale del registro rifiuti, configurazione codici EER e creazione del primo formulario.
                    </p>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium whitespace-nowrap">8 min</span>
                </div>
              </Link>

              <Link
                href="/docs/moduli/sdi-certificati"
                className="block p-6 rounded-xl bg-white border border-gray-200 hover:border-purple-500/50 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Installare i certificati SDI</h3>
                    <p className="text-sm text-gray-600">
                      Come ottenere e configurare i certificati digitali per la fatturazione elettronica via SDI.
                    </p>
                  </div>
                  <span className="text-xs text-purple-600 font-medium whitespace-nowrap">10 min</span>
                </div>
              </Link>
            </div>
          </div>

          {/* CTA Supporto */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Non trovi quello che cerchi?</h2>
              <p className="text-gray-600 mb-6">
                Il nostro team di supporto è sempre disponibile per aiutarti.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/contatti"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                >
                  Contatta il Supporto
                </Link>
                <Link
                  href="/docs/faq"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium hover:bg-gray-50 transition-colors"
                >
                  Leggi le FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
