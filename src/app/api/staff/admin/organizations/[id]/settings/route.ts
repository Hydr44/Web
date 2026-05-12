import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

/**
 * Admin company settings endpoint.
 *
 * Da Maggio 2026 la fonte autoritativa è `org_settings.key='company'` (JSONB).
 * La vecchia tabella `company_settings` è stata deprecata (rinominata in
 * `_deprecated_company_settings` dalla migration 20260501).
 *
 * Per non rompere l'UI admin che si aspetta uno schema "flat" (colonne singole),
 * qui facciamo la traduzione bidirezionale:
 *   DB JSONB { company_name, vat, address:{...} }  ⇄  UI { company_name, vat_number, address_street, ... }
 */

interface FlatSettings {
  company_name?: string | null;
  company_code?: string | null;
  legal_form?: string | null;
  vat_number?: string | null;
  tax_code?: string | null;
  fiscal_code?: string | null;
  chamber_of_commerce?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
  fax?: string | null;
  pec?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_city?: string | null;
  address_province?: string | null;
  address_postal_code?: string | null;
  address_country?: string | null;
  address_region?: string | null;
  iban?: string | null;
  sdi_recipient_code?: string | null;
  codice_ateco?: string | null;
}

/** Converte il JSONB org_settings.company → schema flat usato dall'admin UI. */
function jsonbToFlat(v: Record<string, unknown> | null | undefined): FlatSettings {
  if (!v) return {};
  const addr = (v.address && typeof v.address === 'object') ? v.address as Record<string, unknown> : {};
  const street = [addr.street, addr.civico].filter(Boolean).join(' ').trim();
  return {
    company_name: (v.company_name as string) ?? null,
    vat_number: (v.vat as string) ?? (v.piva as string) ?? null,
    tax_code: (v.tax_code as string) ?? null,
    fiscal_code: (v.tax_code as string) ?? null,
    email: (v.email as string) ?? null,
    phone: (v.phone as string) ?? null,
    mobile: (v.mobile as string) ?? null,
    website: (v.website as string) ?? null,
    pec: (v.pec as string) ?? null,
    address_street: street || ((addr.street as string) ?? null),
    address_number: (addr.civico as string) ?? null,
    address_city: (addr.city as string) ?? null,
    address_province: (addr.province as string) ?? null,
    address_postal_code: (addr.zip as string) ?? null,
    address_country: (addr.country as string) ?? 'IT',
    iban: (v.iban as string) ?? null,
    sdi_recipient_code: (v.codice_destinatario as string) ?? null,
    codice_ateco: (v.codice_ateco as string) ?? null,
    legal_form: (v.forma_giuridica as string) ?? null,
  };
}

/** Converte input flat dell'UI → JSONB schema autoritativo. */
function flatToJsonb(prev: Record<string, unknown>, input: FlatSettings): Record<string, unknown> {
  const prevAddr = (prev?.address && typeof prev.address === 'object') ? prev.address as Record<string, unknown> : {};
  const merged: Record<string, unknown> = { ...prev };

  if (input.company_name !== undefined) merged.company_name = input.company_name || null;
  if (input.vat_number !== undefined) { merged.vat = input.vat_number || null; merged.piva = input.vat_number || null; }
  if (input.tax_code !== undefined || input.fiscal_code !== undefined) {
    merged.tax_code = input.tax_code ?? input.fiscal_code ?? null;
  }
  if (input.email !== undefined) merged.email = input.email || null;
  if (input.phone !== undefined) merged.phone = input.phone || null;
  if (input.mobile !== undefined) merged.mobile = input.mobile || null;
  if (input.website !== undefined) merged.website = input.website || null;
  if (input.pec !== undefined) merged.pec = input.pec || null;
  if (input.iban !== undefined) merged.iban = input.iban || null;
  if (input.sdi_recipient_code !== undefined) merged.codice_destinatario = input.sdi_recipient_code || null;
  if (input.codice_ateco !== undefined) merged.codice_ateco = input.codice_ateco || null;
  if (input.legal_form !== undefined) merged.forma_giuridica = input.legal_form || null;

  // Indirizzo come sub-object
  const hasAnyAddress = [
    input.address_street, input.address_number, input.address_city,
    input.address_province, input.address_postal_code, input.address_country,
  ].some((v) => v !== undefined);

  if (hasAnyAddress) {
    merged.address = {
      ...prevAddr,
      street: input.address_street !== undefined ? (input.address_street || null) : prevAddr.street,
      civico: input.address_number !== undefined ? (input.address_number || null) : prevAddr.civico,
      city: input.address_city !== undefined ? (input.address_city || null) : prevAddr.city,
      province: input.address_province !== undefined ? (input.address_province || null) : prevAddr.province,
      zip: input.address_postal_code !== undefined ? (input.address_postal_code || null) : prevAddr.zip,
      country: input.address_country !== undefined ? (input.address_country || 'IT') : (prevAddr.country || 'IT'),
    };
  }

  return merged;
}

