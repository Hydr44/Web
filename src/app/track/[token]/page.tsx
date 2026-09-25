'use client';
/* eslint-disable @typescript-eslint/no-explicit-any -- Leaflet è caricato da CDN (window.L), senza type definitions npm */

// Pagina pubblica /track/{token} — il cliente segue il carro che sta arrivando.
// Barra in alto con minuti, distanza e autista, mappa scura sotto. Mappa Leaflet
// (CDN). Polling /api/track/{token} ogni 10s. Nessuna dipendenza npm aggiuntiva.

import { useCallback, useEffect, useRef, useState } from 'react';
import { calcolaPercorso } from '@/lib/routing';
import { IconaTelefono } from '@/components/OnboardingShell';

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
// La mappa e' scura come il resto della pagina, ma i tasselli restano quelli di
// OpenStreetMap: a scurirli e' un filtro CSS. I fondi scuri gia' pronti di CARTO
// adesso vogliono una chiave e tornano con "API KEY REQUIRED" stampato sopra,
// anche quelli chiari; il filtro non dipende da nessun servizio in piu' e non
// puo' smettere di funzionare da un giorno all'altro.
// L'attribuzione a OpenStreetMap va mostrata: la chiedono le condizioni d'uso.
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const POLL_MS = 10000;
// Un solo blu, lo stesso del resto del prodotto.
const BLU = '#005dfa';

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
        const map = L.map(mapEl.current, { zoomControl: false }).setView([41.9, 12.5], 6);
        L.tileLayer(TILE_URL, { maxZoom: 19, subdomains: 'abc', attribution: TILE_ATTR }).addTo(map);
        // Se l'utente trascina la mappa smettiamo di ricentrare automaticamente.
        map.on('dragstart', () => { followRef.current = false; });
        mapRef.current = map;
      })
      .catch(() => setFatal('Non riusciamo ad aprire la mappa.'));
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
        if (!json.ok) {
          setFatal(json.error || 'Link non valido.');
          // Link scaduto, revocato o non valido: si smette di interrogare.
          // Il `finally` riprogrammava comunque il giro, quindi il telefono del
          // cliente continuava a chiamare un indirizzo morto ogni 10 secondi,
          // per sempre, con la pagina aperta.
          stop = true;
          return;
        }
        setData(json);
        renderMap(json);
        // Intervento concluso: l'ultimo aggiornamento è arrivato, non c'è più
        // niente da seguire.
        if (json.closed) stop = true;
      } catch {
        /* rete intermittente: riprova al giro dopo */
      } finally {
        if (!stop) timer = setTimeout(tick, POLL_MS);
      }
    };
    tick();
    return () => { stop = true; clearTimeout(timer); };
  }, [token]);

  // Percorso SU STRADA via OSRM demo. Fallback a linea retta tratteggiata se il
  // routing non risponde. Rifà la richiesta solo se le coordinate cambiano
  // sensibilmente (~11m) per non floodare il servizio.
  async function drawRoute(from: [number, number], to: [number, number]) {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    const key = `${from[0].toFixed(4)},${from[1].toFixed(4)}>${to[0].toFixed(4)},${to[1].toFixed(4)}`;
    if (key === routeKeyRef.current) return;
    routeKeyRef.current = key;

    let coords: [number, number][] | null = null;
    try {
      const percorso = await calcolaPercorso([from, to]);
      if (percorso?.coords && percorso.coords.length > 1) coords = percorso.coords;
    } catch {
      /* offline / servizio giù → fallback retta */
    }
    const latlngs = coords ?? [from, to];
    const style = { color: BLU, weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round', dashArray: coords ? '' : '2 12' };
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
          `<path d="M12 2.5 L19.5 21 L12 16.5 L4.5 21 Z" fill="${BLU}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>` +
          '</svg></div>'
        : '<div class="rm-veh">' +
          '<svg width="24" height="24" viewBox="0 0 24 24">' +
          `<circle cx="12" cy="12" r="7.5" fill="${BLU}" stroke="#fff" stroke-width="2.5"/>` +
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
          '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" fill="#0a1119" stroke="#fff" stroke-width="1.5"/>' +
          `<circle cx="12" cy="9" r="2.5" fill="${BLU}"/></svg></div>`,
        iconSize: [30, 38],
        iconAnchor: [15, 36],
      });
      if (!destRef.current) destRef.current = L.marker(ll, { icon }).addTo(map);
      else destRef.current.setLatLng(ll);
    }

    // Percorso su strada mezzo → destinazione
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
  const hasVehicle = !!(data?.vehicle && data.vehicle.lat != null);
  const lastUpd = data?.vehicle?.recordedAt ? new Date(data.vehicle.recordedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : null;

  // Quanto manca, in parole: il numero grande della barra.
  function mancanza(): string {
    if (data?.closed) return 'Completato';
    if (eta == null) return '—';
    if (eta <= 0) return 'In arrivo';
    return `${eta} ${eta === 1 ? 'minuto' : 'minuti'}`;
  }
  // Riga sopra il numero: dice che cosa sta succedendo.
  function stato(): string {
    if (data?.closed) return 'Il soccorso è finito';
    if (!hasVehicle) return 'Stiamo preparando il carro';
    if (eta != null && eta <= 0) return 'Il carro sta arrivando';
    return 'Il carro è in viaggio verso di te';
  }
  const arrivoAlle = !data?.closed && eta != null && eta > 0
    ? new Date(Date.now() + eta * 60000).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    : null;
  // Riga sotto il numero: l'ora di arrivo se la sappiamo, altrimenti quando
  // abbiamo sentito il mezzo l'ultima volta.
  let sottotitolo = 'in attesa di aggiornamenti';
  if (arrivoAlle) sottotitolo = `arrivo previsto alle ${arrivoAlle}`;
  else if (lastUpd) sottotitolo = `aggiornato alle ${lastUpd}`;

  const distM = data?.distanceMeters;
  const distanceText = distM == null ? null : distM >= 1000 ? `${(distM / 1000).toFixed(1).replace('.', ',')} km` : `${distM} m`;
  const driverName = data?.driverName || null;
  const vehicleText = [data?.vehiclePlate, data?.vehicleLabel].filter(Boolean).join(' · ') || null;
  const companyName = data?.company?.name || null;
  const phone = data?.company?.phone || null;

  return (
    <main
      className="rm-prod"
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <style>{`
        /* Marker mezzo: freccia direzionale (stile navigatore), niente pulsazione */
        .rm-veh { display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(2,6,23,.6)); transition: transform .4s ease-out; }
        .rm-dest { filter: drop-shadow(0 4px 6px rgba(0,0,0,.5)); }
        .leaflet-container { background: #0a1119 !important; font-family: inherit; }
        /* I tasselli chiari diventano scuri qui, non li serve gia' scuri nessuno. */
        .leaflet-tile-pane { filter: invert(1) hue-rotate(185deg) brightness(.88) contrast(.92) saturate(.38) grayscale(.55); }
        /* L'attribuzione resta leggibile e discreta sul fondo scuro. */
        .leaflet-control-attribution { background: rgba(10,17,25,.72) !important; color: #94a3b8 !important; font-size: 10px; padding: 2px 6px; }
        .leaflet-control-attribution a { color: #94a3b8 !important; }
        /* La pagina cliente è a tutto schermo: nascondiamo cookie banner, widget
           help/chat (Chatwoot/Hotjar) e simili "rotelline" che coprono la mappa. */
        #onetrust-consent-sdk, #ot-sdk-btn-floating, .ot-floating-button,
        .cookie-banner, [class*="cookie"], [id*="cookie"],
        .woot-widget-holder, .woot--bubble-holder, #chatwoot_live_chat_widget,
        ._hj_feedback_container, .hotjar-feedback, iframe[title*="chat" i] {
          display: none !important; visibility: hidden !important;
        }
      `}</style>

      {/* Barra del marchio: a destra il nome dell'azienda che sta arrivando */}
      <header
        style={{
          background: 'var(--layer)',
          borderBottom: '1px solid var(--border)',
          padding: '11px 20px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 11px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logos/logo-principale-bianco.svg" alt="RescueManager" width={150} height={29} />
        {companyName && <span className="rm-muted">{companyName}</span>}
      </header>

      {/* Minuti, distanza, autista e le due azioni */}
      {!fatal && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 28,
            flexWrap: 'wrap',
            padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p className="rm-muted">{stato()}</p>
            <p className="rm-dato">{mancanza()}</p>
            <p className="rm-muted">{sottotitolo}</p>
          </div>

          {distanceText && !data?.closed && (
            <div>
              <p className="rm-muted">Distanza</p>
              <p className="rm-dato">{distanceText}</p>
            </div>
          )}

          {(driverName || vehicleText) && (
            <div style={{ minWidth: 0 }}>
              <p className="rm-muted">Autista</p>
              <p style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{driverName || 'in assegnazione'}</p>
              {vehicleText && <p className="rm-muted">{vehicleText}</p>}
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {phone && !data?.closed && (
              <a href={`tel:${phone}`} className="rm-btn rm-btn--tertiary">
                Chiama l&apos;autista <IconaTelefono />
              </a>
            )}
            {hasVehicle && (
              <button onClick={recenter} className="rm-btn rm-btn--secondary">
                Centra la mappa
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mappa: prende tutto lo spazio che resta */}
      <div ref={mapEl} style={{ flex: '1 1 auto', minHeight: 0 }} />

      {fatal && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'rgba(10, 17, 25, .88)',
          }}
        >
          <div className="rm-card" style={{ maxWidth: 380 }}>
            <h2>Non possiamo mostrare il viaggio</h2>
            <div className="rm-note rm-note--errore" role="alert" style={{ marginTop: 14 }}>{fatal}</div>
            <p className="rm-muted" style={{ marginTop: 14 }}>
              Chiedi un nuovo link a chi ti sta mandando il carro.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
