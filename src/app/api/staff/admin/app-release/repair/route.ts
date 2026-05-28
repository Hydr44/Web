import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2 } from '@/lib/r2-storage';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * Repair endpoint: corregge i record `app_release_*` esistenti che hanno
 * un version invalido (es. "arm64", "mac", "versione build, 2.4.1") e
 * rigenera tutti i manifest yml (latest.yml, latest-mac.yml, latest-linux.yml)
 * con merge multi-arch dei sibling.
 *
 * Uso: POST /api/staff/admin/app-release/repair  (staff auth richiesto)
 * Idempotente: si può rilanciare quante volte si vuole.
 */

const RELEASE_PREFIX = 'app-releases/stable';

type Platform = 'win' | 'mac' | 'linux';
type Arch = 'arm64' | 'x64';
type AssetType = 'exe' | 'blockmap' | 'dmg' | 'zip' | 'appimage' | 'deb';

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?(?:\+[a-zA-Z0-9.]+)?$/;
const SEMVER_IN_NAME_RE = /(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)/;

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

function archFromName(name: string): Arch {
  const n = name.toLowerCase();
  if (n.includes('arm64') || n.includes('aarch64')) return 'arm64';
  return 'x64';
}

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

function platformFromAssetType(at: AssetType, filename: string): Platform | null {
  if (at === 'exe') return 'win';
  if (at === 'dmg' || at === 'zip') return 'mac';
  if (at === 'appimage' || at === 'deb') return 'linux';
  if (at === 'blockmap') {
    const base = filename.toLowerCase().replace(/\.blockmap$/, '');
    if (base.endsWith('.exe')) return 'win';
    if (base.endsWith('.dmg') || base.endsWith('.zip')) return 'mac';
    if (base.endsWith('.appimage') || base.endsWith('.deb')) return 'linux';
  }
  return null;
}

function normalizeVersion(version: unknown, filename: string): string | null {
  const v = String(version || '').trim();
  if (SEMVER_RE.test(v)) return v;
  const m = String(filename).match(SEMVER_IN_NAME_RE);
  return m ? m[1] : null;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers: corsHeaders(origin) });
  }

  try {
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .like('key', 'app_release_%');

    type Entry = { key: string; version: string; filename: string; sha512?: string; size?: number; platform: Platform; arch: Arch; assetType: AssetType; releaseDate: string };
    const repaired: Entry[] = [];
    const skipped: { key: string; reason: string }[] = [];

    for (const row of data || []) {
      const key = String(row.key);
      const value = (row.value || {}) as { version?: string; filename?: string; sha512?: string; size?: number; releaseDate?: string };
      if (!value.filename) { skipped.push({ key, reason: 'no filename' }); continue; }

      const at = assetTypeFromName(value.filename);
      if (!at) { skipped.push({ key, reason: `unknown ext: ${value.filename}` }); continue; }
      const plat = platformFromAssetType(at, value.filename);
      if (!plat) { skipped.push({ key, reason: `unknown platform: ${value.filename}` }); continue; }
      const arch = archFromName(value.filename);
      const version = normalizeVersion(value.version, value.filename);
      if (!version) { skipped.push({ key, reason: `version not parseable: ${value.version} / ${value.filename}` }); continue; }

      const releaseDate = value.releaseDate || new Date().toISOString();
      const canonicalKey = `app_release_${plat}_${arch}_${at}`;
      const newValue = {
        version,
        filename: value.filename,
        size: value.size,
        sha512: value.sha512,
        releaseDate,
        assetType: at,
        arch,
        platform: plat,
      };

      // Upsert sulla key canonica
      await supabaseAdmin.from('system_settings').upsert(
        {
          key: canonicalKey,
          value: newValue,
          description: `Release desktop ${plat}/${arch}/${at}`,
          updated_at: releaseDate,
        },
        { onConflict: 'key' }
      );

      // Se la key era diversa da quella canonica (vecchio schema o errata),
      // cancellala per evitare di lasciare record fantasma.
      if (key !== canonicalKey) {
        await supabaseAdmin.from('system_settings').delete().eq('key', key);
      }

      repaired.push({ key: canonicalKey, ...newValue } as Entry);
    }

    // Rigenera i manifest yml per ogni piattaforma usando il primary asset
    // (zip/exe/appimage). Multi-arch: nello stesso yml elenca tutti gli arch
    // della stessa versione.
    const ymlsWritten: string[] = [];
    for (const plat of ['win', 'mac', 'linux'] as Platform[]) {
      const primary = PRIMARY_ASSET[plat];
      const primaryEntries = repaired.filter(e => e.platform === plat && e.assetType === primary && e.sha512 && e.size);
      if (primaryEntries.length === 0) continue;

      // Prendi la versione più alta (in caso di mix versioni, raro)
      const versions = [...new Set(primaryEntries.map(e => e.version))].sort().reverse();
      const targetVersion = versions[0];
      const sameVersion = primaryEntries.filter(e => e.version === targetVersion);
      if (sameVersion.length === 0) continue;

      // Ordina: arm64 prima di x64 (convenzione)
      sameVersion.sort((a, b) => (a.arch === 'arm64' ? -1 : 1) - (b.arch === 'arm64' ? -1 : 1));

      const releaseDate = sameVersion[0].releaseDate;
      const filesYaml = sameVersion.map(e =>
        `  - url: ${e.filename}\n    sha512: ${e.sha512}\n    size: ${e.size}\n`
      ).join('');

      const yml =
        `version: ${targetVersion}\n` +
        `files:\n` +
        filesYaml +
        `path: ${sameVersion[0].filename}\n` +
        `sha512: ${sameVersion[0].sha512}\n` +
        `releaseDate: '${releaseDate}'\n`;

      await uploadToR2(`${RELEASE_PREFIX}/${YML_BY_PLATFORM[plat]}`, yml, 'text/yaml', {
        'release-version': targetVersion,
        'release-platform': plat,
      });
      ymlsWritten.push(YML_BY_PLATFORM[plat]);
    }

    return NextResponse.json({
      success: true,
      repaired: repaired.length,
      skipped,
      ymlsWritten,
      summary: repaired.map(e => ({ key: e.key, version: e.version, file: e.filename })),
    }, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error('app-release/repair error:', error);
    return NextResponse.json({ success: false, error: 'Errore repair' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
