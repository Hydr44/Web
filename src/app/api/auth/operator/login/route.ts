// POST /api/auth/operator/login
// Login operatore con password
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  hashToken, 
  verifyPassword,
  getExpiresAt 
} from '@/lib/operator-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer();
    
    // Verifica autenticazione SSO
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autenticato SSO' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { operator_id, password, device_id, device_name, remember_device } = body;

    if (!operator_id || !password || !device_id) {
      return NextResponse.json(
        { error: 'operator_id, password e device_id richiesti' },
        { status: 400 }
      );
    }

    // Carica operatore (usando admin per leggere password_hash)
    const { data: operator, error: operatorError } = await supabaseAdmin
      .from('operators')
      .select('id, org_id, user_id, nome, cognome, codice_operatore, ruolo, password_hash, attivo, permissions')
      .eq('id', operator_id)
      .single();

    if (operatorError || !operator) {
      return NextResponse.json(
        { error: 'Operatore non trovato' },
        { status: 404 }
      );
    }

    if (!operator.attivo) {
      return NextResponse.json(
        { error: 'Operatore non attivo' },
        { status: 403 }
      );
    }

    // Verifica che l'utente SSO sia associato all'operatore o appartenga all'org
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', operator.org_id)
      .single();

    if (!orgMember && operator.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorizzato per questo operatore' },
        { status: 403 }
      );
    }

    // Verifica password
    const passwordValid = await verifyPassword(password, operator.password_hash);
    if (!passwordValid) {
      // Log tentativo fallito (per rate limiting futuro)
      return NextResponse.json(
        { error: 'Password non valida' },
        { status: 401 }
      );
    }

    // Genera token
    const sessionId = crypto.randomUUID();
    const isPersistent = remember_device === true;
    
    const tokenPayload = {
      operator_id: operator.id,
      org_id: operator.org_id,
      user_id: user.id,
      session_id: sessionId,
      ruolo: operator.ruolo as 'operatore' | 'supervisore' | 'admin',
      permissions: (operator.permissions as string[]) || [],
      device_id,
      is_persistent: isPersistent,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const expiresAt = getExpiresAt(accessToken);

    // Salva sessione nel DB
    const { error: sessionError } = await supabaseAdmin
      .from('operator_sessions')
      .insert({
        id: sessionId,
        operator_id: operator.id,
        org_id: operator.org_id,
        user_id: user.id,
        access_token_hash: hashToken(accessToken),
        refresh_token_hash: hashToken(refreshToken),
        device_id,
        device_name: device_name || null,
        device_type: 'desktop', // TODO: rilevare da user_agent
        user_agent: request.headers.get('user-agent') || null,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        expires_at: expiresAt?.toISOString() || null,
        refresh_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 giorni
        is_persistent: isPersistent,
        attivo: true,
      });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json(
        { error: 'Errore creazione sessione' },
        { status: 500 }
      );
    }

    // Aggiorna ultimo_accesso operatore
    await supabaseAdmin
      .from('operators')
      .update({ ultimo_accesso: new Date().toISOString() })
      .eq('id', operator.id);

    // Log attività
    await supabaseAdmin
      .from('operator_activity_log')
      .insert({
        operator_id: operator.id,
        org_id: operator.org_id,
        session_id: sessionId,
        action_type: 'login',
        description: `Login operatore ${operator.codice_operatore}`,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      });

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      operator: {
        id: operator.id,
        nome: operator.nome,
        cognome: operator.cognome,
        codice_operatore: operator.codice_operatore,
        ruolo: operator.ruolo,
      },
      expires_at: expiresAt?.toISOString() || null,
      session_id: sessionId,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/operator/login:', error);
    return NextResponse.json(
      { error: error.message || 'Errore interno' },
      { status: 500 }
    );
  }
}
