import {
  buildAssistUrl,
  emptyCorsResponse,
  generateAssistToken,
  jsonWithCors,
  sanitizeNote,
  sanitizePhone,
  supabaseAdmin,
} from "../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return emptyCorsResponse(204);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const phone = sanitizePhone(payload.phone);
    const note = sanitizeNote(payload.note);
    const orgId = typeof payload.orgId === "string" ? payload.orgId : process.env.ASSIST_DEFAULT_ORG_ID || null;
    const createdBy = typeof payload.createdBy === "string" ? payload.createdBy : null;

    if (!orgId) {
      return jsonWithCors({ ok: false, error: "orgId mancante" }, { status: 400 });
    }

    const token = generateAssistToken();
    const url = buildAssistUrl(token);

    const insertPayload: Record<string, unknown> = {
      org_id: orgId,
      phone: phone || "",
      note,
      token,
      url,
      status: "pending",
    };

    if (createdBy) {
      insertPayload.created_by = createdBy;
    }

    const { data, error } = await supabaseAdmin
      .from("assistance_requests")
      .insert(insertPayload)
      .select(
        "id, org_id, phone, note, token, url, status, lat, lng, accuracy, created_at, updated_at, received_at, closed_at"
      )
      .single();

    if (error) {
      console.error("assist:create supabase error", error);
      return jsonWithCors({ ok: false, error: error.message }, { status: 500 });
    }

    return jsonWithCors({ ok: true, token, url, request: data });
  } catch (error) {
    console.error("assist:create handler error", error);
    return jsonWithCors({ ok: false, error: "Errore interno" }, { status: 500 });
  }
}

