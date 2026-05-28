import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2-storage';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

const RELEASE_PREFIX = 'app-releases/stable';

type Platform = 'win' | 'mac' | 'linux';
type Arch = 'arm64' | 'x64';
type AssetType = 'exe' | 'blockmap' | 'dmg' | 'zip' | 'appimage' | 'deb';

// electron-updater cerca un manifest diverso per piattaforma. Aggiorniamo lo
// yml SOLO quando si carica l'asset "principale" per quella piattaforma
// (exe per win, zip per mac, appimage per linux). Gli altri asset (dmg per il
// download manuale, blockmap per i delta-update) coesistono senza toccare il
// manifest. Su Mac il manifest può contenere più file (arm64 + x64): lo
// merge intelligente preserva la coppia, permettendo a electron-updater di
// scegliere l'asset corretto per l'host.
const YML_BY_PLATFORM: Record<Platform, string> = {
  win: 'latest.yml',
  mac: 'latest-mac.yml',
  linux: 'latest-linux.yml',
};
const PRIMARY_ASSET: Record<Platform, AssetType> = {
  win: 'exe',
  mac: 'zip',
  linux: 'appimage',
};

function assetTypeFromName(name: string): AssetType | null {
  const n = name.toLowerCase();
  if (n.endsWith('.exe')) return 'exe';
  if (n.endsWith('.blockmap')) return 'blockmap';
  if (n.endsWith('.dmg')) return 'dmg';
  if (n.endsWith('.zip')) return 'zip';
  if (n.endsWith('.appimage')) return 'appimage';
  if (n.endsWith('.deb')) return 'deb';
  return null;
}

function archFromName(name: string, platform: Platform): Arch {
  const n = name.toLowerCase();
  // Convention electron-builder: file con "arm64" nel nome → arm64; "ia32" → x86; tutto il resto → x64.
  if (n.includes('arm64') || n.includes('aarch64')) return 'arm64';
  // Win di solito non specifica l'arch nel filename (es. "Setup 2.4.1.exe"), defaulta x64.
  // Linux idem. Mac Intel = file senza "arm64" → x64.
  return 'x64';
}

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
    if (platform !== 'win' && platform !== 'mac' && platform !== 'linux') {
      return NextResponse.json({ success: false, error: 'platform non valida (win|mac|linux)' }, { status: 400, headers: corsHeaders(origin) });
    }
    const assetType = assetTypeFromName(String(filename));
    if (!assetType) {
      return NextResponse.json({ success: false, error: 'Estensione non riconosciuta' }, { status: 400, headers: corsHeaders(origin) });
    }
    const arch = archFromName(String(filename), platform as Platform);

    const safeName = String(filename).replace(/[/\\]/g, '_');
    const releaseDate = new Date().toISOString();
    const isPrimary = PRIMARY_ASSET[platform as Platform] === assetType;

    // Manifest electron-updater: solo per l'asset principale della piattaforma.
    // Per Mac il manifest unisce arm64 + x64 nella stessa lista 'files', così
    // electron-updater sceglie l'asset corretto. Il primo asset caricato per
    // una piattaforma "vince" come 'path' default (per client legacy che non
    // guardano l'array files).
    if (isPrimary) {
      const ymlName = YML_BY_PLATFORM[platform as Platform];
      const ymlKey = `${RELEASE_PREFIX}/${ymlName}`;

      // Leggi metadati esistenti dello stesso primary per le altre arch della
      // stessa piattaforma+versione per fare il merge in latest-mac.yml.
      const { data: siblings } = await supabaseAdmin
        .from('system_settings')
        .select('key, value')
        .like('key', `app_release_${platform}_%_${assetType}`);

      type Entry = { url: string; sha512: string; size: number };
      const files: Entry[] = [];
      // Includi le sibling (altre arch) della stessa versione
      for (const row of siblings || []) {
        const v = (row.value || {}) as { version?: string; filename?: string; sha512?: string; size?: number };
        if (v.version === version && v.filename && v.sha512 && v.size && v.filename !== safeName) {
          files.push({ url: v.filename, sha512: v.sha512, size: Number(v.size) });
        }
      }
      // Aggiungi/aggiorna l'asset corrente
      files.unshift({ url: safeName, sha512, size: Number(size) });

      const filesYaml = files.map(f =>
        `  - url: ${f.url}\n    sha512: ${f.sha512}\n    size: ${f.size}\n`
      ).join('');

      const yml =
        `version: ${version}\n` +
        `files:\n` +
        filesYaml +
        `path: ${safeName}\n` +
        `sha512: ${sha512}\n` +
        `releaseDate: '${releaseDate}'\n`;

      await uploadToR2(ymlKey, yml, 'text/yaml', {
        'release-version': String(version),
        'release-platform': String(platform),
      });
    }

    // Slot per sotto-asset arch-aware: niente sovrascritture tra dmg/zip/arch.
    // Schema chiave: app_release_<plat>_<arch>_<asset> (es. app_release_mac_arm64_dmg).
    await supabaseAdmin.from('system_settings').upsert(
      {
        key: `app_release_${platform}_${arch}_${assetType}`,
        value: { version, filename: safeName, size, sha512, releaseDate, assetType, arch, platform },
        description: `Release desktop ${platform}/${arch}/${assetType}`,
        updated_at: releaseDate,
      },
      { onConflict: 'key' }
    );

    return NextResponse.json(
      { success: true, version, platform, arch, assetType, manifestUpdated: isPrimary },
      { headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error('app-release/finalize error:', error);
    return NextResponse.json({ success: false, error: 'Errore finalizzazione release' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
