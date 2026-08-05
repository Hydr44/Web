/**
 * Portale cliente — fatture fiscali emesse da RescueManager verso l'org cliente.
 *
 * Le fatture "fatturazione clienti" (serie RM/YYYY) sono intestate all'org EMITTENTE
 * (RescueManager), non all'org del cliente: il collegamento al cliente è in
 * `meta.saas.billed_org_id`. Per questo NON sono leggibili dalla sessione anon del
 * cliente (RLS `is_member(org_id)`), e vanno servite lato server con service-role,
 * dopo aver risolto l'org del chiamante e filtrato per `billed_org_id`.
 */
import { supabaseAdmin } from './supabase-admin';
import { EMITTER_ORG_ID } from './admin-invoices';

/** Org del cliente loggato: profiles.current_org, fallback al primo org_members. */
export async function getCallerOrgId(userId: string): Promise<string | null> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('current_org')
    .eq('id', userId)
    .maybeSingle();
  if (profile?.current_org) return profile.current_org as string;
  const { data: m } = await supabaseAdmin
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  return (m?.org_id as string | undefined) ?? null;
}

export interface PortalInvoice {
  id: string;
  number: string | null;
  date: string | null;
  total: number;
  currency: string;
  sdi_status: string | null;
  payment_status: string | null;
  tipo_documento: string | null;
}

/** Fatture fiscali RM emesse all'org (esclude le bozze non ancora emesse). */
export async function listBilledInvoices(orgId: string): Promise<PortalInvoice[]> {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('id, number, date, total, currency, sdi_status, payment_status, meta, created_at')
    .eq('org_id', EMITTER_ORG_ID)
    .eq('direction', 'active')
    .like('number', 'RM/%')
    .filter('meta->saas->>billed_org_id', 'eq', orgId)
    .neq('sdi_status', 'draft')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((r) => ({
    id: r.id as string,
    number: (r.number as string | null) ?? null,
    date: (r.date as string | null) ?? null,
    total: Number(r.total) || 0,
    currency: (r.currency as string | null) || 'EUR',
    sdi_status: (r.sdi_status as string | null) ?? null,
    payment_status: (r.payment_status as string | null) ?? null,
    tipo_documento: ((r.meta as any)?.sdi?.documento?.tipo_documento as string | null) ?? null,
  }));
}

/** Verifica che la fattura `id` sia intestata (billed) all'org del chiamante. */
export async function invoiceBilledTo(id: string, orgId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('invoices')
    .select('meta')
    .eq('id', id)
    .eq('org_id', EMITTER_ORG_ID)
    .maybeSingle();
  return !!data && (data.meta as any)?.saas?.billed_org_id === orgId;
}
