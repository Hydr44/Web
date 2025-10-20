"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, FileText, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <main className="hero-bg">
      {/* ── HERO full-bleed con messaggio chiaro ───────────────────────────── */}
      <section className="relative overflow-hidden pt-18 md:pt-24 pb-20 md:pb-28 hero-bg">
        {/* scrim per leggibilità del testo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[460px] md:h-[560px]
                     bg-gradient-to-r from-background/96 via-background/82 to-background/0"
        />

        {/* colonna testo */}
        <div className="rm-container relative z-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs rounded-full ring-1 ring-primary/30 px-2.5 py-1 mb-4 bg-primary/10 text-primary">
              Operatività h24 per il soccorso stradale
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance">
              Riduci i tempi di intervento <span className="text-primary">fino al 32%</span>
            </h1>

            <p className="mt-3 text-gray-600">
              Dalla chiamata al traino: dispatch su mappa, rapportini con foto/firma, fatture e analisi —
              tutto in un’unica piattaforma veloce.
            </p>

            {/* Value bullets */}
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Dispatch in tempo reale
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Rapportini con foto & firma
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Fatture & analytics
              </li>
            </ul>

            {/* CTA */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contatti"
                className="px-5 py-3 rounded-lg bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition"
                aria-label="Richiedi una demo"
              >
                Richiedi demo
              </Link>
              <Link
                href="/prodotto#demo"
                className="px-5 py-3 rounded-lg bg-white text-gray-900 ring-1 ring-black/10 hover:bg-gray-50 shadow-sm transition"
                aria-label="Guarda una demo di 60 secondi"
              >
                Guarda demo (60s)
              </Link>
            </div>

            {/* Micro-trust badges */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full ring-1 ring-black/10 bg-white">
                ✅ Oltre 120 officine
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full ring-1 ring-black/10 bg-white">
                ✅ 8 consorzi in 5 regioni
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full ring-1 ring-black/10 bg-white">
                ✅ 5.000+ interventi/mese
              </span>
            </div>
          </div>
        </div>

        {/* mockup tappeto: arrotondato + fade top/right/bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[-8rem] md:bottom-[-11rem] z-0">
          <div className="relative mx-auto w-[1200px] max-w-none rounded-[28px] md:rounded-[32px] overflow-hidden ring-1 ring-black/5 shadow-2xl">
            <Image
              src="/mockups/dashboard-mockup.jpg"
              alt=""
              aria-hidden="true"
              width={2400}
              height={1200}
              priority
              sizes="(min-width: 1200px) 1200px, 100vw"
              className="w-full h-auto object-cover"
            />
            {/* Fades di fusione */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/0 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-72 md:w-[28rem] bg-gradient-to-l from-background/80 via-background/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-28 md:h-32 bg-gradient-to-t from-background/65 via-background/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── FEATURE GRID ─────────────────────────────────────────────────────────── */}
      <section className="rm-container py-16 md:py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Clock,    title: "Dispatch in tempo reale", desc: "Smista chiamate, assegna mezzi, ETA e stato su mappa." },
            { icon: FileText, title: "Rapportini completi",     desc: "Foto, firme, allegati e consegna veicolo, tutto digitale." },
            { icon: BarChart3,title: "Analytics utili",         desc: "Tempi medi, volumi e margini per mezzo/intervento." },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ y: 8, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="p-6 rounded-2xl border bg-white"
            >
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SEZIONE PRODOTTO / BENEFICIO ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-primary/8 to-white py-16 md:py-20">
        <div className="rm-container">
          <div className="rounded-2xl border bg-white p-6 md:p-10 grid md:grid-cols-2 gap-10">
            <div>
              <h2 className="text-2xl font-semibold">Flotta, turni e manutenzioni senza caos</h2>
              <p className="mt-3 text-gray-600">
                Disponibilità mezzi in tempo reale, reperibilità, storico viaggi e costi per mezzo.
                Tutto tracciato, niente fogli sparsi.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Calendario turni e reperibilità</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Scadenze e manutenzioni</li>
                <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Storico interventi per mezzo</li>
              </ul>
              <div className="mt-6 flex gap-3">
                <Link href="/prodotto" className="px-5 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition">
                  Vedi i moduli
                </Link>
                <Link href="/contatti" className="px-5 py-3 rounded-lg ring-1 ring-gray-300 hover:bg-gray-50 transition">
                  Parla con noi
                </Link>
              </div>
            </div>
            <div className="rounded-xl border min-h-48 bg-white/60" />
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────────── */}
      <section className="rm-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ["-32%", "tempi di assegnazione"],
            ["+18%", "interventi/mezzo"],
            ["99.9%", "uptime garantito"],
            ["< 2m", "presa → dispatch"],
          ].map(([n, l]) => (
            <div key={l} className="p-4 rounded-xl border">
              <div className="text-2xl font-semibold text-primary">{n}</div>
              <div className="text-xs text-gray-500 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIAL + CTA ───────────────────────────────────────────────────── */}
      <section className="rm-container py-16">
        <div className="rounded-2xl border p-6 md:p-10">
          <blockquote className="text-lg leading-7">
            “Finalmente vediamo in tempo reale chi è più vicino, quanto manca e cosa serve.
            I rapportini con foto e firma ci hanno tolto un mondo di carta.”
          </blockquote>
          <div className="mt-3 text-sm text-gray-500">Responsabile Operativo — Consorzio Sicilia</div>
          <div className="mt-6">
            <Link href="/contatti" className="px-5 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition">
              Richiedi una demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}