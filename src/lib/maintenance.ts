import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Manutenzione programmata unificata (web dashboard + desktop + mobile).
 * Fonte primaria: tabella `maintenance_windows` (finestre multiple + storico).
 * Fallback (finché la tabella non esiste): chiave singola
 * `system_settings.maintenance`, poi tabella legacy `maintenance_mode`.
 *
 * Lo stato è CALCOLATO lato server dalla finestra rilevante, così tutti i
 * client leggono lo stesso esito da GET /api/maintenance/status.
 *
 *   state 'none'    → tutto normale
 *   state 'warning' → finestra imminente (entro warn_minutes): avviso, non blocca
 *   state 'active'  → dentro la finestra: BLOCCA
 */
export type MaintenanceState = 'none' | 'warning' | 'active';

export interface MaintenanceStatus {
  state: MaintenanceState;
  is_active: boolean; // == (state === 'active') — retro-compat desktop
  title: string | null;
  message: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  warn_minutes: number;
  started_at: string | null; // retro-compat overlay desktop
}

export function computeState(
  start: string | null | undefined,
  end: string | null | undefined,
  warnMinutes: number | undefined,
  nowMs: number,
): MaintenanceState {
  if (!start) return 'none';
  const s = Date.parse(start);
  if (Number.isNaN(s)) return 'none';
  const e = end ? Date.parse(end) : null;
  const warnMin = Number(warnMinutes) > 0 ? Number(warnMinutes) : 30;
  const warnMs = warnMin * 60000;
  if (e !== null && !Number.isNaN(e) && nowMs >= e) return 'none'; // finestra passata
  if (nowMs >= s) return 'active';
  if (nowMs >= s - warnMs) return 'warning';
  return 'none';
}

const NONE = (): MaintenanceStatus => ({
  state: 'none',
  is_active: false,
  title: null,
  message: null,
  scheduled_start: null,
  scheduled_end: null,
  warn_minutes: 30,
  started_at: null,
});

export async function readMaintenance(platform = 'web'): Promise<MaintenanceStatus> {
  const now = Date.now();

  // 1) Tabella maintenance_windows (fonte primaria).
  try {
    const { data, error } = await supabaseAdmin
      .from('maintenance_windows')
      .select('id, title, message, starts_at, ends_at, warn_minutes, target')
      .eq('status', 'scheduled')
      .gte('ends_at', new Date(now).toISOString())
      .order('starts_at', { ascending: true });

    if (!error) {
      type Win = {
        title?: string | null; message: string; starts_at: string; ends_at: string;
        warn_minutes?: number; target?: string;
      };
      let best: Win | null = null;
      let bestState: MaintenanceState = 'none';
      for (const w of (data || []) as Win[]) {
        if (w.target && w.target !== 'all' && w.target !== platform) continue;
        const st = computeState(w.starts_at, w.ends_at, w.warn_minutes, now);
        if (st === 'active') { best = w; bestState = 'active'; break; }
        if (st === 'warning' && bestState !== 'active') { best = w; bestState = 'warning'; }
      }
      if (best && bestState !== 'none') {
        return {
          state: bestState,
          is_active: bestState === 'active',
          title: best.title || null,
          message: best.message || null,
          scheduled_start: best.starts_at,
          scheduled_end: best.ends_at,
          warn_minutes: Number(best.warn_minutes) > 0 ? Number(best.warn_minutes) : 30,
          started_at: best.starts_at,
        };
      }
      return NONE(); // tabella ok, nessuna finestra rilevante
    }
  } catch {
    /* tabella assente → prova i fallback */
  }

  // 2) Fallback: chiave singola system_settings.maintenance (versione precedente).
  try {
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance')
      .maybeSingle();
    const m = (data?.value && typeof data.value === 'object'
      ? data.value
      : {}) as { enabled?: boolean; message?: string; scheduled_start?: string; scheduled_end?: string; warn_minutes?: number };
    if (m.enabled) {
      return { ...NONE(), state: 'active', is_active: true, message: m.message || null };
    }
    if (m.scheduled_start) {
      const st = computeState(m.scheduled_start, m.scheduled_end, m.warn_minutes, now);
      if (st !== 'none') {
        return {
          ...NONE(),
          state: st,
          is_active: st === 'active',
          message: m.message || null,
          scheduled_start: m.scheduled_start,
          scheduled_end: m.scheduled_end || null,
          warn_minutes: Number(m.warn_minutes) > 0 ? Number(m.warn_minutes) : 30,
          started_at: m.scheduled_start,
        };
      }
    }
  } catch {
    /* ignora */
  }

  // 3) Fallback legacy: tabella maintenance_mode.
  try {
    const { data: legacy } = await supabaseAdmin.from('maintenance_mode').select('*').maybeSingle();
    if (legacy?.is_active) {
      return { ...NONE(), state: 'active', is_active: true, message: legacy.message || null, started_at: legacy.started_at || null };
    }
  } catch {
    /* ignora */
  }

  return NONE();
}
