// src/app/api/auth/oauth/desktop/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * Endpoint per avvio OAuth desktop
 * GET /api/auth/oauth/desktop?app_id=desktop_app&redirect_uri=http://localhost:3001/auth/callback&state=random_state
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== OAUTH DESKTOP ENDPOINT START ===');
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('app_id');
    const redirectUri = searchParams.get('redirect_uri');
    const state = searchParams.get('state');

    console.log('OAuth params:', { appId, redirectUri, state });

    // Validazione parametri
    if (!appId || !redirectUri || !state) {
      console.error('Missing parameters:', { appId, redirectUri, state });
      return NextResponse.json(
        { error: 'Missing required parameters: app_id, redirect_uri, state' },
        { status: 400 }
      );
    }

    // Validazione app_id
    if (appId !== 'desktop_app') {
      return NextResponse.json(
        { error: 'Invalid app_id' },
        { status: 400 }
      );
    }

    // Validazione redirect_uri
    if (!redirectUri.startsWith('desktop://') && !redirectUri.startsWith('http://localhost:') && !redirectUri.startsWith('http://127.0.0.1:')) {
      return NextResponse.json(
        { error: 'Invalid redirect_uri. Must start with desktop://, http://localhost: or http://127.0.0.1:' },
        { status: 400 }
      );
    }

    // Genera state temporaneo (senza database per evitare RLS)
    const stateCode = `state_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    console.log('Generated state code:', stateCode);
    
    // Codifica i parametri OAuth in base64 per passaggio sicuro
    const oauthParams = {
      app_id: appId,
      redirect_uri: redirectUri,
      state: state,
      state_code: stateCode,
      expires_at: Date.now() + 10 * 60 * 1000 // 10 minuti
    };
    
    const encodedParams = Buffer.from(JSON.stringify(oauthParams)).toString('base64');
    console.log('Encoded OAuth params:', encodedParams);

    // Redirect alla pagina di login OAuth
    const loginUrl = new URL('/auth/oauth/desktop', request.url);
    loginUrl.searchParams.set('params', encodedParams);

    return NextResponse.redirect(loginUrl.toString());

  } catch (error) {
    console.error('OAuth desktop error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
