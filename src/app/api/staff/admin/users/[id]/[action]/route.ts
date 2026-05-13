import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders, handleCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleCors(request) as NextResponse;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string, action: string } }
) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const { id: userId, action } = params;

  try {
    console.log(`User action API called: ${action} for user ${userId}`);

    let responseData: any;
    let status = 200;

    switch (action) {
      case 'view': {
        const { data: user, error } = await supabaseAdmin
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            avatar_url,
            created_at,
            updated_at,
            is_admin,
            current_org,
            provider,
            google_id,
            onboarding_completed
          `)
          .eq('id', userId)
          .single();

        if (error || !user) {
          return NextResponse.json({
            success: false,
            error: 'Utente non trovato'
          }, { status: 404, headers });
        }

        // Carica auth metadata (last_sign_in_at, email_confirmed_at, status)
        let lastSignIn: string | null = null;
        let emailConfirmedAt: string | null = null;
        let status: string = 'active';
        try {
          const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
          if (authData?.user) {
            lastSignIn = authData.user.last_sign_in_at || null;
            emailConfirmedAt = authData.user.email_confirmed_at || null;
            if (authData.user.banned_until && new Date(authData.user.banned_until) > new Date()) {
              status = 'suspended';
            }
          }
        } catch { /* ignore */ }

        // Memberships
        const { data: memberRows } = await supabaseAdmin
          .from('org_members')
          .select('org_id, role, created_at')
          .eq('user_id', userId);

        const orgIds = (memberRows || []).map(m => m.org_id);
        const orgsMap: Record<string, any> = {};
        if (orgIds.length) {
          const { data: orgsData } = await supabaseAdmin
            .from('orgs').select('id, name').in('id', orgIds);
          for (const o of orgsData || []) orgsMap[o.id] = o;
        }
        const memberships = (memberRows || []).map(m => ({
          org_id: m.org_id,
          org_name: orgsMap[m.org_id]?.name || '(senza nome)',
          role: m.role,
          joined_at: m.created_at,
          is_current: m.org_id === user.current_org,
        }));

        // Org corrente (current_org name)
        let orgName: string | null = null;
        if (user.current_org) {
          orgName = orgsMap[user.current_org]?.name || null;
          if (!orgName) {
            const { data: cur } = await supabaseAdmin.from('orgs').select('name').eq('id', user.current_org).maybeSingle();
            orgName = cur?.name || null;
          }
        }

        // Sessioni ultime 30gg
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
        const { data: sessions } = await supabaseAdmin
          .from('user_sessions')
          .select('id, ip_address, user_agent, started_at, last_activity_at, ended_at')
          .eq('user_id', userId)
          .gt('started_at', thirtyDaysAgo)
          .order('started_at', { ascending: false })
          .limit(30);

        responseData = {
          success: true,
          user: {
            ...user,
            last_sign_in_at: lastSignIn,
            email_confirmed_at: emailConfirmedAt,
            status,
            org_name: orgName,
            memberships,
            recent_sessions: sessions || [],
          },
        };
        break;
      }

      case 'edit': {
        const { full_name, email, is_admin, current_org } = await request.json();
        
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name,
            email,
            is_admin,
            current_org,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        if (error || !data) {
          return NextResponse.json({
            success: false,
            error: error?.message || 'Errore aggiornamento utente'
          }, { status: 500, headers });
        }

        responseData = { success: true, user: data, message: 'Utente aggiornato con successo' };
        break;
      }

      case 'suspend': {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({
            status: 'suspended',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        if (error || !data) {
          return NextResponse.json({
            success: false,
            error: error?.message || 'Errore sospensione utente'
          }, { status: 500, headers });
        }

        responseData = { success: true, message: 'Utente sospeso con successo', user: data };
        break;
      }

      case 'activate': {
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        if (error || !data) {
          return NextResponse.json({
            success: false,
            error: error?.message || 'Errore attivazione utente'
          }, { status: 500, headers });
        }

        responseData = { success: true, message: 'Utente attivato con successo', user: data };
        break;
      }

      case 'delete': {
        console.log(`Deleting user ${userId} — starting FK cleanup...`);
        const errors: string[] = [];

        // ── Step 1: DELETE tabelle con user_id (record di proprietà utente) ──
        const deleteByUserId = [
          'org_members',
          'operators',
          'subscriptions',
          'user_sessions',
          'app_heartbeats',
          'user_2fa_settings',
          'user_notification_settings',
        ];
        for (const table of deleteByUserId) {
          const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId);
          if (error) {
            console.error(`  cleanup ${table}.user_id:`, error.message);
            errors.push(`${table}: ${error.message}`);
          }
        }

        // ── Step 2: SET NULL su created_by/colonne FK auth.users (preserva dati business) ──
        const nullifyCreatedBy = [
          'yard_vehicles',
          'accounting_entries',
          'invoice_payments',
          'invoice_email_logs',
          'rentri_limiti_rifiuti',
          'rentri_mud',
          'rentri_registri',
          'rentri_movimenti',
          'rentri_formulari',
          'rentri_org_certificates',
          'rentri_ai_validations',
          // v2 lead system
          'lead_quotes',
          'lead_appointments',
          'lead_tasks',
          'lead_documents',
          'email_campaigns',
          'email_templates',
          'quote_templates',
          'lead_demos',
          'orgs',
        ];
        for (const table of nullifyCreatedBy) {
          const { error } = await supabaseAdmin.from(table).update({ created_by: null }).eq('created_by', userId);
          if (error && !error.message.includes('column') && !error.message.includes('does not exist')) {
            console.error(`  nullify ${table}.created_by:`, error.message);
          }
        }

        // ── Step 3: Tutti i campi FK a auth.users esposti in tabelle v2 ──
        // Lead system: assigned_to/performed_by/sent_by/uploaded_by/approved_by/activated_by/etc.
        const nullifyFKs: Array<[string, string]> = [
          ['leads', 'assigned_to'],
          ['leads', 'first_contact_by'],
          ['leads', 'demo_account_id'],
          ['lead_quotes', 'approved_by'],
          ['lead_quotes', 'discount_approved_by'],
          ['lead_quotes', 'activated_by'],
          ['lead_quotes', 'external_payment_recorded_by'],
          ['lead_quotes', 'commission_recipient'],
          ['lead_appointments', 'assigned_to'],
          ['lead_appointments', 'pilot_assigned_to'],
          ['lead_tasks', 'assigned_to'],
          ['lead_tasks', 'completed_by'],
          ['lead_activities', 'performed_by'],
          ['lead_demos', 'demo_account_id'],
          ['lead_demos', 'pilot_assigned_to'],
          ['lead_documents', 'uploaded_by'],
          ['email_campaigns', 'sent_by'],
          ['lead_automation_settings', 'updated_by'],
          ['maintenance_mode', 'started_by'],
          ['org_subscriptions', 'created_by'],
        ];
        for (const [table, col] of nullifyFKs) {
          const { error } = await supabaseAdmin.from(table).update({ [col]: null }).eq(col, userId);
          if (error && !error.message.includes('column') && !error.message.includes('does not exist')) {
            console.error(`  nullify ${table}.${col}:`, error.message);
          }
        }

        // ── Step 4: DELETE record dipendenti (FK senza ON DELETE SET NULL) ──
        const deleteRows: Array<[string, string]> = [
          ['org_invites', 'invited_by'],
          ['org_invites', 'accepted_by'],
        ];
        for (const [table, col] of deleteRows) {
          const { error } = await supabaseAdmin.from(table).delete().eq(col, userId);
          if (error && !error.message.includes('does not exist')) {
            console.error(`  delete ${table}.${col}:`, error.message);
          }
        }

        // ── Step 7: Elimina profilo (profiles.id → auth.users.id) ──
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileError) {
          console.error('Error deleting profile:', profileError);
          return NextResponse.json({
            success: false,
            error: `Errore eliminazione profilo: ${profileError.message}. Cleanup errors: ${errors.join('; ')}`
          }, { status: 500, headers });
        }

        // ── Step 8: Elimina da auth.users ──
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) {
          console.error('Error deleting auth user:', authError);
          return NextResponse.json({
            success: false,
            error: `Errore eliminazione auth: ${authError.message}`
          }, { status: 500, headers });
        }

        console.log(`User ${userId} deleted successfully.`);
        responseData = { success: true, message: 'Utente eliminato con successo' };
        break;
      }

      case 'reset-password': {
        const { new_password } = await request.json();
        
        if (!new_password) {
          return NextResponse.json({
            success: false,
            error: 'Nuova password richiesta'
          }, { status: 400, headers });
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: new_password
        });

        if (error) {
          return NextResponse.json({
            success: false,
            error: error.message || 'Errore reset password'
          }, { status: 500, headers });
        }

        responseData = { success: true, message: 'Password resettata con successo' };
        break;
      }

      case 'change-role': {
        const { new_role } = await request.json();
        
        if (!new_role || !['admin', 'user'].includes(new_role)) {
          return NextResponse.json({
            success: false,
            error: 'Ruolo non valido'
          }, { status: 400, headers });
        }

        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({
            is_admin: new_role === 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        if (error || !data) {
          return NextResponse.json({
            success: false,
            error: error?.message || 'Errore cambio ruolo'
          }, { status: 500, headers });
        }

        responseData = { success: true, message: 'Ruolo aggiornato con successo', user: data };
        break;
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Azione non valida'
        }, { status: 400, headers });
    }

    return NextResponse.json(responseData, { status, headers });

  } catch (error: any) {
    console.error(`Error in user action (${action}):`, error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500, headers: corsHeaders(origin) });
  }
}
