/**
 * API Route per invio fatture via SFTP SDI
 * POST /api/sdi-sftp/send
 * 
 * Questa route fa proxy al server Node.js sulla VPS
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleCors, corsHeaders } from '@/lib/cors';

const SDI_SFTP_SERVER_URL = process.env.SDI_SFTP_SERVER_URL || 'https://sdi-sftp.rescuemanager.eu';

export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}

/**
 * POST /api/sdi-sftp/send
 * Proxy al server VPS
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await request.json();

    // Inoltra richiesta al server VPS
    const response = await fetch(`${SDI_SFTP_SERVER_URL}/api/sdi-sftp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Errore server SDI-SFTP', details: data.details },
        { status: response.status, headers }
      );
    }

    return NextResponse.json(data, { status: 200, headers });

  } catch (error: any) {
    console.error('[SDI-SFTP-API] Errore:', error);
    return NextResponse.json(
      { error: 'Errore comunicazione server SDI-SFTP', details: error.message },
      { status: 500, headers }
    );
  }
}
