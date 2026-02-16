import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

const VALID_MODULES = ['base', 'rvfu', 'sdi', 'rentri', 'contabilita'];
const VALID_STATUSES = ['active', 'inactive', 'trial'];

// GET — lista moduli attivi per org
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const orgId = params.id;

    // Verifica che l'org esista
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

    // Leggi moduli
    const { data: modules, error } = await supabaseAdmin
      .from('org_modules')
      .select('*')
      .eq('org_id', orgId)
      .order('module');

    if (error) {
      console.error('Error fetching org modules:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    // Costruisci mappa completa (tutti i moduli, anche quelli non presenti)
    const moduleMap: Record<string, any> = {};
    for (const m of VALID_MODULES) {
      moduleMap[m] = {
        module: m,
        status: 'inactive',
        activated_at: null,
        expires_at: null,
        notes: null,
      };
    }
    for (const row of modules || []) {
      moduleMap[row.module] = {
        module: row.module,
        status: row.status,
        activated_at: row.activated_at,
        expires_at: row.expires_at,
        stripe_item_id: row.stripe_item_id,
        notes: row.notes,
      };
    }

    return NextResponse.json(
      { success: true, modules: Object.values(moduleMap) },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    console.error('Admin get org modules error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

// PUT — aggiorna moduli per org (upsert batch)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const origin = request.headers.get('origin');
    const orgId = params.id;
    const body = await request.json();
    const { modules } = body as { modules: { module: string; status: string; notes?: string; expires_at?: string }[] };

    if (!Array.isArray(modules)) {
      return NextResponse.json(
        { success: false, error: 'Formato non valido: modules deve essere un array' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const results: { module: string; success: boolean; error?: string }[] = [];

    for (const mod of modules) {
      if (!VALID_MODULES.includes(mod.module)) {
        results.push({ module: mod.module, success: false, error: 'Modulo non valido' });
        continue;
      }
      if (!VALID_STATUSES.includes(mod.status)) {
        results.push({ module: mod.module, success: false, error: 'Stato non valido' });
        continue;
      }

      if (mod.status === 'inactive') {
        // Rimuovi riga se disattivato
        const { error } = await supabaseAdmin
          .from('org_modules')
          .delete()
          .eq('org_id', orgId)
          .eq('module', mod.module);

        if (error) {
          results.push({ module: mod.module, success: false, error: error.message });
        } else {
          results.push({ module: mod.module, success: true });
        }
      } else {
        // Upsert riga
        const { error } = await supabaseAdmin
          .from('org_modules')
          .upsert(
            {
              org_id: orgId,
              module: mod.module,
              status: mod.status,
              activated_at: mod.status === 'active' ? new Date().toISOString() : undefined,
              expires_at: mod.expires_at || null,
              notes: mod.notes || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'org_id,module' }
          );

        if (error) {
          results.push({ module: mod.module, success: false, error: error.message });
        } else {
          results.push({ module: mod.module, success: true });
        }
      }
    }

    const allOk = results.every((r) => r.success);

    return NextResponse.json(
      {
        success: allOk,
        message: allOk ? 'Moduli aggiornati con successo' : 'Alcuni moduli non sono stati aggiornati',
        results,
      },
      { headers: corsHeaders(origin) }
    );
  } catch (error: any) {
    console.error('Admin update org modules error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
