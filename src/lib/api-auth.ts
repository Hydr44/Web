/**
 * Auth helper per route API chiamabili sia dalla web app (cookie SSR) sia
 * dalle app desktop/mobile (Authorization: Bearer <access_token Supabase>).
 *
 * Restituisce l'utente autenticato o null. Per le scritture usare poi
 * `supabaseAdmin` (service role) impostando esplicitamente created_by/org_id,
 * perché nel percorso Bearer non c'è una sessione cookie su cui applicare RLS.
 */
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export interface RequestUser {
  id: string;
  email: string | null;
}

export async function getRequestUser(request: Request): Promise<RequestUser | null> {
  // 1) Sessione via cookie (web app sullo stesso dominio)
  try {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (user) return { id: user.id, email: user.email ?? null };
  } catch {
    /* nessun cookie / contesto non valido → prova il Bearer */
  }

  // 2) Bearer token (app desktop/mobile, chiamata cross-origin senza cookie)
  const h = request.headers.get('authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (m?.[1]) {
    const { data, error } = await supabaseAdmin.auth.getUser(m[1].trim());
    if (!error && data?.user) return { id: data.user.id, email: data.user.email ?? null };
  }

  return null;
}
