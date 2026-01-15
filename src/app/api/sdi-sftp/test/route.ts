/**
 * Route di test per verificare che le route SDI-SFTP funzionino
 * GET /api/sdi-sftp/test
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'SDI-SFTP route works!',
    timestamp: new Date().toISOString(),
    path: '/api/sdi-sftp/test'
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'SDI-SFTP POST route works!',
    timestamp: new Date().toISOString(),
    path: '/api/sdi-sftp/test'
  });
}

