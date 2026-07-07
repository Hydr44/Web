/**
 * Registro fornitori (per autofatture). GET lista / POST crea.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';

export async function GET(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  const { data, error } = await supabaseAdmin.from('suppliers').select('*').order('active', { ascending: false }).order('denominazione', { ascending: true });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
  return NextResponse.json({ success: true, suppliers: data || [] }, { headers });
}

export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'admin')) return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers });
  try {
    const b = await request.json();
    const denominazione = String(b.denominazione || '').trim();
    if (!denominazione) return NextResponse.json({ success: false, error: 'Denominazione richiesta' }, { status: 400, headers });
    const { data, error } = await supabaseAdmin.from('suppliers').insert({
      denominazione,
      vat: b.vat ? String(b.vat).trim() : null,
      tax_code: b.tax_code ? String(b.tax_code).trim() : null,
      pec: b.pec ? String(b.pec).trim() : null,
      codice_destinatario: b.codice_destinatario ? String(b.codice_destinatario).trim() : null,
      regime_fiscale: b.regime_fiscale ? String(b.regime_fiscale) : 'RF01',
      paese: b.paese ? String(b.paese).trim().toUpperCase() : 'IT',
      address: b.address ?? null,
      iban: b.iban ? String(b.iban).trim() : null,
      active: b.active !== false,
    }).select('*').single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500, headers });
    return NextResponse.json({ success: true, supplier: data }, { headers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
