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
                    <div className="text-sm text-gray-500">392 172 3028</div>
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
