"use client";

import Link from "next/link";
import { Check, Shield, FileText, BarChart3, ArrowRight, Zap, Car, Recycle } from "lucide-react";

export default function PrezziPage() {
  const baseFeatures = [
    "Dashboard completa",
    "Gestione clienti e anagrafiche",
    "Gestione mezzi e autisti",
    "Modulo trasporti e soccorso",
    "Registro auto (confische, sequestri, deposito)",
    "Calendario turni",
    "App desktop Windows e Mac",
    "App mobile autisti",
    "Backup automatici",
    "Supporto email",
  ];

  const modules = [
    {
      id: "rvfu",
      name: "Radiazioni RVFU",
      desc: "Radiazione veicoli fuori uso, certificati di demolizione, fascicolo digitale, invio a STA.",
      icon: Car,
      color: "blue",
    },
    {
      id: "sdi",
      name: "Fatturazione SDI",
      desc: "Fatture elettroniche XML, invio automatico al Sistema di Interscambio, incassi, bollo e ritenute.",
      icon: FileText,
      color: "green",
    },
    {
      id: "rentri",
      name: "Registro RENTRI",
      desc: "Registro nazionale tracciabilità rifiuti, formulari, registri di carico e scarico.",
      icon: Recycle,
      color: "purple",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="pt-18 md:pt-24 pb-12 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Un software, tanti moduli
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Il pacchetto base include tutto quello che serve per gestire la tua attività.
            I moduli specializzati (RVFU, SDI, RENTRI) si attivano singolarmente o insieme.
          </p>
        </div>
      </section>

      {/* Base package */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 p-8 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-primary text-white">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Pacchetto Base</h2>
                <p className="text-sm text-gray-600">Tutto incluso per partire subito</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {baseFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-5 text-center">
              <p className="text-gray-600 text-sm mb-3">
                Il prezzo dipende dalla dimensione della tua attività e dai moduli che attivi.
              </p>
              <Link
                href="/contatti"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                Richiedi un preventivo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Moduli specializzati</h2>
            <p className="text-gray-600">
              Attivabili singolarmente o tutti insieme nel pacchetto completo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className={`rounded-2xl border p-6 bg-white ${
                  mod.color === "blue" ? "border-blue-200" :
                  mod.color === "green" ? "border-green-200" :
                  "border-purple-200"
                }`}
              >
                <div className={`p-2.5 rounded-xl w-fit mb-4 text-white ${
                  mod.color === "blue" ? "bg-blue-600" :
                  mod.color === "green" ? "bg-green-600" :
                  "bg-purple-600"
                }`}>
                  <mod.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{mod.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Domande frequenti</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: "Posso attivare solo un modulo?", a: "Sì. Puoi usare solo RVFU, solo la fatturazione SDI o solo RENTRI. Oppure attivarli tutti nel pacchetto completo." },
              { q: "C'è un periodo di prova?", a: "Contattaci per una demo gratuita e personalizzata. Ti aiutiamo con la configurazione iniziale." },
              { q: "I dati sono al sicuro?", a: "Infrastruttura cloud europea, backup automatici, crittografia e conformità GDPR." },
              { q: "Serve installazione?", a: "RescueManager funziona da browser e ha un'app desktop per Windows e Mac. Per gli autisti c'è l'app mobile." },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Vuoi sapere quanto costa per la tua attività?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Raccontaci cosa gestisci e ti prepariamo un preventivo su misura. Nessun impegno.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contatti"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Richiedi preventivo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/prodotto"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Vedi tutti i moduli
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}