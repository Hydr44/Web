/**
 * GET /api/dashboard/invoices/:id/xml
 * XML FatturaPA di una fattura RM emessa al cliente loggato.
 * Autorizzazione: la fattura deve essere intestata (billed) all'org del chiamante.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { corsHeaders } from "@/lib/cors";
import { buildFatturaPaXml } from "@/lib/admin-invoices";
import { getCallerOrgId, invoiceBilledTo } from "@/lib/portal-invoices";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get("origin"));
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Non autenticato" }, { status: 401, headers });
    const orgId = await getCallerOrgId(user.id);
    if (!orgId || !(await invoiceBilledTo(params.id, orgId))) {
      return NextResponse.json({ ok: false, error: "Fattura non trovata" }, { status: 404, headers });
    }
    const out = await buildFatturaPaXml(params.id);
    if (!out) return NextResponse.json({ ok: false, error: "XML non disponibile" }, { status: 500, headers });
    return new NextResponse(out.xml, {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${out.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[portal invoice xml] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Errore interno" }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}
