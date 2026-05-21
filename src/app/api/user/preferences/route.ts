import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * GET  /api/user/preferences            — preferenze (auto-crea con default)
 * PUT  /api/user/preferences  { email_notifications?, inapp_notifications?, locale? }
 */

type Prefs = {
  email_notifications: Record<string, boolean>;
  inapp_notifications: Record<string, boolean>;
  locale: string;
};

const EMAIL_KEYS = ['security', 'billing', 'support', 'product_updates', 'marketing'];
const INAPP_KEYS = ['security', 'billing', 'support', 'system'];
const VALID_LOCALES = ['it', 'en'];

const DEFAULT_PREFS: Prefs = {
  email_notifications: {
    security: true,
    billing: true,
    support: true,
    product_updates: false,
    marketing: false,
  },
  inapp_notifications: {
    security: true,
    billing: true,
    support: true,
    system: true,
  },
  locale: 'it',
};

function sanitizeBoolMap(input: unknown, allowed: string[]): Record<string, boolean> {
  if (!input || typeof input !== 'object') return {};
  const out: Record<string, boolean> = {};
  for (const k of allowed) {
    const v = (input as Record<string, unknown>)[k];
    if (typeof v === 'boolean') out[k] = v;
  }
  return out;
}

export async function GET(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Non autenticato' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .select('email_notifications, inapp_notifications, locale')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    if (!data) {
      // Auto-crea con default e ritorna
      await supabaseAdmin.from('user_preferences').insert({ user_id: user.id });
      return NextResponse.json(
        { ok: true, preferences: DEFAULT_PREFS },
        { headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        preferences: {
          email_notifications: { ...DEFAULT_PREFS.email_notifications, ...(data.email_notifications as object) },
          inapp_notifications: { ...DEFAULT_PREFS.inapp_notifications, ...(data.inapp_notifications as object) },
          locale: (data.locale as string) || 'it',
        },
      },
      { headers: corsHeaders(origin) }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Errore interno';
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

export async function PUT(request: Request) {
  const origin = request.headers.get('origin');
  try {
    const body = await request.json().catch(() => ({}));

    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Non autenticato' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from('user_preferences')
      .select('email_notifications, inapp_notifications, locale')
      .eq('user_id', user.id)
      .maybeSingle();

    const baseEmail = (existing?.email_notifications as Record<string, boolean>) || DEFAULT_PREFS.email_notifications;
    const baseInapp = (existing?.inapp_notifications as Record<string, boolean>) || DEFAULT_PREFS.inapp_notifications;
    const baseLocale = (existing?.locale as string) || DEFAULT_PREFS.locale;

    const next: Prefs = {
      email_notifications: { ...baseEmail, ...sanitizeBoolMap(body.email_notifications, EMAIL_KEYS) },
      inapp_notifications: { ...baseInapp, ...sanitizeBoolMap(body.inapp_notifications, INAPP_KEYS) },
      locale:
        typeof body.locale === 'string' && VALID_LOCALES.includes(body.locale)
          ? body.locale
          : baseLocale,
    };

    const { error } = await supabaseAdmin
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          ...next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { ok: true, preferences: next },
      { headers: corsHeaders(origin) }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Errore interno';
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
