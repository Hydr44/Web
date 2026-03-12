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
    <main className="bg-white">
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-3">Contattaci<span className="text-blue-500">.</span></h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Raccontaci la tua attività e ti mostriamo come possiamo aiutarti. Demo gratuita, senza impegno.
          </p>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Parliamo</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Che tu gestisca un&apos;autodemolizione, un centro di soccorso stradale o un deposito giudiziario,
                  siamo qui per capire le tue esigenze.
                </p>
              </div>

              <div className="space-y-3">
                <a href="mailto:info@rescuemanager.eu" className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                  <Mail className="h-5 w-5 text-[#2563EB]" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email</div>
                    <div className="text-sm text-gray-600">info@rescuemanager.eu</div>
                  </div>
                </a>
                <a href="tel:+393921723028" className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                  <Phone className="h-5 w-5 text-[#2563EB]" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Telefono</div>
                    <div className="text-sm text-gray-600">392 172 3028</div>
                  </div>
                </a>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Orari</div>
                    <div className="text-sm text-gray-600">Lun-Ven 9:00-18:00</div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-gray-50 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">Cosa succede dopo?</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {[
                    "Ti rispondiamo entro 24 ore",
                    "Organizziamo una dimostrazione gratuita",
                    "Ti aiutiamo con l'installazione",
                    "Nessun vincolo, nessun impegno",
                  ].map((step) => (
                    <li key={step} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-3">
              <ContattiForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
