import { NextRequest, NextResponse } from 'next/server';
import { downloadFromR2, getSignedDownloadUrl } from '@/lib/r2-storage';

const RELEASE_PREFIX = 'app-releases/stable';

/**
 * Feed pubblico electron-updater (provider "generic").
 * Base URL: https://rescuemanager.eu/api/app-update/
 *
 *  - *.yml  → serviti in stream (file piccoli: manifest)
 *  - artifact (exe/dmg/zip/...) → 302 verso URL R2 firmato (no streaming di
 *    decine di MB attraverso la serverless function)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const rel = (path || []).join('/').replace(/\.\.+/g, '');
  if (!rel) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const key = `${RELEASE_PREFIX}/${rel}`;

  try {
    if (rel.endsWith('.yml')) {
      const buf = await downloadFromR2(key);
      return new NextResponse(new Uint8Array(buf), {
        status: 200,
        headers: {
          'Content-Type': 'text/yaml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }
    // Artifact: redirect a URL firmato R2 (15 min).
    const signed = await getSignedDownloadUrl(key, 900);
    return NextResponse.redirect(signed, 302);
  } catch (error) {
    console.error('app-update feed error:', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
