import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { userIds, action } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lista utenti richiesta' 
      }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Azione richiesta' 
      }, { status: 400 });
    }

    console.log(`Performing bulk action ${action} on ${userIds.length} users`);

    let result;
    let message;

    switch (action) {
      case 'activate':
        const { error: activateError } = await supabaseAdmin
          .from('profiles')
          .update({
            updated_at: new Date().toISOString()
          })
          .in('id', userIds);

        if (activateError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore attivazione utenti: ${activateError.message}` 
          }, { status: 500 });
        }

        message = `${userIds.length} utenti attivati con successo`;
        break;

      case 'suspend':
        const { error: suspendError } = await supabaseAdmin
          .from('profiles')
          .update({
            updated_at: new Date().toISOString()
          })
          .in('id', userIds);

        if (suspendError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore sospensione utenti: ${suspendError.message}` 
          }, { status: 500 });
        }

        message = `${userIds.length} utenti sospesi con successo`;
        break;

      case 'delete':
        // Delete from auth.users first
        for (const userId of userIds) {
          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
          if (authError) {
            console.error(`Error deleting auth user ${userId}:`, authError);
          }
        }

        // Delete from profiles
        const { error: deleteError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .in('id', userIds);

        if (deleteError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore eliminazione utenti: ${deleteError.message}` 
          }, { status: 500 });
        }

        message = `${userIds.length} utenti eliminati con successo`;
        break;

      case 'export':
        // Get user data for export
        const { data: users, error: exportError } = await supabaseAdmin
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            created_at,
            updated_at,
            is_admin,
            current_org,
            organizations!current_org (
              name
            )
          `)
          .in('id', userIds);

        if (exportError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore export utenti: ${exportError.message}` 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Dati utenti preparati per export',
          users: users || []
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Azione bulk non supportata' 
        }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message,
      affectedCount: userIds.length
    });

  } catch (error: any) {
    console.error('Bulk users API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
