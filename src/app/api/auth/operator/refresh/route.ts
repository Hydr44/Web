// POST /api/auth/operator/refresh
// Rinnova access token usando refresh token
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyToken, generateAccessToken, generateRefreshToken, hashToken, getExpiresAt } from '@/lib/operator-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'refresh_token richiesto' },
        { status: 400 }
      );
    }

    // Verifica e decodifica refresh token
    const decoded = verifyToken(refresh_token);
    if (!decoded || decoded.type !== 'operator_refresh') {
      return NextResponse.json(
        { error: 'Refresh token non valido' },
        { status: 401 }
      );
    }

    // Verifica sessione nel DB
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('operator_sessions')
      .select('id, operator_id, org_id, user_id, attivo, expires_at, refresh_expires_at')
      .eq('id', decoded.session_id)
      .eq('refresh_token_hash', hashToken(refresh_token))
      .single();

    if (sessionError || !session || !session.attivo) {
      return NextResponse.json(
        { error: 'Sessione non trovata o revocata' },
        { status: 401 }
      );
    }

    // Verifica che refresh token non sia scaduto
    if (session.refresh_expires_at && new Date(session.refresh_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Refresh token scaduto' },
        { status: 401 }
      );
    }

    // Carica operatore per ottenere dati aggiornati
    const { data: operator, error: operatorError } = await supabaseAdmin
      .from('operators')
      .select('id, org_id, ruolo, permissions, attivo')
      .eq('id', session.operator_id)
      .single();

    if (operatorError || !operator || !operator.attivo) {
      return NextResponse.json(
        { error: 'Operatore non trovato o non attivo' },
        { status: 404 }
      );
    }

    // Genera nuovo access token
    const tokenPayload = {
      operator_id: operator.id,
      org_id: operator.org_id,
      user_id: session.user_id || undefined,
      session_id: session.id,
      ruolo: operator.ruolo as 'operatore' | 'supervisore' | 'admin',
      permissions: (operator.permissions as string[]) || [],
      device_id: decoded.device_id,
      is_persistent: decoded.is_persistent,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const expiresAt = getExpiresAt(newAccessToken);

    // Aggiorna hash access token nel DB
    await supabaseAdmin
      .from('operator_sessions')
      .update({
        access_token_hash: hashToken(newAccessToken),
        ultimo_uso: new Date().toISOString(),
      })
      .eq('id', session.id);

    return NextResponse.json({
      access_token: newAccessToken,
      expires_at: expiresAt?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/operator/refresh:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
}
