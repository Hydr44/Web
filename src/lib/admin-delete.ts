/**
 * Cascade di eliminazione lato admin — logica centralizzata così single-delete
 * (clients/:id/delete) e bulk-delete (clients/bulk) restano allineati e non
 * divergono nel tempo.
 *
 * La maggior parte delle tabelle con `org_id` ha già FK `ON DELETE CASCADE`,
 * quindi `delete from orgs` propaga da solo su transports/vehicles/invoices/…
 * Qui gestiamo a mano solo i casi che NON cascadano automaticamente o che
 * puntano all'org da tabelle "esterne" (leads, profiles):
 *   - leads.demo_org_id        → NULL   (FK verso orgs, può bloccare)
 *   - lead_demos.demo_org_id   → delete
 *   - profiles.current_org     → NULL   (evita puntatori orfani/blocchi)
 *   - tabelle org_* esplicite  → delete (difensivo, anche se cascade)
 */

import { supabaseAdmin } from './supabase-admin';

export interface OrgDeleteResult {
  id: string;
  success: boolean;
  error?: string;
}

/**
 * Elimina un'organizzazione (cliente) e i record collegati.
 * Best-effort sulle tabelle figlie (una tabella mancante non è fatale);
 * l'unico errore che fa fallire è la delete finale di `orgs`.
 */
export async function deleteOrgCascade(orgId: string): Promise<OrgDeleteResult> {
  try {
    // Riferimenti esterni che potrebbero bloccare la delete di orgs (FK verso orgs).
    await supabaseAdmin.from('leads').update({ demo_org_id: null }).eq('demo_org_id', orgId);
    await supabaseAdmin.from('lead_demos').delete().eq('demo_org_id', orgId);

    // Tabelle org_* esplicite (difensivo — molte sono già ON DELETE CASCADE).
    await supabaseAdmin.from('org_subscriptions').delete().eq('org_id', orgId);
    await supabaseAdmin.from('org_settings').delete().eq('org_id', orgId);
    await supabaseAdmin.from('operators').delete().eq('org_id', orgId);
    await supabaseAdmin.from('org_modules').delete().eq('org_id', orgId);
    await supabaseAdmin.from('org_members').delete().eq('org_id', orgId);

    // Profili che avevano quest'org come corrente → nullifica.
    await supabaseAdmin.from('profiles').update({ current_org: null }).eq('current_org', orgId);

    // Org stessa: il resto (transports, vehicles, invoices, …) cade per cascade.
    const { error } = await supabaseAdmin.from('orgs').delete().eq('id', orgId);
    if (error) return { id: orgId, success: false, error: error.message };

    return { id: orgId, success: true };
  } catch (e: any) {
    return { id: orgId, success: false, error: e?.message || 'Errore interno' };
  }
}

/**
 * Snapshot JSON di un'org per export GDPR / backup pre-eliminazione.
 * Raccoglie org + subscription + settings + membri (con email/nome) + moduli.
 */
export async function exportOrgSnapshot(orgId: string): Promise<OrgDeleteResult & { data?: unknown }> {
  try {
    const { data: org, error } = await supabaseAdmin.from('orgs').select('*').eq('id', orgId).single();
    if (error || !org) return { id: orgId, success: false, error: error?.message || 'Org non trovata' };

    const [{ data: subscription }, { data: settings }, { data: members }, { data: modules }] = await Promise.all([
      supabaseAdmin.from('org_subscriptions').select('*').eq('org_id', orgId).maybeSingle(),
      supabaseAdmin.from('org_settings').select('key, value, updated_at').eq('org_id', orgId),
      supabaseAdmin
        .from('org_members')
        .select('user_id, role, created_at, profiles!inner(email, full_name)')
        .eq('org_id', orgId),
      supabaseAdmin.from('org_modules').select('*').eq('org_id', orgId),
    ]);

    return {
      id: orgId,
      success: true,
      data: { organization: org, subscription: subscription || null, settings: settings || [], members: members || [], modules: modules || [] },
    };
  } catch (e: any) {
    return { id: orgId, success: false, error: e?.message || 'Errore interno' };
  }
}
