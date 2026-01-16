import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Endpoint di debug per testare il redirect
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== OAUTH DEBUG ENDPOINT ===');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    const testUrl = new URL('/auth/oauth/desktop/test', request.nextUrl.origin);
    console.log('Redirecting to:', testUrl.toString());
    
    return NextResponse.redirect(testUrl.toString(), 302);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
