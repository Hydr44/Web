import { emptyCorsResponse, jsonWithCors, supabaseAdmin } from "../_utils";
import { getRequestUser } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return emptyCorsResponse(204);
}

export async function GET(request: Request) {
  try {
    // Auth obbligatoria: prima questa route era pubblica e, senza orgId, faceva
    // il DUMP di tutte le richieste di soccorso di TUTTI gli org (telefono, note,
    // GPS e i token segreti). Ora richiede login e mostra SOLO le richieste degli
    // org di cui l'utente è membro. `orgId` dal client è ignorato.
    const user = await getRequestUser(request);
    if (!user) {
      return jsonWithCors({ ok: false, error: "Non autorizzato" }, { status: 401 });
    }
    const { data: mem } = await supabaseAdmin
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id);
    const orgIds = (mem || []).map((m: { org_id: string }) => m.org_id);
    if (!orgIds.length) {
      return jsonWithCors({ ok: true, rows: [] });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || "50"), 200);
    const status = searchParams.get("status");

    // NB: `token` NON è più esposto nella lista (è la chiave dei link pubblici).
    let query = supabaseAdmin
      .from("assistance_requests")
      .select(
        "id, org_id, phone, note, url, status, lat, lng, accuracy, created_at, updated_at, received_at, closed_at"
      )
      .in("org_id", orgIds)
      .order("created_at", { ascending: false })
      .limit(limit);

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
