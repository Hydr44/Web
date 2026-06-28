import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

/**
 * GET /api/user/export
 * Export dati personali dell'utente in sessione (GDPR art. 15 accesso + art. 20
 * portabilità). Ritorna un JSON scaricabile con SOLO i dati dell'utente che
 * chiama (auth via sessione; lettura via service role filtrata per user.id).
 *
 * Copre i dati personali dell'account web. I dati operativi aziendali
 * (trasporti, clienti, fatture) vivono nel progetto dati dedicato e si
 * esportano dall'app desktop.
 */
export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const out: Record<string, unknown> = {
    _meta: {
      generato_il: new Date().toISOString(),
      titolare_del_trattamento: 'RescueManager S.r.l. (P.IVA 02176370852)',
      base_giuridica: 'GDPR art. 15 (diritto di accesso) e art. 20 (portabilità dei dati)',
      nota:
        "Contiene i dati personali associati al tuo account. I dati operativi aziendali " +
        "(trasporti, clienti, fatture) sono esportabili separatamente dall'app desktop.",
    },
    account: {
      id: user.id,
      email: user.email,
      creato_il: user.created_at,
      ultimo_accesso: user.last_sign_in_at,
      email_verificata_il: user.email_confirmed_at ?? null,
    },
  };

  const grab = async (
    key: string,
    builder: PromiseLike<{ data: unknown; error: { message?: string } | null }>,
  ) => {
    try {
      const { data, error } = await builder;
      out[key] = error ? { _errore: error.message || 'errore di lettura' } : (data ?? null);
    } catch (e) {
      out[key] = { _errore: e instanceof Error ? e.message : String(e) };
    }
  };

  await grab('profilo', supabaseAdmin.from('profiles').select('*').eq('id', user.id).maybeSingle());
  await grab('appartenenze_organizzazioni', supabaseAdmin.from('org_members').select('*').eq('user_id', user.id));

  // Dati di base delle organizzazioni di cui l'utente è membro.
  try {
    const { data: mems } = await supabaseAdmin.from('org_members').select('org_id').eq('user_id', user.id);
    const orgIds = Array.from(new Set((mems || []).map((m: { org_id?: string }) => m.org_id).filter(Boolean)));
    if (orgIds.length) {
      await grab(
        'organizzazioni',
        supabaseAdmin
          .from('orgs')
          .select('id, name, vat, tax_code, address, phone, email, website, created_at')
          .in('id', orgIds as string[]),
      );
    } else {
      out['organizzazioni'] = [];
    }
  } catch {
    out['organizzazioni'] = [];
  }

  await grab('ticket_supporto', supabaseAdmin.from('support_tickets').select('*').eq('created_by', user.id));
  await grab(
    'log_attivita',
    supabaseAdmin.from('user_audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1000),
  );
  await grab('consensi_cookie', supabaseAdmin.from('cookie_consents').select('*').eq('user_id', user.id));

  const json = JSON.stringify(out, null, 2);
  const filename = `rescuemanager-dati-personali-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
