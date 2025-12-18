/**
 * Recupera i siti (unità locali) registrati per un operatore RENTRI
 * 
 * API: GET /anagrafiche/v1.0/operatore/{num_iscr}/siti
 */

import { generateRentriJWTDynamic } from './jwt-dynamic';

export interface RentriSito {
  num_iscr_sito: string;
  num_iscr_operatore: string;
  denominazione_operatore: string;
  identificativo_operatore: string;
  nome: string;
  is_sede_legale: boolean;
  comune_id: string;
  provincia_id: string;
  indirizzo: string;
  civico: string;
  attivita: string[]; // CentroRaccolta, Produzione, Recupero, Smaltimento, Trasporto, IntermediazioneSenzaDetenzione
  data_iscrizione: string;
}

export async function getRentriSitiOperatore(
  numIscrOperatore: string,
  cert: {
    cf_operatore: string;
    certificate_pem: string;
    private_key_pem: string;
    environment: string;
  }
): Promise<RentriSito[]> {
  
  // 1. Genera JWT per autenticazione
  const jwt = await generateRentriJWTDynamic({
    issuer: cert.cf_operatore,
    certificatePem: cert.certificate_pem,
    privateKeyPem: cert.private_key_pem,
    audience: cert.environment === 'demo' ? 'rentrigov.demo.api' : 'rentrigov.api'
  });
  
  // 2. Chiama API RENTRI
  const baseUrl = cert.environment === 'demo'
    ? 'https://demoapi.rentri.gov.it'
    : 'https://api.rentri.gov.it';
    
  const url = `${baseUrl}/anagrafiche/v1.0/operatore/${numIscrOperatore}/siti`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Accept': 'application/json'
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Errore recupero siti RENTRI (${response.status}): ${error}`);
  }
  
  const siti: RentriSito[] = await response.json();
  return siti;
}

/**
 * Trova il num_iscr_sito della sede legale o del primo sito disponibile
 */
export function getDefaultNumIscrSito(siti: RentriSito[]): string | null {
  if (!siti || siti.length === 0) return null;
  
  // Preferisci la sede legale
  const sedeLegale = siti.find(s => s.is_sede_legale);
  if (sedeLegale) return sedeLegale.num_iscr_sito;
  
  // Altrimenti, primo sito disponibile
  return siti[0].num_iscr_sito;
}



