"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Check,
  Truck,
  Car,
  Smartphone,
  FileText,
  BarChart3,
  Settings,
  ArrowRight,
  Shield,
  Recycle,
} from "lucide-react";

const MODULES = [
  {
    title: "Soccorso & Trasporti",
    icon: Truck,
    color: "blue",
    desc: "Il cuore operativo: dispatch, autisti, rapportini.",
    points: [
      "Dashboard operativa",
      "Gestione clienti e mezzi",
      "Calendario trasporti e turni",
      "Richiesta posizione GPS",
      "Gestione autisti",
      "Preventivi e offerte",
    ],
  },
  {
    title: "Radiazioni RVFU",
    icon: Car,
    color: "blue",
    desc: "Demolizione veicoli e radiazione integrata.",
    points: [
      "Ricerca veicoli tramite PRA",
      "Compilazione radiazione",
      "Certificato di demolizione",
      "Fascicolo digitale del veicolo",
      "Invio a STA e verifica radiazione",
    ],
  },
  {
    title: "Fatturazione SDI",
    icon: FileText,
    color: "green",
    desc: "Fatture elettroniche e invio automatico SDI.",
    points: [
      "Fatture XML per PA e privati",
      "Invio automatico al SDI",
      "Pro-forma e fatture commerciali",
      "Gestione incassi e pagamenti",
      "Bollo virtuale e ritenuta d'acconto",
      "Storico fatturazione completo",
    ],
  },
  {
    title: "Registro RENTRI",
    icon: Recycle,
    color: "green",
    desc: "Tracciabilità rifiuti a norma di legge.",
    points: [
      "Registro carico/scarico",
      "Formulari rifiuti",
      "Tracciabilità completa",
      "Conformità normativa",
    ],
  },
  {
    title: "App Mobile Autisti",
    icon: Smartphone,
    color: "gray",
    desc: "App dedicata per chi è in strada.",
    points: [
      "Interventi assegnati in tempo reale",
      "Foto e firme digitali",
      "Navigazione GPS integrata",
      "Funziona offline",
      "Notifiche push",
    ],
  },
  {
    title: "Analytics & Report",
    icon: BarChart3,
    color: "green",
    desc: "Numeri e performance della tua attività.",
    points: [
      "Dashboard in tempo reale",
      "Volumi per zona/cliente/mezzo",
      "Tempi medi e performance",
      "Report personalizzabili",
      "KPI e alert automatici",
    ],
  },
  {
    title: "Integrazioni & Sicurezza",
    icon: Settings,
    color: "gray",
    desc: "Ruoli, permessi, API e conformità.",
    points: [
      "Ruoli e permessi granulari",
      "Audit log e backup automatici",
      "Integrazione telefonia (3CX)",
      "API per integrazioni custom",
      "Conformità GDPR",
    ],
  },
];

const COLOR_MAP: Record<string, { bg: string; icon: string; check: string }> = {
  blue:  { bg: "bg-blue-50",  icon: "bg-[#2563EB]",  check: "text-[#2563EB]" },
  green: { bg: "bg-green-50", icon: "bg-[#10B981]", check: "text-[#10B981]" },
  gray:  { bg: "bg-gray-50",  icon: "bg-gray-600",   check: "text-gray-600" },
};

export default function Prodotto() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="pt-18 md:pt-24 pb-16 bg-gray-50 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
                Ogni modulo che serve a chi demolisce e soccorre
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Dal soccorso stradale alle radiazioni RVFU, dalla fatturazione SDI al registro RENTRI:
                tutti i moduli per gestire la tua autodemolizione o centro di soccorso.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contatti"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                >
                  Richiedi demo gratuita
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/prezzi"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Vedi prezzi
                </Link>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200">
              <Image
                src="/670shots_so.png"
                alt="RescueManager Desktop App"
                width={600}
                height={400}
                className="w-full h-auto"
                quality={80}
              />
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Tutti i moduli</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Ogni modulo funziona da solo o insieme agli altri. Attivi solo quello che ti serve.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {MODULES.map((mod) => {
              const colors = COLOR_MAP[mod.color] || COLOR_MAP.blue;
              return (
                <article
                  key={mod.title}
                  className="rounded-2xl border border-gray-200 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl ${colors.icon} text-white`}>
                      <mod.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{mod.title}</h3>
                      <p className="text-sm text-gray-500">{mod.desc}</p>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {mod.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <Check className={`h-4 w-4 mt-0.5 shrink-0 ${colors.check}`} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Domande frequenti</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: "Serve installazione?", a: "RescueManager funziona da browser e ha un'app desktop per Windows e Mac. Per gli autisti c'è l'app mobile." },
              { q: "Posso importare dati esistenti?", a: "Sì, supportiamo import da CSV/Excel con mappatura dei campi e assistenza guidata." },
              { q: "È multi-sede / multi-utente?", a: "Certo. Ruoli e permessi granulari, audit log e limiti per area o settore." },
              { q: "Quanto tempo per partire?", a: "Di solito 1–3 giorni: creiamo l'ambiente, importiamo i dati e facciamo onboarding." },
            ].map((faq) => (
              <div key={faq.q} className="rounded-xl border border-gray-200 p-5 bg-white">
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
            Vuoi vedere come funziona?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Raccontaci cosa gestisci e ti mostriamo i moduli giusti per te. Demo gratuita, zero impegno.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contatti"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Richiedi demo gratuita
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/prezzi"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Vedi i prezzi
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}