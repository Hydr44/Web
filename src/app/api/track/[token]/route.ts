// API pubblica per la pagina /track/{token}: ritorna la posizione LIVE del mezzo
// (ultimo punto in transport_tracking) + ETA + destinazione, per il cliente che
// segue l'arrivo del soccorso. Usa il client admin (server-side, token opaco).
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

    // 2) Trasporto (stato, ETA, destinazione)
    const { data: tr, error: trErr } = await supabaseAdmin
      .from("transports")
      .select("id, status, eta_pickup, eta_dropoff, eta_minutes, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, customer_name")
      .eq("id", reqRow.transport_id)
      .maybeSingle();
    if (trErr) throw trErr;

    // 3) Ultima posizione del mezzo. Scartiamo i fix GROSSOLANI (accuracy > 150m):
    //    i primi punti cell/wifi possono avere raggio di km e mostrerebbero il
    //    mezzo dall'altra parte della città. Teniamo l'ultimo punto "buono"
    //    (accuracy ≤ 150 oppure non valorizzata).
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

    // Destinazione "verso cui sta andando" = punto cliente (pickup) se disponibile,
    // altrimenti la posizione condivisa dal cliente.
    const dest =
      num(tr?.pickup_lat) != null && num(tr?.pickup_lng) != null
        ? { lat: num(tr?.pickup_lat), lng: num(tr?.pickup_lng) }
        : num(reqRow.lat) != null && num(reqRow.lng) != null
          ? { lat: num(reqRow.lat), lng: num(reqRow.lng) }
          : null;

    return jsonWithCors({
      ok: true,
      closed,
      status: tr?.status ?? reqRow.status ?? null,
      etaMinutes,
      dest,
      vehicle: pos
        ? {
            lat: num(pos.latitude),
            lng: num(pos.longitude),
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
