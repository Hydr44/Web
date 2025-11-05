// Utility per gestione certificati SDI

import * as fs from 'fs';
import * as path from 'path';
import * as forge from 'node-forge';

export type SDIEnvironment = 'test' | 'production';

/**
 * Ottiene il percorso del certificato SDI client (per validare richieste SDI)
 */
export function getSDIClientCertPath(environment: SDIEnvironment): string {
  const certName = environment === 'test'
    ? 'SistemaInterscambioFatturaPATest.cer'
    : 'Sistema_Interscambio_Fattura_PA.cer';
  
  return path.join(process.cwd(), 'certificati', environment, certName);
}

/**
 * Ottiene il percorso del certificato SDI server (per validare chiamate al SDI)
 */
export function getSDIServerCertPath(environment: SDIEnvironment): string {
  const certName = environment === 'test'
    ? 'testservizi.fatturapa.it.cer'
    : 'servizi.fatturapa.it.cer';
  
  return path.join(process.cwd(), 'certificati', environment, certName);
}

/**
 * Ottiene il percorso del certificato client nostro (per autenticare chiamate al SDI)
 */
export function getClientCertPath(): string {
  return path.join(process.cwd(), 'certificati', 'client', 'CER_CLIENT_IT02166430856.cer');
}

/**
 * Ottiene il percorso del certificato server nostro (per autenticarci a SDI)
 */
export function getServerCertPath(): string {
  return path.join(process.cwd(), 'certificati', 'client', 'CER_SERVER_IT02166430856.cer');
}

/**
 * Ottiene il percorso della chiave privata client (se disponibile)
 */
export function getClientKeyPath(): string | null {
  const keyPath = path.join(process.cwd(), 'certificati', 'client', 'CER_CLIENT_IT02166430856.key');
  return fs.existsSync(keyPath) ? keyPath : null;
}

/**
 * Ottiene il percorso della chiave privata server (se disponibile)
 */
export function getServerKeyPath(): string | null {
  const keyPath = path.join(process.cwd(), 'certificati', 'client', 'CER_SERVER_IT02166430856.key');
  return fs.existsSync(keyPath) ? keyPath : null;
}

/**
 * Carica certificato SDI client
 * Nota: Usa gli stessi certificati per test e produzione
 */
export function loadSDIClientCert(environment: SDIEnvironment): string {
  // PRIMA prova da variabile d'ambiente (Vercel Secrets) - più sicuro
  // Usa SDI_TEST_CLIENT_CERT per test, altrimenti SDI_CLIENT_CERT (condiviso)
  const envVar = process.env.SDI_TEST_CLIENT_CERT || process.env.SDI_CLIENT_CERT;
  if (envVar && envVar.trim().length > 0) {
    console.log(`[SDI] Certificato SDI client caricato da variabile d'ambiente`);
    return envVar.trim();
  }
  
  // Poi prova da filesystem (solo per sviluppo locale)
  const certPath = getSDIClientCertPath(environment);
  if (fs.existsSync(certPath)) {
    console.log(`[SDI] Certificato SDI client caricato da filesystem:`, certPath);
    return fs.readFileSync(certPath, 'utf8');
  }
  
  // Se non trovato, il certificato SDI è opzionale per test
  // Possiamo continuare senza verifica completa del certificato SDI in test
  if (environment === 'test') {
    console.warn(`[SDI TEST] Certificato SDI client non trovato - continuo senza verifica completa`);
    return ''; // Restituisce stringa vuota per test
  }
  
  throw new Error(`Certificato SDI client non trovato. Configura SDI_CLIENT_CERT o SDI_TEST_CLIENT_CERT in Vercel Secrets.`);
}

/**
 * Carica certificato SDI server
 * Nota: Usa gli stessi certificati per test e produzione
 */
export function loadSDIServerCert(environment: SDIEnvironment): string {
  // PRIMA prova da variabile d'ambiente (Vercel Secrets) - più sicuro
  // Usa SDI_TEST_SERVER_CERT per test, altrimenti SDI_SERVER_CERT (condiviso)
  const envVar = process.env.SDI_TEST_SERVER_CERT || process.env.SDI_SERVER_CERT;
  if (envVar && envVar.trim().length > 0) {
    console.log(`[SDI] Certificato SDI server caricato da variabile d'ambiente`);
    return envVar.trim();
  }
  
  // Poi prova da filesystem (solo per sviluppo locale)
  const certPath = getSDIServerCertPath(environment);
  if (fs.existsSync(certPath)) {
    console.log(`[SDI] Certificato SDI server caricato da filesystem:`, certPath);
    return fs.readFileSync(certPath, 'utf8');
  }
  
  // Se non trovato, il certificato SDI server è opzionale per test
  // Possiamo continuare senza verifica completa del certificato SDI in test
  if (environment === 'test') {
    console.warn(`[SDI TEST] Certificato SDI server non trovato - continuo senza verifica completa`);
    return ''; // Restituisce stringa vuota per test
  }
  
  throw new Error(`Certificato SDI server non trovato. Configura SDI_SERVER_CERT o SDI_TEST_SERVER_CERT in Vercel Secrets.`);
}

