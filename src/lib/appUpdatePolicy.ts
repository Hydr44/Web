/**
 * appUpdatePolicy — fonte UNICA della policy di aggiornamento desktop.
 *
 * Separa due concetti che prima erano confusi tra `app_versions` (fantasma) e
 * `system_settings`:
 *   1. DISTRIBUZIONE binari → R2 + manifest electron-updater + system_settings
 *      `app_release_<plat>_<arch>_<asset>` (già gestita da ReleaseUploadModal).
 *   2. POLICY di aggiornamento → questo modulo, un singolo oggetto JSON in
 *      system_settings.key = 'app_update_policy'.
 *
 * Il desktop interroga GET /api/version/check?current=X.Y.Z e riceve la policy
 * valutata (force/soft/grace). L'admin la modifica dalla pagina "Aggiornamenti".
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type UpdateMode = 'optional' | 'forced' | 'grace';

export interface AppUpdatePolicy {
  /** Versione "obiettivo" (l'ultima da installare). Auto dall'ultima pubblicazione. */
  target_version: string;
  /** Soglia dura: i client SOTTO questa versione sono bloccati SEMPRE ("ritiro"). */
  min_supported: string;
  /** optional = banner soft · forced = blocco subito · grace = soft fino a grace_until poi blocco. */
  mode: UpdateMode;
  /** ISO datetime: quando l'update diventa obbligatorio (solo mode='grace'). */
  grace_until: string | null;
  /** Messaggio mostrato nell'overlay/banner (motivo del ritiro/aggiornamento). */
  message: string | null;
}

export const POLICY_KEY = 'app_update_policy';

export const DEFAULT_POLICY: AppUpdatePolicy = {
  target_version: '',
  min_supported: '0.0.0',
  mode: 'optional',
  grace_until: null,
  message: null,
};

