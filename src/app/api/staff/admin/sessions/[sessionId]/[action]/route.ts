import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string, action: string } }
) {
  const { sessionId, action } = params;

  try {
    console.log(`Session action API called: ${action} for session ${sessionId}`);

    let responseData: any;
    let status = 200;

    switch (action) {
      case 'view': {
        const { data: session, error } = await supabaseAdmin
          .from('user_sessions')
          .select(`
            id,
            user_id,
            session_token,
            device_info,
            ip_address,
            location,
            is_active,
            created_at,
            last_activity,
            profiles!inner (
              id,
              email,
              full_name,
              avatar_url
            )
          `)
          .eq('id', sessionId)
          .single();

        if (error || !session) {
          return NextResponse.json({
            success: false,
            error: 'Sessione non trovata'
          }, { status: 404 });
        }

        responseData = { success: true, session };
        break;
      }

      case 'terminate': {
        const { data, error } = await supabaseAdmin
          .from('user_sessions')
          .update({
            is_active: false,
            last_activity: new Date().toISOString()
          })
          .eq('id', sessionId)
          .select()
          .single();

        if (error || !data) {
          return NextResponse.json({
            success: false,
            error: error?.message || 'Errore terminazione sessione'
          }, { status: 500 });
        }

        responseData = { success: true, message: 'Sessione terminata con successo', session: data };
        break;
      }

      case 'extend': {
        const { hours = 24 } = await request.json();
        
        const { data, error } = await supabaseAdmin
          .from('user_sessions')
          .update({
            last_activity: new Date().toISOString()
          })
          .eq('id', sessionId)
          .select()
          .single();

        if (error || !data) {
          return NextResponse.json({
            success: false,
            error: error?.message || 'Errore estensione sessione'
          }, { status: 500 });
        }

        responseData = { success: true, message: `Sessione estesa di ${hours} ore`, session: data };
        break;
      }

      case 'suspend': {
        const { data, error } = await supabaseAdmin
          .from('user_sessions')
          .update({
            is_active: false,
            last_activity: new Date().toISOString()
          })
          .eq('id', sessionId)
          .select()
          .single();

        if (error || !data) {
          return NextResponse.json({
            success: false,
            error: error?.message || 'Errore sospensione sessione'
          }, { status: 500 });
        }

        responseData = { success: true, message: 'Sessione sospesa con successo', session: data };
        break;
      }

      case 'activate': {
        const { data, error } = await supabaseAdmin
          .from('user_sessions')
          .update({
            is_active: true,
            last_activity: new Date().toISOString()
          })
          .eq('id', sessionId)
          .select()
          .single();

        if (error || !data) {
          return NextResponse.json({
            success: false,
            error: error?.message || 'Errore attivazione sessione'
          }, { status: 500 });
        }

        responseData = { success: true, message: 'Sessione attivata con successo', session: data };
        break;
      }

      case 'delete': {
        const { error } = await supabaseAdmin
          .from('user_sessions')
          .delete()
          .eq('id', sessionId);

        if (error) {
          return NextResponse.json({
            success: false,
            error: error.message || 'Errore eliminazione sessione'
          }, { status: 500 });
        }

        responseData = { success: true, message: 'Sessione eliminata con successo' };
        break;
      }

      case 'details': {
        const { data: session, error } = await supabaseAdmin
          .from('user_sessions')
          .select(`
            id,
            user_id,
            session_token,
            device_info,
            ip_address,
            location,
            is_active,
            created_at,
            last_activity,
            profiles!inner (
              id,
              email,
              full_name,
              avatar_url,
              current_org
            )
          `)
          .eq('id', sessionId)
          .single();

        if (error || !session) {
          return NextResponse.json({
            success: false,
            error: 'Sessione non trovata'
          }, { status: 404 });
        }

        // Get additional session details
        const sessionDetails = {
          ...session,
          duration: session.last_activity ? 
            Math.floor((new Date().getTime() - new Date(session.created_at).getTime()) / (1000 * 60 * 60)) : 0,
          is_expired: session.last_activity ? 
            (new Date().getTime() - new Date(session.last_activity).getTime()) > (24 * 60 * 60 * 1000) : false
        };

        responseData = { success: true, session: sessionDetails };
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
    console.error(`Error in session action (${action}):`, error);
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 });
  }
}
