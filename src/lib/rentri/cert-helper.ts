/**
 * Helper per recupero certificato RENTRI con ambiente dinamico
 * Centralizza la logica di ricerca certificato + risoluzione audience JWT
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface RentriCert {
  id: string;
  org_id: string;
  cf_operatore: string;
  ragione_sociale: string | null;
  rentri_id: string | null;
  certificate_pem: string;
  private_key_pem: string;
  ca_chain_pem: string | null;
  certificate_password: string | null;
  serial_number: string | null;
  subject_dn: string | null;
  issuer_dn: string | null;
  environment: 'demo' | 'prod';
  issued_at: string;
  expires_at: string;
  is_active: boolean;
  is_default: boolean;
  num_iscr_sito?: string;
  note: string | null;
}

export interface CertResult {
  cert: RentriCert | null;
  error: string | null;
}

/**
 * Recupera il certificato RENTRI attivo per un'organizzazione.
 * Cerca prima il certificato default, poi il primo attivo.
 * L'ambiente viene determinato dalle impostazioni dell'organizzazione.
 */
export async function getActiveCert(orgId: string, environment?: string): Promise<CertResult> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Se non specificato, recupera l'ambiente dalle impostazioni org
  let env = environment;
  if (!env) {
    const { data: orgSettings } = await supabase
      .from("org_settings")
      .select("rentri_environment")
      .eq("org_id", orgId)
      .maybeSingle();
    env = orgSettings?.rentri_environment || "demo";
  }

  // Prova prima con is_default = true
  const { data: certDefault, error: errorDefault } = await supabase
    .from("rentri_org_certificates")
    .select("*")
    .eq("org_id", orgId)
    .eq("environment", env)
    .eq("is_active", true)
    .eq("is_default", true)
    .maybeSingle();

  if (certDefault) {
    // Verifica scadenza
    if (new Date(certDefault.expires_at) < new Date()) {
      return { cert: null, error: "Certificato RENTRI scaduto" };
    }
    return { cert: certDefault as RentriCert, error: null };
  }

  // Fallback: primo certificato attivo
  const { data: certActive, error: errorActive } = await supabase
    .from("rentri_org_certificates")
    .select("*")
    .eq("org_id", orgId)
    .eq("environment", env)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (certActive) {
    if (new Date(certActive.expires_at) < new Date()) {
      return { cert: null, error: "Certificato RENTRI scaduto" };
    }
    return { cert: certActive as RentriCert, error: null };
  }

  return {
    cert: null,
    error: `Certificato RENTRI non trovato (org=${orgId}, env=${env})`
  };
}

/**
 * Restituisce l'audience JWT corretta per l'ambiente
 */
export function getAudience(environment: string): string {
  return environment === "prod" ? "rentrigov.api" : "rentrigov.demo.api";
}

/**
 * Restituisce il base URL del gateway RENTRI per l'ambiente
 */
export function getGatewayUrl(environment: string): string {
  if (environment === "prod") {
    return process.env.RENTRI_GATEWAY_URL_PROD || "https://rentri.rescuemanager.eu";
  }
  return process.env.RENTRI_GATEWAY_URL || "https://rentri-test.rescuemanager.eu";
}
