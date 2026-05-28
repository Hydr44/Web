import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * Ultima release desktop per piattaforma + architettura (pubblico) — alimenta
 * /download e /dashboard/download. La UI sceglie automaticamente l'asset
 * adatto al client (arm64 vs x64) o lascia all'utente la scelta esplicita.
 *
 * Schema chiavi DB:
 *  - corrente:  app_release_<plat>_<arch>_<asset>  (es. app_release_mac_arm64_dmg)
 *  - legacy v2: app_release_<plat>_<asset>         (default arch=x64)
 *  - legacy v1: app_release_<plat>                 (default arch=x64, asset=primary)
 *
 * Per ogni (platform, arch) preferiamo l'asset destinato al download manuale
 * (exe / dmg / AppImage); fallback sull'asset usato da electron-updater
 * (zip per mac, deb per linux).
 */
type Rel = { version?: string; filename?: string; size?: number; releaseDate?: string; sha512?: string };
type Platform = 'win' | 'mac' | 'linux';
type Arch = 'arm64' | 'x64';

const PREFERENCE: Record<Platform, string[]> = {
  win: ['exe'],
  mac: ['dmg', 'zip'],
  linux: ['appimage', 'deb'],
};

const ARCHS: Record<Platform, Arch[]> = {
  win: ['x64'],
  mac: ['arm64', 'x64'],
  linux: ['x64'],
};

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('key, value')
      .like('key', 'app_release_%');

    // Indicizza per piattaforma → arch → asset.
    const byPA: Record<Platform, Record<Arch, Record<string, Rel>>> = {
      win: { arm64: {}, x64: {} },
      mac: { arm64: {}, x64: {} },
      linux: { arm64: {}, x64: {} },
    };
    const legacyArch: Record<Platform, Record<string, Rel>> = { win: {}, mac: {}, linux: {} };
    const legacyV1: Partial<Record<Platform, Rel>> = {};

    for (const row of data || []) {
      const key = String(row.key);
      const v = (row.value || {}) as Rel;
      if (!v.filename) continue;

      // Nuovo formato: app_release_<plat>_<arch>_<asset>
      const m3 = key.match(/^app_release_(win|mac|linux)_(arm64|x64)_([a-z]+)$/);
      if (m3) {
        byPA[m3[1] as Platform][m3[2] as Arch][m3[3]] = v;
        continue;
      }
      // Legacy v2: app_release_<plat>_<asset> (arch implicito x64)
      const m2 = key.match(/^app_release_(win|mac|linux)_([a-z]+)$/);
      if (m2 && m2[2] !== 'arm64' && m2[2] !== 'x64') {
        legacyArch[m2[1] as Platform][m2[2]] = v;
        continue;
      }
      // Legacy v1: app_release_<plat>
      const m1 = key.match(/^app_release_(win|mac|linux)$/);
      if (m1) {
        legacyV1[m1[1] as Platform] = v;
      }
    }

    // Per ogni (platform, arch) scegli il miglior asset secondo PREFERENCE.
    const out: Record<Platform, Partial<Record<Arch, Rel & { url: string }>>> = { win: {}, mac: {}, linux: {} };

    for (const plat of ['win', 'mac', 'linux'] as Platform[]) {
      for (const arch of ARCHS[plat]) {
        let chosen: Rel | undefined;
        for (const asset of PREFERENCE[plat]) {
          if (byPA[plat][arch][asset]) { chosen = byPA[plat][arch][asset]; break; }
        }
        // Fallback legacy v2 (solo per x64, dove era implicito)
        if (!chosen && arch === 'x64') {
          for (const asset of PREFERENCE[plat]) {
            if (legacyArch[plat][asset]) { chosen = legacyArch[plat][asset]; break; }
          }
        }
        // Fallback legacy v1
        if (!chosen && arch === 'x64' && legacyV1[plat]) {
          chosen = legacyV1[plat];
        }
        if (chosen?.filename) {
          out[plat][arch] = { ...chosen, url: `/api/app-update/${encodeURIComponent(chosen.filename)}` };
        }
      }
    }

    // Backward-compat: anche il vecchio formato { win, mac, linux } come singolo,
    // così i client esistenti (Shell.jsx, vecchie versioni download page) non si rompono.
    const flat: Record<Platform, (Rel & { url: string }) | null> = { win: null, mac: null, linux: null };
    for (const plat of ['win', 'mac', 'linux'] as Platform[]) {
      // Preferenza per il "default" flat: arm64 su mac (la maggioranza moderna), x64 su win/linux
      flat[plat] = out[plat].arm64 || out[plat].x64 || null;
    }

    return NextResponse.json({ success: true, releases: flat, releasesByArch: out }, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error('app-release/latest error:', error);
    return NextResponse.json({ success: false, error: 'Errore' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
