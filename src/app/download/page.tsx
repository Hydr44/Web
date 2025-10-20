"use client";

import Link from "next/link";
import { Monitor, Globe, Smartphone } from "lucide-react";

export default function Accessi() {
  const ITEMS = [
    {
      name: "Portale centrale operativa",
      desc: "Accesso diretto da browser per dispatcher e amministrazione.",
      href: "#", // link al portale web
      icon: Globe,
      cta: "Apri portale",
    },
    {
      name: "App desktop RescueManager",
      desc: "Applicazione dedicata per Windows e MacOS, con prestazioni ottimizzate e aggiornamenti automatici.",
      downloads: [
        { label: "Scarica per Windows", href: "#" }, // link al file .exe
        { label: "Scarica per Mac", href: "#" }, // link al file .dmg
      ],
      icon: Monitor,
    },
    {
      name: "App mobile per autisti (in arrivo)",
      desc: "App nativa per i driver con interventi, foto e firme digitali. Disponibile a breve su iOS e Android.",
      href: "#", // placeholder, in futuro store link
      icon: Smartphone,
      cta: "In arrivo",
    },
  ];

  return (
    <main className="hero-bg">
      {/* HERO INTRO */}
      <section className="rm-container pt-18 md:pt-24 pb-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Accessi & Download
          </h1>
          <p className="mt-3 text-gray-600">
            Usa RescueManager dal browser, scarica la versione desktop
            per Windows e Mac, e a breve anche l’app mobile per autisti.
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="rm-container pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {ITEMS.map((i) => (
            <div
              key={i.name}
              className="p-6 rounded-2xl border bg-white hover:shadow-md transition flex flex-col"
            >
              <div className="flex items-center gap-3">
                <i.icon className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-medium">{i.name}</h3>
              </div>
              <p className="mt-3 text-sm text-gray-600 flex-1">{i.desc}</p>

              {/* Se ha più download */}
              {i.downloads ? (
                <div className="mt-4 flex flex-col gap-2">
                  {i.downloads.map((d) => (
                    <Link
                      key={d.label}
                      href={d.href}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white text-center hover:opacity-90 transition"
                    >
                      {d.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  href={i.href || "#"}
                  className="mt-4 inline-block px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 transition text-center"
                >
                  {i.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}