// src/app/api/auth/oauth/exchange/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import jwt from 'jsonwebtoken';

export const runtime = "nodejs";

// JWT Secret per desktop app (dovrebbe essere in env)
const JWT_SECRET = process.env.JWT_SECRET || 'desktop_oauth_secret_key_change_in_production';

/**
 * Endpoint per scambio code OAuth per access token
 * POST /api/auth/oauth/exchange
 * Body: { code: "oauth_code", app_id: "desktop_app" }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== OAUTH EXCHANGE ENDPOINT START ===');
    const { code, app_id } = await request.json();
    console.log('Exchange params:', { code, app_id });

    // Validazione parametri
    if (!code || !app_id) {
      console.error('Missing parameters:', { code, app_id });
      return NextResponse.json(
        { error: 'Missing required parameters: code, app_id' },
        { status: 400 }
      );
    }

    // Usa supabaseAdmin per bypassare RLS
    const supabase = supabaseAdmin;

    // Verifica e recupera il code OAuth
    console.log('=== SEARCHING OAUTH CODE ===');
    console.log('Searching for code:', code);
    console.log('Searching for app_id:', app_id);
    
    const { data: oauthData, error: oauthError } = await supabase
      .from('oauth_codes')
      .select('*')
      .eq('code', code)
      .eq('app_id', app_id)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    console.log('=== OAUTH CODE SEARCH RESULT ===');
    console.log('OAuth Data:', oauthData);
    console.log('OAuth Error:', oauthError);

    if (oauthError || !oauthData) {
      console.error('=== OAUTH CODE NOT FOUND ===');
      console.error('Error:', oauthError);
      console.error('Data:', oauthData);
      return NextResponse.json(
        { error: 'Invalid or expired OAuth code' },
        { status: 400 }
      );
    }

    // Marca il code come usato
    await supabase
      .from('oauth_codes')
      .update({ used: true })
      .eq('id', oauthData.id);

    // Recupera dati utente
    console.log('=== SEARCHING USER ===');
    console.log('User ID:', oauthData.user_id);
    
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', oauthData.user_id)
      .single();

    console.log('=== USER SEARCH RESULT ===');
    console.log('User Data:', userData);
    console.log('User Error:', userError);

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Genera access token e refresh token
    const accessToken = jwt.sign(
      {
        user_id: oauthData.user_id,
        app_id: app_id,
        type: 'access',
        email: userData.email,
        full_name: userData.full_name
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      {
        user_id: oauthData.user_id,
        app_id: app_id,
        type: 'refresh'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Salva i token nel database
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 ora
    const { error: tokenError } = await supabase
      .from('oauth_tokens')
      .insert({
        user_id: oauthData.user_id,
        app_id: app_id,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        scope: 'read write',
        is_active: true
      });

    if (tokenError) {
      console.error('Error saving tokens:', tokenError);
      return NextResponse.json(
        { error: 'Failed to save tokens' },
        { status: 500 }
      );
    }

    // Risposta con token
    return NextResponse.json({
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 ora in secondi
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url
      }
    });

  } catch (error) {
    console.error('OAuth exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
