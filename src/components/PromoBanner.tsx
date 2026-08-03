"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "promo-estate-2026";
// L'offerta scade a fine 31 agosto 2026 (Europe/Rome)
const DEADLINE = new Date("2026-09-01T00:00:00+02:00");

export default function PromoBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (new Date() >= DEADLINE) return; // promo scaduta
    if (typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "1") return;
    setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-blue-600 text-white shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
      <button
        onClick={dismiss}
        aria-label="Chiudi banner offerta"
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-white/80 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="max-w-7xl mx-auto px-10 py-2.5 flex items-center justify-center gap-x-4 gap-y-1.5 flex-wrap text-center">
        <span className="text-sm">
          <span className="font-extrabold">☀️ Offerta estiva</span>
          <span className="hidden sm:inline"> — attiva un pacchetto entro il </span>
          <span className="sm:hidden"> · entro il </span>
          <span className="font-bold">31 agosto</span> e blocchi uno{" "}
          <span className="font-bold">sconto permanente fino al 30%</span>.
        </span>
        <Link
          href="/contatti"
          className="inline-flex items-center gap-1.5 bg-white text-blue-700 font-bold text-sm px-4 py-1.5 rounded hover:bg-blue-50 transition-colors whitespace-nowrap"
        >
          Richiedi demo
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
