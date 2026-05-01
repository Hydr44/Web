// src/app/api/auth/oauth/desktop/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Endpoint per avvio OAuth desktop
 * GET /api/auth/oauth/desktop?app_id=desktop_app&redirect_uri=http://localhost:3001/auth/callback&state=random_state
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('app_id');
    const redirectUri = searchParams.get('redirect_uri');
    const state = searchParams.get('state');

    if (!appId || !redirectUri || !state) {
      return NextResponse.json(
        { error: 'Missing required parameters: app_id, redirect_uri, state' },
        { status: 400 }
      );
    }

    if (appId !== 'desktop_app') {
      return NextResponse.json(
        { error: 'Invalid app_id' },
        { status: 400 }
      );
    }

    if (!redirectUri.startsWith('desktop://') && !redirectUri.startsWith('http://localhost:') && !redirectUri.startsWith('http://127.0.0.1:')) {
      return NextResponse.json(
        { error: 'Invalid redirect_uri. Must start with desktop://, http://localhost: or http://127.0.0.1:' },
        { status: 400 }
      );
    }

    const stateCode = `state_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const oauthParams = {
      app_id: appId,
      redirect_uri: redirectUri,
      state,
      state_code: stateCode,
      expires_at: Date.now() + 10 * 60 * 1000,
    };

    const encodedParams = Buffer.from(JSON.stringify(oauthParams)).toString('base64');

    const origin = request.nextUrl.origin;
    const loginUrl = new URL('/auth/oauth/desktop', origin);
    loginUrl.searchParams.set('params', encodedParams);

    const finalUrl = loginUrl.toString();

    if (finalUrl.length > 2000) {
      return NextResponse.json({
        error: 'URL too long',
        redirect_url: finalUrl
      }, { status: 400 });
    }

    const escapedUrl = finalUrl
      .replaceAll('\\', '\\\\')
      .replaceAll("'", "\\'")
      .replaceAll('"', '&quot;')
      .replaceAll('\n', '\\n')
      .replaceAll('\r', '\\r');

    const htmlRedirect = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=${escapedUrl}">
  <title>Reindirizzamento OAuth...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #141c27;
      color: #e2e8f0;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: #1a2536;
      border-radius: 16px;
      border: 1px solid #243044;
      max-width: 400px;
      width: 100%;
    }
    .spinner {
      border: 3px solid #243044;
      border-radius: 50%;
      border-top: 3px solid #3b82f6;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    a {
      color: white;
      text-decoration: underline;
    }
  </style>
  <script>
    (function() {
      try {
        window.location.href = ${JSON.stringify(finalUrl)};
      } catch (e) {}
      setTimeout(function() {
        try {
          window.location.replace(${JSON.stringify(finalUrl)});
        } catch (e) {}
      }, 50);
      setTimeout(function() {
        if (window.location.href.indexOf('/auth/oauth/desktop') !== -1) {
          document.body.innerHTML = '<div class="container"><h2>Reindirizzamento manuale necessario</h2><p><a href="' + ${JSON.stringify(finalUrl)} + '">Clicca qui per continuare</a></p></div>';
        }
      }, 200);
    })();
  </script>
</head>
<body>
  <div class="container">
    <h2>Reindirizzamento in corso...</h2>
    <div class="spinner"></div>
    <p>Se non vieni reindirizzato automaticamente, <a href="${escapedUrl}">clicca qui</a>.</p>
  </div>
</body>
</html>`;

    return new NextResponse(htmlRedirect, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('[OAuth Desktop] Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
