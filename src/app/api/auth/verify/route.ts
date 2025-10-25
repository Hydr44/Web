// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import jwt from 'jsonwebtoken';

export const runtime = "nodejs";

// JWT Secret per desktop app (dovrebbe essere in env)
const JWT_SECRET = process.env.JWT_SECRET || 'desktop_oauth_secret_key_change_in_production';

/**
 * Endpoint per verifica access token
 * GET /api/auth/verify?token=access_token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      );
    }

    // Verifica JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (jwtError) {
      console.warn('JWT verification failed:', jwtError);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Verifica che sia un access token
    if (decoded.type !== 'access') {
      return NextResponse.json(
        { error: 'Invalid token type' },
        { status: 401 }
      );
    }

    const supabase = await supabaseServer();

    // Verifica che il token sia ancora attivo nel database
    const { data: tokenData, error: tokenError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('access_token', token)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Token not found or expired' },
        { status: 401 }
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

    // Risposta con dati utente
    return NextResponse.json({
      valid: true,
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        current_org: userData.current_org,
        is_admin: userData.is_admin,
        is_staff: userData.is_staff,
        staff_role: userData.staff_role
      },
      token_info: {
        app_id: decoded.app_id,
        type: decoded.type,
        expires_at: tokenData.expires_at
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
