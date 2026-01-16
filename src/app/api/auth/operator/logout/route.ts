// POST /api/auth/operator/logout
// Logout e invalida sessione
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken, hashToken } from '@/lib/operator-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, revoke_all } = body;

    // Se revoke_all, serve operator_id
    if (revoke_all && !body.operator_id) {
      return NextResponse.json(
        { error: 'operator_id richiesto per revoke_all' },
        { status: 400 }
      );
    }

    // Verifica token dalla header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token non fornito' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'operator_access') {
      return NextResponse.json(
        { error: 'Token non valido' },
        { status: 401 }
      );
    }

    const operatorId = decoded.operator_id;
    const sessionIdToRevoke = session_id || decoded.session_id;

    if (revoke_all) {
      // Revoca tutte le sessioni dell'operatore
      const { error: revokeError } = await supabaseAdmin
        .from('operator_sessions')
        .update({
          attivo: false,
          revoked_at: new Date().toISOString(),
        })
        .eq('operator_id', operatorId)
        .eq('attivo', true);

      if (revokeError) {
        console.error('Error revoking all sessions:', revokeError);
        return NextResponse.json(
          { error: 'Errore revoca sessioni' },
          { status: 500 }
        );
      }

      // Log attività
      await supabaseAdmin
        .from('operator_activity_log')
        .insert({
          operator_id: operatorId,
          org_id: decoded.org_id,
          action_type: 'logout',
          description: 'Logout - tutte le sessioni revocate',
        });
    } else {
      // Revoca solo la sessione specifica
      const { error: revokeError } = await supabaseAdmin
        .from('operator_sessions')
        .update({
          attivo: false,
          revoked_at: new Date().toISOString(),
        })
        .eq('id', sessionIdToRevoke)
        .eq('attivo', true);

      if (revokeError) {
        console.error('Error revoking session:', revokeError);
        return NextResponse.json(
          { error: 'Errore revoca sessione' },
          { status: 500 }
        );
      }

      // Log attività
      await supabaseAdmin
        .from('operator_activity_log')
        .insert({
          operator_id: operatorId,
          org_id: decoded.org_id,
          session_id: sessionIdToRevoke,
          action_type: 'logout',
          description: 'Logout operatore',
        });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/operator/logout:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
}
