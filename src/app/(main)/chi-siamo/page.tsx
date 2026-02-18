"use client";

import Link from "next/link";
import { 
  CheckCircle2,
  Code2,
  Wrench,
  FileText,
  Car,
  Recycle,
  Shield,
  Zap,
  Phone
} from "lucide-react";

export default function ChiSiamoPage() {
  return (
    <div className="bg-white">
      <section className="pt-28 pb-10 bg-gray-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Nato sul campo, costruito per il campo
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
            RescueManager non è nato in un ufficio di consulenza. È nato dalla frustrazione 
            di vedere autodemolizioni e centri di soccorso stradale sommersi da carta, fogli Excel 
            e procedure manuali che rubano tempo e generano errori.
          </p>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-4xl">
            <div className="space-y-8">
              <div className="p-7 rounded-lg bg-gray-50 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Perché esiste RescueManager</h2>
                <p className="text-gray-600 leading-relaxed mb-3 text-sm">
                  Chi gestisce un&apos;autodemolizione o un centro di soccorso stradale lo sa: 
                  tra radiazioni RVFU, fatture elettroniche, registro RENTRI, confische, sequestri 
                  e la gestione quotidiana dei mezzi e degli autisti, il lavoro amministrativo 
                  rischia di mangiarsi più tempo del lavoro vero.
                </p>
                <p className="text-gray-600 leading-relaxed text-sm">
                  RescueManager è la risposta a questo problema. Un unico software che mette insieme 
                  tutto quello che serve: dal soccorso stradale alla demolizione, dalla fattura SDI 
                  al registro rifiuti. Senza dover saltare tra dieci programmi diversi, senza fogli 
                  sparsi, senza doppie digitazioni.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-lg p-6 border border-gray-200">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                    <Code2 className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Sviluppo continuo</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    RescueManager è in sviluppo attivo. Ogni mese aggiungiamo funzionalità, 
                    miglioriamo l&apos;interfaccia e ascoltiamo chi lo usa. Non è un prodotto finito 
                    messo in un cassetto — è un progetto vivo che cresce con le esigenze del settore.
                  </p>
                </div>
                
                <div className="rounded-lg p-6 border border-gray-200">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                    <Wrench className="h-5 w-5 text-[#10B981]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Fatto per chi ci lavora</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Ogni funzionalità nasce da un problema reale. Non aggiungiamo cose perché 
                    &quot;fanno figo&quot; — le aggiungiamo perché qualcuno ne ha bisogno. 
                    Il risultato è un software che fa quello che deve, senza complicazioni inutili.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Cosa copre RescueManager</h2>
            <p className="text-gray-600">
              Un software, tante funzioni — tutte quelle che servono a un&apos;autodemolizione moderna
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: "Soccorso stradale", desc: "Dispatch, autisti, rapportini con foto e firma, calendario turni" },
              { icon: Car, title: "Radiazioni RVFU", desc: "Demolizione veicoli, certificati, fascicolo digitale, invio a STA" },
              { icon: FileText, title: "Fatturazione SDI", desc: "Fatture elettroniche XML, invio automatico, incassi e solleciti" },
              { icon: Recycle, title: "Registro RENTRI", desc: "Tracciabilità rifiuti, formulari, registri di carico e scarico" },
              { icon: Shield, title: "Deposito giudiziario", desc: "Confische, sequestri, registro auto in deposito, scadenze" },
              { icon: CheckCircle2, title: "App mobile", desc: "App dedicata per autisti con interventi, foto, firme e GPS" },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-lg p-5 border border-gray-200"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-gray-100">
                  <item.icon className="h-4 w-4 text-gray-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-[#2563EB]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Vuoi vedere come funziona?
          </h2>
          <p className="text-blue-100 mb-6">
            Raccontaci cosa fai e ti mostriamo come possiamo semplificarti il lavoro. 
            Dimostrazione gratuita, zero impegno.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link 
              href="/contatti"
              className="px-7 py-3 bg-white text-[#2563EB] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Contattaci
            </Link>
            <Link 
              href="tel:+393921723028"
              className="px-7 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2 border border-blue-500"
            >
              <Phone className="h-4 w-4" />
              392 172 3028
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
