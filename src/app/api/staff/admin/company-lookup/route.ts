// src/app/api/staff/admin/company-lookup/route.ts
//
// Verifica P.IVA lato server tramite OpenAPI.it (Company IT) — usata dalla pagina
// Revisione dell'admin-panel per la verifica semi-automatica di un lead in_verifica.
//
//   GET ?piva=IT01234567890  → { configured, found, company?, message? }
//
// Richiede le credenziali OpenAPI.it nelle env Vercel (le stesse del desktop):
//   OPENAPI_API_KEY, OPENAPI_EMAIL (opzionale; senza email la key è usata come token).
// Se non configurate → risponde { configured:false } in modo graceful (la Revisione
// resta usabile con verifica manuale). Auth staff gestita dal middleware /api/staff/*.

import { NextRequest, NextResponse } from 'next/server';
import { getStaffFromRequest } from '@/lib/staff-auth';

export const runtime = 'nodejs';

const OPENAPI_OAUTH_URL = 'https://oauth.openapi.it';
const OPENAPI_BASE_URL = 'https://company.openapi.com';

async function getOAuthToken(apiKey: string, email: string | undefined): Promise<string | null> {
  // Senza email: la key potrebbe già essere un token valido.
  if (!email) return apiKey;
  try {
    const basicAuth = Buffer.from(`${email}:${apiKey}`).toString('base64');
    const res = await fetch(`${OPENAPI_OAUTH_URL}/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scopes: ['GET:company.openapi.com/IT-start', 'GET:company.openapi.com/IT-advanced'],
        ttl: 3600,
      }),
    });
    if (!res.ok) return apiKey; // fallback: usa la key direttamente
    const data = await res.json();
    return data?.token && data?.success ? data.token : apiKey;
  } catch {
    return apiKey;
  }
}

const STATUS_MAP: Record<string, string> = {
  ATTIVA: 'active', SOSPESA: 'suspended', CESSAZIONE: 'ceased', INATTIVA: 'inactive',
  ACTIVE: 'active', SUSPENDED: 'suspended', CEASED: 'ceased', INACTIVE: 'inactive',
};

export async function GET(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
  }

  const apiKey = process.env.OPENAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      success: true, configured: false,
      message: 'Verifica P.IVA automatica non configurata (OPENAPI_API_KEY mancante su Vercel).',
    });
  }

  const rawPiva = request.nextUrl.searchParams.get('piva') || '';
  const piva = rawPiva.trim().replace(/\s+/g, '').replace(/^IT/i, '');
  // Stretto: ESATTAMENTE 11 cifre. Blocca path-traversal/char speciali nell'URL OpenAPI.
  if (!/^[0-9]{11}$/.test(piva)) {
    return NextResponse.json({ success: false, configured: true, error: 'P.IVA non valida (esattamente 11 cifre).' }, { status: 400 });
  }

  try {
    const token = await getOAuthToken(apiKey, process.env.OPENAPI_EMAIL);
    if (!token) {
      return NextResponse.json({ success: false, configured: true, error: 'Token OpenAPI non ottenuto.' }, { status: 502 });
    }
    const res = await fetch(`${OPENAPI_BASE_URL}/IT-start/${piva}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (res.status === 404) {
      return NextResponse.json({ success: true, configured: true, found: false, message: 'P.IVA non trovata.' });
    }
    if (!res.ok) {
      return NextResponse.json({ success: false, configured: true, error: `OpenAPI HTTP ${res.status}` }, { status: 502 });
    }
    const body = await res.json();
    const d = body?.data?.[0];
    if (!body?.success || !d) {
      return NextResponse.json({ success: true, configured: true, found: false, message: body?.message || 'Nessun dato.' });
    }
    const details = d.companyDetails || {};
    const addr = d.address?.registeredOffice || d.address || {};
    const rawStatus = String(d.companyStatus?.activityStatus || d.activityStatus || 'ATTIVA').toUpperCase();
    const status = STATUS_MAP[rawStatus] || 'active';
    const company = {
      vat: d.vatCode || details.vatCode || piva,
      taxCode: d.taxCode || details.taxCode || details.codiceFiscale || null,
      denomination: d.companyName || details.companyName || details.denomination || null,
      legalForm: details.legalForm || d.legalForm || null,
      status,
      active: status === 'active',
      pec: d.pec || d.domicilioDigitale || null,
      sdiCode: d.sdiCode || d.codiceSDI || d.codiceDestinatario || null,
      ateco: d.atecoClassification?.ateco2025?.[0]?.code || d.atecoClassification?.ateco2022?.[0]?.code || d.ateco || null,
      street: addr.streetName || addr.street || addr.via || null,
      city: addr.town || addr.city || addr.citta || null,
      province: addr.province || addr.provincia || null,
      zip: addr.zipCode || addr.zip || addr.cap || null,
    };
    return NextResponse.json({ success: true, configured: true, found: true, company });
  } catch (e) {
    console.error('[company-lookup]', e);
    return NextResponse.json({ success: false, configured: true, error: 'Errore lookup' }, { status: 502 });
  }
}
