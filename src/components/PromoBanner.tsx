"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ArrowRight } from "lucide-react";

// L'offerta scade a fine 31 agosto 2026 (Europe/Rome)
const DEADLINE = new Date("2026-09-01T00:00:00+02:00");
const HIDE_KEY = "promo-estate-2026-hidden"; // "non mostrare più" (nasconde anche il sole)
// Pagine dove il banner appare PIENO; altrove si riduce a "sole" cliccabile.
const MAIN_PAGES = new Set(["/", "/dashboard"]);

export default function PromoBanner() {
  const pathname = usePathname();
  const [now, setNow] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Countdown al secondo (client only) + rispetto del "non mostrare più".
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(HIDE_KEY) === "1") {
      setHidden(true);
      return;
    }
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Default per pagina: pieno sulle pagine principali (home, dashboard),
  // ridotto a sole quando il cliente naviga altrove.
  useEffect(() => {
    setOpen(MAIN_PAGES.has(pathname || ""));
  }, [pathname]);

  if (hidden || now === null) return null;
  const remaining = DEADLINE.getTime() - now;
  if (remaining <= 0) return null; // promo scaduta

  const d = Math.floor(remaining / 86400000);
  const h = Math.floor((remaining % 86400000) / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);

  const hideForever = () => {
    try {
      window.localStorage.setItem(HIDE_KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  // ── Sole (stato ridotto) ──
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Offerta estiva: sconto fino al 30%"
        title="Offerta estiva — sconto fino al 30%"
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center bg-blue-600 text-2xl shadow-lg transition-transform hover:scale-105"
      >
        <span className="animate-pulse">☀️</span>
      </button>
    );
  }

  // ── Banner pieno con countdown ──
  const Unit = ({ v, l }: { v: number; l: string }) => (
    <span className="flex flex-col items-center leading-none">
      <span className="min-w-[2.2ch] bg-white/15 px-1.5 py-1 text-sm font-bold tabular-nums">
        {String(v).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wide text-white/70">{l}</span>
    </span>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-blue-600 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
      <button
        onClick={() => setOpen(false)}
        aria-label="Riduci offerta"
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-white/80 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-10 py-2 text-center">
        <span className="text-sm">
          <span className="font-extrabold">☀️ Offerta estiva</span>
          <span className="hidden sm:inline"> — blocca uno </span>
          <span className="font-bold">sconto permanente fino al 30%</span>
        </span>
        <span className="flex items-start gap-1.5">
          <Unit v={d} l="giorni" />
          <Unit v={h} l="ore" />
          <Unit v={m} l="min" />
          <Unit v={s} l="sec" />
        </span>
        <Link
          href="/contatti"
          className="inline-flex items-center gap-1.5 whitespace-nowrap bg-white px-4 py-1.5 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50"
        >
          Richiedi demo
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button onClick={hideForever} className="text-[11px] text-white/60 underline hover:text-white/90">
          non mostrare più
        </button>
      </div>
    </div>
  );
}
