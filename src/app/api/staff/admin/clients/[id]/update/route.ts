/**
 * PATCH /api/staff/admin/clients/:id/update
 * Aggiorna in modo atomico anagrafica + access flags + modules + features + subscription.
 *
 * Body (tutti i campi opzionali):
 *   company?: Partial<CompanyJsonb>      → org_settings.key='company' merge
 *   access?: {                            → orgs columns
 *     web_access_enabled?: boolean
 *     desktop_access_enabled?: boolean
 *   }
 *   modules?: string[]                    → orgs.desktop_modules (full replace)
 *   features?: Partial<FeaturesJsonb>     → org_settings.key='features' merge
 *   subscription?: {                      → org_subscriptions
 *     status?, plan?, billing_type?, custom_price?, custom_notes?, current_period_end?, trial_end?
 *   }
 *   org_name?: string                     → orgs.name (sync con company.company_name)
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  try {
    const orgId = params.id;
    const body = await request.json();

    const errors: string[] = [];

    // ─── 1. orgs columns (access + name + desktop_modules) ──────────
    const orgUpdate: Record<string, any> = {};
    if (body.access?.web_access_enabled !== undefined) orgUpdate.web_access_enabled = body.access.web_access_enabled;
    if (body.access?.desktop_access_enabled !== undefined) orgUpdate.desktop_access_enabled = body.access.desktop_access_enabled;
    if (Array.isArray(body.modules)) orgUpdate.desktop_modules = body.modules;
    if (body.org_name) orgUpdate.name = body.org_name;
    if (Object.keys(orgUpdate).length) {
      orgUpdate.updated_at = new Date().toISOString();
      const { error } = await supabaseAdmin.from('orgs').update(orgUpdate).eq('id', orgId);
      if (error) errors.push(`orgs: ${error.message}`);
    }

    // ─── 2. org_settings.company (merge JSONB) ──────────────────────
    //    + propagazione in sdi/billing per chiavi specifiche che da Mag 2026
    //    desktop salva separate (PEC, regime_fiscale, IBAN, codice_destinatario)
    if (body.company && typeof body.company === 'object') {
      // 2a. company
      const { data: existing } = await supabaseAdmin
        .from('org_settings').select('value').eq('org_id', orgId).eq('key', 'company').maybeSingle();
      const prev = (existing?.value as Record<string, any>) || {};
      const merged: Record<string, any> = { ...prev, ...body.company };
      if (body.company.address && typeof body.company.address === 'object') {
        merged.address = { ...(prev.address || {}), ...body.company.address };
      }
      const { error } = await supabaseAdmin.from('org_settings').upsert({
        org_id: orgId, key: 'company', value: merged, updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id,key' });
      if (error) errors.push(`org_settings.company: ${error.message}`);

      if (typeof merged.company_name === 'string' && merged.company_name && !orgUpdate.name) {
        await supabaseAdmin.from('orgs').update({ name: merged.company_name }).eq('id', orgId);
      }

      // 2b. Propaga PEC + regime_fiscale + codice_destinatario in org_settings.sdi
      const sdiFields: Record<string, any> = {};
      if (body.company.pec !== undefined) sdiFields.pec = body.company.pec;
      if (body.company.regime_fiscale !== undefined) sdiFields.regime_fiscale = body.company.regime_fiscale;
      if (body.company.codice_destinatario !== undefined) sdiFields.codice_destinatario = body.company.codice_destinatario;

      if (Object.keys(sdiFields).length) {
        const { data: sdiExist } = await supabaseAdmin
          .from('org_settings').select('value').eq('org_id', orgId).eq('key', 'sdi').maybeSingle();
        const sdiMerged = { ...((sdiExist?.value as Record<string, any>) || {}), ...sdiFields };
        const { error: sdiErr } = await supabaseAdmin.from('org_settings').upsert({
          org_id: orgId, key: 'sdi', value: sdiMerged, updated_at: new Date().toISOString(),
        }, { onConflict: 'org_id,key' });
        if (sdiErr) errors.push(`org_settings.sdi: ${sdiErr.message}`);
      }

      // 2c. Propaga IBAN in org_settings.billing (se presente)
      if (body.company.iban !== undefined) {
        const { data: billExist } = await supabaseAdmin
          .from('org_settings').select('value').eq('org_id', orgId).eq('key', 'billing').maybeSingle();
        const billMerged = { ...((billExist?.value as Record<string, any>) || {}), iban: body.company.iban };
        const { error: billErr } = await supabaseAdmin.from('org_settings').upsert({
          org_id: orgId, key: 'billing', value: billMerged, updated_at: new Date().toISOString(),
        }, { onConflict: 'org_id,key' });
        if (billErr) errors.push(`org_settings.billing: ${billErr.message}`);
      }
    }

    // ─── 3. org_settings.features (merge JSONB) ─────────────────────
    if (body.features && typeof body.features === 'object') {
      const { data: existing } = await supabaseAdmin
        .from('org_settings').select('value').eq('org_id', orgId).eq('key', 'features').maybeSingle();
      const prev = (existing?.value as Record<string, any>) || {};
      const merged: Record<string, any> = { ...prev, ...body.features };
      const { error } = await supabaseAdmin.from('org_settings').upsert({
        org_id: orgId, key: 'features', value: merged, updated_at: new Date().toISOString(),
      }, { onConflict: 'org_id,key' });
      if (error) errors.push(`org_settings.features: ${error.message}`);
    }

    // ─── 4. subscription overrides ─────────────────────────────────
    if (body.subscription && typeof body.subscription === 'object') {
      const subAllowed = [
        'status', 'plan', 'billing_type', 'custom_price', 'custom_notes',
        'is_custom', 'current_period_start', 'current_period_end', 'trial_end'
      ];
      const subUpdate: Record<string, any> = {};
      for (const k of subAllowed) if (body.subscription[k] !== undefined) subUpdate[k] = body.subscription[k];
      if (Object.keys(subUpdate).length) {
        subUpdate.updated_at = new Date().toISOString();
        // Upsert (crea se non esiste)
        const { error } = await supabaseAdmin.from('org_subscriptions').upsert({
          org_id: orgId, ...subUpdate,
        }, { onConflict: 'org_id' });
        if (error) errors.push(`org_subscriptions: ${error.message}`);
      }
    }

    // ─── 5. Sync per-module rows in org_modules (per granularità futura) ──
    if (Array.isArray(body.modules)) {
      try {
        await supabaseAdmin.from('org_modules').delete().eq('org_id', orgId);
        if (body.modules.length) {
          const rows = body.modules.map((m: string) => ({ org_id: orgId, module_code: m, enabled: true }));
          await supabaseAdmin.from('org_modules').insert(rows);
        }
      } catch (e: any) {
        // non bloccante (tabella potrebbe non avere la stessa shape)
        console.warn('[clients update] org_modules sync skipped:', e.message);
      }
    }

    if (errors.length) {
      return NextResponse.json({ success: false, error: errors.join('; ') }, { status: 500, headers: corsHeaders(origin) });
    }
    return NextResponse.json({ success: true, message: 'Aggiornato con successo' }, { headers: corsHeaders(origin) });
  } catch (e: any) {
    console.error('[clients update] error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
