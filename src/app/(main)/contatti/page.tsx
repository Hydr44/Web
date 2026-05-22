import type { Metadata } from "next";
import { Mail, Phone, Clock, CheckCircle2 } from "lucide-react";
import ContattiForm from "./_ContattiForm";

export const metadata: Metadata = {
  title: "Contattaci",
  description:
    "Richiedi una demo gratuita di RescueManager. Raccontaci la tua attività e ti mostriamo come semplificare la gestione. Risposta entro 24 ore, nessun impegno.",
};

export default function Contatti() {
  return (
    <main className="bg-white min-h-screen">
      <section className="pt-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-3">Contattaci<span className="text-blue-600">.</span></h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Raccontaci la tua attività e ti mostriamo come possiamo aiutarti. Demo gratuita, senza impegno.
          </p>
        </div>
      </section>

      <section className="py-14 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Info Col */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Parliamo</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Che tu gestisca un'autodemolizione, un centro di soccorso stradale o un deposito giudiziario,
                  siamo qui per capire le tue esigenze.
                </p>
              </div>

              <div className="space-y-3">
                <a href="mailto:info@rescuemanager.eu" className="flex items-center gap-4 p-5 bg-white border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Email</div>
                    <div className="text-sm text-gray-500">info@rescuemanager.eu</div>
                  </div>
                </a>
                
                <a href="tel:+393921723028" className="flex items-center gap-4 p-5 bg-white border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Telefono</div>
                    <div className="text-sm text-gray-500">+39 392 172 3028</div>
                  </div>
                </a>

                <a
                  href="https://wa.me/393921723028"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-5 bg-white border border-gray-200 hover:border-emerald-300 transition-colors"
                >
                  <div className="w-10 h-10 bg-emerald-50 flex items-center justify-center shrink-0">
                    {/* WhatsApp glyph (inline SVG, no extra package) */}
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-600" fill="currentColor" aria-hidden="true">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">WhatsApp</div>
                    <div className="text-sm text-gray-500">+39 392 172 3028</div>
                  </div>
                </a>


                <div className="flex items-center gap-4 p-5 bg-white border border-gray-200">
                  <div className="w-10 h-10 bg-gray-50 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Orari</div>
                    <div className="text-sm text-gray-500">Lun-Ven 9:00-18:00</div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Cosa succede dopo?</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  {[
                    "Ti rispondiamo entro 24 ore",
                    "Organizziamo una dimostrazione gratuita",
                    "Ti aiutiamo con l'installazione",
                    "Nessun vincolo, nessun impegno",
                  ].map((step) => (
                    <li key={step} className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Form Col */}
            <div className="lg:col-span-3">
              <ContattiForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
