// Autocompletamento indirizzo (Google Places) per il wizard onboarding.
// Usa NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (già su Vercel). Se la chiave manca o lo
// script non carica, degrada a input normale (nessun crash). Alla selezione
// compila via+civico, città, provincia (sigla), CAP.
'use client';

import { useEffect, useRef } from 'react';

type Parsed = { indirizzo: string; citta: string; provincia: string; cap: string };

let scriptPromise: Promise<void> | null = null;
function loadPlaces(key: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if ((window as unknown as { google?: { maps?: { places?: unknown } } }).google?.maps?.places) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&language=it&region=IT`;
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('places script failed'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function AddressAutocomplete({ value, onChange, onPick, className, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  onPick: (p: Parsed) => void;
  className?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    if (!key || !ref.current) return;
    let ac: { addListener: (e: string, cb: () => void) => void; getPlace: () => { address_components?: Array<{ types: string[]; long_name: string; short_name: string }> } } | null = null;
    let cancelled = false;
    loadPlaces(key).then(() => {
      if (cancelled || !ref.current) return;
      const g = (window as unknown as { google: any }).google;
      if (!g?.maps?.places) return;
      ac = new g.maps.places.Autocomplete(ref.current, {
        types: ['address'],
        componentRestrictions: { country: 'it' },
        fields: ['address_components'],
      });
      ac!.addListener('place_changed', () => {
        const comp = ac!.getPlace().address_components || [];
        const get = (t: string, short = false) => {
          const c = comp.find((x) => x.types.includes(t));
          return c ? (short ? c.short_name : c.long_name) : '';
        };
        const route = get('route');
        const num = get('street_number');
        onPick({
          indirizzo: [route, num].filter(Boolean).join(' '),
          citta: get('locality') || get('administrative_area_level_3'),
          provincia: get('administrative_area_level_2', true),
          cap: get('postal_code'),
        });
      });
    }).catch(() => { /* degrada a input normale */ });
    return () => {
      cancelled = true;
      const g = (window as unknown as { google?: any }).google;
      if (ac && g?.maps?.event) g.maps.event.clearInstanceListeners(ac);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <input
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={className}
      placeholder={placeholder}
      autoComplete="off"
    />
  );
}
