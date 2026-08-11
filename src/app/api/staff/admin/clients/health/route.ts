/**
 * GET /api/staff/admin/clients/health
 *
 * Health / churn score dei clienti (org reali). Per ogni org con is_demo=false
 * (esclusa anche l'org emitter interna) calcola un punteggio 0-100 + motivo,
 * aggregando segnali reali: recency (audit_log), trend attività (transports),
 * contratto (org_subscriptions), supporto (support_tickets), adozione moduli.
 *
 * Le tabelle usage_counters/user_sessions sono VUOTE e NON vengono usate.
 *
 * Best-effort: se una singola query fallisce quel segnale diventa neutro,
 * l'handler non lancia mai. Auth staff garantita dal middleware.
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders, handleCors } from '@/lib/cors';

// Org emitter interna (RescueManager stessa) — mai un "cliente".
const EMITTER_ORG_ID = '1ea3be12-a439-46ac-94d9-eaff1bb346c2';

type Tier = 'sano' | 'raffreddamento' | 'a rischio' | 'critico';

interface Signals {
  recency: number;
  trend: number;
  contract: number;
  support: number;
  modules: number;
}

interface HealthClient {
  org_id: string;
  name: string;
  score: number;
  tier: Tier;
  reason: string;
  signals: Signals;
}

interface OrgRow {
  id: string;
  name: string | null;
  desktop_modules: string[] | null;
}

interface SubRow {
  org_id: string;
  status: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  auto_renew: boolean | null;
  suspended_at: string | null;
  cancelled_at: string | null;
}

interface TicketRow {
  org_id: string | null;
  status: string | null;
  priority: string | null;
  staff_unread: boolean | null;
  created_at: string | null;
}

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));
const NEUTRAL = 60;

export async function OPTIONS(request: Request) {
  return handleCors(request) as NextResponse;
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const now = Date.now();
    const iso = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();
    const since30 = iso(30);
    const since60 = iso(60);
    const since90 = iso(90);
    const since120 = iso(120);

    // ---- 1. Org reali (no demo, no emitter) --------------------------------
    const { data: orgsData, error: orgsErr } = await supabaseAdmin
      .from('orgs')
      .select('id, name, desktop_modules')
      .eq('is_demo', false)
      .neq('id', EMITTER_ORG_ID);

    if (orgsErr || !orgsData) {
      return NextResponse.json(
        { success: false, error: 'Impossibile leggere le organizzazioni' },
        { status: 500, headers }
      );
    }

    const orgs = orgsData as OrgRow[];
    const orgIds = orgs.map((o) => o.id);
    if (orgIds.length === 0) {
      return NextResponse.json(
        { success: true, clients: [], generatedAt: new Date().toISOString() },
        { status: 200, headers }
      );
    }

    // ---- 2. Recency: audit_log ultimi 60g (best-effort) --------------------
    // Serve solo il record più recente per org + count ultimi 30g; oltre 60g
    // la recency è comunque 0, quindi la finestra a 60g è sufficiente.
    const lastAuditByOrg = new Map<string, number>(); // org_id -> max ts (ms)
    const audit30ByOrg = new Map<string, number>();
    try {
      const { data: audit } = await supabaseAdmin
        .from('audit_log')
        .select('org_id, created_at')
        .in('org_id', orgIds)
        .gte('created_at', since60)
        .order('created_at', { ascending: false })
        .limit(20000);
      for (const row of (audit || []) as { org_id: string | null; created_at: string | null }[]) {
        if (!row.org_id || !row.created_at) continue;
        const ts = Date.parse(row.created_at);
        if (Number.isNaN(ts)) continue;
        if (!lastAuditByOrg.has(row.org_id)) lastAuditByOrg.set(row.org_id, ts);
        if (ts >= now - 30 * 86400000) {
          audit30ByOrg.set(row.org_id, (audit30ByOrg.get(row.org_id) || 0) + 1);
        }
      }
    } catch {
      /* segnale recency neutro sui mancanti */
    }

    // ---- 3. Trend: transports 30g vs baseline 30-120g ----------------------
    const transports30ByOrg = new Map<string, number>();
    const transportsPrevByOrg = new Map<string, number>(); // finestra 30-120g
    try {
      const { data: tr } = await supabaseAdmin
        .from('transports')
        .select('org_id, created_at, is_demo')
        .in('org_id', orgIds)
        .eq('is_demo', false)
        .gte('created_at', since120)
        .limit(50000);
      for (const row of (tr || []) as { org_id: string | null; created_at: string | null }[]) {
        if (!row.org_id || !row.created_at) continue;
        const ts = Date.parse(row.created_at);
        if (Number.isNaN(ts)) continue;
        if (ts >= now - 30 * 86400000) {
          transports30ByOrg.set(row.org_id, (transports30ByOrg.get(row.org_id) || 0) + 1);
        } else {
          transportsPrevByOrg.set(row.org_id, (transportsPrevByOrg.get(row.org_id) || 0) + 1);
        }
      }
    } catch {
      /* trend neutro sui mancanti */
    }

    // ---- 4. Contratto: org_subscriptions -----------------------------------
    const subByOrg = new Map<string, SubRow>();
    try {
      const { data: subs } = await supabaseAdmin
        .from('org_subscriptions')
        .select('org_id, status, trial_end, current_period_end, auto_renew, suspended_at, cancelled_at')
        .in('org_id', orgIds);
      for (const s of (subs || []) as SubRow[]) {
        if (s.org_id) subByOrg.set(s.org_id, s);
      }
    } catch {
      /* contratto neutro sui mancanti */
    }

    // ---- 5. Supporto: support_tickets --------------------------------------
    const ticketsByOrg = new Map<string, TicketRow[]>();
    try {
      const { data: tickets } = await supabaseAdmin
        .from('support_tickets')
        .select('org_id, status, priority, staff_unread, created_at')
        .in('org_id', orgIds);
      for (const t of (tickets || []) as TicketRow[]) {
        if (!t.org_id) continue;
        const list = ticketsByOrg.get(t.org_id) || [];
        list.push(t);
        ticketsByOrg.set(t.org_id, list);
      }
    } catch {
      /* supporto neutro sui mancanti */
    }

    // ---- 6. Scoring per-org ------------------------------------------------
    const clients: HealthClient[] = orgs.map((org) => {
      const issues: string[] = [];

      // --- Recency (35%) ---
      const lastTs = lastAuditByOrg.get(org.id);
      const daysSince = lastTs != null ? Math.floor((now - lastTs) / 86400000) : null;
      let recency: number;
      if (daysSince == null) recency = 0;
      else if (daysSince < 7) recency = 100;
      else if (daysSince <= 14) recency = 80;
      else if (daysSince <= 30) recency = 55;
      else if (daysSince <= 60) recency = 25;
      else recency = 0;
      if (recency <= 25) {
        issues.push(
          daysSince == null
            ? 'Nessuna attività registrata di recente'
            : `Ultima attività ${daysSince} giorni fa`
        );
      }

      // --- Trend attività (30%) ---
      const modules = Array.isArray(org.desktop_modules) ? org.desktop_modules : [];
      const hasTransport = modules.includes('trasporti');
      let trend: number;
      if (!hasTransport) {
        trend = NEUTRAL; // modulo non attivo → non penalizzare
      } else {
        const recent = transports30ByOrg.get(org.id) || 0;
        const prev = transportsPrevByOrg.get(org.id) || 0;
        const baseline = prev / 3; // media mensile sulla finestra 30-120g
        if (baseline === 0 && recent === 0) {
          trend = 30; // nessun trasporto nel modulo attivo
          issues.push('Nessun trasporto negli ultimi mesi');
        } else if (baseline === 0 && recent > 0) {
          trend = 85; // ripartenza / crescita
        } else {
          const ratio = recent / baseline;
          if (ratio >= 1) trend = 90;
          else if (ratio >= 0.8) trend = 75;
          else if (ratio >= 0.5) trend = 55;
          else {
            trend = 25;
            issues.push('Attività trasporti in forte calo');
          }
        }
      }

      // --- Contratto (15%) + gate critico ---
      const sub = subByOrg.get(org.id);
      let contract: number;
      let forceCritical = false;
      if (!sub) {
        contract = 35; // nessun abbonamento attivo
        issues.push('Nessun abbonamento attivo');
      } else {
        const status = (sub.status || '').toLowerCase();
        const badStatus = ['past_due', 'suspended', 'canceled', 'cancelled'].includes(status);
        if (badStatus || sub.suspended_at || sub.cancelled_at) {
          contract = 15;
          forceCritical = true;
          issues.unshift('Abbonamento sospeso/scaduto/disdetto');
        } else if (status === 'trial' || status === 'trialing') {
          const trialEnd = sub.trial_end ? Date.parse(sub.trial_end) : NaN;
          if (!Number.isNaN(trialEnd) && trialEnd <= now + 7 * 86400000) {
            contract = 40;
            issues.push('Trial in scadenza');
          } else {
            contract = 65;
          }
        } else if (status === 'active') {
          const periodEnd = sub.current_period_end ? Date.parse(sub.current_period_end) : NaN;
          const periodFuture = !Number.isNaN(periodEnd) && periodEnd > now;
          contract = sub.auto_renew && periodFuture ? 90 : 60;
        } else {
          contract = 50;
        }
      }

      // --- Supporto (10%, sottrattivo) ---
      const tickets = ticketsByOrg.get(org.id) || [];
      let support: number;
      if (tickets.length === 0) {
        support = 100;
      } else {
        const isOpen = (t: TicketRow) =>
          !['closed', 'resolved'].includes((t.status || '').toLowerCase());
        const openTickets = tickets.filter(isOpen);
        const urgentOpen = openTickets.filter((t) =>
          ['urgent', 'high', 'urgente', 'alta'].includes((t.priority || '').toLowerCase())
        ).length;
        const staffUnread = openTickets.some((t) => t.staff_unread === true);
        const recent90 = tickets.filter(
          (t) => t.created_at && Date.parse(t.created_at) >= Date.parse(since90)
        ).length;
        let penalty = 0;
        penalty += urgentOpen * 25;
        penalty += Math.min(openTickets.length, 5) * 5;
        if (recent90 > 5) penalty += 15;
        if (staffUnread) penalty += 10;
        support = clamp(100 - penalty);
        if (urgentOpen > 0) issues.push('Ticket urgenti aperti');
        else if (openTickets.length > 0) issues.push('Ticket di supporto in sospeso');
      }

      // --- Adozione moduli (10%) ---
      const moduleCount = modules.length;
      const recentActivity =
        (audit30ByOrg.get(org.id) || 0) > 0 || (transports30ByOrg.get(org.id) || 0) > 0;
      let modulesScore: number;
      if (moduleCount === 0) {
        modulesScore = 50; // nessun modulo → neutro-basso
      } else if (recentActivity) {
        modulesScore = 70;
      } else {
        modulesScore = 20;
        issues.push('Moduli poco utilizzati');
      }

      const signals: Signals = {
        recency: clamp(recency),
        trend: clamp(trend),
        contract: clamp(contract),
        support: clamp(support),
        modules: clamp(modulesScore),
      };

      // --- Punteggio pesato ---
      let score = clamp(
        recency * 0.35 + trend * 0.3 + contract * 0.15 + support * 0.1 + modulesScore * 0.1
      );
      if (forceCritical) score = Math.min(score, 20);

      // --- Tier ---
      let tier: Tier;
      if (forceCritical || score <= 20) tier = 'critico';
      else if (score <= 40) tier = 'a rischio';
      else if (score <= 65) tier = 'raffreddamento';
      else tier = 'sano';

      const reason =
        issues.length > 0 ? issues.slice(0, 2).join('; ') : 'Cliente attivo e in salute';

      return {
        org_id: org.id,
        name: org.name || 'Senza nome',
        score,
        tier,
        reason,
        signals,
      };
    });

    // Ordina per score crescente (i più a rischio in cima).
    clients.sort((a, b) => a.score - b.score);

    return NextResponse.json(
      { success: true, clients, generatedAt: new Date().toISOString() },
      { status: 200, headers }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500, headers }
    );
  }
}
