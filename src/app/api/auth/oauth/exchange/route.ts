// src/app/api/auth/oauth/exchange/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import jwt from 'jsonwebtoken';

export const runtime = "nodejs";
export const maxDuration = 30; // 30 secondi per Supabase queries

// JWT Secret per desktop app (dovrebbe essere in env)
const JWT_SECRET = process.env.JWT_SECRET || 'desktop_oauth_secret_key_change_in_production';

const DEFAULT_ALLOW_HEADERS = 'Content-Type, Authorization, Apikey, Prefer, X-Client-Info, X-Requested-With';

function withCORS(
  data: any,
  status: number,
  request: NextRequest,
  allowHeaders: string = DEFAULT_ALLOW_HEADERS
) {
  const origin = request.headers.get('origin');
  const allowOrigin = origin ?? '*';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': allowHeaders,
  };

  if (origin) {
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin';
  }

  return NextResponse.json(data, { status, headers });
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowOrigin = origin ?? '*';
  const requestedHeaders = request.headers.get('access-control-request-headers');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': requestedHeaders && requestedHeaders.trim().length > 0
      ? requestedHeaders
      : DEFAULT_ALLOW_HEADERS,
    'Access-Control-Max-Age': '86400',
  };
  if (origin) {
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin, Access-Control-Request-Headers';
  }
  return new NextResponse(null, { status: 200, headers });
}

/**
 * Endpoint per scambio code OAuth per access token
 * POST /api/auth/oauth/exchange
 * Body: { code: "oauth_code", app_id: "desktop_app" }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== OAUTH EXCHANGE ENDPOINT START ===');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const { code, app_id } = await request.json();
    console.log('Exchange params:', { code, app_id });

    // Validazione parametri
    if (!code || !app_id) {
      console.error('Missing parameters:', { code, app_id });
      return withCORS(
        { error: 'Missing required parameters: code, app_id' },
        400,
        request
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
      return withCORS(
        { error: 'Invalid or expired OAuth code' },
        400,
        request
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
      return withCORS(
        { error: 'User not found' },
        404,
        request
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
      { expiresIn: '365d' } // 1 anno per token persistente
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
      return withCORS(
        { error: 'Failed to save tokens' },
        500,
        request
      );
    }

    // Genera magic link Supabase per creare sessione auth reale nel client
    // Questo permette a auth.uid() di funzionare nelle policy RLS
    let supabaseSession = null;
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userData.email,
      });
      
      if (!linkError && linkData?.properties?.hashed_token) {
        supabaseSession = {
          hashed_token: linkData.properties.hashed_token,
          type: 'magiclink' as const,
        };
        console.log('[OAuth Exchange] Supabase magic link generated for RLS session');
      } else {
        console.warn('[OAuth Exchange] Could not generate Supabase session:', linkError?.message);
      }
    } catch (sessionErr) {
      console.warn('[OAuth Exchange] Supabase session generation failed:', sessionErr);
    }

    // Risposta con token
    return withCORS({
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
      },
      // Token per sessione Supabase (RLS)
      supabase_session: supabaseSession
    }, 200, request);

  } catch (error) {
    console.error('OAuth exchange error:', error);
    return withCORS(
      { error: 'Internal server error' },
      500,
      request
    );
  }
}
