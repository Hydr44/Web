import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { sessionIds, action, data } = await request.json();

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0 || !action) {
      return NextResponse.json({
        success: false,
        error: 'Parametri richiesti: sessionIds (array), action (string)'
      }, { status: 400 });
    }

    console.log(`Bulk session action: ${action} for ${sessionIds.length} sessions`);

    const results: { id: string; success: boolean; error?: string }[] = [];

    switch (action) {
      case 'terminate': {
        for (const sessionId of sessionIds) {
          try {
            const { error } = await supabaseAdmin
              .from('user_sessions')
              .update({
                is_active: false,
                last_activity: new Date().toISOString()
              })
              .eq('id', sessionId);

            if (error) {
              results.push({ id: sessionId, success: false, error: error.message });
            } else {
              results.push({ id: sessionId, success: true });
            }
          } catch (err: any) {
            results.push({ id: sessionId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'activate': {
        for (const sessionId of sessionIds) {
          try {
            const { error } = await supabaseAdmin
              .from('user_sessions')
              .update({
                is_active: true,
                last_activity: new Date().toISOString()
              })
              .eq('id', sessionId);

            if (error) {
              results.push({ id: sessionId, success: false, error: error.message });
            } else {
              results.push({ id: sessionId, success: true });
            }
          } catch (err: any) {
            results.push({ id: sessionId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'delete': {
        for (const sessionId of sessionIds) {
          try {
            const { error } = await supabaseAdmin
              .from('user_sessions')
              .delete()
              .eq('id', sessionId);

            if (error) {
              results.push({ id: sessionId, success: false, error: error.message });
            } else {
              results.push({ id: sessionId, success: true });
            }
          } catch (err: any) {
            results.push({ id: sessionId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'extend': {
        const { hours = 24 } = data || {};
        
        for (const sessionId of sessionIds) {
          try {
            const { error } = await supabaseAdmin
              .from('user_sessions')
              .update({
                last_activity: new Date().toISOString()
              })
              .eq('id', sessionId);

            if (error) {
              results.push({ id: sessionId, success: false, error: error.message });
            } else {
              results.push({ id: sessionId, success: true });
            }
          } catch (err: any) {
            results.push({ id: sessionId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'cleanup-expired': {
        // Clean up expired sessions (older than 24 hours)
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        for (const sessionId of sessionIds) {
          try {
            // First check if session is actually expired
            const { data: session, error: fetchError } = await supabaseAdmin
              .from('user_sessions')
              .select('last_activity')
              .eq('id', sessionId)
              .single();

            if (fetchError) {
              results.push({ id: sessionId, success: false, error: fetchError.message });
              continue;
            }

            if (session.last_activity && new Date(session.last_activity) < new Date(cutoffTime)) {
              const { error } = await supabaseAdmin
                .from('user_sessions')
                .delete()
                .eq('id', sessionId);

              if (error) {
                results.push({ id: sessionId, success: false, error: error.message });
              } else {
                results.push({ id: sessionId, success: true });
              }
            } else {
              results.push({ id: sessionId, success: true, message: 'Sessione non scaduta' });
            }
          } catch (err: any) {
            results.push({ id: sessionId, success: false, error: err.message });
          }
        }
        break;
      }

      case 'export': {
        // Export session data
        for (const sessionId of sessionIds) {
          try {
            const { data: session, error } = await supabaseAdmin
              .from('user_sessions')
              .select(`
                id,
                user_id,
                device_info,
                ip_address,
                location,
                is_active,
                created_at,
                last_activity,
                profiles!inner (
                  email,
                  full_name
                )
              `)
              .eq('id', sessionId)
              .single();

            if (error) {
              results.push({ id: sessionId, success: false, error: error.message });
            } else {
              results.push({ 
                id: sessionId, 
                success: true, 
                data: session
              });
            }
          } catch (err: any) {
            results.push({ id: sessionId, success: false, error: err.message });
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
        total: sessionIds.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error: any) {
    console.error('Bulk session action error:', error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
}
