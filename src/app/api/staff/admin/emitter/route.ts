/**
 * Dati emittente (RescueManager SRL) per le fatture SaaS.
 * GET /api/staff/admin/emitter  → anagrafica fiscale dell'org emittente
 * PUT /api/staff/admin/emitter  → aggiorna (scrive su org_settings company + sdi)
 *
 * NB: cedente/prestatore di TUTTE le fatture ai clienti. Deve essere corretto.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';
import { EMITTER_ORG_ID } from '@/lib/admin-invoices';

async function readSettings() {
  const { data } = await supabaseAdmin.from('org_settings').select('key, value').eq('org_id', EMITTER_ORG_ID);
  const map: Record<string, any> = {};
  for (const r of data || []) map[r.key] = r.value;
  return map;
}

async function upsertSetting(key: string, value: any) {
  const { data: existing } = await supabaseAdmin.from('org_settings').select('org_id').eq('org_id', EMITTER_ORG_ID).eq('key', key).maybeSingle();
  if (existing) {
    await supabaseAdmin.from('org_settings').update({ value }).eq('org_id', EMITTER_ORG_ID).eq('key', key);
  } else {
    await supabaseAdmin.from('org_settings').insert({ org_id: EMITTER_ORG_ID, key, value });
  }
}

export async function GET(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });

  const { data: org } = await supabaseAdmin.from('orgs').select('id, name').eq('id', EMITTER_ORG_ID).maybeSingle();
  const map = await readSettings();
  const company = map.company || {};
  const sdi = map.sdi || {};
  return NextResponse.json({
    success: true,
    emitter: {
      org_id: EMITTER_ORG_ID,
      company_name: company.company_name || org?.name || '',
      vat: company.vat || '',
      tax_code: company.tax_code || '',
      email: company.email || '',
      phone: company.phone || '',
      iban: company.iban || sdi.iban || '',
      pec: sdi.pec || company.pec || '',
      codice_destinatario: sdi.codice_destinatario || company.codice_destinatario || '',
      regime_fiscale: sdi.regime_fiscale || company.regime_fiscale || 'RF01',
      address: company.address || { street: '', civico: '', zip: '', city: '', province: '', country: 'IT' },
    },
  }, { headers });
}

export async function PUT(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });
  if (!requireStaffRole(staff, 'admin')) return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403, headers });

  try {
    const b = await request.json();
    const map = await readSettings();
    const company = { ...(map.company || {}) };
    const sdi = { ...(map.sdi || {}) };

    // company
    if (b.company_name !== undefined) company.company_name = String(b.company_name).trim();
    if (b.vat !== undefined) company.vat = String(b.vat).trim();
    if (b.tax_code !== undefined) company.tax_code = String(b.tax_code).trim();
    if (b.email !== undefined) company.email = String(b.email).trim();
    if (b.phone !== undefined) company.phone = String(b.phone).trim();
    if (b.iban !== undefined) company.iban = String(b.iban).trim();
    if (b.address !== undefined) company.address = b.address;
    // sdi (fiscali per FatturaPA)
    if (b.pec !== undefined) sdi.pec = String(b.pec).trim();
    if (b.codice_destinatario !== undefined) sdi.codice_destinatario = String(b.codice_destinatario).trim();
    if (b.regime_fiscale !== undefined) sdi.regime_fiscale = String(b.regime_fiscale).trim();

    await upsertSetting('company', company);
    await upsertSetting('sdi', sdi);

    return NextResponse.json({ success: true, message: 'Dati emittente aggiornati' }, { headers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
