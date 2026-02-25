import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

// Definizione statica dei flag disponibili (metadata)
// Coprono TUTTE le funzionalità dell'app desktop/mobile/web
const FLAG_DEFINITIONS = [
  // === MODULI CORE ===
  { id: 'veicoli_enabled', name: 'Gestione Veicoli', description: 'Anagrafica veicoli, pratiche, documenti', category: 'modules', default: true },
  { id: 'clienti_enabled', name: 'Gestione Clienti', description: 'CRM clienti, contatti, timeline', category: 'modules', default: true },
  { id: 'trasporti_enabled', name: 'Trasporti', description: 'Gestione trasporti, autisti, programmazione', category: 'modules', default: true },
  { id: 'ricambi_enabled', name: 'Ricambi & Magazzino', description: 'Catalogo ricambi, giacenze, codici interni, prezzi', category: 'modules', default: true },
  { id: 'piazzale_enabled', name: 'Piazzale', description: 'Mappa piazzale, posizioni veicoli, settori', category: 'modules', default: true },
  { id: 'fatture_enabled', name: 'Fatturazione', description: 'Emissione fatture, note di credito, pagamenti', category: 'modules', default: true },
  { id: 'contabilita_enabled', name: 'Contabilità', description: 'Piano dei conti, partita doppia, prima nota', category: 'modules', default: true },
  { id: 'vendite_enabled', name: 'Modulo Vendite', description: 'Preventivi, ordini, dashboard vendite', category: 'modules', default: true },
  { id: 'marketplace_enabled', name: 'Marketplace B2B', description: 'Vetrina ricambi, ordini B2B tra demolitori', category: 'modules', default: false },
  { id: 'assist_enabled', name: 'Assistenza Clienti', description: 'Sistema assist remoto, ticket supporto', category: 'modules', default: true },
  { id: 'etichette_enabled', name: 'Etichette & Stampe', description: 'Generazione etichette, stampa documenti', category: 'modules', default: true },
  { id: 'calendario_enabled', name: 'Calendario', description: 'Calendario attività, scadenze, promemoria', category: 'modules', default: true },
  { id: 'dashboard_analytics', name: 'Dashboard Analytics', description: 'Dashboard con grafici e statistiche avanzate', category: 'modules', default: true },

  // === INTEGRAZIONI GOVERNATIVE ===
  { id: 'sdi_enabled', name: 'SDI / Fattura Elettronica', description: 'Invio e ricezione fatture tramite SDI-SFTP', category: 'integrations', default: true },
  { id: 'rentri_enabled', name: 'RENTRI', description: 'Registro rifiuti, formulari, MUD', category: 'integrations', default: true },
  { id: 'rvfu_enabled', name: 'RVFU (MIT)', description: 'Radiazione veicoli fuori uso presso MIT', category: 'integrations', default: false },
  { id: 'pra_enabled', name: 'PRA / ACI', description: 'Pratiche PRA, visure ACI', category: 'integrations', default: false },

  // === MOBILE APP ===
  { id: 'mobile_app_enabled', name: 'App Mobile', description: 'Accesso app mobile per autisti', category: 'mobile', default: true },
  { id: 'mobile_foto_enabled', name: 'Foto da Mobile', description: 'Scatto e upload foto veicoli da mobile', category: 'mobile', default: true },
  { id: 'mobile_firma_enabled', name: 'Firma Digitale Mobile', description: 'Firma documenti da mobile', category: 'mobile', default: true },
  { id: 'mobile_gps_enabled', name: 'Tracking GPS', description: 'Tracciamento posizione autisti in tempo reale', category: 'mobile', default: false },

  // === NOTIFICHE ===
  { id: 'email_notifications', name: 'Notifiche Email', description: 'Notifiche automatiche via email', category: 'notifications', default: true },
  { id: 'push_notifications', name: 'Push Notifications', description: 'Notifiche push su app mobile', category: 'notifications', default: false },
  { id: 'scadenze_alerts', name: 'Alert Scadenze', description: 'Avvisi automatici per scadenze documenti', category: 'notifications', default: true },
  { id: 'sdi_notifications', name: 'Notifiche SDI', description: 'Alert su esiti fatture SDI', category: 'notifications', default: true },

  // === SICUREZZA ===
  { id: 'two_factor_auth', name: 'Autenticazione 2FA', description: 'Autenticazione a due fattori obbligatoria', category: 'security', default: false },
  { id: 'registration_open', name: 'Registrazione Aperta', description: 'Consenti nuove registrazioni dal sito', category: 'security', default: true },
  { id: 'operator_login', name: 'Login Operatori', description: 'Accesso multi-operatore con PIN', category: 'security', default: true },
  { id: 'audit_trail', name: 'Audit Trail', description: 'Log dettagliato di tutte le azioni', category: 'security', default: true },
  { id: 'ip_whitelist', name: 'IP Whitelist', description: 'Restrizione accesso per IP', category: 'security', default: false },

  // === AVANZATE ===
  { id: 'ai_validation', name: 'Validazione AI', description: 'Validazione intelligente documenti e fatture', category: 'advanced', default: true },
  { id: 'bulk_import', name: 'Import Massivo', description: 'Importazione dati da CSV/Excel', category: 'advanced', default: true },
  { id: 'api_access', name: 'Accesso API', description: 'API REST per integrazioni esterne', category: 'advanced', default: false },
  { id: 'webhook_enabled', name: 'Webhooks', description: 'Notifiche webhook su eventi', category: 'advanced', default: false },
  { id: 'white_label', name: 'White Label', description: 'Personalizzazione brand e loghi', category: 'advanced', default: false },
];

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin');

    // Legge feature_flags da system_settings
    const { data } = await supabaseAdmin
      .from('system_settings')
      .select('value')
      .eq('key', 'feature_flags')
      .single();

    const savedFlags: Record<string, boolean> = data?.value && typeof data.value === 'object' ? data.value : {};

    // Merge definizioni con valori salvati
    const flags = FLAG_DEFINITIONS.map(def => ({
      id: def.id,
      name: def.name,
      description: def.description,
      category: def.category,
      enabled: savedFlags[def.id] !== undefined ? savedFlags[def.id] : def.default,
    }));

    return NextResponse.json({ success: true, flags }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Admin settings feature flags API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500, headers: corsHeaders(origin) });
  }
}

export async function PUT(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const body = await request.json();
    const { flags } = body;

    // Costruisce oggetto { flag_id: boolean }
    const flagValues: Record<string, boolean> = {};
    for (const flag of flags) {
      flagValues[flag.id] = flag.enabled;
    }

    // Upsert in system_settings
    const { error } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        key: 'feature_flags',
        value: flagValues,
        description: 'Feature flags globali',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    if (error) {
      console.error('Error saving feature flags:', error);
      return NextResponse.json({ success: false, error: 'Errore salvataggio feature flags' }, { status: 500, headers: corsHeaders(origin) });
    }

    return NextResponse.json({ success: true, message: 'Feature flags aggiornate con successo' }, { headers: corsHeaders(origin) });

  } catch (error: any) {
    console.error('Admin settings update feature flags API error:', error);
    const origin = request.headers.get('origin');
    return NextResponse.json({ success: false, error: 'Errore interno del server' }, { status: 500, headers: corsHeaders(origin) });
  }
}