// GET — leggi org_settings.key='company' e ritorna formato flat per UI admin
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const orgId = params.id;

    const { data, error } = await supabaseAdmin
      .from('org_settings')
      .select('value, updated_at')
      .eq('org_id', orgId)
      .eq('key', 'company')
      .maybeSingle();

    if (error) {
      console.error('Error fetching org_settings.company:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    const value = (data?.value as Record<string, unknown>) || null;
    const flat = jsonbToFlat(value);
    const settings = value
      ? { org_id: orgId, updated_at: data?.updated_at, ...flat }
      : null;

    return NextResponse.json(
      { success: true, settings },
      { headers: corsHeaders(origin) }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Errore interno del server';
    console.error('Admin get company settings error:', error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

// PUT — crea/aggiorna in org_settings.key='company' (JSONB)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin');
  try {
    const orgId = params.id;
    const body = (await request.json()) as FlatSettings;

    // Campi consentiti (allowlist)
    const allowedFields: (keyof FlatSettings)[] = [
      'company_name', 'company_code', 'legal_form',
      'vat_number', 'tax_code', 'fiscal_code', 'chamber_of_commerce',
      'email', 'phone', 'mobile', 'website', 'fax', 'pec',
      'address_street', 'address_number', 'address_city',
      'address_province', 'address_postal_code', 'address_country', 'address_region',
      'iban', 'sdi_recipient_code', 'codice_ateco',
    ];

    const sanitized: FlatSettings = {};
    for (const k of allowedFields) {
      if (body[k] !== undefined) (sanitized as Record<string, unknown>)[k] = body[k];
    }

    // Carica record esistente (per merge)
    const { data: existing } = await supabaseAdmin
      .from('org_settings')
      .select('value')
      .eq('org_id', orgId)
      .eq('key', 'company')
      .maybeSingle();

    const prevValue = (existing?.value as Record<string, unknown>) || {};
    const nextValue = flatToJsonb(prevValue, sanitized);

    // Validazione minima: company_name obbligatorio se è una nuova creazione
    if (!existing && !nextValue.company_name) {
      return NextResponse.json(
        { success: false, error: 'company_name è obbligatorio per la creazione' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const { error: upsertError } = await supabaseAdmin
      .from('org_settings')
      .upsert(
        {
          org_id: orgId,
          key: 'company',
          value: nextValue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id,key' }
      );

    if (upsertError) {
      console.error('Error upserting org_settings.company:', upsertError);
      return NextResponse.json(
        { success: false, error: upsertError.message },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    // Sync orgs.name col company_name se cambiato
    if (typeof nextValue.company_name === 'string' && nextValue.company_name) {
      await supabaseAdmin
        .from('orgs')
        .update({ name: nextValue.company_name })
        .eq('id', orgId);
    }

    return NextResponse.json(
      {
        success: true,
        settings: { org_id: orgId, ...jsonbToFlat(nextValue) },
        message: 'Impostazioni aziendali aggiornate',
      },
      { headers: corsHeaders(origin) }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Errore interno del server';
    console.error('Admin update company settings error:', error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
