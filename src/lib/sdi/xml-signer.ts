// Firma digitale XML con CAdES-BES per SDI
// Genera file .xml.p7m (PKCS#7) conforme alle specifiche SDI

import * as forge from 'node-forge';
import * as fs from 'fs';
import { loadClientCert, loadClientKey } from './certificates';

type ForgeByteBuffer = forge.util.ByteBuffer;

function isForgeByteBuffer(value: unknown): value is ForgeByteBuffer {
  return typeof value === 'object' && value !== null && typeof (value as ForgeByteBuffer).getBytes === 'function';
}

function extractBytesFromAsn1Node(node: unknown): string {
  if (!node) {
    return '';
  }

  if (typeof node === 'string') {
    return node;
  }

  if (
    typeof node === 'object' &&
    node !== null &&
    'value' in (node as Record<string, unknown>)
  ) {
    const value = (node as { value: unknown }).value;

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(extractBytesFromAsn1Node).join('');
    }
  }

  return '';
}

/**
 * Opzioni per la firma digitale
 */
export interface SignOptions {
  certPath?: string;
  keyPath?: string;
  certPem?: string;
  keyPem?: string;
  password?: string; // Password per chiave privata (se protetta)
}

/**
 * Firma XML FatturaPA con CAdES-BES e genera file .xml.p7m
 * @param xmlString XML FatturaPA da firmare
 * @param options Opzioni per la firma (certificato, chiave privata)
 * @returns Buffer del file .xml.p7m firmato
 */
export async function signFatturaPAXML(
  xmlString: string,
  options: SignOptions = {}
): Promise<Buffer> {
  try {
    // Carica certificato e chiave privata
    let certPem: string;
    let keyPem: string;

    if (options.certPem && options.keyPem) {
      certPem = options.certPem;
      keyPem = options.keyPem;
    } else if (options.certPath && options.keyPath) {
      certPem = fs.readFileSync(options.certPath, 'utf8');
      keyPem = fs.readFileSync(options.keyPath, 'utf8');
    } else {
      // Usa certificato e chiave di default
      certPem = loadClientCert();
      const keyPath = loadClientKey();
      if (!keyPath) {
        throw new Error('Chiave privata non trovata. Impossibile firmare l\'XML.');
      }
      keyPem = keyPath;
    }

    // Parse certificato e chiave
    const cert = forge.pki.certificateFromPem(certPem);
    let privateKey: forge.pki.PrivateKey;

    // Prova a caricare chiave in diversi formati
    try {
      privateKey = forge.pki.privateKeyFromPem(keyPem);
    } catch {
      // Se è una chiave protetta con password, prova a decriptarla
      if (options.password) {
        try {
          // Prova formato PKCS#8 encrypted
          privateKey = forge.pki.decryptRsaPrivateKey(keyPem, options.password);
        } catch {
          throw new Error('Impossibile decriptare la chiave privata. Verifica la password.');
        }
      } else {
        throw new Error('Chiave privata non valida o protetta. Fornisci la password se necessario.');
      }
    }

    // Crea messaggio PKCS#7 (CAdES-BES)
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(xmlString, 'utf8');

    // Aggiungi certificato
    p7.addCertificate(cert);

    // Aggiungi signer con certificato e chiave privata
    p7.addSigner({
      key: privateKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        {
          type: forge.pki.oids.contentType,
          value: forge.pki.oids.data,
        },
        {
          type: forge.pki.oids.messageDigest,
          value: forge.md.sha256.create().update(p7.content.getBytes()).digest().getBytes(),
        },
        {
          type: forge.pki.oids.signingTime,
          value: new Date(),
        },
      ],
    });

    // Firma il messaggio
    p7.sign({ detached: false });

    // Converti in formato DER (binario)
    const derBuffer = forge.asn1.toDer(p7.toAsn1()).getBytes();

    // Converti stringa binaria in Buffer
    return Buffer.from(derBuffer, 'binary');
  } catch (error) {
    console.error('[SDI Signer] Errore firma XML:', error);
    const message = error instanceof Error ? error.message : 'Errore sconosciuto';
    throw new Error(`Errore durante la firma dell'XML: ${message}`);
  }
}

/**
 * Genera nome file .xml.p7m conforme SDI
 * @param vatNumber Partita IVA del trasmittente
 * @param invoiceNumber Numero della fattura
 * @returns Nome file .xml.p7m
 */
export function generateSignedFileName(vatNumber: string, invoiceNumber: string): string {
  const cleanVat = vatNumber.replace(/^IT/, '').replace(/[^0-9]/g, '');
  const cleanNumber = invoiceNumber.replace(/[^0-9]/g, '').padStart(5, '0');
  return `IT${cleanVat}_${cleanNumber}.xml.p7m`;
}

/**
 * Verifica firma digitale di un file .xml.p7m
 * @param p7mBuffer Buffer del file .xml.p7m
 * @returns XML estratto e verifica firma
 */
export async function verifySignedXML(
  p7mBuffer: Buffer
): Promise<{ xml: string; verified: boolean; signer?: forge.pki.Certificate }> {
  try {
    // Parse messaggio PKCS#7
    const asn1 = forge.asn1.fromDer(p7mBuffer.toString('binary'));
    const p7 = forge.pkcs7.messageFromAsn1(asn1);

    // Verifica firma
    const verified = p7.verify();

    // Estrai contenuto XML
    let xmlContent = '';
    if (p7.content) {
      if (isForgeByteBuffer(p7.content)) {
        xmlContent = Buffer.from(p7.content.getBytes(), 'binary').toString('utf8');
      } else if (typeof p7.content === 'string') {
        xmlContent = p7.content;
      }
    }

    if (!xmlContent) {
      const rawCapture = (p7 as { rawCapture?: { content?: unknown } }).rawCapture;
      const extracted = extractBytesFromAsn1Node(rawCapture?.content);
      if (extracted) {
        xmlContent = Buffer.from(extracted, 'binary').toString('utf8');
      }
    }

    // Estrai certificato del firmatario (se disponibile)
    const signerCert = p7.certificates?.[0];

    return {
      xml: xmlContent,
      verified,
      signer: signerCert,
    };
  } catch (error) {
    console.error('[SDI Signer] Errore verifica firma:', error);
    return {
      xml: '',
      verified: false,
    };
  }
}

/**
 * Estrae XML da file .xml.p7m senza verifica (per test)
 * @param p7mBuffer Buffer del file .xml.p7m
 * @returns XML estratto
 */
export function extractXMLFromP7M(p7mBuffer: Buffer): string {
  try {
    const binary = p7mBuffer.toString('binary');
    const asn1 = forge.asn1.fromDer(binary);
    const p7 = forge.pkcs7.messageFromAsn1(asn1);

    let contentBytes = '';

    if (p7.content) {
      if (isForgeByteBuffer(p7.content)) {
        contentBytes = p7.content.getBytes();
      } else if (typeof p7.content === 'string') {
        contentBytes = p7.content;
      }
    }

    if (!contentBytes) {
      const rawCapture = (p7 as { rawCapture?: { content?: unknown } }).rawCapture;
      const extracted = extractBytesFromAsn1Node(rawCapture?.content);
      if (extracted) {
        contentBytes = extracted;
      }
    }

    if (!contentBytes) {
      return '';
    }

    const xml = Buffer.from(contentBytes, 'binary').toString('utf8');
    return xml;
  } catch (error) {
    console.error('[SDI Signer] Errore estrazione XML:', error);
    const message = error instanceof Error ? error.message : 'Errore sconosciuto';
    throw new Error(`Impossibile estrarre XML da file .p7m: ${message}`);
  }
}

