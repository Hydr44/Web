import Link from "next/link";
import { ArrowLeft, Package, Search, ShoppingCart, CheckCircle2, Barcode, Tag, ArrowRight } from "lucide-react";

export default function RicambiPage() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Torna alla home
          </Link>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">App Base</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
            Ricambi TecDoc<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl">
            Magazzino ricambi con TecDoc integrato. Ricerca per OEM, EAN, VIN. Pubblicazione automatica su eBay, Subito.it e Shopify.
          </p>
        </div>
      </section>


      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 border border-gray-200">
            <Search className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Integrazione TecDoc</h3>
            <p className="text-sm text-gray-600">
              Database completo di oltre 5 milioni di ricambi. Ricerca per codice OEM, EAN, targa o telaio. Cross-reference automatico tra codici costruttore.
            </p>
          </div>

          <div className="p-6 border border-gray-200">
            <Barcode className="h-6 w-6 text-green-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">VIN Decoder</h3>
            <p className="text-sm text-gray-600">
              Decodifica automatica del numero di telaio per identificare marca, modello, anno e motorizzazione. Ricerca ricambi compatibili in un click.
            </p>
          </div>

          <div className="p-6 border border-gray-200">
            <Package className="h-6 w-6 text-blue-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Gestione Scaffali</h3>
            <p className="text-sm text-gray-600">
              Organizzazione magazzino con scaffali, ripiani e posizioni. Stampa etichette con QR code per localizzazione rapida. Inventario e giacenze in tempo reale.
            </p>
          </div>

          <div className="p-6 border border-gray-200">
            <ShoppingCart className="h-6 w-6 text-gray-600 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Pubblicazione Automatica</h3>
            <p className="text-sm text-gray-600">
              Sincronizzazione automatica con eBay, Subito.it e Shopify. Gestione prezzi, foto e descrizioni. Aggiornamento giacenze in tempo reale.
            </p>
          </div>
        </div>
        </div>
      </section>

      <section className="py-10 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Marketplace Supportati</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Tag className="h-4 w-4 text-[#2563EB]" />
                </div>
                <span className="text-sm font-medium text-gray-800">eBay</span>
              </div>
              <p className="text-xs text-gray-500">Pubblicazione automatica con template personalizzabili</p>
            </div>
            <div className="p-4 border border-gray-200 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Tag className="h-4 w-4 text-[#10B981]" />
                </div>
                <span className="text-sm font-medium text-gray-800">Subito.it</span>
              </div>
              <p className="text-xs text-gray-500">Annunci automatici con foto e descrizione</p>
            </div>
            <div className="p-4 border border-gray-200 bg-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Tag className="h-4 w-4 text-[#2563EB]" />
                </div>
                <span className="text-sm font-medium text-gray-800">Shopify</span>
              </div>
              <p className="text-xs text-gray-500">E-commerce integrato con catalogo sincronizzato</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Modalità di Ricerca</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-800">Codice OEM</div>
                <div className="text-xs text-gray-500">Ricerca per codice originale costruttore con cross-reference automatico</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-800">Codice EAN</div>
                <div className="text-xs text-gray-500">Identificazione tramite barcode EAN-13 con scanner integrato</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-800">Targa Veicolo</div>
                <div className="text-xs text-gray-500">Ricerca ricambi compatibili inserendo solo la targa</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-800">Numero Telaio (VIN)</div>
                <div className="text-xs text-gray-500">Decodifica VIN per identificazione precisa del veicolo</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-800">Ricerca Testuale</div>
                <div className="text-xs text-gray-500">Ricerca libera per nome ricambio o categoria (es. "filtro olio")</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Il tuo magazzino ricambi organizzato.</h2>
          <p className="text-blue-100 mb-8">TecDoc integrato, marketplace automatici. Demo gratuita.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors">
            RICHIEDI DEMO <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
