// src/app/api/staff/admin/plans/route.ts
//
// Listino piani — CRUD per lo staff admin. Fonte unica = tabella `plans`
// (prezzi salvati in CENTESIMI interi). RLS sulla tabella è solo SELECT-all,
// quindi le scritture passano da qui con service_role + auth staff.
//
//   GET  → lista piani (anche inattivi), ordinati per sort_order
//   PUT  → upsert di un piano (solo ruolo admin)
//
// CORS/preflight per /api/staff/* è gestito dal middleware globale.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createAuditLog } from '@/lib/staff-audit';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';

export const runtime = 'nodejs';

// NB: si usa select('*') (non una lista esplicita) così l'endpoint resta
// retro-compatibile con DB che non hanno ancora le colonne "limiti d'uso"
// (Fase 1): le colonne mancanti semplicemente non compaiono, senza errori.

// Coercizioni difensive per le colonne limite (numeri o null).
const toIntOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
};
const toNumOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function GET(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, plans: data ?? [] });
}

export async function PUT(request: NextRequest) {
  const staff = await getStaffFromRequest(request);
  if (!staff) {
    return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 });
  }
  // Modifica del listino = azione sensibile → solo admin/super_admin.
  if (!requireStaffRole(staff, 'admin')) {
    return NextResponse.json({ success: false, error: 'Permessi insufficienti' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Body non valido' }, { status: 400 });
  }

  const id = String(body.id ?? '').trim();
  if (!id) {
    return NextResponse.json({ success: false, error: 'id piano richiesto' }, { status: 400 });
  }
  const label = String(body.label ?? '').trim();
  if (!label) {
    return NextResponse.json({ success: false, error: 'Etichetta richiesta' }, { status: 400 });
  }

  // Prezzi attesi in CENTESIMI interi.
  const monthly = Math.round(Number(body.monthly_price));
  const yearly = Math.round(Number(body.yearly_price));
  if (!Number.isFinite(monthly) || !Number.isFinite(yearly) || monthly < 0 || yearly < 0) {
    return NextResponse.json(
      { success: false, error: 'Prezzi non validi (centesimi interi ≥ 0)' },
      { status: 400 }
    );
  }

  const maxModulesRaw = Number(body.max_modules);
  const sortOrderRaw = Number(body.sort_order);
  const row: Record<string, unknown> = {
    id,
    label,
    monthly_price: monthly,
    yearly_price: yearly,
    max_modules: Number.isFinite(maxModulesRaw) ? Math.max(0, Math.round(maxModulesRaw)) : 1,
    description: typeof body.description === 'string' ? body.description : null,
    is_active: body.is_active !== false,
    sort_order: Number.isFinite(sortOrderRaw) ? Math.round(sortOrderRaw) : 0,
  };

  // Fase 1 "limiti d'uso": scrivi le 8 colonne solo se presenti nel body
  // (assenti = lasciate invariate). Numeri/null per i limiti, boolean per ai_included.
  if ('limit_storage_gb' in body) row.limit_storage_gb = toIntOrNull(body.limit_storage_gb);
  if ('limit_photo_months' in body) row.limit_photo_months = toIntOrNull(body.limit_photo_months);
  if ('limit_postal_year' in body) row.limit_postal_year = toIntOrNull(body.limit_postal_year);
  if ('limit_autocompile_month' in body) row.limit_autocompile_month = toIntOrNull(body.limit_autocompile_month);
  if ('limit_sms_month' in body) row.limit_sms_month = toIntOrNull(body.limit_sms_month);
  if ('ai_included' in body) row.ai_included = body.ai_included === true || body.ai_included === 'true';
  if ('ai_budget_eur' in body) row.ai_budget_eur = toNumOrNull(body.ai_budget_eur);
  if ('limit_sites' in body) row.limit_sites = toIntOrNull(body.limit_sites);

  const { data, error } = await supabaseAdmin
    .from('plans')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  await createAuditLog(
    staff.sub, staff.full_name, staff.role,
    'system.settings_change', 'plan', id, label,
    { monthly_price: monthly, yearly_price: yearly, is_active: row.is_active },
    request, true
  );

  return NextResponse.json({ success: true, plan: data });
}
