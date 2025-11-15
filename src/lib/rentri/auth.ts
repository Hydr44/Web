import 'server-only';

import { createPrivateKey, randomUUID, sign as signData } from 'crypto';
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

const resolvedSecrets = {
  privateKey: resolveSecret(env.privateKey, env.privateKeyFile),
  certificate: resolveSecret(env.certificate, env.certificateFile),
};

const normalizedPrivateKey = resolvedSecrets.privateKey
  ? normalizeMultilineEnv(resolvedSecrets.privateKey)
  : undefined;

const privateKeyObject = normalizedPrivateKey ? createPrivateKey(normalizedPrivateKey) : undefined;
const keyConfig = privateKeyObject ? getKeyConfig(privateKeyObject.asymmetricKeyType) : null;

if (!privateKeyObject || !resolvedSecrets.certificate || !env.issuer || !keyConfig) {
  console.warn(
    '[RENTRI AUTH] Variabili mancanti. Impostare RENTRI_JWT_PRIVATE_KEY, RENTRI_JWT_CERT e RENTRI_JWT_ISSUER.',
  );
}

function ensureConfig() {
  if (!privateKeyObject || !resolvedSecrets.certificate || !env.issuer || !keyConfig) {
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
    alg: keyConfig.jwtAlg,
    typ: 'JWT',
    x5c: extractCertificates(resolvedSecrets.certificate!),
  };

  const headerPart = toBase64Url(JSON.stringify(header));
  const payloadPart = toBase64Url(JSON.stringify(payload));
  const dataToSign = `${headerPart}.${payloadPart}`;

  const signature = signJwt(dataToSign, keyConfig);

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

function getKeyConfig(keyType: string | undefined) {
  if (keyType === 'rsa' || keyType === 'rsa-pss') {
    return { jwtAlg: 'RS256', signAlgorithm: 'RSA-SHA256' as const };
  }
  if (keyType === 'ec') {
    return { jwtAlg: 'ES256', signAlgorithm: 'sha256' as const, dsaEncoding: 'ieee-p1363' as const };
  }
  throw new Error(`Tipo di chiave non supportato per RENTRI JWT: ${keyType}`);
}

function signJwt(data: string, config: ReturnType<typeof getKeyConfig>) {
  if (!privateKeyObject) throw new Error('Chiave privata non disponibile');
  if ('dsaEncoding' in config) {
    return signData(null, Buffer.from(data), {
      key: privateKeyObject,
      dsaEncoding: config.dsaEncoding,
    }).toString('base64url');
  }
  return signData(config.signAlgorithm, Buffer.from(data), privateKeyObject).toString('base64url');
}


