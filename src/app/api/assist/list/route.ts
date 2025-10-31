import { emptyCorsResponse, jsonWithCors, supabaseAdmin } from "../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return emptyCorsResponse(204);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || "50"), 200);
    const orgId = searchParams.get("orgId");
    const status = searchParams.get("status");

    let query = supabaseAdmin
      .from("assistance_requests")
      .select(
        "id, org_id, phone, note, token, url, status, lat, lng, accuracy, created_at, updated_at, received_at, closed_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (orgId) {
      query = query.eq("org_id", orgId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("assist:list supabase error", error);
      return jsonWithCors({ ok: false, error: error.message }, { status: 500 });
    }

    return jsonWithCors({ ok: true, rows: data || [] });
  } catch (error) {
    console.error("assist:list handler error", error);
    return jsonWithCors({ ok: false, error: "Errore interno" }, { status: 500 });
  }
}

