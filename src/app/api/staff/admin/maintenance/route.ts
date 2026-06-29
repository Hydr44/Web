import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { readMaintenance } from '@/lib/maintenance';
import { sendToAllClients, getClientRecipients } from '@/lib/client-mailer';

export const runtime = 'nodejs';

/**
 * Gestione finestre di manutenzione (staff). Auth via middleware /api/staff/admin/*.
 *  GET    → elenco finestre + stato corrente calcolato
 *  POST   → crea finestra { title, message, starts_at, ends_at, warn_minutes, target, notify_clients }
 *           (se notify_clients → email branded a tutti i clienti)
 *  PATCH  → aggiorna { id, ...campi } (es. annulla: { id, status:'cancelled' })
 *  DELETE ?id=... → elimina
 */
const TARGETS = ['all', 'web', 'desktop', 'mobile'];

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('it-IT', {
      weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const status = await readMaintenance('web');
  // Quanti clienti riceverebbero l'email (esclusi staff e org demo).
  const recipientCount = (await getClientRecipients()).length;
  const { data, error } = await supabaseAdmin
    .from('maintenance_windows')
    .select('*')
    .order('starts_at', { ascending: false })
    .limit(100);
  if (error) {
    return NextResponse.json(
      { success: true, windows: [], status, recipientCount, tableMissing: true },
      { headers: corsHeaders(origin) },
    );
  }
  return NextResponse.json({ success: true, windows: data || [], status, recipientCount }, { headers: corsHeaders(origin) });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const b = await request.json().catch(() => ({}));
    const message = String(b.message || '').trim();
    const title = b.title ? String(b.title).slice(0, 160).trim() : null;
    const starts_at = b.starts_at || null;
    const ends_at = b.ends_at || null;
    const warn_minutes = Number(b.warn_minutes) > 0 ? Number(b.warn_minutes) : 30;
    const target = TARGETS.includes(b.target) ? b.target : 'all';
    const notify_clients = b.notify_clients !== false;

    if (message.length < 2) {
      return NextResponse.json({ success: false, error: 'Messaggio obbligatorio' }, { status: 400, headers: corsHeaders(origin) });
    }
    if (!starts_at || !ends_at) {
      return NextResponse.json({ success: false, error: 'Inizio e fine obbligatori' }, { status: 400, headers: corsHeaders(origin) });
    }
    if (Date.parse(ends_at) <= Date.parse(starts_at)) {
      return NextResponse.json({ success: false, error: 'La fine deve essere successiva all\'inizio' }, { status: 400, headers: corsHeaders(origin) });
    }

    const { data: created, error } = await supabaseAdmin
      .from('maintenance_windows')
      .insert({ title, message, starts_at, ends_at, warn_minutes, target, notify_clients })
      .select()
      .maybeSingle();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    }

    let notified: { sent: number; failed: number; total: number } | null = null;
    if (notify_clients && created) {
      const subject = `Manutenzione programmata${title ? `: ${title}` : ''}`;
      const body =
        `Gentile {{nome}},\n` +
        `ti informiamo di una manutenzione programmata del servizio${title ? ` — ${title}` : ''}.\n` +
        `${message}\n` +
        `\n` +
        `Quando: dal ${fmt(starts_at)} al ${fmt(ends_at)}.\n` +
        `Durante questo intervallo l'applicazione (web, desktop e mobile) non sarà accessibile. Ci scusiamo per il disagio.`;
      notified = await sendToAllClients(subject, body, { subtitle: 'Manutenzione programmata' });
      await supabaseAdmin
        .from('maintenance_windows')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', created.id);
    }

    return NextResponse.json({ success: true, window: created, notified }, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error('admin/maintenance POST error:', error);
    return NextResponse.json({ success: false, error: 'Errore' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function PATCH(request: NextRequest) {
  const origin = request.headers.get('origin');
  const b = await request.json().catch(() => ({}));
  const id = String(b.id || '');
  if (!id) {
    return NextResponse.json({ success: false, error: 'id mancante' }, { status: 400, headers: corsHeaders(origin) });
  }
  const patch: Record<string, unknown> = {};
  for (const k of ['title', 'message', 'starts_at', 'ends_at', 'warn_minutes', 'target', 'status', 'notify_clients']) {
    if (k in b) patch[k] = b[k];
  }
  if (patch.status && !['scheduled', 'cancelled'].includes(patch.status as string)) delete patch.status;
  if (patch.target && !TARGETS.includes(patch.target as string)) delete patch.target;
  const { error } = await supabaseAdmin.from('maintenance_windows').update(patch).eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
  }
  return NextResponse.json({ success: true }, { headers: corsHeaders(origin) });
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin');
  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'id mancante' }, { status: 400, headers: corsHeaders(origin) });
  }
  const { error } = await supabaseAdmin.from('maintenance_windows').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
  }
  return NextResponse.json({ success: true }, { headers: corsHeaders(origin) });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
