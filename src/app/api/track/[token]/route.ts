// API pubblica per la pagina /track/{token}: ritorna la posizione LIVE del mezzo
// + ETA + destinazione + info utili al cliente (autista, mezzo, azienda, distanza).
// Usa il client admin (server-side, token opaco).
import { supabaseAdmin, jsonWithCors, emptyCorsResponse } from "../../assist/_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Durata del link pubblico "segui il mezzo", per i record creati prima che
// esistesse la colonna `expires_at`. Deve restare allineato al default della
// colonna in `assistance_requests`.
const SETTE_GIORNI_MS = 7 * 24 * 60 * 60 * 1000;

export async function OPTIONS() {
  return emptyCorsResponse(204);
}

function etaMinutesFrom(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((t - Date.now()) / 60000));
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : null;
}

/**
 * Coordinate di un punto del trasporto, da qualunque forma siano salvate.
 *
 * Il record ha due rappresentazioni della stessa cosa: le colonne
 * `*_lat` / `*_lng` e il campo JSON `*_coords`. In produzione le colonne sono
 * vuote su TUTTI i record — nessun client le scrive — mentre `*_coords` è
 * valorizzato. Questa pagina leggeva solo le colonne, quindi la destinazione
 * risultava sempre assente e con lei distanza e minuti stimati.
 *
 * `*_coords` arriva come array [lat, lng] (è quello che scrivono desktop e app)
 * ma tolleriamo anche l'oggetto { lat, lng }, che il codice client accetta.
 */
function coordDa(coords: unknown, lat: unknown, lng: unknown): { lat: number; lng: number } | null {
  const l = num(lat);
  const g = num(lng);
  if (l != null && g != null) return { lat: l, lng: g };

  if (Array.isArray(coords) && coords.length >= 2) {
    const a = num(coords[0]);
    const b = num(coords[1]);
    if (a != null && b != null) return { lat: a, lng: b };
  }
  if (coords && typeof coords === "object") {
    const o = coords as Record<string, unknown>;
    const a = num(o.lat ?? o.latitude);
    const b = num(o.lng ?? o.lon ?? o.longitude);
    if (a != null && b != null) return { lat: a, lng: b };
  }
  return null;
}

