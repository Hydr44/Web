// src/app/api/auth/oauth/desktop/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * Endpoint per avvio OAuth desktop
 * GET /api/auth/oauth/desktop?app_id=desktop_app&redirect_uri=desktop://auth/callback&state=random_state
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
    if (!redirectUri.startsWith('desktop://')) {
      return NextResponse.json(
        { error: 'Invalid redirect_uri. Must start with desktop://' },
        { status: 400 }
      );
    }

    // Salva state temporaneamente per verifica
    console.log('Connecting to Supabase...');
    const supabase = await supabaseServer();
    console.log('Supabase connected');
    
    // Test connessione Supabase
    try {
      const { data: testData, error: testError } = await supabase
        .from('oauth_codes')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        return NextResponse.json(
          { error: 'Database connection failed', details: testError.message },
          { status: 500 }
        );
      }
      console.log('Supabase connection test passed');
    } catch (testErr) {
      console.error('Supabase connection test error:', testErr);
      return NextResponse.json(
        { error: 'Database connection test failed', details: testErr.message },
        { status: 500 }
      );
    }
    
    // Crea una sessione temporanea per lo state
    const stateCode = `state_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    console.log('Creating state with code:', stateCode);
    
    const { data: stateData, error: stateError } = await supabase
      .from('oauth_codes')
      .insert({
        code: stateCode,
        user_id: null, // Sarà popolato dopo il login
        app_id: appId,
        redirect_uri: redirectUri,
        state: state,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minuti
        used: false
      })
      .select()
      .single();

    if (stateError) {
      console.error('Error saving state:', stateError);
      console.error('State error details:', JSON.stringify(stateError, null, 2));
      return NextResponse.json(
        { error: 'Failed to initialize OAuth flow', details: stateError.message },
        { status: 500 }
      );
    }

    console.log('State saved successfully:', stateData.id);

    // Redirect alla pagina di login OAuth
    const loginUrl = new URL('/auth/oauth/desktop', request.url);
    loginUrl.searchParams.set('app_id', appId);
    loginUrl.searchParams.set('redirect_uri', redirectUri);
    loginUrl.searchParams.set('state', state);
    loginUrl.searchParams.set('state_id', stateData.id);

    return NextResponse.redirect(loginUrl.toString());

  } catch (error) {
    console.error('OAuth desktop error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
