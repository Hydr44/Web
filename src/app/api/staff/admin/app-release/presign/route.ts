import { NextRequest, NextResponse } from 'next/server';
import { getSignedUploadUrl } from '@/lib/r2-storage';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { corsHeaders } from '@/lib/cors';

const RELEASE_PREFIX = 'app-releases/stable';
const ALLOWED_EXT = /\.(exe|dmg|zip|appimage|deb|blockmap|yml)$/i;

/**
 * Restituisce un URL firmato per caricare l'installer direttamente su R2
 * dal browser dell'admin (bypassa il limite body delle serverless function).
 * Solo staff autenticato.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers: corsHeaders(origin) });
  }

  try {
    const { filename, contentType } = await request.json();
    if (!filename || typeof filename !== 'string' || !ALLOWED_EXT.test(filename)) {
      return NextResponse.json({ success: false, error: 'filename non valido' }, { status: 400, headers: corsHeaders(origin) });
    }
    // No path traversal: solo basename.
    const safeName = filename.replace(/[/\\]/g, '_');
    const key = `${RELEASE_PREFIX}/${safeName}`;

    const uploadUrl = await getSignedUploadUrl(
      key,
      typeof contentType === 'string' ? contentType : 'application/octet-stream',
      900
    );

    return NextResponse.json({ success: true, uploadUrl, key }, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error('app-release/presign error:', error);
    return NextResponse.json({ success: false, error: 'Errore generazione URL' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
