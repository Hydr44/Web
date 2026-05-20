import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

// Sezioni filiera VFU RENTRI (D.Lgs 209/2003): AUT=Autodemolitore,
// ROT=Rottamatore, FRA=Frantumatore. Persistite in org_settings (EAV),
// key='rentri_filiera', value={ sezioni_attivate: string[] }.
// Default ['AUT'] (caso autodemolitore puro). AUT è sempre attiva.
const VALID_SEZIONI = ['AUT', 'ROT', 'FRA'];

function normalizeSezioni(arr: unknown): string[] {
  const list = Array.isArray(arr)
    ? arr.filter((s): s is string => typeof s === 'string' && VALID_SEZIONI.includes(s))
    : [];
  const set = new Set(list);
  set.add('AUT'); // AUT sempre attiva (autodemolitore)
  return VALID_SEZIONI.filter((s) => set.has(s));
}

// GET — sezioni filiera attivate per l'org
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const orgId = params.id;

    const { data: org, error: orgErr } = await supabaseAdmin
      .from('orgs')
      .select('id, name')
      .eq('id', orgId)
      .single();

    if (orgErr || !org) {
      return NextResponse.json(
        { success: false, error: 'Organizzazione non trovata' },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('org_settings')
      .select('value')
      .eq('org_id', orgId)
      .eq('key', 'rentri_filiera')
      .maybeSingle();

    if (error) {
      console.error('Error fetching org_settings.rentri_filiera:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    const value = (data?.value as Record<string, unknown>) || {};
    const sezioni_attivate = normalizeSezioni(value.sezioni_attivate);

    return NextResponse.json(
      { success: true, sezioni_attivate, valide: VALID_SEZIONI },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    console.error('Admin get rentri-filiera error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

// PUT — aggiorna sezioni filiera attivate
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const orgId = params.id;
    const body = await request.json();
    const { sezioni_attivate } = body as { sezioni_attivate: unknown };

    if (!Array.isArray(sezioni_attivate)) {
      return NextResponse.json(
        { success: false, error: 'Formato non valido: sezioni_attivate deve essere un array' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const normalized = normalizeSezioni(sezioni_attivate);

    // Preserva eventuali altri campi nel value JSONB.
    const { data: existing } = await supabaseAdmin
      .from('org_settings')
      .select('value')
      .eq('org_id', orgId)
      .eq('key', 'rentri_filiera')
      .maybeSingle();
    const prevValue = (existing?.value as Record<string, unknown>) || {};

    const { error: upsertError } = await supabaseAdmin
      .from('org_settings')
      .upsert(
        {
          org_id: orgId,
          key: 'rentri_filiera',
          value: { ...prevValue, sezioni_attivate: normalized },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id,key' }
      );

    if (upsertError) {
      console.error('Error upserting org_settings.rentri_filiera:', upsertError);
      return NextResponse.json(
        { success: false, error: upsertError.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { success: true, sezioni_attivate: normalized },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    console.error('Admin update rentri-filiera error:', error);
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
