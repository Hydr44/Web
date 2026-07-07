/**
 * Registro fornitori — modifica / elimina.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';

const FIELDS = ['denominazione', 'vat', 'tax_code', 'pec', 'codice_destinatario', 'regime_fiscale', 'paese', 'address', 'iban', 'active'];

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'admin')) return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers });
  try {
    const b = await request.json();
    const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const f of FIELDS) {
      if (b[f] !== undefined) {
        if (f === 'active') upd[f] = !!b[f];
        else if (f === 'address') upd[f] = b[f] ?? null;
        else upd[f] = b[f] ? String(b[f]) : null;
      }
    }
    const { data, error } = await supabaseAdmin.from('suppliers').update(upd).eq('id', params.id).select('*').single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
    return NextResponse.json({ success: true, supplier: data }, { headers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'admin')) return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers });
  const { error } = await supabaseAdmin.from('suppliers').delete().eq('id', params.id);
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
  return NextResponse.json({ success: true }, { headers });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