/** Confronto semver semplice (major.minor.patch). -1 se a<b, 0 se =, 1 se a>b. */
export function compareVersions(a: string, b: string): number {
  const pa = String(a || '0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

/** Versione più alta tra quelle pubblicate (da system_settings app_release_*). */
export async function latestPublishedVersion(supabaseAdmin: SupabaseClient): Promise<string> {
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('key, value')
    .like('key', 'app_release_%');
  const versions = (data || [])
    .map((r: any) => (r.value && typeof r.value === 'object' ? r.value.version : null))
    .filter((v: any): v is string => typeof v === 'string' && v.length > 0);
  if (!versions.length) return '';
  return versions.sort(compareVersions)[versions.length - 1];
}

/**
 * Legge la policy. Preferisce l'oggetto canonico `app_update_policy`; se assente
 * ricostruisce dai vecchi flag (min_app_version/force_update) per retrocompat.
 * target_version, se non impostato, è dedotto dall'ultima release pubblicata.
 */
export async function readPolicy(supabaseAdmin: SupabaseClient): Promise<AppUpdatePolicy> {
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('key, value')
    .in('key', [POLICY_KEY, 'min_app_version', 'force_update']);

  const rows: Record<string, any> = {};
  (data || []).forEach((r: any) => { rows[r.key] = r.value; });

  let policy: Partial<AppUpdatePolicy> = {};
  if (rows[POLICY_KEY] && typeof rows[POLICY_KEY] === 'object') {
    policy = rows[POLICY_KEY] as Partial<AppUpdatePolicy>;
  } else {
    // Retrocompat: vecchia card Impostazioni → Versione App.
    const legacyForce = rows.force_update === true || rows.force_update === 'true';
    policy = {
      min_supported: typeof rows.min_app_version === 'string' ? rows.min_app_version : '0.0.0',
      mode: legacyForce ? 'forced' : 'optional',
    };
  }

  const merged: AppUpdatePolicy = { ...DEFAULT_POLICY, ...policy };
  if (!merged.target_version) {
    merged.target_version = (await latestPublishedVersion(supabaseAdmin)) || merged.min_supported || '0.0.0';
  }
  if (!merged.min_supported) merged.min_supported = '0.0.0';
  return merged;
}

export interface EvaluatedUpdate {
  update_required: boolean;
  force_update: boolean;
  current_version: string;
  latest_version: string;
  min_required: string;
  /** ISO datetime se siamo in finestra grace (per countdown nel banner). */
  mandatory_after: string | null;
  mode: UpdateMode;
  notes: string | null;
}

/** Valuta la policy per un client a versione `currentVersion`. */
export function evaluatePolicy(
  policy: AppUpdatePolicy,
  currentVersion: string,
  now: number = Date.now(),
): EvaluatedUpdate {
  const belowTarget = compareVersions(currentVersion, policy.target_version) < 0;
  const belowFloor = compareVersions(currentVersion, policy.min_supported) < 0;
  const graceMs = policy.grace_until ? Date.parse(policy.grace_until) : NaN;
  const hasGrace = policy.mode === 'grace' && Number.isFinite(graceMs);
  const graceExpired = hasGrace && now >= graceMs;

  // Blocco obbligatorio: sotto la soglia dura SEMPRE, oppure sotto target con
  // policy forced, oppure grace scaduto.
  const force = belowFloor || (belowTarget && (policy.mode === 'forced' || graceExpired));

  return {
    update_required: belowTarget || belowFloor,
    force_update: force,
    current_version: currentVersion,
    latest_version: policy.target_version,
    min_required: policy.min_supported,
    mandatory_after: hasGrace && belowTarget && !graceExpired ? new Date(graceMs).toISOString() : null,
    mode: policy.mode,
    notes: policy.message || null,
  };
}

// ── Completezza release (per la pagina admin "Aggiornamenti") ────────────────

export type AssetType = 'exe' | 'zip' | 'dmg' | 'appimage' | 'deb';

export interface ReleaseSlot {
  platform: 'win' | 'mac' | 'linux';
  arch: string;
  asset: AssetType;
  required: boolean;
  /** Cosa abilita questo file (per spiegarlo all'admin). */
  purpose: string;
}

/** Slot attesi per una release completa (auto-update + download manuale). */
export const EXPECTED_SLOTS: ReleaseSlot[] = [
  { platform: 'win', arch: 'x64', asset: 'exe', required: true, purpose: 'Installer Windows + auto-update' },
  { platform: 'mac', arch: 'arm64', asset: 'zip', required: true, purpose: 'Auto-update Apple Silicon' },
  { platform: 'mac', arch: 'arm64', asset: 'dmg', required: false, purpose: 'Download manuale Apple Silicon' },
  { platform: 'mac', arch: 'x64', asset: 'zip', required: true, purpose: 'Auto-update Intel' },
  { platform: 'mac', arch: 'x64', asset: 'dmg', required: false, purpose: 'Download manuale Intel' },
];

export interface ReleaseAssetStatus extends ReleaseSlot {
  present: boolean;
  version: string | null;
  size: number | null;
  /** Nome file su R2 (per costruire il link di download /api/app-update/<filename>). */
  filename: string | null;
  releaseDate: string | null;
  /** true se presente ma a una versione diversa dal target. */
  versionMismatch: boolean;
}

export interface ReleaseStatus {
  target_version: string;
  assets: ReleaseAssetStatus[];
  complete: boolean; // tutti gli slot required presenti e alla versione target
}

/**
 * Stato di completezza della release CORRENTE: incrocia gli slot attesi con i
 * record system_settings `app_release_<plat>_<arch>_<asset>` (ognuno è l'ultimo
 * pubblicato per quello slot).
 */
export async function currentReleaseStatus(
  supabaseAdmin: SupabaseClient,
  targetVersion: string,
): Promise<ReleaseStatus> {
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('key, value')
    .like('key', 'app_release_%');

  const slots: Record<string, any> = {};
  (data || []).forEach((r: any) => { slots[r.key] = r.value; });

  const assets: ReleaseAssetStatus[] = EXPECTED_SLOTS.map((s) => {
    const rec = slots[`app_release_${s.platform}_${s.arch}_${s.asset}`];
    const version = rec?.version || null;
    return {
      ...s,
      present: !!rec,
      version,
      size: rec?.size ?? null,
      filename: rec?.filename || null,
      releaseDate: rec?.releaseDate || null,
      versionMismatch: !!version && !!targetVersion && version !== targetVersion,
    };
  });

  const complete = assets.every((a) => !a.required || (a.present && !a.versionMismatch));
  return { target_version: targetVersion, assets, complete };
}
