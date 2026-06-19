'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- Leaflet è caricato da CDN (window.L), senza type definitions npm */

// Pagina pubblica /track/{token} — il cliente segue in tempo reale il mezzo di
// soccorso in arrivo (posizione live + ETA). Mappa Leaflet caricata da CDN (nessuna
// nuova dipendenza npm). Polling /api/track/{token} ogni 12s.

import { useEffect, useRef, useState } from 'react';

type Vehicle = { lat: number | null; lng: number | null; heading: number | null; speed: number | null; recordedAt: string | null };
type TrackData = {
  ok: boolean;
  closed?: boolean;
  status?: string | null;
  etaMinutes?: number | null;
  dest?: { lat: number | null; lng: number | null } | null;
  vehicle?: Vehicle | null;
  error?: string;
};

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const POLL_MS = 12000;

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.L) return resolve(w.L);
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    let script = document.querySelector(`script[src="${LEAFLET_JS}"]`) as HTMLScriptElement | null;
    if (script && w.L) return resolve(w.L);
    if (!script) {
      script = document.createElement('script');
      script.src = LEAFLET_JS;
      document.body.appendChild(script);
    }
    script.addEventListener('load', () => resolve((window as any).L));
    script.addEventListener('error', () => reject(new Error('Leaflet load failed')));
  });
}

export default function TrackPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [data, setData] = useState<TrackData | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const truckRef = useRef<any>(null);
  const destRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  // Init mappa
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        LRef.current = L;
        const map = L.map(mapEl.current, { zoomControl: true, attributionControl: false }).setView([41.9, 12.5], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        mapRef.current = map;
      })
      .catch(() => setFatal('Impossibile caricare la mappa.'));
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Polling dati
  useEffect(() => {
    let timer: any;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/track/${token}`, { cache: 'no-store' });
        const json: TrackData = await res.json();
        if (stop) return;
        if (!json.ok) { setFatal(json.error || 'Link non valido.'); return; }
        setData(json);
        renderMap(json);
      } catch {
        /* rete intermittente: riprova al giro dopo */
      } finally {
        if (!stop) timer = setTimeout(tick, POLL_MS);
      }
    };
    tick();
    return () => { stop = true; clearTimeout(timer); };
  }, [token]);

  function renderMap(d: TrackData) {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    const v = d.vehicle;
    const dest = d.dest;
    const pts: [number, number][] = [];

    if (v && v.lat != null && v.lng != null) {
      const ll: [number, number] = [v.lat, v.lng];
      pts.push(ll);
      const icon = L.divIcon({
        className: '',
        html: `<div style="font-size:28px;line-height:1;transform:rotate(${v.heading ?? 0}deg)">🚛</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      if (!truckRef.current) truckRef.current = L.marker(ll, { icon }).addTo(map);
      else { truckRef.current.setLatLng(ll); truckRef.current.setIcon(icon); }
    }

    if (dest && dest.lat != null && dest.lng != null) {
      const ll: [number, number] = [dest.lat, dest.lng];
      pts.push(ll);
      const icon = L.divIcon({ className: '', html: '<div style="font-size:24px">📍</div>', iconSize: [24, 24], iconAnchor: [12, 22] });
      if (!destRef.current) destRef.current = L.marker(ll, { icon }).addTo(map);
      else destRef.current.setLatLng(ll);
    }

    if (pts.length === 1) map.setView(pts[0], 15, { animate: true });
    else if (pts.length >= 2) map.fitBounds(L.latLngBounds(pts).pad(0.3), { animate: true });
  }

  const eta = data?.etaMinutes;
  const etaText = eta == null ? '—' : eta <= 0 ? 'In arrivo' : `${eta} min`;
  const lastUpd = data?.vehicle?.recordedAt ? new Date(data.vehicle.recordedAt).toLocaleTimeString() : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">RescueManager</p>
          <h1 className="text-lg font-semibold">Soccorso in arrivo</h1>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Arrivo stimato</p>
          <p className="text-2xl font-bold text-emerald-400">{etaText}</p>
        </div>
      </header>

      <div className="relative flex-1">
        <div ref={mapEl} className="absolute inset-0" style={{ background: '#0b1220' }} />

        {fatal && (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-950/80">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm text-center">
              <p className="text-sm text-slate-300">{fatal}</p>
            </div>
          </div>
        )}

        {!fatal && data?.closed && (
          <div className="absolute inset-x-0 top-0 m-3 rounded-xl bg-slate-900/90 border border-slate-700 p-3 text-center text-sm">
            Il soccorso è stato completato. Grazie per aver usato RescueManager.
          </div>
        )}

        {!fatal && !data?.closed && !data?.vehicle && (
          <div className="absolute inset-x-0 top-0 m-3 rounded-xl bg-slate-900/90 border border-slate-700 p-3 text-center text-sm text-slate-300">
            In attesa della posizione del mezzo…
          </div>
        )}
      </div>

      <footer className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>{lastUpd ? `Aggiornato alle ${lastUpd}` : 'In attesa di aggiornamenti'}</span>
        <span>🚛 mezzo · 📍 destinazione</span>
      </footer>
    </main>
  );
}
