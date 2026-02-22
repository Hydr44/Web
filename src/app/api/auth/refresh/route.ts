// src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import jwt from 'jsonwebtoken';

export const runtime = "nodejs";

// JWT Secret per desktop app (dovrebbe essere in env)
const JWT_SECRET = process.env.JWT_SECRET || 'desktop_oauth_secret_key_change_in_production';

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

    // Verifica refresh token
    let decoded;
    try {
      decoded = jwt.verify(refresh_token, JWT_SECRET) as any;
    } catch (jwtError) {
      console.warn('JWT refresh verification failed:', jwtError);
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
      JWT_SECRET,
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
