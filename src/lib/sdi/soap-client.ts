// SOAP Client per trasmissione fatture al SDI
// Supporta invio con MTOM (Multipart/Related) per file .xml.p7m

import { Buffer } from 'buffer';
import { SDIEnvironment, getSOAPClientConfig } from './certificates';
import { signFatturaPAXML, generateSignedFileName } from './xml-signer';
import { sendInvoiceToSDIWithoutWSDL } from './soap-client-manual';

export interface SDITransmissionResult {
  success: boolean;
  identificativoSDI?: string;
  error?: string;
  message?: string;
  signedFileName?: string;
  signedBuffer?: Buffer;
  soapEnvelope?: string;
  soapResponse?: string;
  endpoint?: string;
  httpStatus?: number;
  debug?: any;
  dataOraRicezione?: string;
  boundary?: string;
  rootContentId?: string;
  attachmentContentId?: string;
}

/**
 * Invia fattura al SDI tramite web service SOAP
 * @param xml XML FatturaPA da inviare (verrà firmato automaticamente)
 * @param fileName Nome file originale (senza estensione .p7m)
 * @param environment Ambiente SDI (test o production)
 * @param options Opzioni aggiuntive (skipSign per saltare la firma in test)
 */
export async function sendInvoiceToSDI(
  xml: string,
  fileName: string,
  environment: SDIEnvironment = 'production',
  options: { skipSign?: boolean } = {}
): Promise<SDITransmissionResult> {
  let p7mBuffer: Buffer = Buffer.from(xml, 'utf8');
  let signedFileName: string = fileName.endsWith('.xml')
    ? fileName.replace(/\.xml$/i, '.xml.p7m')
    : `${fileName}.p7m`;
  try {
    let certConfig: any;
    try {
      certConfig = getSOAPClientConfig(environment);
      if (environment === 'test') {
        certConfig.rejectUnauthorized = false;
      }
    } catch (certError: any) {
      if (environment === 'test') {
        console.warn(`[SDI TEST] ⚠️ Certificati non disponibili: ${certError.message}`);
        console.warn(`[SDI TEST] ⚠️ Tentativo invio senza autenticazione certificati (solo per test)`);
        certConfig = {
          cert: undefined,
          key: undefined,
          ca: undefined,
          rejectUnauthorized: false,
        };
      } else {
        throw new Error(`Certificati SDI non disponibili: ${certError.message}. Configura i certificati in Vercel Secrets.`);
      }
    }

    if (!options.skipSign) {
      try {
        p7mBuffer = await signFatturaPAXML(xml);
        const vatMatch = fileName.match(/IT(\d+)/);
        const numberMatch = fileName.match(/_(\d+)\.xml/);
        const vatNumber = vatMatch ? vatMatch[1] : '02166430856';
        const invoiceNumber = numberMatch ? numberMatch[1] : '00001';
        signedFileName = generateSignedFileName(vatNumber, invoiceNumber);
        console.log(`[SDI ${environment.toUpperCase()}] XML firmato: ${signedFileName}`);
      } catch (signError: any) {
        console.error(`[SDI ${environment.toUpperCase()}] Errore firma XML:`, signError);
        if (environment === 'test') {
          console.warn(`[SDI TEST] Tentativo invio senza firma (solo per test)`);
          p7mBuffer = Buffer.from(xml, 'utf8');
          signedFileName = fileName.endsWith('.xml')
            ? fileName.replace(/\.xml$/i, '.xml.p7m')
            : `${fileName}.p7m`;
        } else {
          throw new Error(`Impossibile firmare l'XML: ${signError.message}`);
        }
      }
    } else {
      console.warn(`[SDI ${environment.toUpperCase()}] ⚠️ Firma digitale saltata (solo per test)`);
    }

    console.log(`[SDI ${environment.toUpperCase()}] Invio fattura (client manuale): ${signedFileName}`);
    const manualResult = await sendInvoiceToSDIWithoutWSDL(xml, fileName, p7mBuffer, environment, certConfig);
    if (!manualResult.success) {
      console.warn(`[SDI ${environment.toUpperCase()}] Invio manuale SOAP fallito: ${manualResult.error}`);
    }
    return manualResult;
  } catch (error: any) {
    console.error(`[SDI ${environment.toUpperCase()}] Errore invio fattura:`, error);
    const errorMessage = error.message || 'Errore sconosciuto';
    return {
      success: false,
      error: errorMessage,
      message: `Errore durante l'invio al SDI: ${errorMessage}`,
      signedFileName,
      signedBuffer: p7mBuffer,
      debug: error,
    };
  }
}

/**
 * Genera nome file fattura conforme SDI
 */
export function generateSDIFileName(vatNumber: string, invoiceNumber: string): string {
  // Formato: IT{PartitaIVA}_{ProgressivoInvio}.xml
  const cleanVat = vatNumber.replace(/^IT/, '').replace(/[^0-9]/g, '');
  const cleanNumber = invoiceNumber.replace(/[^0-9]/g, '').padStart(5, '0');
  return `IT${cleanVat}_${cleanNumber}.xml`;
}

