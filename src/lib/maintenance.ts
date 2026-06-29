import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Manutenzione programmata unificata (web dashboard + desktop + mobile).
 * Fonte unica: system_settings.maintenance (jsonb). Lo stato è CALCOLATO lato
 * server dalla finestra temporale, così tutti i client leggono lo stesso esito
 * da GET /api/maintenance/status.
 *
 *   state 'none'    → tutto normale
 *   state 'warning' → finestra imminente: mostra countdown/avviso (non blocca)
 *   state 'active'  → dentro la finestra (o enabled manuale): BLOCCA
 */
export type MaintenanceState = 'none' | 'warning' | 'active';

export interface MaintenanceConfig {
  enabled?: boolean;            // ON manuale immediato (ignora schedule)
  message?: string;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  warn_minutes?: number;       // quanti minuti prima mostrare l'avviso (default 30)
}

export interface MaintenanceStatus {
  state: MaintenanceState;
  is_active: boolean;          // == (state === 'active') — retro-compat desktop
  message: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  warn_minutes: number;
  started_at: string | null;   // retro-compat overlay desktop
}

export function computeState(m: MaintenanceConfig, nowMs: number): MaintenanceState {
  if (m?.enabled === true) return 'active';
  if (m?.scheduled_start) {
    const start = Date.parse(m.scheduled_start);
    if (!Number.isNaN(start)) {
      const end = m.scheduled_end ? Date.parse(m.scheduled_end) : null;
      const warnMin = Number(m.warn_minutes) > 0 ? Number(m.warn_minutes) : 30;
      const warnMs = warnMin * 60000;
      if (end !== null && !Number.isNaN(end) && nowMs >= end) return 'none'; // finestra passata
      if (nowMs >= start) return 'active';
      if (nowMs >= start - warnMs) return 'warning';
    }
  }
  return 'none';
}

export async function readMaintenance(): Promise<MaintenanceStatus> {
  let m: MaintenanceConfig = {};
  try {
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance')
      .maybeSingle();
    if (data?.value && typeof data.value === 'object') m = data.value as MaintenanceConfig;
  } catch {
    /* nessuna config → none */
  }

  // Retro-compatibilità: se la chiave unificata non è impostata, leggi la
  // vecchia tabella maintenance_mode (manutenzione manuale legacy).
  if (!m.enabled && !m.scheduled_start) {
    try {
      const { data: legacy } = await supabaseAdmin.from('maintenance_mode').select('*').maybeSingle();
      if (legacy?.is_active) m = { enabled: true, message: legacy.message || undefined };
    } catch {
      /* ignora */
    }
  }

  const state = computeState(m, Date.now());
  return {
    state,
    is_active: state === 'active',
    message: m.message || null,
    scheduled_start: m.scheduled_start || null,
    scheduled_end: m.scheduled_end || null,
    warn_minutes: Number(m.warn_minutes) > 0 ? Number(m.warn_minutes) : 30,
    started_at: m.scheduled_start || null,
  };
}
