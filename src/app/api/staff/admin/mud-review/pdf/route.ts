import { NextRequest, NextResponse } from 'next/server';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { corsHeaders } from '@/lib/cors';

/**
 * Proxy staff-only al gateway RENTRI: rigenera server-side l'HTML del MUD
 * (stesso template usato dal cliente) così lo staff verifica esattamente il
 * documento. Ritorna text/html da mostrare in un iframe nell'admin.
 */
const GATEWAY = (process.env.RENTRI_API_URL || 'https://rentri-test.rescuemanager.eu/api/rentri').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers: corsHeaders(origin) });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'id richiesto' }, { status: 400, headers: corsHeaders(origin) });
  }

  try {
    const r = await fetch(`${GATEWAY}/mud/${encodeURIComponent(id)}?action=generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.success || !j?.html) {
      return NextResponse.json({ success: false, error: j?.error || 'Errore generazione PDF' }, { status: 502, headers: corsHeaders(origin) });
    }
    const html = Buffer.from(j.html, 'base64').toString('utf-8');
    return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders(origin) } });
  } catch (e) {
    console.error('mud-review pdf error:', e);
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
