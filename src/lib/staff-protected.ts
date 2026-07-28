/**
 * Account staff "primari" protetti: non possono essere eliminati né sospesi
 * da nessun endpoint admin. È una regola di business hardcoded (non un flag a
 * DB modificabile) proprio perché deve resistere anche a modifiche del DB/UI.
 *
 * Aggiungere qui un'email la rende immortale lato applicazione.
 */
import { supabaseAdmin } from './supabase-admin';

export const PROTECTED_STAFF_EMAILS: readonly string[] = [
  'emmanuel.scozzarini@rescuemanager.eu',
];

export function isProtectedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return PROTECTED_STAFF_EMAILS.includes(email.toLowerCase().trim());
}

/**
 * Dato un elenco di staff.id, ritorna quelli che corrispondono a un account
 * protetto (da escludere/rifiutare in delete/suspend).
 */
export async function findProtectedStaffIds(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const { data } = await supabaseAdmin.from('staff').select('id, email').in('id', ids);
  const protectedIds = new Set<string>();
  for (const s of data || []) {
    if (isProtectedEmail(s.email)) protectedIds.add(s.id);
  }
  return protectedIds;
}
