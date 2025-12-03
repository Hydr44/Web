/**
 * RENTRI JWT Generator - Dynamic (from DB certificates)
 * Genera JWT per autenticazione RENTRI usando certificati dal database
 */

import { createPrivateKey, randomUUID } from 'crypto';

interface JWTOptions {
  issuer: string;              // CF operatore (es: SCZMNL05L21D960T)
  certificatePem: string;      // Certificato PEM
  privateKeyPem: string;       // Chiave privata PEM
  audience?: string;           // rentrigov.demo.api o rentrigov.api
  ttlSeconds?: number;         // Default: 55 secondi
}

/**
 * Genera JWT ES256 per RENTRI con certificato dinamico dal DB
 */
export async function generateRentriJWTDynamic(options: JWTOptions): Promise<string> {
  const {
    issuer,
    certificatePem,
    privateKeyPem,
    audience = 'rentrigov.demo.api',
    ttlSeconds = 55
  } = options;
  
  // 1. Parse chiave privata
  const privateKey = createPrivateKey(privateKeyPem);
  
  // 2. Estrai certificato (x5c header)
  const certChain = extractCertificates(certificatePem);
  
  // 3. Crea JWT header
  const header = {
    alg: 'ES256',
    typ: 'JWT',
    x5c: certChain // Array di certificati in base64
  };
  
  // 4. Crea JWT payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: issuer,                    // CF operatore
    aud: audience,                  // rentrigov.demo.api
    exp: now + ttlSeconds,          // Scadenza (55s)
    iat: now,                       // Issued at
    nbf: now,                       // Not before
    jti: randomUUID()               // JWT ID univoco
  };
  
  // 5. Codifica header e payload
  const headerB64 = toBase64Url(JSON.stringify(header));
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  
  // 6. Firma con ES256
  const signatureInput = `${headerB64}.${payloadB64}`;
  const signature = signES256(signatureInput, privateKey);
  
  // 7. Costruisci JWT finale
  const jwt = `${headerB64}.${payloadB64}.${signature}`;
  
  console.log('[RENTRI-JWT] JWT generato:', {
    issuer,
    audience,
    expires_in: ttlSeconds,
    jwt_length: jwt.length
  });
  
  return jwt;
}

/**
 * Estrae certificati da PEM (supporta chain)
 */
function extractCertificates(pemContent: string): string[] {
  const certRegex = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
  const matches = pemContent.match(certRegex);
  
  if (!matches || matches.length === 0) {
    throw new Error('Nessun certificato trovato nel PEM');
  }
  
  return matches.map(cert => stripPem(cert));
}

/**
 * Rimuove header/footer PEM e whitespace
 */
function stripPem(pem: string): string {
  return pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
}

/**
 * Converte a Base64URL
 */
function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Firma con ES256 (ECDSA SHA-256)
 */
function signES256(data: string, privateKey: any): string {
  const { sign } = require('crypto');
  
  const signature = sign('sha256', Buffer.from(data), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363' // Formato raw per ES256
  });
  
  return toBase64Url(signature);
}

/**
 * Verifica JWT (per debug)
 */
export function verifyJWT(jwt: string): { header: any; payload: any; valid: boolean } {
  const parts = jwt.split('.');
  
  if (parts.length !== 3) {
    return { header: null, payload: null, valid: false };
  }
  
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    return { header, payload, valid: true };
  } catch {
    return { header: null, payload: null, valid: false };
  }
}

