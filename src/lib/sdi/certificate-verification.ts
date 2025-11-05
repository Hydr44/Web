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
    // Verifica User-Agent (SDI usa user agent specifici)
    const userAgent = request.headers.get('user-agent') || '';
    const sdiUserAgents = [
      'SDI',
      'Sistema di Interscambio',
      'FatturaPA',
    ];
    
    const isSDIUserAgent = sdiUserAgents.some(ua => 
      userAgent.toLowerCase().includes(ua.toLowerCase())
    );

    // Verifica IP (SDI usa range IP noti)
    // In produzione, configurare IP whitelist
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0] || realIp || '';
    
    // TODO: Configurare whitelist IP SDI
    // Per ora, accettiamo tutte le richieste (da configurare in produzione)
    const sdiIpWhitelist: string[] = [];
    const isSDIIp = sdiIpWhitelist.length === 0 || sdiIpWhitelist.includes(clientIp);

    // Verifica certificato client (se presente nell'header)
    // In Vercel/AWS, il certificato è gestito a livello di infrastruttura
    const clientCert = request.headers.get('x-client-cert');
    if (clientCert) {
      // Verifica certificato
      const sdiCert = loadSDIClientCert(environment);
      // TODO: Implementare verifica firma certificato
      // Per ora, verifichiamo solo che il certificato sia presente
    }

    // Per ora, accettiamo tutte le richieste
    // In produzione, configurare:
    // 1. IP whitelist SDI
    // 2. Verifica certificato SSL
    // 3. Verifica firma richiesta
    return true; // TODO: Implementare verifica completa

  } catch (error) {
    console.error('[SDI] Errore verifica richiesta:', error);
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