// Distanza in metri tra due coordinate (Haversine).
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  try {
    const token = params?.token;
    if (!token) return jsonWithCors({ ok: false, error: "Token mancante" }, { status: 400 });

    // 1) Richiesta assist legata a un trasporto
    const { data: reqRow, error: reqErr } = await supabaseAdmin
      .from("assistance_requests")
      .select("token, status, transport_id, lat, lng, created_at, expires_at, closed_at")
      .eq("token", token)
      .maybeSingle();
    if (reqErr) throw reqErr;
    if (!reqRow) return jsonWithCors({ ok: false, error: "Link non valido o scaduto" }, { status: 404 });
    if (!reqRow.transport_id) {
      return jsonWithCors({ ok: false, error: "Questo link non è un tracking mezzo" }, { status: 409 });
    }

    // Scadenza del link (privacy P2). Questo indirizzo è pubblico e senza
    // password, ed espone nome dell'autista, targa e posizione aggiornata:
    // prima non scadeva mai e non si poteva revocare.
    //
    // Si prende sempre la data PIÙ VICINA fra `expires_at` e «creazione + 7
    // giorni», così un link non può in nessun caso sopravvivere più di sette
    // giorni dalla sua creazione. Non è una cintura in più: aggiungendo la
    // colonna con un default, Postgres l'ha calcolato anche sulle righe già
    // esistenti, che si sono così ritrovate una scadenza nuova invece di
    // risultare scadute. Questo limite le riporta al comportamento voluto senza
    // dover riscrivere i dati.
    const daCreazione = new Date(reqRow.created_at).getTime() + SETTE_GIORNI_MS;
    const daColonna = reqRow.expires_at ? new Date(reqRow.expires_at).getTime() : Number.POSITIVE_INFINITY;
    const scadenza = Math.min(daCreazione, daColonna);
    const revocato = !!reqRow.closed_at || reqRow.status === "closed";
    if (revocato || (Number.isFinite(scadenza) && Date.now() > scadenza)) {
      return jsonWithCors(
        { ok: false, error: "Questo link non è più attivo." },
        { status: 410 },
      );
    }

    // 2) Trasporto (stato, ETA, destinazione, riferimenti autista/mezzo/org)
    const { data: tr, error: trErr } = await supabaseAdmin
      .from("transports")
      .select(
        // `pickup_coords` / `dropoff_coords` sono i campi che desktop e app
        // scrivono davvero. Le colonne `pickup_lat` / `pickup_lng` esistono ma
        // NESSUNO le riempie: erano il motivo per cui questa pagina non ha mai
        // mostrato destinazione, distanza e minuti. Vedi coordDa() più sotto.
        "id, status, eta_pickup, eta_dropoff, eta_minutes, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, pickup_coords, dropoff_coords, customer_name, driver_id, vehicle_id, org_id, number, transport_type, dropoff_address",
      )
      .eq("id", reqRow.transport_id)
      .maybeSingle();
    if (trErr) throw trErr;

    // 2b) Autista, mezzo, azienda — in parallelo (best-effort)
    const [drvRes, vehRes, orgRes] = await Promise.all([
      tr?.driver_id
        ? supabaseAdmin.from("staff_drivers").select("nome, cognome").eq("id", tr.driver_id).maybeSingle()
        : Promise.resolve({ data: null }),
      tr?.vehicle_id
        ? supabaseAdmin.from("vehicles").select("targa, plate, marca, modello, model, tipo").eq("id", tr.vehicle_id).maybeSingle()
        : Promise.resolve({ data: null }),
      tr?.org_id
        ? supabaseAdmin.from("orgs").select("name, phone").eq("id", tr.org_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const drv = drvRes.data as { nome?: string; cognome?: string } | null;
    const driverName = drv ? [drv.nome, drv.cognome].filter(Boolean).join(" ").trim() || null : null;

    const veh = vehRes.data as { targa?: string; plate?: string; marca?: string; modello?: string; model?: string; tipo?: string } | null;
    const vehiclePlate = veh ? veh.targa || veh.plate || null : null;
    const vehicleLabel = veh ? [veh.marca, veh.modello || veh.model].filter(Boolean).join(" ").trim() || veh.tipo || null : null;

    const orgRow = orgRes.data as { name?: string; phone?: string } | null;
    const company = orgRow ? { name: orgRow.name ?? null, phone: orgRow.phone ?? null } : null;

    // 3) Ultima posizione del mezzo. Scartiamo i fix GROSSOLANI (accuracy > 150m):
    //    i primi punti cell/wifi possono avere raggio di km e mostrerebbero il
    //    mezzo dall'altra parte della città. Teniamo l'ultimo punto "buono".
    const { data: pos, error: posErr } = await supabaseAdmin
      .from("transport_tracking")
      .select("latitude, longitude, heading, speed, status, recorded_at")
      .eq("transport_id", reqRow.transport_id)
      .or("accuracy.lte.150,accuracy.is.null")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (posErr) throw posErr;

    // `canceled` con UNA elle è la grafia reale del database (vincolo su
    // transports.status); le altre restano per record storici.
    const closed = !tr || ["done", "canceled", "cancelled", "completato", "annullato"].includes((tr.status || "").toLowerCase());

    // ETA: preferisci il punto ancora futuro (pickup → poi dropoff)
    const etaPickup = etaMinutesFrom(tr?.eta_pickup ?? null);
    const etaDropoff = etaMinutesFrom(tr?.eta_dropoff ?? null);
    const etaSalvato = etaPickup ?? etaDropoff ?? (Number.isFinite(tr?.eta_minutes as number) ? (tr!.eta_minutes as number) : null);

    // Destinazione = punto cliente (pickup) se disponibile, altrimenti posizione
    // condivisa dal cliente (assist). Il pickup si legge da `pickup_coords`,
    // che è dove i client scrivono davvero (vedi coordDa).
    const destPickup = coordDa(tr?.pickup_coords, tr?.pickup_lat, tr?.pickup_lng);
    const destAssist = coordDa(null, reqRow.lat, reqRow.lng);
    const dest = destPickup ?? destAssist;

    const vLat = pos ? num(pos.latitude) : null;
    const vLng = pos ? num(pos.longitude) : null;
    const distanceMeters =
      vLat != null && vLng != null && dest?.lat != null && dest?.lng != null
        ? haversine(vLat, vLng, dest.lat, dest.lng)
        : null;

    // Minuti stimati. I campi `eta_*` sul trasporto sono vuoti su ogni record —
    // li scriverebbe l'app dell'autista, ma solo dentro un ramo che non si
    // attiva mai. Finché non si sblocca, la stima la facciamo qui: distanza in
    // linea d'aria per il fattore strada, alla velocità corrente del mezzo (o
    // 40 km/h se è fermo o non la conosciamo). È una stima dichiarata tale, ed
    // è comunque meglio del nulla che la pagina mostra adesso.
    const velocitaKmh = (() => {
      const v = pos ? num(pos.speed) : null;
      return v != null && v >= 5 ? v : 40;
    })();
    const etaCalcolato =
      distanceMeters != null
        ? Math.max(1, Math.round(((distanceMeters * 1.3) / 1000 / velocitaKmh) * 60))
        : null;
    const etaMinutes = etaSalvato ?? etaCalcolato;

    return jsonWithCors({
      ok: true,
      closed,
      status: tr?.status ?? reqRow.status ?? null,
      etaMinutes,
      distanceMeters,
      dest,
      destAddress: tr?.dropoff_address ?? null,
      number: tr?.number ?? null,
      type: tr?.transport_type ?? null,
      driverName,
      vehiclePlate,
      vehicleLabel,
      company,
      // A intervento concluso la posizione del mezzo NON viene più restituita.
      // Prima la pagina continuava a mostrare dove si trovava il carro attrezzi
      // anche a lavoro chiuso: il cliente non ne ha più bisogno, e quella è la
      // parte che pesa di più sulla privacy dell'autista.
      vehicle: pos && !closed
        ? {
            lat: vLat,
            lng: vLng,
            heading: num(pos.heading),
            speed: num(pos.speed),
            recordedAt: pos.recorded_at,
          }
        : null,
    });
  } catch (error) {
    console.error("track:by-token handler error", error);
    return jsonWithCors({ ok: false, error: "Errore interno" }, { status: 500 });
  }
}
