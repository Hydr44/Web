'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- Leaflet è caricato da CDN (window.L), senza type definitions npm */

// Pagina pubblica /track/{token} — tracking live "stile Uber": il cliente segue
// in tempo reale il mezzo di soccorso in arrivo (posizione + ETA). Mappa Leaflet
// (CDN), tile CartoDB Positron per un look pulito/minimale. Polling
// /api/track/{token} ogni 10s. Nessuna dipendenza npm aggiuntiva.

import { useCallback, useEffect, useRef, useState } from 'react';

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
// Tile chiare e minimali (CartoDB Positron) per un look da app di ride-hailing.
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const POLL_MS = 10000;

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
  const lineRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const followRef = useRef(true); // auto-centra finché l'utente non sposta la mappa

  // Init mappa
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        LRef.current = L;
        const map = L.map(mapEl.current, { zoomControl: false, attributionControl: false }).setView([41.9, 12.5], 6);
        L.tileLayer(TILE_URL, { maxZoom: 20, subdomains: 'abcd' }).addTo(map);
        // Se l'utente trascina la mappa smettiamo di ricentrare automaticamente.
        map.on('dragstart', () => { followRef.current = false; });
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
        html: '<div class="rm-truck"><span class="rm-pulse"></span><span class="rm-badge">🚛</span></div>',
        iconSize: [46, 46],
        iconAnchor: [23, 23],
      });
      if (!truckRef.current) truckRef.current = L.marker(ll, { icon, zIndexOffset: 1000 }).addTo(map);
      else { truckRef.current.setLatLng(ll); truckRef.current.setIcon(icon); }
    }

    if (dest && dest.lat != null && dest.lng != null) {
      const ll: [number, number] = [dest.lat, dest.lng];
      pts.push(ll);
      const icon = L.divIcon({ className: '', html: '<div class="rm-dest">📍</div>', iconSize: [30, 38], iconAnchor: [15, 36] });
      if (!destRef.current) destRef.current = L.marker(ll, { icon }).addTo(map);
      else destRef.current.setLatLng(ll);
    }

    // Linea tratteggiata mezzo → destinazione
    if (pts.length >= 2) {
      if (!lineRef.current) {
        lineRef.current = L.polyline(pts, { color: '#10B981', weight: 4, opacity: 0.7, dashArray: '2 10', lineCap: 'round' }).addTo(map);
      } else {
        lineRef.current.setLatLngs(pts);
      }
    } else if (lineRef.current) {
      map.removeLayer(lineRef.current);
      lineRef.current = null;
    }

    if (!followRef.current) return; // l'utente ha spostato la mappa: non ricentriamo
    if (pts.length === 1) map.setView(pts[0], 15, { animate: true });
    else if (pts.length >= 2) map.fitBounds(L.latLngBounds(pts).pad(0.35), { animate: true, maxZoom: 16 });
  }

  const recenter = useCallback(() => {
    followRef.current = true;
    if (data) renderMap(data);
  }, [data]);

  const eta = data?.etaMinutes;
  const etaText = eta == null ? '—' : eta <= 0 ? 'In arrivo' : `${eta}`;
  const etaUnit = eta == null || eta <= 0 ? '' : eta === 1 ? 'minuto' : 'minuti';
  const lastUpd = data?.vehicle?.recordedAt ? new Date(data.vehicle.recordedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : null;
  const hasVehicle = !!(data?.vehicle && data.vehicle.lat != null);
  const headline = data?.closed
    ? 'Soccorso completato'
    : hasVehicle
      ? (eta != null && eta <= 0 ? 'Il mezzo è in arrivo' : 'Mezzo di soccorso in arrivo')
      : 'In attesa del mezzo';

  return (
    <main className="fixed inset-0 bg-[#eef1f4] overflow-hidden">
      <style>{`
        .rm-truck { position: relative; width: 46px; height: 46px; }
        .rm-pulse { position: absolute; inset: 0; border-radius: 9999px; background: rgba(16,185,129,.35); animation: rmpulse 1.8s ease-out infinite; }
        .rm-badge { position: absolute; inset: 7px; border-radius: 9999px; background: #0F1724; border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 6px 16px rgba(2,6,23,.45); }
        .rm-dest { font-size: 30px; filter: drop-shadow(0 4px 6px rgba(0,0,0,.35)); }
        @keyframes rmpulse { 0% { transform: scale(.45); opacity: .85; } 100% { transform: scale(1.7); opacity: 0; } }
        .leaflet-container { background: #eef1f4 !important; font-family: inherit; }
      `}</style>

      {/* Mappa full-screen */}
      <div ref={mapEl} className="absolute inset-0" />

      {/* Brand chip in alto */}
      <div className="absolute top-0 inset-x-0 p-3 pointer-events-none">
        <div className="mx-auto max-w-md flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-3.5 py-2 shadow-lg ring-1 ring-black/5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[13px] font-semibold text-slate-800">RescueManager</span>
            <span className="text-[12px] text-slate-400">· tracking live</span>
          </div>
        </div>
      </div>

      {/* Bottone ricentra */}
      {hasVehicle && !fatal && (
        <button
          onClick={recenter}
          aria-label="Centra sulla mappa"
          className="absolute right-4 z-[500] h-11 w-11 rounded-full bg-white shadow-lg ring-1 ring-black/5 flex items-center justify-center active:scale-95 transition"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 188px)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      )}

      {/* Errore fatale */}
      {fatal && (
        <div className="absolute inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-7 max-w-sm text-center shadow-2xl">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">⚠️</div>
            <p className="text-[15px] font-medium text-slate-800">{fatal}</p>
            <p className="text-[13px] text-slate-500 mt-1">Contatta il centro di assistenza per un nuovo link.</p>
          </div>
        </div>
      )}

      {/* Bottom sheet stile Uber */}
      {!fatal && (
        <div className="absolute inset-x-0 bottom-0 p-3 pointer-events-none">
          <div
            className="mx-auto max-w-md rounded-[28px] bg-white shadow-[0_-8px_40px_rgba(2,6,23,.18)] ring-1 ring-black/5 pointer-events-auto"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-200" />
            <div className="px-5 pt-3 pb-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    data?.closed ? 'bg-slate-100 text-slate-500' : hasVehicle ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${data?.closed ? 'bg-slate-400' : hasVehicle ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {data?.closed ? 'Completato' : hasVehicle ? 'In viaggio verso di te' : 'In preparazione'}
                  </span>
                  <h1 className="mt-2 text-[19px] font-bold text-slate-900 leading-tight truncate">{headline}</h1>
                </div>
                {!data?.closed && (
                  <div className="text-right shrink-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Arrivo</p>
                    <p className="text-[30px] font-extrabold text-emerald-600 leading-none tabular-nums">{etaText}</p>
                    {etaUnit && <p className="text-[11px] font-medium text-slate-400 -mt-0.5">{etaUnit}</p>}
                  </div>
                )}
              </div>

              {/* Barra progresso "in avvicinamento" */}
              {!data?.closed && hasVehicle && (
                <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 animate-pulse" style={{ width: '60%' }} />
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-[12px] text-slate-400">
                <span>{lastUpd ? `Aggiornato alle ${lastUpd}` : 'In attesa di aggiornamenti…'}</span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  automatico
                </span>
              </div>

              {data?.closed && (
                <p className="mt-3 text-[13px] text-slate-500">
                  Il soccorso è stato completato. Grazie per aver usato RescueManager.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
