/**
 * POST /api/staff/admin/clients/[id]/recovery
 * Recupero accesso di un MEMBRO dell'org: reset password (link recovery),
 * magic-link di accesso, sblocco 2FA. Solo super_admin. Ogni azione lascia
 * una nota automatica sul cliente (client_notes) come traccia.
 * body: { action: 'reset_password'|'magic_link'|'clear_2fa', user_id }
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders, handleCors } from '@/lib/cors';
import { getStaffFromRequest, requireStaffRole } from '@/lib/staff-auth';

export async function OPTIONS(request: Request) {
  return handleCors(request) as NextResponse;
}

const SITE = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://rescuemanager.eu';
const LABELS: Record<string, string> = { reset_password: 'Reset password', magic_link: 'Magic-link accesso', clear_2fa: 'Sblocco 2FA' };

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);
  const orgId = params.id;
  try {
    const staff = await getStaffFromRequest(request as unknown as NextRequest);
    if (!staff) return NextResponse.json({ success: false, error: 'Non autorizzato' }, { status: 401, headers });
    if (!requireStaffRole(staff, 'super_admin')) return NextResponse.json({ success: false, error: 'Azione riservata ai super_admin' }, { status: 403, headers });

    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '');
    const userId = String(body.user_id || '');
    if (!['reset_password', 'magic_link', 'clear_2fa'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Azione non valida' }, { status: 400, headers });
    }
    if (!userId) return NextResponse.json({ success: false, error: 'Utente mancante' }, { status: 400, headers });

    // L'utente DEVE essere membro di questa org
    const { data: mem } = await supabaseAdmin.from('org_members').select('user_id').eq('org_id', orgId).eq('user_id', userId).maybeSingle();
    if (!mem) return NextResponse.json({ success: false, error: 'L\'utente non appartiene a questo cliente' }, { status: 404, headers });

    const { data: prof } = await supabaseAdmin.from('profiles').select('email, full_name').eq('id', userId).maybeSingle();
    const email = prof?.email as string | undefined;
    if (!email && action !== 'clear_2fa') {
      return NextResponse.json({ success: false, error: 'Email dell\'utente non trovata' }, { status: 404, headers });
    }

    let link: string | null = null;
    let message = '';

    if (action === 'reset_password') {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: 'recovery', email: email as string, options: { redirectTo: `${SITE}/set-password` } });
      if (error) throw new Error(error.message);
      link = (data as { properties?: { action_link?: string } } | null)?.properties?.action_link || null;
      message = 'Link di reset password generato: invialo all\'utente.';
    } else if (action === 'magic_link') {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: email as string });
      if (error) throw new Error(error.message);
      link = (data as { properties?: { action_link?: string } } | null)?.properties?.action_link || null;
      message = 'Magic-link di accesso generato: invialo all\'utente.';
    } else {
      // clear_2fa — disattiva il 2FA applicativo custom
      await supabaseAdmin.from('user_2fa_settings').update({ enabled: false }).eq('user_id', userId);
      message = '2FA disattivato: l\'utente potrà riconfigurarlo al prossimo accesso.';
    }

    // Traccia come nota automatica sul cliente
    await supabaseAdmin.from('client_notes').insert({
      org_id: orgId,
      author_email: staff.email,
      author_name: staff.full_name || 'Staff',
      kind: 'tecnico',
      body: `🔑 ${LABELS[action]} per ${prof?.full_name || email || userId} — eseguito da ${staff.email}`,
    }).then(() => {}, () => {});

    return NextResponse.json({ success: true, message, link }, { status: 200, headers });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Errore interno del server' }, { status: 500, headers });
  }
}
