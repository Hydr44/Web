import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';
import { readMaintenance } from '@/lib/maintenance';

export const runtime = 'nodejs';

/**
 * Gestione manutenzione programmata (staff). Auth via middleware /api/staff/admin/*.
 *  GET  → config corrente + stato calcolato
 *  POST → imposta { enabled, message, scheduled_start, scheduled_end, warn_minutes }
 *         (enabled=true → manutenzione immediata; altrimenti finestra programmata)
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('value, updated_at')
      .eq('key', 'maintenance')
      .maybeSingle();
    const config = data?.value && typeof data.value === 'object' ? data.value : {};
    const status = await readMaintenance();
    return NextResponse.json(
      { success: true, config, status, updated_at: data?.updated_at || null },
      { headers: corsHeaders(origin) },
    );
  } catch (error) {
    console.error('admin/maintenance GET error:', error);
    return NextResponse.json({ success: false, error: 'Errore' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  try {
    const b = await request.json().catch(() => ({}));
    const value = {
      enabled: b.enabled === true,
      message: b.message ? String(b.message).slice(0, 500) : '',
      scheduled_start: b.scheduled_start || null,
      scheduled_end: b.scheduled_end || null,
      warn_minutes: Number(b.warn_minutes) > 0 ? Number(b.warn_minutes) : 30,
    };

    if (
      value.scheduled_start &&
      value.scheduled_end &&
      Date.parse(value.scheduled_end) <= Date.parse(value.scheduled_start)
    ) {
      return NextResponse.json(
        { success: false, error: 'La fine deve essere successiva all\'inizio.' },
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    const { error } = await supabaseAdmin.from('system_settings').upsert(
      {
        key: 'maintenance',
        value,
        description: 'Manutenzione programmata (web dashboard / desktop / mobile)',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    );
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders(origin) });
    }

    const status = await readMaintenance();
    return NextResponse.json({ success: true, status }, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error('admin/maintenance POST error:', error);
    return NextResponse.json({ success: false, error: 'Errore' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}
