/**
 * POST /api/staff/admin/clients/:id/:action
 * Proxy alle azioni esistenti su /organizations/:id/:action.
 * Cliente == Organization quindi le due URL sono equivalenti.
 *
 * Azioni supportate (vedi organizations route):
 *   - delete         elimina org e cascade
 *   - edit           aggiorna anagrafica core orgs
 *   - suspend / activate
 *   - members        lista membri
 *   - add-member     aggiunge membro {user_id, role}
 *   - remove-member  rimuove membro {user_id}
 *   - analytics
 *   - view
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

export async function POST(
  request: Request,
  { params }: { params: { id: string; action: string } }
) {
  const origin = request.headers.get('origin');
  const { id: orgId, action } = params;

  try {
    let responseData: any;
    let status = 200;

    switch (action) {
      case 'delete': {
        // Cascade cleanup (allineato a /organizations delete)
        await supabaseAdmin.from('leads').update({ demo_org_id: null }).eq('demo_org_id', orgId);
        await supabaseAdmin.from('lead_demos').delete().eq('demo_org_id', orgId);
        await supabaseAdmin.from('org_subscriptions').delete().eq('org_id', orgId);
        await supabaseAdmin.from('org_settings').delete().eq('org_id', orgId);
        await supabaseAdmin.from('operators').delete().eq('org_id', orgId);
        await supabaseAdmin.from('org_modules').delete().eq('org_id', orgId);
        await supabaseAdmin.from('org_members').delete().eq('org_id', orgId);

        // Nullifica profiles.current_org se puntava qui
        await supabaseAdmin.from('profiles').update({ current_org: null }).eq('current_org', orgId);

        const { error: orgErr } = await supabaseAdmin.from('orgs').delete().eq('id', orgId);
        if (orgErr) {
          return NextResponse.json({ success: false, error: orgErr.message }, { status: 500, headers: corsHeaders(origin) });
        }

        responseData = { success: true, message: 'Cliente eliminato con successo' };
        break;
      }

      case 'suspend': {
        await supabaseAdmin.from('orgs').update({
          web_access_enabled: false,
          desktop_access_enabled: false,
          updated_at: new Date().toISOString(),
        }).eq('id', orgId);
        await supabaseAdmin.from('org_subscriptions').update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('org_id', orgId);
        responseData = { success: true, message: 'Cliente sospeso' };
        break;
      }

      case 'activate': {
        await supabaseAdmin.from('orgs').update({
          web_access_enabled: true,
          desktop_access_enabled: true,
          updated_at: new Date().toISOString(),
        }).eq('id', orgId);
        await supabaseAdmin.from('org_subscriptions').update({
          status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('org_id', orgId);
        responseData = { success: true, message: 'Cliente attivato' };
        break;
      }

      case 'add-member': {
        const body = await request.json();
        const { user_id, role = 'member' } = body || {};
        if (!user_id) {
          return NextResponse.json({ success: false, error: 'user_id richiesto' }, { status: 400, headers: corsHeaders(origin) });
        }
        const { data, error } = await supabaseAdmin.from('org_members').insert({
          org_id: orgId, user_id, role,
        }).select().single();
        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
        }
        responseData = { success: true, member: data, message: 'Membro aggiunto' };
        break;
      }

      case 'remove-member': {
        const body = await request.json();
        const { user_id } = body || {};
        if (!user_id) {
          return NextResponse.json({ success: false, error: 'user_id richiesto' }, { status: 400, headers: corsHeaders(origin) });
        }
        const { error } = await supabaseAdmin.from('org_members')
          .delete()
          .eq('org_id', orgId)
          .eq('user_id', user_id);
        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
        }
        // Se l'utente aveva current_org=questo org, lo nullifica
        await supabaseAdmin.from('profiles')
          .update({ current_org: null })
          .eq('id', user_id)
          .eq('current_org', orgId);
        responseData = { success: true, message: 'Membro rimosso' };
        break;
      }

      case 'change-role': {
        const body = await request.json();
        const { user_id, role } = body || {};
        if (!user_id || !role) {
          return NextResponse.json({ success: false, error: 'user_id e role richiesti' }, { status: 400, headers: corsHeaders(origin) });
        }
        const { error } = await supabaseAdmin.from('org_members')
          .update({ role })
          .eq('org_id', orgId)
          .eq('user_id', user_id);
        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
        }
        responseData = { success: true, message: 'Ruolo aggiornato' };
        break;
      }

      case 'change-owner': {
        // Promuove un membro a owner. Demote l'attuale owner ad admin.
        const body = await request.json();
        const { new_owner_user_id } = body || {};
        if (!new_owner_user_id) {
          return NextResponse.json({ success: false, error: 'new_owner_user_id richiesto' }, { status: 400, headers: corsHeaders(origin) });
        }
        await supabaseAdmin.from('org_members').update({ role: 'admin' }).eq('org_id', orgId).eq('role', 'owner');
        const { error } = await supabaseAdmin.from('org_members')
          .update({ role: 'owner' })
          .eq('org_id', orgId)
          .eq('user_id', new_owner_user_id);
        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
        }
        responseData = { success: true, message: 'Owner cambiato' };
        break;
      }

      default:
        return NextResponse.json({ success: false, error: `Azione non supportata: ${action}` }, { status: 400, headers: corsHeaders(origin) });
    }

    return NextResponse.json(responseData, { status, headers: corsHeaders(origin) });
  } catch (e: any) {
    console.error(`[admin clients/${action}] error:`, e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
