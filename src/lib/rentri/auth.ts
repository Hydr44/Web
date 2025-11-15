import 'server-only';

import { createSign, randomUUID } from 'crypto';
import { readFileSync } from 'fs';

const env = {
  privateKey: process.env.RENTRI_JWT_PRIVATE_KEY,
  privateKeyFile: process.env.RENTRI_JWT_PRIVATE_KEY_FILE,
  certificate: process.env.RENTRI_JWT_CERT,
  certificateFile: process.env.RENTRI_JWT_CERT_FILE,
  audience: process.env.RENTRI_JWT_AUDIENCE ?? 'rentrigov.demo.api',
  issuer: process.env.RENTRI_JWT_ISSUER,
  ttlSeconds: Number.parseInt(process.env.RENTRI_JWT_TTL_SECONDS ?? '', 10) || 55, // short-lived token
};

const resolvedSecrets = {
  privateKey: resolveSecret(env.privateKey, env.privateKeyFile),
  certificate: resolveSecret(env.certificate, env.certificateFile),
};

if (!resolvedSecrets.privateKey || !resolvedSecrets.certificate || !env.issuer) {
  console.warn(
    '[RENTRI AUTH] Variabili mancanti. Impostare RENTRI_JWT_PRIVATE_KEY, RENTRI_JWT_CERT e RENTRI_JWT_ISSUER.',
  );
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

let cachedAuthorization: CachedToken | null = null;

const CERT_BLOCK_REGEX = /-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g;

const extractCertificates = (pemContent: string): string[] => {
  const matches = pemContent.match(CERT_BLOCK_REGEX);
  if (matches && matches.length > 0) {
    return matches.map(stripPem);
  }
  return [stripPem(pemContent)];
};

const stripPem = (pem: string) =>
  pem.replace(/-----BEGIN [^-]+-----/g, '').replace(/-----END [^-]+-----/g, '').replace(/\s+/g, '');

const toBase64Url = (input: string | Buffer) => Buffer.from(input).toString('base64url');

const normalizeMultilineEnv = (value: string) => value.replace(/\\n/g, '\n').trim();

function ensureConfig() {
  if (!resolvedSecrets.privateKey || !resolvedSecrets.certificate || !env.issuer) {
    throw new Error(
      'Configurazione RENTRI JWT mancante. Definire RENTRI_JWT_PRIVATE_KEY, RENTRI_JWT_CERT e RENTRI_JWT_ISSUER.',
    );
  }
}

function buildJwtToken(): { token: string; expiresAt: number } {
  ensureConfig();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const exp = nowSeconds + env.ttlSeconds;
  const payload = {
    jti: randomUUID(),
    aud: env.audience,
    iss: env.issuer!,
    iat: nowSeconds,
    nbf: nowSeconds,
    exp,
  };

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    x5c: extractCertificates(resolvedSecrets.certificate!),
  };

  const headerPart = toBase64Url(JSON.stringify(header));
  const payloadPart = toBase64Url(JSON.stringify(payload));
  const dataToSign = `${headerPart}.${payloadPart}`;

  const sign = createSign('RSA-SHA256');
  sign.update(dataToSign);
  sign.end();
  const signature = sign.sign(normalizeMultilineEnv(resolvedSecrets.privateKey!), 'base64url');

  return {
    token: `${dataToSign}.${signature}`,
    expiresAt: exp,
  };
}

export async function getRentriAuthorizationToken(): Promise<string> {
  if (cachedAuthorization && cachedAuthorization.expiresAt - 5 > Math.floor(Date.now() / 1000)) {
    return cachedAuthorization.value;
  }
  const jwt = buildJwtToken();
  cachedAuthorization = {
    value: jwt.token,
    expiresAt: jwt.expiresAt,
  };
  return jwt.token;
}

function resolveSecret(value?: string | null, filePath?: string | null): string | undefined {
  if (value && value.trim().length > 0) {
    return value;
  }
  if (filePath) {
    try {
      return readFileSync(filePath, 'utf8');
    } catch (error) {
      console.warn(`[RENTRI AUTH] Impossibile leggere il file ${filePath}:`, error);
    }
  }
  return undefined;
}


