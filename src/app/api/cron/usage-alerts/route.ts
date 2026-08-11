/**
 * GET /api/cron/usage-alerts — FASE 4 (limiti d'uso)
 * Per ogni org non-demo confronta il consumo con i limiti effettivi e invia
 * un'email di avviso "superamento morbido" al raggiungimento dell'80% e del
 * 100% (una sola volta per metrica/soglia/mese, via tabella usage_alerts).
 * NESSUN blocco: è solo un avviso. Protetto da CRON_SECRET.
 *
 * Test manuale: /api/cron/usage-alerts?key=<CRON_SECRET>&dry=1
 * Schedulato da Vercel cron (vedi vercel.json).
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEmail, isValidEmail } from '@/lib/newsletter';
import { brandedHtml } from '@/lib/email-template';

export const runtime = 'nodejs';
export const maxDuration = 60;

const METERED = [
  { key: 'autocompile', usageKey: 'autocompile',   limitKey: 'autocompile_month', label: 'Compilazioni automatiche' },
  { key: 'sms',         usageKey: 'sms',           limitKey: 'sms_month',         label: 'SMS / messaggi' },
  { key: 'ai_eur',      usageKey: 'ai_eur',        limitKey: 'ai_budget_eur',     label: 'Consulente IA' },
  { key: 'storage',     usageKey: 'storage_bytes', limitKey: 'storage_gb',        label: 'Archivio' },
] as const;

function fmtBytes(b: number): string {
  if (!(b > 0)) return '0 MB';
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(1)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024).toFixed(0)} KB`;
}

async function orgEmail(orgId: string): Promise<string | null> {
  const { data: cs } = await supabaseAdmin.from('org_settings').select('value').eq('org_id', orgId).eq('key', 'company').maybeSingle();
  const cEmail = (cs?.value as { email?: string } | null)?.email;
  if (cEmail && isValidEmail(cEmail)) return cEmail;
  const { data: members } = await supabaseAdmin.from('org_members').select('user_id, role').eq('org_id', orgId);
  const ownerId = (members || []).find(m => m.role === 'owner' || m.role === 'admin')?.user_id || (members || [])[0]?.user_id;
  if (!ownerId) return null;
  const { data: prof } = await supabaseAdmin.from('profiles').select('email').eq('id', ownerId).maybeSingle();
  return (prof?.email && isValidEmail(prof.email)) ? prof.email : null;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const authOk =
    !secret ||
    request.headers.get('authorization') === `Bearer ${secret}` ||
    url.searchParams.get('key') === secret;
  if (!authOk) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  const dry = url.searchParams.get('dry') === '1';

  const { data: orgs } = await supabaseAdmin.from('orgs').select('id, is_demo, name');
  const targets = (orgs || []).filter(o => o.is_demo !== true);

  const { data: sent } = await supabaseAdmin.from('usage_alerts').select('org_id, metric, threshold').eq('period', period);
  const already = new Set((sent || []).map(s => `${s.org_id}|${s.metric}|${s.threshold}`));

  let checked = 0, emails = 0;
  const results: Array<{ org: string; email: boolean; crossings: string[] }> = [];

  for (const org of targets) {
    checked++;
    const [{ data: eff }, { data: usg }] = await Promise.all([
      supabaseAdmin.rpc('get_org_effective_limits', { p_org_id: org.id }),
      supabaseAdmin.rpc('get_org_usage', { p_org_id: org.id }),
    ]);
    if (!eff) continue;
    const effective = eff as Record<string, number | null>;
    const usage = (usg || {}) as Record<string, number>;

    const crossings: Array<{ metric: string; threshold: number; label: string; usedStr: string; maxStr: string; pct: number }> = [];
    for (const m of METERED) {
      const limit = Number(effective[m.limitKey]);
      if (!limit || limit <= 0) continue;
      const raw = Number(usage[m.usageKey] || 0);
      let usedInUnit: number, usedStr: string, maxStr: string;
      if (m.key === 'storage') { usedInUnit = raw / 1024 ** 3; usedStr = fmtBytes(raw); maxStr = `${limit} GB`; }
      else if (m.key === 'ai_eur') { usedInUnit = raw; usedStr = `~${Math.round(raw * 60)} consulenze`; maxStr = `~${Math.round(limit * 60)} consulenze/mese`; }
      else { usedInUnit = raw; usedStr = `${Math.round(raw)}`; maxStr = `${Math.round(limit)} /mese`; }
      const pct = (usedInUnit / limit) * 100;
      const threshold = pct >= 100 ? 100 : pct >= 80 ? 80 : 0;
      if (!threshold || already.has(`${org.id}|${m.key}|${threshold}`)) continue;
      crossings.push({ metric: m.key, threshold, label: m.label, usedStr, maxStr, pct: Math.round(pct) });
    }
    if (!crossings.length) continue;

    const email = await orgEmail(org.id);
    for (const c of crossings) {
      if (!dry) {
        await supabaseAdmin.from('usage_alerts').upsert(
          { org_id: org.id, period, metric: c.metric, threshold: c.threshold },
          { onConflict: 'org_id,period,metric,threshold' },
        );
      }
      already.add(`${org.id}|${c.metric}|${c.threshold}`);
      if (email && !dry) {
        const over = c.threshold >= 100;
        const subject = over ? `Limite raggiunto: ${c.label}` : `Stai per esaurire: ${c.label}`;
        const body = [
          'Ciao,',
          over
            ? `hai raggiunto il limite incluso nel tuo piano per ${c.label.toLowerCase()}.`
            : `il tuo utilizzo di ${c.label.toLowerCase()} ha raggiunto l'${c.pct}% del limite del piano.`,
          over
            ? 'Il servizio continua a funzionare: puoi aggiungere un pacchetto o passare a un piano superiore quando vuoi.'
            : 'Ti avvisiamo in anticipo così puoi valutare per tempo un pacchetto aggiuntivo o un upgrade.',
        ].join('\n');
        const html = brandedHtml(body, { infoRows: [{ label: c.label, value: `${c.usedStr} di ${c.maxStr} (${c.pct}%)` }] });
        if (await sendEmail(email, subject, html)) emails++;
      }
    }
    results.push({ org: org.name, email: !!email, crossings: crossings.map(c => `${c.metric}@${c.threshold}`) });
  }

  return NextResponse.json({ ok: true, period, checked, emails, dry, results });
}
