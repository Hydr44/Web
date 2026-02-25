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
            google_id
          `)
          .eq('id', userId)
          .single();

        if (error || !user) {
          return NextResponse.json({
            success: false,
            error: 'Utente non trovato'
          }, { status: 404, headers });
        }

        responseData = { success: true, user };
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

        // ── Step 2: SET NULL su created_by (preserva dati business) ──
        const nullifyCreatedBy = [
          'company_settings',
          'export_templates',
          'export_configurations',
          'export_history',
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
        ];
        for (const table of nullifyCreatedBy) {
          const { error } = await supabaseAdmin.from(table).update({ created_by: null }).eq('created_by', userId);
          if (error) {
            console.error(`  nullify ${table}.created_by:`, error.message);
            // Non bloccante — la tabella potrebbe non esistere o non avere record
          }
        }

        // ── Step 3: SET NULL su updated_by ──
        for (const table of ['company_settings', 'export_templates']) {
          const { error } = await supabaseAdmin.from(table).update({ updated_by: null }).eq('updated_by', userId);
          if (error) console.error(`  nullify ${table}.updated_by:`, error.message);
        }

        // ── Step 4: SET NULL su leads.assigned_to (referenzia profiles.id) ──
        {
          const { error } = await supabaseAdmin.from('leads').update({ assigned_to: null }).eq('assigned_to', userId);
          if (error) console.error('  nullify leads.assigned_to:', error.message);
        }

        // ── Step 5: SET NULL su maintenance_mode.started_by ──
        {
          const { error } = await supabaseAdmin.from('maintenance_mode').update({ started_by: null }).eq('started_by', userId);
          if (error) console.error('  nullify maintenance_mode.started_by:', error.message);
        }

        // ── Step 6: DELETE org_invites per questo utente ──
        {
          const { error } = await supabaseAdmin.from('org_invites').delete().eq('invited_by', userId);
          if (error) console.error('  cleanup org_invites.invited_by:', error.message);
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
