/**
 * Utility per firma e cifratura file SDI-SFTP
 * Utilizza node-forge per PKCS#7 e cifratura AES
 */

import * as forge from 'node-forge';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Carica certificato P12
 */
export function loadP12Certificate(
  certPath: string,
  password: string
): { privateKey: forge.pki.PrivateKey; certificate: forge.pki.Certificate } {
  const p12Der = readFileSync(certPath, 'binary');
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
  
  // Estrai chiave privata e certificato
  const bags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = bags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  
  if (!keyBag || !certBag) {
    throw new Error('Certificato P12 non valido: chiave privata o certificato non trovati');
  }
  
  return {
    privateKey: keyBag.key as forge.pki.PrivateKey,
    certificate: certBag.cert as forge.pki.Certificate,
  };
}

/**
 * Carica certificato pubblico PEM
 */
export function loadPublicCertificatePEM(certPath: string): forge.pki.Certificate {
  const certPEM = readFileSync(certPath, 'utf8');
  return forge.pki.certificateFromPem(certPEM);
}

/**
 * Firma file ZIP con PKCS#7
 * @param filePath Path al file da firmare (o Buffer)
 * @param certPath Path al certificato P12 per firma
 * @param password Password del certificato P12
 * @returns Buffer del file firmato (PKCS#7)
 */
export async function signFile(
  filePath: string | Buffer,
  certPath: string,
  password: string
): Promise<Buffer> {
  const { privateKey, certificate } = loadP12Certificate(certPath, password);
  
  const fileBuffer = typeof filePath === 'string' 
    ? readFileSync(filePath)
    : filePath;
  
  // Crea PKCS#7 SignedData
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(fileBuffer.toString('binary'));
  p7.addCertificate(certificate);
  p7.addSigner({
    key: privateKey,
    certificate,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      {
        type: forge.pki.oids.contentType,
        value: forge.pki.oids.data,
      },
      {
        type: forge.pki.oids.messageDigest,
      },
      {
        type: forge.pki.oids.signingTime,
        value: new Date(),
      },
    ],
  });
  
  p7.sign({ detached: false });
  const signedData = forge.asn1.toDer(p7.toAsn1()).getBytes();
  
  return Buffer.from(signedData, 'binary');
}

/**
 * Cifra file con AES-256-CBC usando certificato pubblico SDI
 * @param fileBuffer Buffer del file da cifrare
 * @param publicCertPath Path al certificato pubblico SDI (sogeiunicocifra.pem)
 * @returns Buffer del file cifrato
 */
export async function encryptFile(
  fileBuffer: Buffer,
  publicCertPath: string
): Promise<Buffer> {
  const publicCert = loadPublicCertificatePEM(publicCertPath);
  const publicKey = publicCert.publicKey as forge.pki.rsa.PublicKey;
  
  // Genera chiave simmetrica AES-256 e IV
  const key = forge.random.getBytesSync(32); // 256 bit
  const iv = forge.random.getBytesSync(16); // 128 bit
  
  // Cifra file con AES-256-CBC
  const cipher = forge.cipher.createCipher('AES-CBC', key);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(fileBuffer.toString('binary')));
  cipher.finish();
  const encrypted = cipher.output;
  
  // Cifra chiave simmetrica con chiave pubblica RSA
  const encryptedKey = publicKey.encrypt(key, 'RSA-OAEP');
  
  // Costruisci formato PKCS#7 EnvelopedData (semplificato)
  // Nota: Per SDI potrebbe essere necessario un formato specifico
  // Consultare manuale SDI_SFTP_Massivi_v2.pdf per dettagli
  
  // Per ora, ritorniamo un formato semplice (da adattare)
  const result = Buffer.concat([
    Buffer.from(encryptedKey, 'binary'),
    Buffer.from(iv, 'binary'),
    Buffer.from(encrypted.getBytes(), 'binary'),
  ]);
  
  return result;
}

/**
 * Decifra file usando certificato privato
 * @param encryptedBuffer Buffer del file cifrato
 * @param certPath Path al certificato P12 per decifratura
 * @param password Password del certificato P12
 * @returns Buffer del file decifrato
 */
export async function decryptFile(
  encryptedBuffer: Buffer,
  certPath: string,
  password: string
): Promise<Buffer> {
  const { privateKey } = loadP12Certificate(certPath, password);
  const rsaKey = privateKey as forge.pki.rsa.PrivateKey;
  
  // Estrai chiave cifrata, IV e dati (formato dipende da SDI)
  // Nota: Formato da verificare con manuale SDI
  
  // Placeholder - da implementare secondo specifiche SDI
  throw new Error('Decifratura non ancora implementata - consultare manuale SDI');
}

