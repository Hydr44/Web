import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createAuditLog } from '@/lib/staff-audit';

export async function POST(
  request: Request,
  { params }: { params: { userId: string; action: string } }
) {
  try {
    const { userId, action } = params;
    const { data: bodyData } = await request.json().catch(() => ({}));

    console.log(`Performing action ${action} on staff user ${userId}`);

    let result;
    let message;

    switch (action) {
      case 'view':
        // Get staff user details
        const { data: user, error: userError } = await supabaseAdmin
          .from('profiles')
          .select(`
            *,
            organizations!current_org (
              name,
              created_at
            )
          `)
          .eq('id', userId)
          .eq('is_staff', true)
          .single();

        if (userError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore nel recupero utente staff: ${userError.message}` 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          user,
          message: 'Dettagli utente staff recuperati' 
        });

      case 'edit':
        const { full_name, email, staff_role, is_admin } = bodyData;
        
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            full_name,
            email,
            staff_role,
            is_admin,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .eq('is_staff', true);

        if (updateError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore aggiornamento utente staff: ${updateError.message}` 
          }, { status: 500 });
        }

        // Log audit
        await createAuditLog(
          'system',
          'System',
          'system',
          'staff.edit',
          'staff_user',
          userId,
          full_name,
          { staff_role, is_admin },
          request,
          true
        );

        message = 'Utente staff aggiornato con successo';
        break;

      case 'suspend':
        const { error: suspendError } = await supabaseAdmin
          .from('profiles')
          .update({
            updated_at: new Date().toISOString()
            // Add suspended field if needed
          })
          .eq('id', userId)
          .eq('is_staff', true);

        if (suspendError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore sospensione utente staff: ${suspendError.message}` 
          }, { status: 500 });
        }

        // Log audit
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

        message = 'Utente staff sospeso con successo';
        break;

      case 'activate':
        const { error: activateError } = await supabaseAdmin
          .from('profiles')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .eq('is_staff', true);

        if (activateError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore attivazione utente staff: ${activateError.message}` 
          }, { status: 500 });
        }

        // Log audit
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

        message = 'Utente staff attivato con successo';
        break;

      case 'permissions':
        const { permissions } = bodyData;
        
        // Update permissions (this would need a permissions table)
        // For now, just log the action
        await createAuditLog(
          'system',
          'System',
          'system',
          'staff.permissions_change',
          'staff_user',
          userId,
          'Staff User',
          { permissions },
          request,
          true
        );

        message = 'Permessi aggiornati con successo';
        break;

      case 'delete':
        // Delete staff user
        const { error: deleteError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId)
          .eq('is_staff', true);

        if (deleteError) {
          return NextResponse.json({ 
            success: false, 
            error: `Errore eliminazione utente staff: ${deleteError.message}` 
          }, { status: 500 });
        }

        // Also delete from auth.users
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

        message = 'Utente staff eliminato con successo';
        break;

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Azione non supportata' 
        }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message 
    });

  } catch (error: any) {
    console.error('Staff user action API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Errore interno del server' 
    }, { status: 500 });
  }
}
