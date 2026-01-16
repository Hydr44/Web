// GET /api/auth/operator/sessions
// Lista sessioni attive dell'operatore
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken } from '@/lib/operator-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
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

    // Carica tutte le sessioni attive dell'operatore
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from('operator_sessions')
      .select('id, device_name, device_type, created_at, ultimo_uso, is_persistent')
      .eq('operator_id', decoded.operator_id)
      .eq('attivo', true)
      .order('ultimo_uso', { ascending: false });

    if (sessionsError) {
      console.error('Error loading sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Errore caricamento sessioni' },
        { status: 500 }
      );
    }

    // Marca sessione corrente
    const sessionsWithCurrent = (sessions || []).map(session => ({
      ...session,
      is_current: session.id === decoded.session_id,
    }));

    return NextResponse.json({
      sessions: sessionsWithCurrent,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/operator/sessions:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
}
