/**
 * Preset di fatturazione (piani/pacchetti/una-tantum) — catalogo RescueManager.
 * GET  /api/staff/admin/billing-presets  → lista
 * POST /api/staff/admin/billing-presets  → crea
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';

const KINDS = ['abbonamento', 'pacchetto', 'una_tantum'];

export async function GET(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  const { data, error } = await supabaseAdmin
    .from('billing_presets')
    .select('*')
    .order('active', { ascending: false })
    .order('kind', { ascending: true })
    .order('name', { ascending: true });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
  return NextResponse.json({ success: true, presets: data || [] }, { headers });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'admin')) return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers });

  try {
    const b = await request.json();
    const name = String(b.name || '').trim();
    const kind = String(b.kind || 'una_tantum');
    if (!name) return NextResponse.json({ success: false, error: 'Nome richiesto' }, { status: 400, headers });
    if (!KINDS.includes(kind)) return NextResponse.json({ success: false, error: 'Tipo non valido' }, { status: 400, headers });

    const { data, error } = await supabaseAdmin.from('billing_presets').insert({
      name,
      description: b.description ? String(b.description) : null,
      kind,
      unit_price: Number(b.unit_price) || 0,
      vat_perc: b.vat_perc != null ? Number(b.vat_perc) : 22,
      billing_period: b.billing_period ? String(b.billing_period) : null,
      item_code: b.item_code ? String(b.item_code) : null,
      active: b.active !== false,
    }).select('*').single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
    return NextResponse.json({ success: true, preset: data }, { headers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
