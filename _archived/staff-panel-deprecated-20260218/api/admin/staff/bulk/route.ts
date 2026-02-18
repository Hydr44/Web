import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createAuditLog } from '@/lib/staff-audit';

export async function POST(request: Request) {
  try {
    const { userIds, action } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Lista utenti staff richiesta' 
      }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Azione richiesta' 
      }, { status: 400 });
    }

    console.log(`Performing bulk action ${action} on ${userIds.length} staff users`);

    let result;
    let message;

    switch (action) {
      case 'activate':
        const { error: activateError } = await supabaseAdmin
          .from('profiles')
          .update({
            updated_at: new Date().toISOString()
          })
          .in('id', userIds)
          .eq('is_staff', true);

        if (activateError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore attivazione utenti staff: ${activateError.message}` 
          }, { status: 500 });
        }

        // Log audit for each user
        for (const userId of userIds) {
          await createAuditLog(
            'system',
            'System',
            'system',
            'staff.activate',
            'staff_user',
            userId,
            'Staff User',
            {},
            request,
            true
          );
        }

        message = `${userIds.length} utenti staff attivati con successo`;
        break;

      case 'suspend':
        const { error: suspendError } = await supabaseAdmin
          .from('profiles')
          .update({
            updated_at: new Date().toISOString()
          })
          .in('id', userIds)
          .eq('is_staff', true);

        if (suspendError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore sospensione utenti staff: ${suspendError.message}` 
          }, { status: 500 });
        }

        // Log audit for each user
        for (const userId of userIds) {
          await createAuditLog(
            'system',
            'System',
            'system',
            'staff.suspend',
            'staff_user',
            userId,
            'Staff User',
            {},
            request,
            true
          );
        }

        message = `${userIds.length} utenti staff sospesi con successo`;
        break;

      case 'delete':
        // Delete from profiles first
        const { error: deleteError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .in('id', userIds)
          .eq('is_staff', true);

        if (deleteError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore eliminazione utenti staff: ${deleteError.message}` 
          }, { status: 500 });
        }

        // Delete from auth.users
        for (const userId of userIds) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
          
          // Log audit
          await createAuditLog(
            'system',
            'System',
            'system',
            'staff.delete',
            'staff_user',
            userId,
            'Staff User',
            {},
            request,
            true
          );
        }

        message = `${userIds.length} utenti staff eliminati con successo`;
        break;

      case 'export':
        // Get staff user data for export
        const { data: users, error: exportError } = await supabaseAdmin
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            staff_role,
            is_admin,
            created_at,
            updated_at,
            is_staff
          `)
          .in('id', userIds)
          .eq('is_staff', true);

        if (exportError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore export utenti staff: ${exportError.message}` 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Dati utenti staff preparati per export',
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
    console.error('Bulk staff users API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
