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
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

// JWT Secret per desktop app (dovrebbe essere in env)
const JWT_SECRET = process.env.JWT_SECRET || 'desktop_oauth_secret_key_change_in_production';

// Verifica token OAuth
function verifyOAuthToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Leggi token Bearer dall'header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token non fornito' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyOAuthToken(token);
    
    if (!decoded || decoded.type !== 'access') {
      return NextResponse.json(
        { error: 'Token non valido o scaduto' },
        { status: 401 }
      );
    }

    const userId = decoded.user_id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Token non valido' },
        { status: 401 }
      );
    }

    const supabase = await supabaseServer();

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
      .eq('user_id', userId)
      .eq('org_id', operator.org_id)
      .single();

    if (!orgMember && operator.user_id !== userId) {
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
      user_id: userId,
      session_id: sessionId,
      ruolo: operator.ruolo as 'operatore' | 'supervisore' | 'admin',
      permissions: (operator.permissions as string[]) || [],
      device_id,
      is_persistent: isPersistent,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const expiresAt = getExpiresAt(accessToken);

    // Se il token è persistente e non ha scadenza, imposta una data molto lontana nel futuro
    // (100 anni da ora) per rispettare il vincolo NOT NULL del database
    const expiresAtValue = isPersistent && !expiresAt 
      ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 anni
      : expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 giorni se null

    // Salva sessione nel DB
    const { error: sessionError } = await supabaseAdmin
      .from('operator_sessions')
      .insert({
        id: sessionId,
        operator_id: operator.id,
        org_id: operator.org_id,
        user_id: userId,
        access_token_hash: hashToken(accessToken),
        refresh_token_hash: hashToken(refreshToken),
        device_id,
        device_name: device_name || null,
        device_type: 'desktop', // TODO: rilevare da user_agent
        user_agent: request.headers.get('user-agent') || null,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        expires_at: expiresAtValue.toISOString(),
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
      expires_at: expiresAtValue.toISOString(),
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
