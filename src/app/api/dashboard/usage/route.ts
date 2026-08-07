/**
 * GET /api/dashboard/usage
 * Limiti EFFETTIVI del piano dell'org del cliente loggato (override cliente sopra il
 * default di piano), risolti server-side via la funzione SQL get_org_effective_limits.
 * FASE 1: mostra solo i limiti inclusi (nessun consumo reale — arriva in Fase 3).
 * Degrada a { ok:true, limits:null } se la funzione non è ancora applicata (es. prod
 * pre-migration) così la dashboard semplicemente non mostra la sezione.
 */
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { corsHeaders } from "@/lib/cors";
import { getCallerOrgId } from "@/lib/portal-invoices";

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
      return NextResponse.json({ ok: true, limits: null }, { headers: corsHeaders(origin) });
    }
    const { data, error } = await supabaseAdmin.rpc("get_org_effective_limits", { p_org_id: orgId });

    // Consumi del mese corrente (Fase 2). Degrada a {} se la funzione non è
    // ancora presente (prod pre-migration) o restituisce null: non deve mai
    // impedire il rendering della sezione limiti.
    let usage: Record<string, number> = {};
    try {
      const { data: usageData, error: usageErr } = await supabaseAdmin.rpc("get_org_usage", { p_org_id: orgId });
      if (usageErr) {
        console.warn("[dashboard/usage] rpc get_org_usage:", usageErr.message);
      } else if (usageData && typeof usageData === "object") {
        usage = usageData as Record<string, number>;
      }
    } catch (e) {
      console.warn("[dashboard/usage] get_org_usage:", e instanceof Error ? e.message : String(e));
    }

    if (error) {
      // Funzione non ancora presente (prod pre-migration) o altro: degrada senza rompere.
      console.warn("[dashboard/usage] rpc get_org_effective_limits:", error.message);
      return NextResponse.json({ ok: true, limits: null, usage }, { headers: corsHeaders(origin) });
    }
    return NextResponse.json({ ok: true, limits: data, usage }, { headers: corsHeaders(origin) });
  } catch (e: unknown) {
    console.error("[dashboard/usage] error:", e);
    const msg = e instanceof Error ? e.message : "Errore interno";
    return NextResponse.json({ ok: false, error: msg }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}
