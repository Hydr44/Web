import Link from "next/link";
import { ArrowLeft, Package, Search, ShoppingCart, CheckCircle2, Barcode, Tag } from "lucide-react";

export default function RicambiPage() {
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
            <Package className="h-5 w-5 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">App Base</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">
            Ricambi TecDoc
          </h1>
          <p className="text-lg text-slate-400 max-w-3xl">
            Gestione magazzino ricambi con integrazione TecDoc per identificazione automatica tramite OEM, EAN e VIN decoder. Pubblicazione automatica su marketplace.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Integrazione TecDoc</h3>
            <p className="text-sm text-slate-400">
              Database completo di oltre 5 milioni di ricambi. Ricerca per codice OEM, EAN, targa o telaio. Cross-reference automatico tra codici costruttore.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
              <Barcode className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">VIN Decoder</h3>
            <p className="text-sm text-slate-400">
              Decodifica automatica del numero di telaio per identificare marca, modello, anno e motorizzazione. Ricerca ricambi compatibili in un click.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Gestione Scaffali</h3>
            <p className="text-sm text-slate-400">
              Organizzazione magazzino con scaffali, ripiani e posizioni. Stampa etichette con QR code per localizzazione rapida. Inventario e giacenze in tempo reale.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044]">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4">
              <ShoppingCart className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Pubblicazione Automatica</h3>
            <p className="text-sm text-slate-400">
              Sincronizzazione automatica con eBay, Subito.it e Shopify. Gestione prezzi, foto e descrizioni. Aggiornamento giacenze in tempo reale.
            </p>
          </div>
        </div>

        {/* Marketplace supportati */}
        <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044] mb-12">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Marketplace Supportati</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[#141c27] border border-[#243044]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Tag className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-slate-200">eBay</span>
              </div>
              <p className="text-xs text-slate-500">Pubblicazione automatica con template personalizzabili</p>
            </div>
            <div className="p-4 rounded-lg bg-[#141c27] border border-[#243044]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Tag className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-slate-200">Subito.it</span>
              </div>
              <p className="text-xs text-slate-500">Annunci automatici con foto e descrizione</p>
            </div>
            <div className="p-4 rounded-lg bg-[#141c27] border border-[#243044]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Tag className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-slate-200">Shopify</span>
              </div>
              <p className="text-xs text-slate-500">E-commerce integrato con catalogo sincronizzato</p>
            </div>
          </div>
        </div>

        {/* Funzionalità ricerca */}
        <div className="p-6 rounded-xl bg-[#1a2536] border border-[#243044] mb-12">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Modalità di Ricerca</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-200">Codice OEM</div>
                <div className="text-xs text-slate-500">Ricerca per codice originale costruttore con cross-reference automatico</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-200">Codice EAN</div>
                <div className="text-xs text-slate-500">Identificazione tramite barcode EAN-13 con scanner integrato</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-200">Targa Veicolo</div>
                <div className="text-xs text-slate-500">Ricerca ricambi compatibili inserendo solo la targa</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-200">Numero Telaio (VIN)</div>
                <div className="text-xs text-slate-500">Decodifica VIN per identificazione precisa del veicolo</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-200">Ricerca Testuale</div>
                <div className="text-xs text-slate-500">Ricerca libera per nome ricambio o categoria (es. "filtro olio")</div>
              </div>
            </div>
          </div>
        </div>

        {/* Etichette e QR */}
        <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-8">
          <div className="flex items-start gap-3">
            <Barcode className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-400 mb-1">Stampa Etichette con QR Code</h3>
              <p className="text-xs text-slate-400">
                Genera etichette personalizzate con QR code per ogni ricambio. Scansione rapida per localizzazione in magazzino e gestione vendite.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-base font-semibold text-slate-100 mb-2">Incluso in tutti i piani</h3>
              <p className="text-sm text-slate-400">
                Il modulo Ricambi fa parte dell'App Base ed è incluso in tutti i piani: Starter, Professional, Business e Full.
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
