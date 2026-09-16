import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight, Phone } from "lucide-react";

/**
 * Ossatura condivisa delle pagine settore (/autodemolizioni, /soccorso-stradale).
 * Stessa grammatica visiva della home ("Bold Split"): hero diviso scuro/blu,
 * blocchi numerati con schermate vere del programma, banda scura per gli enti,
 * passi con i numeri grandi, chiusura blu. Server component, nessuno stato.
 */

const PHONE_TEL = "tel:+393921723028";
const PHONE_LABEL = "392 172 3028";
const SITE_URL = "https://rescuemanager.eu";

export type SectorBlock = {
  title: string;
  text: string;
  bullets: string[];
  href: string;
  cta: string;
  /** Schermata vera del programma (public/appshots). */
  image?: { src: string; alt: string; width: number; height: number };
  /** In alternativa alla schermata: un dato grande con la sua spiegazione. */
  panel?: { big: string; unit: string; small: string };
};

export type SectorStep = { title: string; desc: string };

export type SectorConnection = { ente: string; title: string; short: string };

export type SectorFaq = {
  q: string;
  a: string;
  link?: { href: string; label: string };
};

export type SectorPageProps = {
  path: string;
  breadcrumb: string;
  eyebrow: string;
  /** Righe dell'H1: l'ultima viene resa in blu, come nella home. */
  titleLines: string[];
  subtitle: ReactNode;
  video: { src: string; poster: string };
  blocksTitle: string;
  blocks: SectorBlock[];
  flowTitle: string;
  flowIntro: string;
  flow: SectorStep[];
  connectionsIntro: string;
  connections: SectorConnection[];
  pkg: {
    title: string;
    intro: string;
    items: { label: string; href: string }[];
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

function Dot() {
  return <span className="text-blue-500">.</span>;
}

export default function SectorPage(props: SectorPageProps) {
  const {
    path,
    breadcrumb,
    eyebrow,
    titleLines,
    subtitle,
    video,
    blocksTitle,
    blocks,
    flowTitle,
    flowIntro,
    flow,
    connectionsIntro,
    connections,
    pkg,
    faqs,
    finalCta,
  } = props;

  const breadcrumbJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: breadcrumb, item: `${SITE_URL}${path}` },
    ],
  }).replace(/</g, "\\u003c");

  const head = titleLines.slice(0, -1);
  const last = titleLines[titleLines.length - 1];

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd }} />

      {/* HERO — diviso scuro/blu come la home */}
      <section className="pt-16 relative">
        <div className="grid lg:grid-cols-2 min-h-[80vh]">
          <div className="flex items-center px-6 lg:px-12 xl:px-20 py-20 bg-[#0f172a] relative z-10">
            <div className="max-w-xl">
              <nav aria-label="Percorso" className="text-xs text-slate-500 mb-8">
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
                <span className="mx-2" aria-hidden="true">›</span>
                <span aria-current="page" className="text-slate-400">{breadcrumb}</span>
              </nav>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">{eyebrow}</p>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.05]">
                {head.map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
                <span className="text-blue-500">{last}</span>
              </h1>
              <p className="text-lg text-slate-400 mb-10 leading-relaxed">{subtitle}</p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/contatti"
                  className="px-7 py-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors rounded"
                >
                  RICHIEDI DEMO
                </Link>
                <Link
                  href={PHONE_TEL}
                  className="px-7 py-4 border-2 border-slate-700 text-white font-bold text-sm hover:border-blue-500 transition-colors flex items-center gap-2 rounded"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  CHIAMACI
                </Link>
              </div>
            </div>
          </div>
          <div className="relative bg-blue-600 overflow-hidden flex items-center justify-center min-h-[320px]">
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster={video.poster}
              className="w-full h-full object-contain"
            >
              <source src={video.src} type="video/mp4" />
              <track kind="captions" />
            </video>
          </div>
        </div>
      </section>

      {/* COSA FA PER TE — blocchi numerati con schermate vere */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-16">
            {blocksTitle}
            <Dot />
          </h2>
          {blocks.map((b, i) => {
            const flip = i % 2 === 1;
            const n = String(i + 1).padStart(2, "0");
            return (
              <div key={b.title} className="grid lg:grid-cols-2 gap-10 items-center mb-16 lg:mb-20 last:mb-0">
                <div className={flip ? "order-1 lg:order-2" : ""}>
                  <span aria-hidden="true" className="text-6xl font-extrabold text-blue-500">{n}</span>
                  <h3 className="text-2xl font-extrabold text-[#0f172a] mb-3 -mt-4">{b.title}</h3>
                  <p className="text-gray-500 mb-5">{b.text}</p>
                  <ul className="space-y-2.5 mb-6">
                    {b.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-blue-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={b.href}
                    className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-[#0f172a] transition-colors"
                  >
                    {b.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
                <div className={flip ? "order-2 lg:order-1" : ""}>
                  {b.image ? (
                    <div className="rounded-lg overflow-hidden shadow-lg border-2 border-[#0f172a]">
                      <Image
                        src={b.image.src}
                        alt={b.image.alt}
                        width={b.image.width}
                        height={b.image.height}
                        className="w-full h-auto"
                      />
                    </div>
                  ) : b.panel ? (
                    <div className="bg-[#0f172a] rounded-lg p-10 lg:p-14">
                      <div className="text-7xl lg:text-8xl font-extrabold text-blue-500 leading-none">{b.panel.big}</div>
                      <div className="text-2xl font-extrabold text-white mt-2">{b.panel.unit}</div>
                      <p className="text-slate-400 mt-5 max-w-sm leading-relaxed">{b.panel.small}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* IL FLUSSO — numeri grandi, come "Come iniziare" nella home */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-4">
            {flowTitle}
            <Dot />
          </h2>
          <p className="text-gray-500 mb-14 max-w-2xl">{flowIntro}</p>
          <ol className="grid md:grid-cols-3 gap-8 list-none m-0 p-0">
            {flow.map((s, i) => (
              <li key={s.title}>
                <span className="text-6xl font-extrabold text-blue-500">{i + 1}</span>
                <h3 className="text-lg font-extrabold text-[#0f172a] mb-2 mt-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ENTI E SERVIZI — banda scura come "Integrazioni certificate" */}
      <section className="py-20 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Collegato a chi conta
            <Dot />
          </h2>
          <p className="text-slate-400 mb-10 max-w-2xl">{connectionsIntro}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connections.map((c) => (
              <div key={c.title} className="border border-slate-800 p-7 transition-colors hover:border-blue-500/40">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">{c.ente}</div>
                <h3 className="text-lg font-extrabold text-white mb-2">{c.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{c.short}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IL PACCHETTO — due colonne, niente scatole */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-4">
              {pkg.title}
              <Dot />
            </h2>
            <p className="text-gray-500 mb-4 max-w-xl">{pkg.intro}</p>
            <p className="text-sm text-gray-500 max-w-xl">{pkg.note}</p>
          </div>
          <div>
            <ul className="space-y-3 mb-8">
              {pkg.items.map((it) => (
                <li key={it.label} className="flex items-start gap-3 text-[#0f172a] font-medium">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 bg-blue-500" />
                  <Link href={it.href} className="hover:text-blue-600 transition-colors">
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/contatti"
                className="inline-flex items-center gap-2 px-7 py-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors rounded"
              >
                RICHIEDI PREVENTIVO
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <span className="text-sm text-gray-500">14 giorni soddisfatti o rimborsati. Installazione inclusa.</span>
            </div>
          </div>
        </div>
      </section>

      {/* DOMANDE — testo piano, righe sottili */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-[#0f172a] mb-12">
            Domande
            <Dot />
          </h2>
          <dl className="grid lg:grid-cols-2 gap-x-16 gap-y-10 m-0">
            {faqs.map((f) => (
              <div key={f.q} className="border-t border-gray-200 pt-6">
                <dt className="text-lg font-extrabold text-[#0f172a] mb-2">{f.q}</dt>
                <dd className="m-0 text-sm text-gray-600 leading-relaxed">
                  {f.a}
                  {f.link ? (
                    <>
                      {" "}
                      <Link href={f.link.href} className="font-bold text-blue-600 hover:text-[#0f172a] transition-colors">
                        {f.link.label}
                      </Link>
                    </>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CHIUSURA — blu, come la home */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">{finalCta.title}</h2>
          <p className="text-blue-50 mb-10 text-lg">{finalCta.text}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contatti"
              className="px-8 py-4 bg-[#0f172a] text-white font-bold hover:bg-slate-800 transition-colors"
            >
              RICHIEDI DEMO
            </Link>
            <Link
              href={PHONE_TEL}
              className="px-8 py-4 text-white font-bold border-2 border-white/40 hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {PHONE_LABEL}
            </Link>
          </div>
          <p className="text-blue-100 text-sm mt-10">
            {finalCta.crossQuestion}{" "}
            <Link href={finalCta.crossHref} className="font-bold text-white underline underline-offset-4 hover:text-blue-50">
              {finalCta.crossLabel} →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
