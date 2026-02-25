import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { userIds, action, data } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !action) {
      return NextResponse.json({
        success: false,
        error: 'Parametri richiesti: userIds (array), action (string)'
      }, { status: 400 });
    }

    console.log(`Bulk user action: ${action} for ${userIds.length} users`);

    const results: { id: string; success: boolean; error?: string }[] = [];

    switch (action) {
      case 'activate': {
        for (const userId of userIds) {
          try {
            const { error } = await supabaseAdmin
              .from('profiles')
              .update({
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);

            if (error) {
              results.push({ id: userId, success: false, error: error.message });
            } else {
              results.push({ id: userId, success: true });
            }
          } catch (err: any) {
            results.push({ id: userId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'suspend': {
        for (const userId of userIds) {
          try {
            const { error } = await supabaseAdmin
              .from('profiles')
              .update({
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);

            if (error) {
              results.push({ id: userId, success: false, error: error.message });
            } else {
              results.push({ id: userId, success: true });
            }
          } catch (err: any) {
            results.push({ id: userId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'delete': {
        for (const userId of userIds) {
          try {
            // Delete from auth.users
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            
            if (authError) {
              results.push({ id: userId, success: false, error: authError.message });
              continue;
            }

            // Delete from profiles
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .delete()
              .eq('id', userId);

            if (profileError) {
              results.push({ id: userId, success: false, error: profileError.message });
            } else {
              results.push({ id: userId, success: true });
            }
          } catch (err: any) {
            results.push({ id: userId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'change-role': {
        const { new_role } = data || {};
        
        if (!new_role || !['admin', 'user'].includes(new_role)) {
          return NextResponse.json({
            success: false,
            error: 'Ruolo non valido'
          }, { status: 400 });
        }

        for (const userId of userIds) {
          try {
            const { error } = await supabaseAdmin
              .from('profiles')
              .update({
                is_admin: new_role === 'admin',
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);

            if (error) {
              results.push({ id: userId, success: false, error: error.message });
            } else {
              results.push({ id: userId, success: true });
            }
          } catch (err: any) {
            results.push({ id: userId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'reset-passwords': {
        const { new_password } = data || {};
        
        if (!new_password) {
          return NextResponse.json({
            success: false,
            error: 'Nuova password richiesta'
          }, { status: 400 });
        }

        for (const userId of userIds) {
          try {
            const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
              password: new_password
            });

            if (error) {
              results.push({ id: userId, success: false, error: error.message });
            } else {
              results.push({ id: userId, success: true });
            }
          } catch (err: any) {
            results.push({ id: userId, success: false, error: err.message });
          }
        }
        break;
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Azione bulk non valida'
        }, { status: 400 });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Operazione completata: ${successCount} successi, ${failureCount} errori`,
      results,
      summary: {
        total: userIds.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error: any) {
    console.error('Bulk user action error:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
}