/**
 * GET /api/staff/admin/dashboard
 * Payload unico e AZIONABILE per la dashboard admin: KPI reali (clienti attivi/in
 * prova, MRR stimato, lead), lista "Richiede attenzione" (solo voci con count>0),
 * attività recente (clienti/lead/fatture). Tutto in parallelo su Supabase.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { getStaffFromRequest } from '@/lib/staff-auth';
import { EMITTER_ORG_ID } from '@/lib/admin-invoices';

const DAY = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  const staff = await getStaffFromRequest(request);
  if (!staff) return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401, headers });

  try {
    const now = Date.now();
    const since30 = new Date(now - 30 * DAY).toISOString();
    const soon = new Date(now + 7 * DAY).toISOString();
    const nowIso = new Date(now).toISOString();

    const [orgsR, subsR, plansR, leadsR, quotesR, ticketsR, invoicesR] = await Promise.all([
      supabaseAdmin.from('orgs').select('id, name, created_at, is_demo, demo_expires_at, verification_pending'),
      supabaseAdmin.from('org_subscriptions').select('org_id, status, plan, is_custom, custom_price, billing_type, trial_end'),
      supabaseAdmin.from('plans').select('id, monthly_price, yearly_price'),
      supabaseAdmin.from('leads').select('id, name, company, status, created_at'),
      supabaseAdmin.from('lead_quotes').select('status'),
      supabaseAdmin.from('support_tickets').select('status, staff_unread'),
      supabaseAdmin.from('invoices').select('id, number, customer_name, total, sdi_status, payment_status, date, created_at')
        .eq('org_id', EMITTER_ORG_ID).like('number', 'RM/%').order('created_at', { ascending: false }).limit(60),
    ]);

    const orgs = orgsR.data || [];
    const subs = subsR.data || [];
    const plans = plansR.data || [];
    const leads = leadsR.data || [];
    const quotes = quotesR.data || [];
    const tickets = ticketsR.data || [];
    const invoices = invoicesR.data || [];

    const planMap: Record<string, { m: number; y: number }> = {};
    for (const p of plans) planMap[String(p.id)] = { m: Number(p.monthly_price) || 0, y: Number(p.yearly_price) || 0 };
    const subByOrg: Record<string, any> = {};
    for (const s of subs) subByOrg[s.org_id] = s;

    // ── KPI ──
    const activeSubs = subs.filter(s => s.status === 'active');
    const trialSubs = subs.filter(s => s.status === 'trial');
    const clients_active = activeSubs.length;
    const clients_trial = trialSubs.length;
    const clients_total = orgs.length;
    const new_clients_30d = orgs.filter(o => o.created_at && o.created_at >= since30).length;

    // MRR stimato (€/mese): abbonamenti attivi; custom_price se valorizzato, altrimenti
    // il prezzo del piano dal listino (centesimi). Annuale → /12. Piani non mappati → 0.
    let mrr = 0;
    for (const s of activeSubs) {
      const yearly = /year|annu/i.test(String(s.billing_type || ''));
      if (s.is_custom && s.custom_price != null && Number(s.custom_price) > 0) {
        const cp = Number(s.custom_price);
        mrr += yearly ? cp / 12 : cp;
      } else {
        const pm = planMap[String(s.plan)];
        if (pm) mrr += (yearly ? pm.y / 12 : pm.m) / 100;
      }
    }
    mrr = Math.round(mrr);

    const OPEN_LEAD = (st: string) => !['converted', 'lost', 'rejected', 'closed', 'won'].includes(String(st || ''));
    const leads_open = leads.filter(l => OPEN_LEAD(l.status)).length;
    const new_leads_30d = leads.filter(l => l.created_at && l.created_at >= since30).length;

    // ── Richiede attenzione ──
    const newLeads = leads.filter(l => l.status === 'new').length;
    const trialsExpiring = trialSubs.filter(s => s.trial_end && s.trial_end <= soon).length; // scade ≤7gg o scaduto
    const verificationPending = orgs.filter(o => o.verification_pending === true).length;
    const demosExpiring = orgs.filter(o => o.is_demo && o.demo_expires_at && o.demo_expires_at <= soon && o.demo_expires_at >= new Date(now - 60 * DAY).toISOString()).length;
    const quotesOpen = quotes.filter(q => !['activated', 'superseded', 'rejected', 'expired', 'cancelled', 'declined'].includes(String(q.status || ''))).length;
    const ticketsOpen = tickets.filter(t => !['closed', 'resolved'].includes(String(t.status || '')) || Number(t.staff_unread) > 0).length;
    const unpaid = invoices.filter(i => (i.payment_status || 'unpaid') !== 'paid');
    const unpaidCount = unpaid.length;
    const unpaidTotal = Math.round(unpaid.reduce((s, i) => s + (Number(i.total) || 0), 0));

    const attentionAll = [
      { key: 'trials_expiring', label: 'Prove in scadenza', count: trialsExpiring, severity: 'high', href: '/clients' },
      { key: 'verification_pending', label: 'Verifiche dati in sospeso', count: verificationPending, severity: 'high', href: '/clients' },
      { key: 'open_tickets', label: 'Ticket di supporto aperti', count: ticketsOpen, severity: 'high', href: '/support' },
      { key: 'unpaid_invoices', label: 'Fatture non pagate', count: unpaidCount, severity: 'medium', href: '/invoices' },
      { key: 'new_leads', label: 'Nuovi lead da contattare', count: newLeads, severity: 'medium', href: '/leads' },
      { key: 'open_quotes', label: 'Preventivi in attesa', count: quotesOpen, severity: 'medium', href: '/leads' },
      { key: 'demos_expiring', label: 'Demo in scadenza', count: demosExpiring, severity: 'low', href: '/leads' },
    ].filter(a => a.count > 0);

    // ── Attività recente ──
    const statusOf = (orgId: string) => {
      const s = subByOrg[orgId];
      return s ? s.status : null;
    };
    const recent_clients = [...orgs]
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 6)
      .map(o => ({ id: o.id, name: o.name, created_at: o.created_at, status: statusOf(o.id), is_demo: !!o.is_demo }));
    const recent_leads = [...leads]
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 6)
      .map(l => ({ id: l.id, name: l.name, company: l.company, status: l.status, created_at: l.created_at }));
    const recent_invoices = invoices.slice(0, 6).map(i => ({
      id: i.id, number: i.number, customer_name: i.customer_name,
      total: Number(i.total) || 0, sdi_status: i.sdi_status || 'draft',
      payment_status: i.payment_status || 'unpaid', date: i.date,
    }));

    return NextResponse.json({
      success: true,
      generated_at: nowIso,
      kpi: {
        clients_active, clients_trial, clients_total, new_clients_30d,
        mrr, leads_open, new_leads_30d, unpaid_total: unpaidTotal,
      },
      attention: attentionAll,
      recent_clients, recent_leads, recent_invoices,
    }, { headers });
  } catch (e: any) {
    console.error('[admin dashboard] error:', e);
    return NextResponse.json({ success: false, error: e?.message || 'Errore interno' }, { status: 500, headers });
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
