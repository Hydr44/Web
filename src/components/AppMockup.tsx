"use client";
import Image from "next/image";
import { useState } from "react";

type Shot = { src: string; alt: string };

export default function AppMockup({
  shots,
  initial = 0,
}: { shots: Shot[]; initial?: number }) {
  const [idx, setIdx] = useState(initial);
  const current = shots[idx];

  return (
    <div className="w-full">
      {/* Finestra */}
      <div className="relative rounded-2xl border bg-[#0f1220] text-white overflow-hidden shadow-xl">
        {/* Barra finestra */}
        <div className="h-9 px-3 flex items-center justify-between border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="text-[11px] tracking-wide text-white/60">
            RescueManager — anteprima
          </div>
          <div className="w-10" />
        </div>

        {/* Screenshot */}
        <div className="relative">
          <Image
            src={current.src}
            alt={current.alt}
            width={1300}
            height={740}
            priority
            className="w-full h-auto object-cover"
          />

          {/* PRIVACY PATCH (copre l’angolo alto-destro) */}
          <div
            aria-hidden
            className="absolute top-2 right-2 h-8 w-40 rounded-md bg-[#0f1220]/90 ring-1 ring-white/5"
            // se vuoi estenderla: style={{width:180,height:38}}
          />
        </div>
      </div>

      {/* Thumbs */}
      {shots.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {shots.map((s, i) => (
            <button
              key={s.src}
              onClick={() => setIdx(i)}
              className={`relative overflow-hidden rounded-lg border ${
                i === idx ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={s.src}
                alt={s.alt}
                width={180}
                height={110}
                className="h-20 w-36 object-cover"
              />
              {/* mini patch anche nelle thumbs */}
              <span className="absolute top-1.5 right-1.5 h-3.5 w-12 rounded bg-[#0f1220]/90" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
