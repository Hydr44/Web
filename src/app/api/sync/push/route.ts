import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyOAuthToken } from "@/lib/jwt-secure";

export const runtime = "nodejs";

/**
 * POST /api/sync/push
 * Push changes from desktop app to database.
 *
 * Hardening 2026-06-11 (security audit C7 - mass-assignment / privesc):
 * - Whitelist tabelle permesse (no arbitrary `req.body.table`).
 * - Strip campi sensibili che il client non deve mai impostare
 *   (`is_admin`, `staff_role`, `is_staff`, `is_active`, `current_org`,
 *   `created_by`, `org_id` forzato dal token/membership, ecc.).
 * - Limite hard al numero di item per request (no batch giganti).
 */

/**
 * Tabelle che il desktop può sincronizzare via push. Limitata a quelle
 * effettivamente usate per il sync offline → online. Per aggiungerne una
 * nuova, valutare a parte (e definire la sua deny-list specifica).
 */
const ALLOWED_TABLES = new Set<string>([
  'transports',
  'transport_audit_log',
  'demolition_cases',
  'vfu_processing_steps',
  'vfu_attachments',
  'spare_parts',
  'clients',
  'invoices',
  'invoice_lines',
  'invoice_payments',
  'rentri_movimenti',
  'rentri_formulari',
]);

/**
 * Campi che NON devono mai essere accettati dal payload client: sono
 * controllati dal server (auth, RLS) e impostarli sarebbe privilege
 * escalation o spoofing. Strip silenzioso al primo dell'upsert.
 */
const DENY_FIELDS = new Set<string>([
  'is_admin',
  'is_staff',
  'staff_role',
  'is_active',
  'current_org',
  'created_by',         // forzato dal token (decoded.user_id)
  'sub',                // auth claim
  'user_metadata',      // auth metadata
  'app_metadata',
  'role',               // ruolo membership (mai dal client per altri)
  'subscription_status',
  'stripe_customer_id',
]);

const MAX_ITEMS_PER_REQUEST = 500;

function stripDenied<T extends Record<string, unknown>>(item: T): T {
  const out = { ...item };
  for (const k of DENY_FIELDS) delete out[k];
  return out;
}

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyOAuthToken(token) as any;

    if (!decoded?.user_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { org_id, table, data } = body;

    if (!org_id || !table || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: org_id, table, data' },
        { status: 400 }
      );
    }

    // Whitelist tabella: rifiuta qualsiasi nome non in ALLOWED_TABLES.
    // Senza questa protezione l'utente poteva chiamare `table: 'org_members'`
    // e fare upsert con `role: 'admin'`.
    if (typeof table !== 'string' || !ALLOWED_TABLES.has(table)) {
      return NextResponse.json(
        { error: `Tabella '${table}' non sincronizzabile` },
        { status: 400 }
      );
    }

    // Verifica che l'utente appartenga all'org
    const { data: member, error: memberError } = await supabaseAdmin
      .from('org_members')
      .select('org_id, role')
      .eq('org_id', org_id)
      .eq('user_id', decoded.user_id)
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Not authorized for this org' }, { status: 403 });
    }

    // Push data
    const result = await pushData(table, org_id, data, decoded.user_id);

    return result;

  } catch (error) {
    console.error('Sync push error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function pushData(
  table: string,
  orgId: string,
  data: any[] | any,
  _userId: string // non più usato qui (created_by non viene forzato); firma posizionale invariata
) {
  try {
    const isArray = Array.isArray(data);
    const itemsRaw = isArray ? data : [data];

    if (itemsRaw.length > MAX_ITEMS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Troppi item in una richiesta (max ${MAX_ITEMS_PER_REQUEST}).` },
        { status: 413 },
      );
    }

    // Strip campi sensibili + forza org_id dal token/membership.
    // L'utente NON deve poter impostare arbitrariamente org_id (= tenant switch).
    // created_by NON viene ri-iniettato: è già in DENY_FIELDS (quindi non
    // falsificabile dal client) e diverse tabelle whitelisted NON hanno la
    // colonna created_by (es. vfu_processing_steps, vfu_attachments) → forzarla
    // farebbe fallire l'upsert con errore di colonna inesistente.
    const items = itemsRaw.map((raw: Record<string, unknown>) => ({
      ...stripDenied(raw),
      org_id: orgId,
    }));

    // Upsert data
    const { data: result, error } = await supabaseAdmin
      .from(table)
      .upsert(items, { onConflict: 'id' })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      table,
      data: result,
      pushed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error(`Error pushing to ${table}:`, error);
    return NextResponse.json({
      success: false,
      error: `Failed to push to ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

