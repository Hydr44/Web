import { NextRequest, NextResponse } from 'next/server';
import { getSignedUploadUrl, getSignedDownloadUrl } from '@/lib/r2-storage';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * Presign R2 per la desktop app, AUTENTICATO e SCOPED ALL'ORG dell'utente.
 *
 * La desktop app non deve avere credenziali R2: chiede qui un URL firmato.
 * La chiave è SEMPRE costruita server-side con l'orgId reale dell'utente →
 * un utente non può scrivere/leggere fuori dalla sua org né su prefissi
 * arbitrari (whitelist categorie).
 *
 * Body: { mode: 'put'|'get', category, filename, contentType? }
 *   category ∈ media | backups | exports | invoices
 */
const PREFIX: Record<string, string> = {
  media: 'media',           // foto/allegati operativi
  backups: 'backups/desktop',
  exports: 'exports/desktop',
  invoices: 'invoices/archive',
};

async function resolveOrg(userId: string): Promise<string | null> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('current_org')
    .eq('id', userId)
    .maybeSingle();
  if (profile?.current_org) return profile.current_org as string;
  const { data: mem } = await supabaseAdmin
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  return mem?.org_id || null;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers: corsHeaders(origin) });
    }
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ success: false, error: 'Sessione non valida' }, { status: 401, headers: corsHeaders(origin) });
    }
    const orgId = await resolveOrg(userData.user.id);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Org non trovata' }, { status: 403, headers: corsHeaders(origin) });
    }

    const { mode, category, filename, contentType } = await request.json();
    const prefix = PREFIX[category];
    if (!prefix) {
      return NextResponse.json({ success: false, error: 'category non valida' }, { status: 400, headers: corsHeaders(origin) });
    }
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ success: false, error: 'filename mancante' }, { status: 400, headers: corsHeaders(origin) });
    }
    // No path traversal: solo basename, niente "/" o "..".
    const safeName = filename.replace(/[/\\]/g, '_').replace(/\.\.+/g, '.');
    const key = `${prefix}/${orgId}/${safeName}`;

    if (mode === 'get') {
      const url = await getSignedDownloadUrl(key, 900);
      return NextResponse.json({ success: true, url, key }, { headers: corsHeaders(origin) });
    }
    const url = await getSignedUploadUrl(
      key,
      typeof contentType === 'string' ? contentType : 'application/octet-stream',
      900
    );
    return NextResponse.json({ success: true, url, key }, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error('desktop/r2/presign error:', error);
    return NextResponse.json({ success: false, error: 'Errore presign' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
