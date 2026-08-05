/**
 * GET /api/dashboard/invoices
 * Fatture fiscali emesse da RescueManager verso l'org del cliente loggato
 * (serie RM/YYYY). Servite lato server con service-role perché intestate
 * all'org emittente (vedi lib/portal-invoices).
 */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { corsHeaders } from "@/lib/cors";
import { getCallerOrgId, listBilledInvoices } from "@/lib/portal-invoices";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Non autenticato" }, { status: 401, headers: corsHeaders(origin) });
    }
    const orgId = await getCallerOrgId(user.id);
    if (!orgId) {
      return NextResponse.json({ ok: true, invoices: [] }, { headers: corsHeaders(origin) });
    }
    const invoices = await listBilledInvoices(orgId);
    return NextResponse.json({ ok: true, invoices }, { headers: corsHeaders(origin) });
  } catch (e: unknown) {
    console.error("[dashboard/invoices] error:", e);
    const msg = e instanceof Error ? e.message : "Errore interno";
    return NextResponse.json({ ok: false, error: msg }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}
