"use client";

import Link from "next/link";
import {
  CheckCircle2,
  PhoneCall,
  Truck,
  ClipboardCheck,
  FileSpreadsheet,
  BarChart3,
  LineChart,
} from "lucide-react";

type Module = {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  points: string[];
};

const MODULES: Module[] = [
  {
    title: "Centrale operativa & Dispatch",
    icon: PhoneCall,
    points: [
      "Presa chiamata con posizione e priorità",
      "Assegnazione mezzi su mappa con ETA",
      "SLA, note operative e checklist",
    ],
  },
  {
    title: "Flotta & Turni",
    icon: Truck,
    points: [
      "Gestione mezzi, manutenzioni, equipaggiamenti",
      "Turnazioni e disponibilità in tempo reale",
      "Storico viaggi e costi/mezzo",
    ],
  },
  {
    title: "Interventi & Rapportini",
    icon: ClipboardCheck,
    points: [
      "Check-list, foto (📷) e firme digitali",
      "Tariffe automatiche per tipo intervento",
      "Consegna veicolo (officina/deposito) e DDT",
    ],
  },
  {
    title: "Clienti, Convenzioni & Fatturazione",
    icon: FileSpreadsheet,
    points: [
      "Anagrafiche, listini e convenzioni",
      "Preventivi, pro-forma/PA, incassi",
      "Export contabile",
    ],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    points: [
      "Volumi per zona/cliente/mezzo",
      "Tempi medi presa → assegnazione → arrivo",
      "Redditività per intervento/mezzo",
    ],
  },
];

export default function Prodotto() {
  return (
    <main className="hero-bg">
      {/* HERO */}
      <section className="relative overflow-hidden pt-18 md:pt-24 pb-12">
        <div className="rm-container">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-primary/30 px-2.5 py-1 mb-4 bg-primary/10 text-primary">
              Tutto il ciclo del soccorso, in un’unica piattaforma
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance">
              Moduli operativi per la tua centrale e la flotta
            </h1>
            <p className="mt-3 text-gray-600 max-w-2xl">
              Dal primo squillo al rapporto firmato: riduci tempi, errori e costi con un flusso end-to-end pensato per officine, flotte e consorzi.
            </p>

            {/* micro badges */}
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              {[
                "📞 Dispatch su mappa",
                "🖊️ Rapportini con foto & firma",
                "📄 Fatture & pro-forma/PA",
                "📈 Analytics utili",
              ].map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full ring-1 ring-black/10 bg-white text-gray-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  {b}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contatti"
                className="px-5 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                Richiedi demo
              </Link>
              <Link
                href="/prezzi"
                className="px-5 py-3 rounded-lg ring-1 ring-black/10 bg-white text-gray-900 hover:bg-gray-50 transition"
              >
                Vedi prezzi
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MODULI */}
      <section className="rm-container pb-4 md:pb-8">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {MODULES.map((m) => (
            <article
              key={m.title}
              className="p-6 rounded-2xl border bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <m.icon className="h-5 w-5 text-primary" />
                <h3 className="font-medium">{m.title}</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {m.points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}

          {/* Card “Plus” per features trasversali */}
          <article className="p-6 rounded-2xl border bg-white md:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-3">
              <LineChart className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Integrazioni & Sicurezza</h3>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Telefonia (es. 3CX), protocolli email/PEC, portali e contabilità (export)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>Ruoli e permessi granulari, audit log, backup e GDPR-by-design</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span>API per integrazioni personalizzate</span>
              </li>
            </ul>
          </article>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="py-12">
        <div className="rm-container">
          <div className="rounded-2xl border bg-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Pronto a ridurre i tempi di intervento?</h2>
              <p className="text-gray-600 mt-1">
                Ti mostriamo i moduli in 10 minuti, con esempi reali.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/contatti"
                className="px-5 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                Richiedi demo
              </Link>
              <Link
                href="/prodotto#demo"
                className="px-5 py-3 rounded-lg ring-1 ring-black/10 bg-white text-gray-900 hover:bg-gray-50 transition"
              >
                Guarda demo (60s)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ BREVE */}
      <section className="rm-container pb-16">
        <h3 className="text-lg font-medium">Domande frequenti</h3>
        <div className="mt-4 grid md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div className="rounded-xl border p-5 bg-white">
            <p className="font-medium">Serve installazione sui PC dell’ufficio?</p>
            <p className="mt-1 text-gray-600">
              No, RescueManager è web-based: funziona da browser su desktop e mobile. Per i driver è disponibile una web-app ottimizzata.
            </p>
          </div>
          <div className="rounded-xl border p-5 bg-white">
            <p className="font-medium">Posso importare clienti e mezzi esistenti?</p>
            <p className="mt-1 text-gray-600">
              Sì, supportiamo import da CSV/Excel e mappatura dei campi con assistenza guidata.
            </p>
          </div>
          <div className="rounded-xl border p-5 bg-white">
            <p className="font-medium">È multi-sede / multi-utente?</p>
            <p className="mt-1 text-gray-600">
              Certo. Ruoli e permessi granulari, audit log e limiti per area/settore.
            </p>
          </div>
          <div className="rounded-xl border p-5 bg-white">
            <p className="font-medium">Quanto tempo per partire?</p>
            <p className="mt-1 text-gray-600">
              Di solito 1–3 giorni: creiamo l’ambiente, importiamo i dati e facciamo onboarding rapido.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}