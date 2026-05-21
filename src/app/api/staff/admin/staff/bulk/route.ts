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

    let message: string;

    switch (action) {
      case 'activate': {
        const { error } = await supabaseAdmin
          .from('staff')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .in('id', userIds);

        if (error) {
          return NextResponse.json({
            success: false,
            error: `Errore attivazione utenti staff: ${error.message}`
          }, { status: 500 });
        }

        for (const userId of userIds) {
          await createAuditLog('system', 'System', 'system', 'staff.activate', 'staff_user', userId, 'Staff User', {}, request, true);
        }
        message = `${userIds.length} utenti staff attivati con successo`;
        break;
      }

      case 'suspend': {
        const { error } = await supabaseAdmin
          .from('staff')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in('id', userIds);

        if (error) {
          return NextResponse.json({
            success: false,
            error: `Errore sospensione utenti staff: ${error.message}`
          }, { status: 500 });
        }

        for (const userId of userIds) {
          await createAuditLog('system', 'System', 'system', 'staff.suspend', 'staff_user', userId, 'Staff User', {}, request, true);
        }
        message = `${userIds.length} utenti staff sospesi con successo`;
        break;
      }

      case 'delete': {
        // Rimuovi prima le sessioni (FK ON DELETE CASCADE, ma siamo espliciti)
        await supabaseAdmin.from('staff_sessions').delete().in('staff_id', userIds);

        const { error } = await supabaseAdmin
          .from('staff')
          .delete()
          .in('id', userIds);

        if (error) {
          return NextResponse.json({
            success: false,
            error: `Errore eliminazione utenti staff: ${error.message}`
          }, { status: 500 });
        }

        for (const userId of userIds) {
          await createAuditLog('system', 'System', 'system', 'staff.delete', 'staff_user', userId, 'Staff User', {}, request, true);
        }
        message = `${userIds.length} utenti staff eliminati con successo`;
        break;
      }

      case 'export': {
        const { data: users, error } = await supabaseAdmin
          .from('staff')
          .select('id, email, full_name, role, is_active, last_login_at, created_at, updated_at')
          .in('id', userIds);

        if (error) {
          return NextResponse.json({
            success: false,
            error: `Errore export utenti staff: ${error.message}`
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: 'Dati utenti staff preparati per export',
          users: users || []
        });
      }

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
