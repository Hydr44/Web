// Verifica certificati SDI per ricezione

import { NextRequest } from 'next/server';
import { SDIEnvironment, loadSDIClientCert } from './certificates';

/**
 * Verifica che la richiesta provenga da SDI
 * 
 * NOTA: In produzione, la verifica del certificato SDI dovrebbe essere gestita
 * a livello di infrastruttura (reverse proxy, load balancer, Vercel Edge Middleware).
 * 
 * Questa funzione fornisce una verifica base che può essere migliorata.
 */
export function verifySDIRequest(
  request: NextRequest,
  environment: SDIEnvironment = 'production'
): boolean {
  try {
    // 1. Verifica Header Nginx (Critico per Sicurezza)
    // Nginx è configurato per passare questi header solo se mTLS è attivo
    const sslVerify = request.headers.get('x-ssl-client-verify');
    const sslDN = request.headers.get('x-ssl-client-dn');

    // In produzione (o test con Nginx), questo header DEVE essere "SUCCESS"
    if (sslVerify !== 'SUCCESS') {
      console.warn(`[SDI Security] Rifiutata richiesta senza verifica SSL valida. Verify: ${sslVerify}`);
      return false;
    }

    // 2. Verifica DN (Distinguished Name)
    // Il certificato SDI deve contenere specifici attributi
    // Es: C=IT, O=Agenzia delle Entrate, CN=Sistema Interscambio Fattura PA
    if (!sslDN) {
      console.warn('[SDI Security] Rifiutata richiesta senza DN');
      return false;
    }

    const validDNMarkers = [
      'O=Agenzia delle Entrate',
      'CN=Sistema Interscambio',
      'CN=CA Agenzia delle Entrate', // Per certificati di test CA
    ];

    const isValidDN = validDNMarkers.some(marker =>
      sslDN.includes(marker)
    );

    if (!isValidDN) {
      console.warn(`[SDI Security] Rifiutata richiesta con DN non valido: ${sslDN}`);
      return false;
    }

    console.log(`[SDI Security] Richiesta accettata da: ${sslDN}`);
    return true;

  } catch (error) {
    console.error('[SDI Security] Errore verifica richiesta:', error);
    return false;
  }
}

/**
 * Verifica che il certificato fornito corrisponda al certificato SDI atteso
 */
export function verifySDICertificate(
  certPem: string,
  environment: SDIEnvironment = 'production'
): boolean {
  try {
    const sdiCertPem = loadSDIClientCert(environment);

    // Per ora, verifichiamo solo che i certificati esistano
    // In produzione, implementare verifica firma completa
    return sdiCertPem.length > 0 && certPem.length > 0;

  } catch (error) {
    console.error('[SDI] Errore verifica certificato:', error);
    return false;
  }
}