/**
 * Carica certificato client nostro
 */
export function loadClientCert(): string {
  // PRIMA prova da variabile d'ambiente (Vercel Secrets) - più sicuro
  const envCert = process.env.SDI_CLIENT_CERT;
  if (envCert && envCert.trim().length > 0) {
    console.log('[SDI] Certificato client caricato da variabile d\'ambiente SDI_CLIENT_CERT');
    return envCert.trim();
  }
  
  // Poi prova da filesystem (solo per sviluppo locale)
  const certPath = getClientCertPath();
  if (fs.existsSync(certPath)) {
    console.log('[SDI] Certificato client caricato da filesystem:', certPath);
    return fs.readFileSync(certPath, 'utf8');
  }
  
  // Se non trovato, prova a convertire da DER se esiste
  const derPath = certPath.replace(/\.cer$/, '.cer');
  if (fs.existsSync(derPath)) {
    try {
      const { execSync } = require('child_process');
      const pemCert = execSync(`openssl x509 -inform DER -in "${derPath}" -outform PEM`, { encoding: 'utf8' });
      console.log('[SDI] Certificato client convertito da DER a PEM');
      return pemCert;
    } catch (error) {
      // Ignora errori di conversione
    }
  }
  
  throw new Error(`Certificato client non trovato. Configura SDI_CLIENT_CERT in Vercel Secrets o salva il file in: ${certPath}`);
}

/**
 * Carica chiave privata client (se disponibile)
 */
export function loadClientKey(): string | null {
  // PRIMA prova da variabile d'ambiente (Vercel Secrets) - più sicuro
  const envKey = process.env.SDI_CLIENT_KEY;
  if (envKey && envKey.trim().length > 0) {
    console.log('[SDI] Chiave privata caricata da variabile d\'ambiente SDI_CLIENT_KEY');
    return envKey.trim();
  }
  
  // Poi prova da filesystem (solo per sviluppo locale)
  const keyPath = getClientKeyPath();
  if (keyPath && fs.existsSync(keyPath)) {
    console.log('[SDI] Chiave privata caricata da filesystem:', keyPath);
    return fs.readFileSync(keyPath, 'utf8');
  }
  
  return null;
}

/**
 * Verifica che un certificato sia valido e corrisponda al certificato SDI atteso
 */
export function verifySDICertificate(
  clientCertPem: string,
  environment: SDIEnvironment = 'production'
): boolean {
  try {
    const sdiCertPem = loadSDIClientCert(environment);
    const sdiCert = forge.pki.certificateFromPem(sdiCertPem);
    const clientCert = forge.pki.certificateFromPem(clientCertPem);

    // Verifica che il certificato client corrisponda al certificato SDI
    // In realtà, SDI usa il suo certificato per firmare, quindi verifichiamo la firma
    return sdiCert.verify(clientCert);
  } catch (error) {
    console.error('Errore verifica certificato SDI:', error);
    return false;
  }
}

/**
 * Carica certificati CA per validare catena di certificati
 */
export function loadCACerts(environment: SDIEnvironment): string[] {
  const caDir = path.join(process.cwd(), 'certificati', environment);
  const caFiles = [
    environment === 'test' ? 'CAEntratetest.cer' : 'caentrate.cer',
    'Sectigo_CA_OV_R36.cer',
    'Sectigo_Root_R46.cer',
  ];

  if (environment === 'production') {
    caFiles.push('UserTrustCA.cer');
  }

  const caCerts: string[] = [];
  for (const caFile of caFiles) {
    const caPath = path.join(caDir, caFile);
    if (fs.existsSync(caPath)) {
      caCerts.push(fs.readFileSync(caPath, 'utf8'));
    }
  }

  return caCerts;
}

/**
 * Configurazione certificati per SOAP client
 */
export interface SOAPCertConfig {
  cert: string;
  key?: string;
  ca?: string[];
  rejectUnauthorized?: boolean;
}

/**
 * Ottiene configurazione certificati per SOAP client (trasmissione)
 */
export function getSOAPClientConfig(environment: SDIEnvironment): SOAPCertConfig {
  const cert = loadClientCert();
  const key = loadClientKey();
  const ca = loadCACerts(environment);
  const serverCert = loadSDIServerCert(environment);

  return {
    cert,
    key: key || undefined,
    ca: [...ca, serverCert],
    rejectUnauthorized: true,
  };
}

