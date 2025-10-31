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

    const { error } = await supabaseAdmin
      .from("assistance_requests")
      .delete()
      .eq("token", token);

    if (error) {
      console.error("assist:delete supabase error", error);
      return jsonWithCors({ ok: false, error: error.message }, { status: 500 });
    }

    return jsonWithCors({ ok: true });
  } catch (error) {
    console.error("assist:delete handler error", error);
    return jsonWithCors({ ok: false, error: "Errore interno" }, { status: 500 });
  }
}

