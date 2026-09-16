import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Phone,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Wrench,
} from "lucide-react";

/**
 * Ossatura condivisa delle pagine settore (/autodemolizioni, /soccorso-stradale).
 * Server component: riceve solo dati e icone, nessuno stato lato client.
 * I menu a scomparsa (FAQ) usano <details>/<summary>, quindi il contenuto
 * resta nell'HTML anche da chiuso.
 */

const PHONE_TEL = "tel:+393921723028";
const PHONE_LABEL = "+39 392 172 3028";
const SITE_URL = "https://rescuemanager.eu";

export type SectorScenario = {
  situation: string;
  change: string;
};

export type SectorModule = {
  href: string;
  title: string;
  desc: string;
  icon: LucideIcon;
};

export type SectorStep = {
  title: string;
  desc: string;
};

export type SectorConnection = {
  name: string;
  desc: string;
  icon: LucideIcon;
};

export type SectorFaq = {
  q: string;
  a: string;
  /** Link facoltativo aggiunto in coda alla risposta (es. rimando all'altra pagina settore). */
  link?: { href: string; label: string };
};

export type SectorPageProps = {
  /** Percorso della pagina, usato per il breadcrumb (es. "/autodemolizioni"). */
  path: string;
  /** Nome breve della pagina nel breadcrumb. */
  breadcrumb: string;
  eyebrow: string;
  /** Titolo H1 senza punto finale: il punto blu lo aggiunge il componente. */
  title: string;
  subtitle: string;
  video: { src: string; poster: string; caption: string };
  scenariosIntro: string;
  scenarios: SectorScenario[];
  modulesIntro: string;
  modules: SectorModule[];
  flowTitle: string;
  flowIntro: string;
  flow: SectorStep[];
  connectionsIntro: string;
  connections: SectorConnection[];
  pkg: {
    name: string;
    intro: string;
    modules: string[];
    note: string;
  };
  faqs: SectorFaq[];
  finalCta: {
    title: string;
    text: string;
    crossQuestion: string;
    crossLabel: string;
    crossHref: string;
  };
};

