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
  distanceMeters?: number | null;
  dest?: { lat: number | null; lng: number | null } | null;
  destAddress?: string | null;
  number?: number | null;
  type?: string | null;
  driverName?: string | null;
  vehiclePlate?: string | null;
  vehicleLabel?: string | null;
  company?: { name: string | null; phone: string | null } | null;
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
  const routeRef = useRef<any>(null);
  const routeKeyRef = useRef<string>('');
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

  // Percorso SU STRADA (stile Uber) via OSRM demo. Fallback a linea retta
  // tratteggiata se il routing non risponde. Rifà la richiesta solo se le
  // coordinate cambiano sensibilmente (~11m) per non floodare il servizio.
  async function drawRoute(from: [number, number], to: [number, number]) {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    const key = `${from[0].toFixed(4)},${from[1].toFixed(4)}>${to[0].toFixed(4)},${to[1].toFixed(4)}`;
    if (key === routeKeyRef.current) return;
    routeKeyRef.current = key;

    let coords: [number, number][] | null = null;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const j = await res.json();
      const g = j?.routes?.[0]?.geometry?.coordinates;
      if (Array.isArray(g) && g.length > 1) coords = g.map((c: [number, number]) => [c[1], c[0]]);
    } catch {
      /* offline / rate-limit → fallback retta */
    }
    const latlngs = coords ?? [from, to];
    const style = { color: '#3B82F6', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round', dashArray: coords ? '' : '2 12' };
    if (routeRef.current) {
      routeRef.current.setLatLngs(latlngs);
      routeRef.current.setStyle(style);
    } else {
      routeRef.current = L.polyline(latlngs, style).addTo(map);
    }
  }

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
      // Freccia direzionale (stile navigatore): punta nel senso di marcia se
      // c'è un heading valido, altrimenti puck tondo. Niente pulsazione.
      const hasHeading = typeof v.heading === 'number' && v.heading >= 0;
      const html = hasHeading
        ? `<div class="rm-veh" style="transform: rotate(${v.heading}deg)">` +
          '<svg width="34" height="34" viewBox="0 0 24 24">' +
          '<path d="M12 2.5 L19.5 21 L12 16.5 L4.5 21 Z" fill="#3B82F6" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>' +
          '</svg></div>'
        : '<div class="rm-veh">' +
          '<svg width="24" height="24" viewBox="0 0 24 24">' +
          '<circle cx="12" cy="12" r="7.5" fill="#3B82F6" stroke="#fff" stroke-width="2.5"/>' +
          '</svg></div>';
      const icon = L.divIcon({ className: '', html, iconSize: [34, 34], iconAnchor: [17, 17] });
      if (!truckRef.current) truckRef.current = L.marker(ll, { icon, zIndexOffset: 1000 }).addTo(map);
      else { truckRef.current.setLatLng(ll); truckRef.current.setIcon(icon); }
    }

    if (dest && dest.lat != null && dest.lng != null) {
      const ll: [number, number] = [dest.lat, dest.lng];
      pts.push(ll);
      const icon = L.divIcon({
        className: '',
        html:
          '<div class="rm-dest"><svg width="30" height="38" viewBox="0 0 24 24">' +
          '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" fill="#0F1724" stroke="#fff" stroke-width="1.5"/>' +
          '<circle cx="12" cy="9" r="2.5" fill="#34d399"/></svg></div>',
        iconSize: [30, 38],
        iconAnchor: [15, 36],
      });
      if (!destRef.current) destRef.current = L.marker(ll, { icon }).addTo(map);
      else destRef.current.setLatLng(ll);
    }

    // Percorso su strada mezzo → destinazione (stile Uber)
    if (v && v.lat != null && v.lng != null && dest && dest.lat != null && dest.lng != null) {
      void drawRoute([v.lat, v.lng], [dest.lat, dest.lng]);
    } else if (routeRef.current) {
      map.removeLayer(routeRef.current);
      routeRef.current = null;
      routeKeyRef.current = '';
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

  const distM = data?.distanceMeters;
  const distanceText = distM == null ? null : distM >= 1000 ? `${(distM / 1000).toFixed(1)} km` : `${distM} m`;
  const driverName = data?.driverName || null;
  const driverInitials = driverName
    ? driverName.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() || '').join('')
    : null;
  const vehicleText = [data?.vehiclePlate, data?.vehicleLabel].filter(Boolean).join(' · ') || null;
  const companyName = data?.company?.name || null;
  const phone = data?.company?.phone || null;

  return (
    <main className="fixed inset-0 bg-[#eef1f4] overflow-hidden">
      <style>{`
        /* Marker mezzo: freccia direzionale (stile navigatore), niente pulsazione */
        .rm-veh { display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(2,6,23,.45)); transition: transform .4s ease-out; }
        .rm-dest { filter: drop-shadow(0 4px 6px rgba(0,0,0,.35)); }
        .leaflet-container { background: #eef1f4 !important; font-family: inherit; }
        /* La pagina cliente è a tutto schermo: nascondiamo cookie banner, widget
           help/chat (Chatwoot/Hotjar) e simili "rotelline" che coprono la mappa. */
        #onetrust-consent-sdk, #ot-sdk-btn-floating, .ot-floating-button,
        .cookie-banner, [class*="cookie"], [id*="cookie"],
        .woot-widget-holder, .woot--bubble-holder, #chatwoot_live_chat_widget,
        ._hj_feedback_container, .hotjar-feedback, iframe[title*="chat" i] {
          display: none !important; visibility: hidden !important;
        }
      `}</style>

      {/* Mappa full-screen */}
      <div ref={mapEl} className="absolute inset-0" />

      {/* Chip azienda (white-label: il cliente vede il nome del soccorritore, non RescueManager) */}
      <div className="absolute top-0 inset-x-0 px-3 pointer-events-none" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="mx-auto max-w-md flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-[#1C2128]/95 backdrop-blur px-3.5 py-2 border border-[#374151]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
            <span className="text-[13px] font-semibold text-white truncate max-w-[60vw]">{companyName || 'Soccorso stradale'}</span>
          </div>
        </div>
      </div>

      {/* Bottone ricentra (piatto, stile app) */}
      {hasVehicle && !fatal && (
        <button
          onClick={recenter}
          aria-label="Centra sulla mappa"
          className="absolute right-3 z-[500] h-11 w-11 bg-[#1C2128] border border-[#374151] flex items-center justify-center active:opacity-80 transition"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 64px)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      )}

      {/* Errore fatale (piatto, stile app) */}
      {fatal && (
        <div className="absolute inset-0 z-[600] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1C2128] border border-[#374151] p-7 max-w-sm text-center">
            <div className="mx-auto mb-3 h-12 w-12 bg-[#0A0E13] border border-[#374151] flex items-center justify-center text-2xl">⚠️</div>
            <p className="text-[15px] font-medium text-white">{fatal}</p>
            <p className="text-[13px] text-[#9CA3AF] mt-1">Contatta il centro di assistenza per un nuovo link.</p>
          </div>
        </div>
      )}

      {/* Pannello info — design app: piatto, raggio 0, bordi sottili, accento a sinistra */}
      {!fatal && (
        <div className="absolute inset-x-0 bottom-0 pointer-events-none">
          <div
            className="mx-auto max-w-md bg-[#0A0E13]/97 backdrop-blur border-t border-[#374151] pointer-events-auto"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="px-5 pt-4 pb-4">
              {/* Stato + ETA, con accento colorato a sinistra (pattern app) */}
              <div className="flex items-stretch gap-3">
                <div className="w-[3px] shrink-0" style={{ backgroundColor: data?.closed ? '#9CA3AF' : hasVehicle ? '#10B981' : '#F59E0B' }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: data?.closed ? '#9CA3AF' : hasVehicle ? '#10B981' : '#F59E0B' }}>
                    {data?.closed ? 'Completato' : hasVehicle ? 'In viaggio verso di te' : 'In preparazione'}
                  </p>
                  <h1 className="mt-1 text-[18px] font-bold text-white leading-tight truncate">{headline}</h1>
                </div>
                {!data?.closed && (
                  <div className="text-right shrink-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#9CA3AF]">Arrivo</p>
                    <p className="text-[28px] font-extrabold text-white leading-none tabular-nums">{etaText}</p>
                    {etaUnit && <p className="text-[11px] font-medium text-[#9CA3AF] -mt-0.5">{etaUnit}</p>}
                  </div>
                )}
              </div>

              {/* Barra avvicinamento */}
              {!data?.closed && hasVehicle && (
                <div className="mt-4 h-1 w-full bg-[#1C2128] overflow-hidden">
                  <div className="h-full bg-[#3B82F6]" style={{ width: '60%' }} />
                </div>
              )}

              {/* Card autista + mezzo + distanza + chiamata (piatta, bordi app) */}
              {(driverName || vehicleText || distanceText || phone) && (
                <div className="mt-4 bg-[#1C2128] border border-[#374151]">
                  <div className="flex items-center gap-3 p-3.5">
                    <div className="h-10 w-10 shrink-0 bg-[#0A0E13] border border-[#374151] flex items-center justify-center font-bold text-[14px] text-[#60A5FA]">
                      {driverInitials || (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-white truncate">{driverName || companyName || 'Autista in arrivo'}</p>
                      <p className="text-[12px] text-[#9CA3AF] truncate">{vehicleText || 'Mezzo di soccorso'}</p>
                    </div>
                    {distanceText && !data?.closed && (
                      <div className="text-right shrink-0">
                        <p className="text-[10px] uppercase tracking-wider text-[#9CA3AF]">distanza</p>
                        <p className="text-[15px] font-semibold text-white tabular-nums">{distanceText}</p>
                      </div>
                    )}
                  </div>
                  {phone && !data?.closed && (
                    <a
                      href={`tel:${phone}`}
                      className="flex items-center justify-center gap-2 border-t border-[#374151] bg-[#3B82F6] active:bg-[#2563EB] transition py-3 text-[14px] font-semibold text-white"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      Chiama
                    </a>
                  )}
                </div>
              )}

              {data?.closed && (
                <p className="mt-4 text-[13px] text-[#9CA3AF]">Il soccorso è stato completato. Grazie!</p>
              )}

              <div className="mt-4 flex items-center justify-between text-[12px] text-[#9CA3AF]">
                <span>{lastUpd ? `Aggiornato alle ${lastUpd}` : 'In attesa di aggiornamenti…'}</span>
                <span>aggiornamento automatico</span>
              </div>

              {/* white-label: powered by RescueManager (cliccabile) */}
              <div className="mt-3 pt-3 border-t border-[#374151] text-center">
                <a href="https://rescuemanager.eu" target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#6B7280]">
                  powered by <span className="font-semibold text-[#9CA3AF]">RescueManager</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
