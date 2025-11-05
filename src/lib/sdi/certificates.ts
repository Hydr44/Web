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
 */
export function loadSDIClientCert(environment: SDIEnvironment): string {
  const certPath = getSDIClientCertPath(environment);
  if (!fs.existsSync(certPath)) {
    throw new Error(`Certificato SDI client non trovato: ${certPath}`);
  }
  return fs.readFileSync(certPath, 'utf8');
}

/**
 * Carica certificato SDI server
 */
export function loadSDIServerCert(environment: SDIEnvironment): string {
  const certPath = getSDIServerCertPath(environment);
  if (!fs.existsSync(certPath)) {
    throw new Error(`Certificato SDI server non trovato: ${certPath}`);
  }
  return fs.readFileSync(certPath, 'utf8');
}

/**
 * Carica certificato client nostro
 */
export function loadClientCert(): string {
  const certPath = getClientCertPath();
  if (!fs.existsSync(certPath)) {
    throw new Error(`Certificato client non trovato: ${certPath}`);
  }
  return fs.readFileSync(certPath, 'utf8');
}

/**
 * Carica chiave privata client (se disponibile)
 */
export function loadClientKey(): string | null {
  const keyPath = getClientKeyPath();
  if (!keyPath) return null;
  return fs.readFileSync(keyPath, 'utf8');
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

