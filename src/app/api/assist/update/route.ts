import { emptyCorsResponse, jsonWithCors, supabaseAdmin } from "../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return emptyCorsResponse(204);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const token = typeof payload.token === "string" ? payload.token : null;
    const lat = payload.lat;
    const lng = payload.lng;
    const accuracy = payload.accuracy;

    if (!token) {
      return jsonWithCors({ ok: false, error: "Token mancante" }, { status: 400 });
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      return jsonWithCors({ ok: false, error: "Coordinate non valide" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("assistance_requests")
      .update({
        lat,
        lng,
        accuracy: typeof accuracy === "number" ? accuracy : null,
        status: "located",
        received_at: new Date().toISOString(),
      })
      .eq("token", token)
      .select(
        "id, org_id, phone, note, token, url, status, lat, lng, accuracy, created_at, updated_at, received_at, closed_at"
      )
      .single();

    if (error) {
      console.error("assist:update supabase error", error);
      return jsonWithCors({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return jsonWithCors({ ok: false, error: "Richiesta non trovata" }, { status: 404 });
    }

    return jsonWithCors({ ok: true, row: data });
  } catch (error) {
    console.error("assist:update handler error", error);
    return jsonWithCors({ ok: false, error: "Errore interno" }, { status: 500 });
  }
}

