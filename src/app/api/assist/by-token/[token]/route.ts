import { emptyCorsResponse, fetchRequestByToken, jsonWithCors } from "../../_utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return emptyCorsResponse(204);
}

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    if (!token) {
      return jsonWithCors({ ok: false, error: "Token mancante" }, { status: 400 });
    }

    const row = await fetchRequestByToken(token);

    if (!row) {
      return jsonWithCors({ ok: false, error: "Richiesta non trovata" }, { status: 404 });
    }

    return jsonWithCors({ ok: true, row });
  } catch (error) {
    console.error("assist:by-token handler error", error);
    return jsonWithCors({ ok: false, error: "Errore interno" }, { status: 500 });
  }
}

