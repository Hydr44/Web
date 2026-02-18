"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Monitor, 
  Globe, 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Clock,
  ExternalLink
} from "lucide-react";

export default function Accessi() {
  return (
    <main className="bg-white">
      <section className="pt-28 pb-10 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Accessi e Download</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Usa RescueManager dal browser, scarica la versione desktop per Windows e Mac, o usa l&apos;app mobile per gli autisti.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Web App */}
            <div className="rounded-lg border border-gray-200 p-6">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-5 w-5 text-[#2563EB]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Portale Web</h3>
              <p className="text-sm text-gray-600 mb-4">Accesso diretto da browser per dispatcher e amministrazione.</p>
              
              <div className="rounded-lg overflow-hidden border border-gray-200 mb-4">
                <Image src="/670shots_so.png" alt="RescueManager Web" width={400} height={250} className="w-full h-32 object-cover" />
              </div>
              
              <ul className="space-y-2 mb-5 text-sm text-gray-600">
                {["Accesso immediato", "Nessuna installazione", "Aggiornamenti automatici", "Multi-dispositivo"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-[#2563EB] shrink-0" /> {f}</li>
                ))}
              </ul>
              
              <Link href="/dashboard" className="w-full py-2.5 px-4 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                <ExternalLink className="h-4 w-4" /> Apri portale
              </Link>
            </div>

            {/* Desktop App */}
            <div className="rounded-lg border border-gray-200 p-6">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Monitor className="h-5 w-5 text-gray-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">App Desktop</h3>
              <p className="text-sm text-gray-600 mb-4">Per Windows e Mac, con prestazioni ottimizzate e aggiornamenti automatici.</p>
              
              <div className="rounded-lg overflow-hidden border border-gray-200 mb-4">
                <Image src="/670shots_so.png" alt="RescueManager Desktop" width={400} height={250} className="w-full h-32 object-cover" />
              </div>
              
              <ul className="space-y-2 mb-5 text-sm text-gray-600">
                {["Prestazioni ottimizzate", "Funziona offline", "Notifiche desktop", "Sincronizzazione automatica"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-gray-500 shrink-0" /> {f}</li>
                ))}
              </ul>
              
              <div className="space-y-2">
                <a href="#" className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-between text-sm font-medium">
                  <span className="flex items-center gap-2"><Monitor className="h-4 w-4" /> Windows</span>
                  <span className="flex items-center gap-1 text-xs opacity-75">45 MB <Download className="h-3.5 w-3.5" /></span>
                </a>
                <a href="#" className="w-full py-2.5 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-between text-sm font-medium">
                  <span className="flex items-center gap-2"><Monitor className="h-4 w-4" /> Mac</span>
                  <span className="flex items-center gap-1 text-xs opacity-75">52 MB <Download className="h-3.5 w-3.5" /></span>
                </a>
              </div>
            </div>

            {/* Mobile App */}
            <div className="rounded-lg border border-gray-200 p-6 relative">
              <span className="absolute -top-2.5 right-4 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-0.5 rounded">In arrivo</span>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="h-5 w-5 text-[#10B981]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">App Mobile</h3>
              <p className="text-sm text-gray-600 mb-4">App per autisti con interventi, foto e firme digitali. iOS e Android.</p>
              
              <div className="rounded-lg overflow-hidden border border-gray-200 mb-4">
                <Image src="/670shots_so.png" alt="RescueManager Mobile" width={400} height={250} className="w-full h-32 object-cover" />
              </div>
              
              <ul className="space-y-2 mb-5 text-sm text-gray-600">
                {["Interventi in tempo reale", "Foto e firme digitali", "GPS integrato", "Funziona offline"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0" /> {f}</li>
                ))}
              </ul>
              
              <button disabled className="w-full py-2.5 px-4 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" /> In arrivo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Domande frequenti</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { q: "Differenza tra web app e desktop app?", a: "La web app funziona da browser senza installazione. La desktop app offre prestazioni migliori e funziona anche offline." },
              { q: "Quando sarà disponibile l'app mobile?", a: "L'app mobile per autisti sarà disponibile entro il prossimo trimestre su iOS e Android." },
              { q: "Posso usare più accessi contemporaneamente?", a: "Sì, puoi accedere da web, desktop e mobile con lo stesso account senza limitazioni." },
              { q: "I dati sono sincronizzati?", a: "Sì. Tutti i dati sono sincronizzati in tempo reale tra web, desktop e mobile." },
            ].map((faq) => (
              <div key={faq.q} className="rounded-lg border border-gray-200 p-5 bg-white">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-[#2563EB]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Hai bisogno di aiuto con l&apos;installazione?</h2>
          <p className="text-blue-100 mb-6">Ti aiutiamo noi con la configurazione. Contattaci e ti guidiamo passo passo.</p>
          <Link href="/contatti" className="inline-flex items-center gap-2 px-7 py-3 bg-white text-[#2563EB] font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            Richiedi assistenza
          </Link>
        </div>
      </section>
    </main>
  );
}