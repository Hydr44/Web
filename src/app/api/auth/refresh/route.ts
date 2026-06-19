// src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import jwt from 'jsonwebtoken';
import { verifyOAuthToken } from "@/lib/oauth-jwt";

export const runtime = "nodejs";

// JWT Secret per desktop app — SOLO da env (rimosso il fallback hardcoded).
// Lazy: throw a runtime (gestito dal try/catch della route → 500), non a
// livello-modulo (eviterebbe l'import della route, ma comunque solo questa).
function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET non configurata.');
  return s;
}

/**
 * Endpoint per refresh access token
 * POST /api/auth/refresh
 * Body: { refresh_token: "refresh_token" }
 */
export async function POST(request: NextRequest) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Missing refresh_token' },
        { status: 400 }
      );
    }

    // Verifica refresh token (tipato; null se invalido/scaduto/forma sbagliata)
    const decoded = verifyOAuthToken(refresh_token, getJwtSecret());
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Verifica che sia un refresh token
    if (decoded.type !== 'refresh') {
      return NextResponse.json(
        { error: 'Invalid token type' },
        { status: 401 }
      );
    }

    const supabase = supabaseAdmin;

    // Verifica che il refresh token sia ancora attivo nel database
    const { data: tokenData, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('refresh_token', refresh_token)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Refresh token not found or expired' },
        { status: 401 }
      );
    }

    // Genera nuovo access token
    const newAccessToken = jwt.sign(
      {
        user_id: decoded.user_id,
        app_id: decoded.app_id,
        type: 'access',
        email: tokenData.user_id, // Sarà aggiornato con i dati reali
        full_name: tokenData.user_id // Sarà aggiornato con i dati reali
      },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    // Aggiorna il token nel database
    const newExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora
    const { error: updateError } = await supabase
      .from('oauth_tokens')
      .update({
        access_token: newAccessToken,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error('Error updating token:', updateError);
      return NextResponse.json(
        { error: 'Failed to update token' },
        { status: 500 }
      );
    }

    // Recupera dati utente aggiornati
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Risposta con nuovo access token
    return NextResponse.json({
      success: true,
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 ora in secondi
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        current_org: userData.current_org,
        is_admin: userData.is_admin,
        is_staff: userData.is_staff,
        staff_role: userData.staff_role
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
