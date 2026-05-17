import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2-storage';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

const RELEASE_PREFIX = 'app-releases/stable';

// electron-updater cerca file diversi per piattaforma.
const YML_BY_PLATFORM: Record<string, string> = {
  win: 'latest.yml',
  mac: 'latest-mac.yml',
  linux: 'latest-linux.yml',
};

/**
 * Dopo che l'admin ha caricato l'installer su R2 (via presign), genera il
 * manifest electron-updater (latest*.yml) e lo scrive su R2. Da questo
 * momento i client desktop vedranno l'aggiornamento.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers: corsHeaders(origin) });
  }

  try {
    const { version, platform, filename, sha512, size } = await request.json();

    if (!version || !platform || !filename || !sha512 || !size) {
      return NextResponse.json({ success: false, error: 'Campi mancanti' }, { status: 400, headers: corsHeaders(origin) });
    }
    const ymlName = YML_BY_PLATFORM[platform];
    if (!ymlName) {
      return NextResponse.json({ success: false, error: 'platform non valida (win|mac|linux)' }, { status: 400, headers: corsHeaders(origin) });
    }

    const safeName = String(filename).replace(/[/\\]/g, '_');
    const releaseDate = new Date().toISOString();

    // Manifest in formato electron-updater (YAML minimale, valori semplici).
    const yml =
      `version: ${version}\n` +
      `files:\n` +
      `  - url: ${safeName}\n` +
      `    sha512: ${sha512}\n` +
      `    size: ${size}\n` +
      `path: ${safeName}\n` +
      `sha512: ${sha512}\n` +
      `releaseDate: '${releaseDate}'\n`;

    await uploadToR2(`${RELEASE_PREFIX}/${ymlName}`, yml, 'text/yaml', {
      'release-version': String(version),
      'release-platform': String(platform),
    });

    // Traccia l'ultima release nei system_settings (visibile lato admin).
    await supabaseAdmin.from('system_settings').upsert(
      {
        key: `app_release_${platform}`,
        value: { version, filename: safeName, size, releaseDate },
        description: `Ultima release desktop ${platform}`,
        updated_at: releaseDate,
      },
      { onConflict: 'key' }
    );

    return NextResponse.json({ success: true, version, platform, manifest: ymlName }, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error('app-release/finalize error:', error);
    return NextResponse.json({ success: false, error: 'Errore finalizzazione release' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
