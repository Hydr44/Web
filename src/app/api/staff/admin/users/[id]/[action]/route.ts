import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: Request,
  { params }: { params: { id: string, action: string } }
) {
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
          }, { status: 404 });
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
          }, { status: 500 });
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
          }, { status: 500 });
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
          }, { status: 500 });
        }

        responseData = { success: true, message: 'Utente attivato con successo', user: data };
        break;
      }

      case 'delete': {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) {
          return NextResponse.json({
            success: false,
            error: authError.message || 'Errore eliminazione utente da auth'
          }, { status: 500 });
        }

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (profileError) {
          return NextResponse.json({
            success: false,
            error: profileError.message || 'Errore eliminazione profilo'
          }, { status: 500 });
        }

        responseData = { success: true, message: 'Utente eliminato con successo' };
        break;
      }

      case 'reset-password': {
        const { new_password } = await request.json();
        
        if (!new_password) {
          return NextResponse.json({
            success: false,
            error: 'Nuova password richiesta'
          }, { status: 400 });
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: new_password
        });

        if (error) {
          return NextResponse.json({
            success: false,
            error: error.message || 'Errore reset password'
          }, { status: 500 });
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
          }, { status: 400 });
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
          }, { status: 500 });
        }

        responseData = { success: true, message: 'Ruolo aggiornato con successo', user: data };
        break;
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Azione non valida'
        }, { status: 400 });
    }

    return NextResponse.json(responseData, { status });

  } catch (error: any) {
    console.error(`Error in user action (${action}):`, error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
}
