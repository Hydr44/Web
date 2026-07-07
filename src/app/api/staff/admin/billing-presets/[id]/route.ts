/**
 * Preset di fatturazione — modifica / elimina.
 * PUT    /api/staff/admin/billing-presets/:id
 * DELETE /api/staff/admin/billing-presets/:id
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';

const KINDS = ['abbonamento', 'pacchetto', 'una_tantum'];

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'admin')) return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers });

  try {
    const b = await request.json();
    const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (b.name !== undefined) upd.name = String(b.name).trim();
    if (b.description !== undefined) upd.description = b.description ? String(b.description) : null;
    if (b.kind !== undefined) { if (!KINDS.includes(String(b.kind))) return NextResponse.json({ success: false, error: 'Tipo non valido' }, { status: 400, headers }); upd.kind = b.kind; }
    if (b.unit_price !== undefined) upd.unit_price = Number(b.unit_price) || 0;
    if (b.vat_perc !== undefined) upd.vat_perc = Number(b.vat_perc) || 0;
    if (b.billing_period !== undefined) upd.billing_period = b.billing_period ? String(b.billing_period) : null;
    if (b.item_code !== undefined) upd.item_code = b.item_code ? String(b.item_code) : null;
    if (b.active !== undefined) upd.active = !!b.active;

    const { data, error } = await supabaseAdmin.from('billing_presets').update(upd).eq('id', params.id).select('*').single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
    return NextResponse.json({ success: true, preset: data }, { headers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'admin')) return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers });
  const { error } = await supabaseAdmin.from('billing_presets').delete().eq('id', params.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
  return NextResponse.json({ success: true }, { headers });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
