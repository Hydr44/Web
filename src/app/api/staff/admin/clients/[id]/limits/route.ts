/**
 * GET /api/staff/admin/clients/:id/limits
 * Limiti EFFETTIVI (piano + override per-cliente) e CONSUMO corrente di un'org.
 * SOLO LETTURA: due RPC read-only (`get_org_effective_limits`, `get_org_usage`).
 * Best-effort e difensivo: ogni RPC è avvolta in try/catch e degrada a
 * null / {} se manca (es. prod pre-migration) → mai 500 per questo motivo.
 * L'auth staff è già garantita dal middleware /api/staff/*.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const orgId = params.id;

  // 1. Limiti effettivi (piano + override) — degrada a null se la RPC manca.
  let effective: any = null;
  try {
    const { data, error } = await supabaseAdmin.rpc('get_org_effective_limits', { p_org_id: orgId });
    if (error) console.warn('[admin client limits] get_org_effective_limits:', error.message);
    else effective = data ?? null;
  } catch (e: any) {
    console.warn('[admin client limits] get_org_effective_limits threw:', e?.message);
  }

  // 2. Consumo corrente — degrada a {} se la RPC manca o non ritorna un oggetto.
  let usage: any = {};
  try {
    const { data, error } = await supabaseAdmin.rpc('get_org_usage', { p_org_id: orgId });
    if (error) console.warn('[admin client limits] get_org_usage:', error.message);
    else if (data && typeof data === 'object') usage = data;
  } catch (e: any) {
    console.warn('[admin client limits] get_org_usage threw:', e?.message);
  }

  return NextResponse.json({ ok: true, effective: effective ?? null, usage: (usage && typeof usage === 'object') ? usage : {} }, { headers });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
