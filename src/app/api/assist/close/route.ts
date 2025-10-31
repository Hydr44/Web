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

    if (!token) {
      return jsonWithCors({ ok: false, error: "Token mancante" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("assistance_requests")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("token", token)
      .select("id")
      .single();

    if (error) {
      console.error("assist:close supabase error", error);
      return jsonWithCors({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return jsonWithCors({ ok: false, error: "Richiesta non trovata" }, { status: 404 });
    }

    return jsonWithCors({ ok: true });
  } catch (error) {
    console.error("assist:close handler error", error);
    return jsonWithCors({ ok: false, error: "Errore interno" }, { status: 500 });
  }
}