export default function SectorPage(props: SectorPageProps) {
  const {
    path,
    breadcrumb,
    eyebrow,
    title,
    subtitle,
    video,
    scenariosIntro,
    scenarios,
    modulesIntro,
    modules,
    flowTitle,
    flowIntro,
    flow,
    connectionsIntro,
    connections,
    pkg,
    faqs,
    finalCta,
  } = props;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: breadcrumb, item: `${SITE_URL}${path}` },
    ],
  };

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />

      {/* 1. HERO */}
      <section className="pt-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <nav aria-label="Percorso" className="mb-8 text-sm text-slate-400">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
                <li aria-current="page" className="text-slate-300">
                  {breadcrumb}
                </li>
              </ol>
            </nav>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">{eyebrow}</p>
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold text-white mb-4 leading-[1.05]">
              {title}
              <span className="text-blue-500">.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-10">{subtitle}</p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contatti"
                className="px-7 py-4 bg-blue-600 text-white font-bold text-sm uppercase hover:bg-blue-700 transition-colors rounded"
              >
                Richiedi demo
              </Link>
              <a
                href={PHONE_TEL}
                aria-label={`Chiamaci al ${PHONE_LABEL}`}
                className="px-7 py-4 border-2 border-slate-700 text-white font-bold text-sm uppercase hover:border-blue-500 transition-colors flex items-center gap-2 rounded"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                Chiamaci
              </a>
            </div>
          </div>
          <figure className="w-full max-w-full aspect-video bg-black border border-slate-800 overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={video.poster}
              className="w-full h-full object-cover"
            >
              <source src={video.src} type="video/mp4" />
            </video>
            <figcaption className="sr-only">{video.caption}</figcaption>
          </figure>
        </div>
      </section>

      {/* 2. TI RICONOSCI? */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Ti riconosci?</h2>
          <p className="text-gray-500 text-center mb-10 max-w-2xl mx-auto">{scenariosIntro}</p>
          <div className="grid md:grid-cols-2 gap-6">
            {scenarios.map((s) => (
              <article key={s.situation} className="border border-gray-200 bg-white flex flex-col">
                <div className="p-5 bg-gray-50 border-l-4 border-gray-300">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">La situazione</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{s.situation}</p>
                </div>
                <div className="p-5 border-l-4 border-blue-500 flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Cosa cambia</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.change}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. COSA USI OGNI GIORNO */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Cosa usi ogni giorno</h2>
          <p className="text-gray-500 text-center mb-10 max-w-2xl mx-auto">{modulesIntro}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  className="group p-6 border border-gray-200 bg-white hover:border-blue-400 transition-colors flex flex-col"
                >
                  <Icon className="h-6 w-6 text-blue-600 mb-3" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{m.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">{m.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:gap-2 transition-all">
                    Scopri il modulo
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. FLUSSO DI LAVORO */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">{flowTitle}</h2>
          <p className="text-gray-500 text-center mb-10 max-w-2xl mx-auto">{flowIntro}</p>
          <ol className="space-y-4">
            {flow.map((step, i) => (
              <li key={step.title} className="flex gap-4 p-5 bg-gray-50 border border-gray-200">
                <div
                  className="w-9 h-9 bg-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. COLLEGATO A CHI CONTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Collegato a chi conta</h2>
          <p className="text-gray-500 text-center mb-10 max-w-2xl mx-auto">{connectionsIntro}</p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] gap-4">
            {connections.map((c) => {
              const Icon = c.icon;
              return (
                <li key={c.name} className="p-5 border border-gray-200 bg-white">
                  <Icon className="h-6 w-6 text-blue-600 mb-3" aria-hidden="true" />
                  <p className="font-bold text-gray-900 mb-1">{c.name}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{c.desc}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 6. PACCHETTO CONSIGLIATO */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-10 text-center">Pacchetto consigliato</h2>
          <div className="grid md:grid-cols-5 border border-gray-200">
            <div className="md:col-span-3 p-8 bg-[#0f172a] text-white">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Pacchetto</p>
              <h3 className="text-2xl font-extrabold mb-3">
                {pkg.name}
                <span className="text-blue-500">.</span>
              </h3>
              <p className="text-slate-400 leading-relaxed mb-6">{pkg.intro}</p>
              <ul className="space-y-3">
                {pkg.modules.map((m) => (
                  <li key={m} className="flex items-start gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2 p-8 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 flex flex-col">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm font-bold text-gray-900">14 giorni soddisfatti o rimborsati</span>
                </li>
                <li className="flex items-start gap-3">
                  <Wrench className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-sm font-bold text-gray-900">Installazione inclusa</span>
                </li>
              </ul>
              <Link
                href="/contatti"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-blue-600 text-white font-bold text-sm uppercase hover:bg-blue-700 transition-colors rounded"
              >
                Richiedi preventivo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <p className="text-xs text-gray-500 leading-relaxed mt-4">{pkg.note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. DOMANDE FREQUENTI */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-10 text-center">Domande frequenti</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group border border-gray-200 bg-white">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 font-bold text-gray-900 [&::-webkit-details-marker]:hidden">
                  <span>{f.q}</span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-blue-600 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
                  {f.a}
                  {f.link ? (
                    <>
                      {" "}
                      <Link href={f.link.href} className="font-bold text-blue-600 underline underline-offset-4">
                        {f.link.label}
                      </Link>
                    </>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CTA FINALE */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">{finalCta.title}</h2>
          <p className="text-blue-50 mb-8">{finalCta.text}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contatti"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0f172a] text-white font-bold text-sm uppercase hover:bg-slate-800 transition-colors rounded"
            >
              Richiedi demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={PHONE_TEL}
              aria-label={`Chiamaci al ${PHONE_LABEL}`}
              className="inline-flex items-center gap-2 px-8 py-4 text-white font-bold text-sm uppercase border-2 border-white/40 hover:bg-white/10 transition-colors rounded"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              Chiamaci
            </a>
          </div>
          <p className="mt-8 text-sm text-blue-100">
            {finalCta.crossQuestion}{" "}
            <Link href={finalCta.crossHref} className="font-bold text-white underline underline-offset-4">
              {finalCta.crossLabel}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
