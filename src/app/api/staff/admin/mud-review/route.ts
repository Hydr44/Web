import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { corsHeaders } from '@/lib/cors';

/**
 * Coda di REVISIONE MUD per lo staff (revisione assistita).
 * GET  → elenco MUD in revisione (cross-org, service role) con nome cliente + dati aggregati.
 * POST → esito revisione { id, esito: 'approvato'|'modifiche_richieste', note? }.
 * Staff-only.
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers: corsHeaders(origin) });
  }

  try {
    const sp = request.nextUrl.searchParams;
    const stato = sp.get('stato') || 'in_revisione';

    const { data: muds, error } = await supabaseAdmin
      .from('rentri_mud')
      .select('id, org_id, anno, stato, review_status, review_requested_at, reviewed_at, reviewed_by, review_note, totale_movimenti, totale_registri, totale_formulari, totale_quantita, riepilogo_eer, data_inizio, data_fine')
      .eq('review_status', stato)
      .order('review_requested_at', { ascending: true });

    if (error) {
      console.error('mud-review query error:', error);
      return NextResponse.json({ success: false, error: 'Errore query MUD' }, { status: 500, headers: corsHeaders(origin) });
    }

    // Nome cliente (org) in batch.
    const orgIds = [...new Set((muds || []).map((m) => m.org_id).filter(Boolean))];
    const orgMap: Record<string, { name?: string; piva?: string }> = {};
    if (orgIds.length) {
      const { data: orgs } = await supabaseAdmin.from('orgs').select('id, name, piva').in('id', orgIds);
      for (const o of orgs || []) orgMap[o.id] = { name: o.name, piva: o.piva };
    }

    const items = (muds || []).map((m) => ({
      ...m,
      org_name: orgMap[m.org_id]?.name || null,
      org_piva: orgMap[m.org_id]?.piva || null,
    }));

    return NextResponse.json({ success: true, items, total: items.length }, { headers: corsHeaders(origin) });
  } catch (e) {
    console.error('mud-review error:', e);
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers: corsHeaders(origin) });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { id, esito, note } = body as { id?: string; esito?: string; note?: string };
    if (!id) return NextResponse.json({ success: false, error: 'id richiesto' }, { status: 400, headers: corsHeaders(origin) });
    if (esito !== 'approvato' && esito !== 'modifiche_richieste') {
      return NextResponse.json({ success: false, error: "esito non valido (approvato|modifiche_richieste)" }, { status: 400, headers: corsHeaders(origin) });
    }
    if (esito === 'modifiche_richieste' && !String(note || '').trim()) {
      return NextResponse.json({ success: false, error: 'Indica le modifiche richieste (note)' }, { status: 400, headers: corsHeaders(origin) });
    }

    const reviewer = (staff as { email?: string }).email || 'staff';
    const nowIso = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from('rentri_mud')
      .update({
        review_status: esito,
        reviewed_at: nowIso,
        reviewed_by: reviewer,
        review_note: note || null,
        updated_at: nowIso,
      })
      .eq('id', id);

    if (error) {
      console.error('mud-review update error:', error);
      return NextResponse.json({ success: false, error: 'Errore aggiornamento' }, { status: 500, headers: corsHeaders(origin) });
    }

    return NextResponse.json({ success: true, review_status: esito, reviewed_at: nowIso, reviewed_by: reviewer }, { headers: corsHeaders(origin) });
  } catch (e) {
    console.error('mud-review POST error:', e);
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
