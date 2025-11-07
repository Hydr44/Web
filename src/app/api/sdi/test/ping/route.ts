// Endpoint di test per verificare che l'API sia raggiungibile
// GET /api/sdi/test/ping

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('[SDI TEST] ⚠️ PING chiamato - endpoint raggiungibile');

  const timestamp = new Date().toISOString();
  const url = request.url;
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return NextResponse.json({
    success: true,
    message: 'SDI API raggiungibile',
    timestamp,
    url,
    headers,
    environment: {
      node_env: process.env.NODE_ENV,
      vercel_url: process.env.VERCEL_URL,
      vercel_env: process.env.VERCEL_ENV,
    },
  });
}

export async function POST(request: NextRequest) {
  console.log('[SDI TEST] ⚠️ PING POST chiamato');

  const body = await request.text().catch(() => '');
  const timestamp = new Date().toISOString();
  const url = request.url;
  const contentType = request.headers.get('content-type') || '';
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  console.log('[SDI TEST] PING POST - Content-Type:', contentType);
  console.log('[SDI TEST] PING POST - Body length:', body.length);
  console.log('[SDI TEST] PING POST - Body (primi 500):', body.substring(0, 500));

  return NextResponse.json({
    success: true,
    message: 'SDI API POST ricevuto',
    timestamp,
    url,
    contentType,
    bodyLength: body.length,
    bodyPreview: body.substring(0, 500),
    headers,
  });
}

