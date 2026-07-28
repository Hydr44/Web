// API pubblica per la pagina /track/{token}: ritorna la posizione LIVE del mezzo
// + ETA + destinazione + info utili al cliente (autista, mezzo, azienda, distanza).
// Usa il client admin (server-side, token opaco).
import { supabaseAdmin, jsonWithCors, emptyCorsResponse } from "../../assist/_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      .select("token, status, transport_id, lat, lng")
      .eq("token", token)
      .maybeSingle();
    if (reqErr) throw reqErr;
    if (!reqRow) return jsonWithCors({ ok: false, error: "Link non valido o scaduto" }, { status: 404 });
    if (!reqRow.transport_id) {
      return jsonWithCors({ ok: false, error: "Questo link non è un tracking mezzo" }, { status: 409 });
    }

    // 2) Trasporto (stato, ETA, destinazione, riferimenti autista/mezzo/org)
    const { data: tr, error: trErr } = await supabaseAdmin
      .from("transports")
      .select(
        "id, status, eta_pickup, eta_dropoff, eta_minutes, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, customer_name, driver_id, vehicle_id, org_id, number, transport_type, dropoff_address",
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

    const closed = !tr || ["done", "cancelled", "completato", "annullato"].includes((tr.status || "").toLowerCase());

    // ETA: preferisci il punto ancora futuro (pickup → poi dropoff)
    const etaPickup = etaMinutesFrom(tr?.eta_pickup ?? null);
    const etaDropoff = etaMinutesFrom(tr?.eta_dropoff ?? null);
    const etaMinutes = etaPickup ?? etaDropoff ?? (Number.isFinite(tr?.eta_minutes as number) ? (tr!.eta_minutes as number) : null);

    // Destinazione = punto cliente (pickup) se disponibile, altrimenti posizione
    // condivisa dal cliente (assist).
    const dest =
      num(tr?.pickup_lat) != null && num(tr?.pickup_lng) != null
        ? { lat: num(tr?.pickup_lat), lng: num(tr?.pickup_lng) }
        : num(reqRow.lat) != null && num(reqRow.lng) != null
          ? { lat: num(reqRow.lat), lng: num(reqRow.lng) }
          : null;

    const vLat = pos ? num(pos.latitude) : null;
    const vLng = pos ? num(pos.longitude) : null;
    const distanceMeters =
      vLat != null && vLng != null && dest?.lat != null && dest?.lng != null
        ? haversine(vLat, vLng, dest.lat, dest.lng)
        : null;

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
      vehicle: pos
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
