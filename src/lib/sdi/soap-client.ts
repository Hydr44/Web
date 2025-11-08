// SOAP Client per trasmissione fatture al SDI
// Supporta invio con MTOM (Multipart/Related) per file .xml.p7m

import { Buffer } from 'buffer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import soap from 'soap';
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
  let manualAttempt: SDITransmissionResult | null = null;

  try {
    const wsdlFilePath = join(process.cwd(), 'src/lib/sdi/wsdl/SdIRiceviFile_v1.0.wsdl');
    const wsdlDefinition = readFileSync(wsdlFilePath, 'utf8');
    const wsdlEndpoint = environment === 'test'
      ? 'https://testservizi.fatturapa.it/ricevi_file'
      : 'https://servizi.fatturapa.it/ricevi_file';

    // Configurazione certificati
    let certConfig: any;
    try {
      certConfig = getSOAPClientConfig(environment);
      // Per TEST, assicuriamoci che rejectUnauthorized sia false
      if (environment === 'test') {
        certConfig.rejectUnauthorized = false;
      }
    } catch (certError: any) {
      // Se i certificati non sono disponibili, per TEST permettiamo di continuare senza
      if (environment === 'test') {
        console.warn(`[SDI TEST] ⚠️ Certificati non disponibili: ${certError.message}`);
        console.warn(`[SDI TEST] ⚠️ Tentativo invio senza autenticazione certificati (solo per test)`);
        // Configurazione minima per test senza certificati
        certConfig = {
          cert: undefined,
          key: undefined,
          ca: undefined,
          rejectUnauthorized: false, // Disabilita verifica certificati per test
        };
      } else {
        throw new Error(`Certificati SDI non disponibili: ${certError.message}. Configura i certificati in Vercel Secrets.`);
      }
    }
    
    // IMPORTANTE: Il WSDL SDI richiede autenticazione tramite certificati client
    // Passiamo i certificati anche nel download del WSDL
    // Nota: La libreria soap potrebbe non supportare certificati nel download WSDL
    // Potremmo dover scaricare il WSDL manualmente con certificati o usare un WSDL locale

    // Firma XML con CAdES-BES (genera .xml.p7m)
    if (!options.skipSign) {
      try {
        p7mBuffer = await signFatturaPAXML(xml);
        // Genera nome file firmato
        const vatMatch = fileName.match(/IT(\d+)/);
        const numberMatch = fileName.match(/_(\d+)\.xml/);
        const vatNumber = vatMatch ? vatMatch[1] : '02166430856';
        const invoiceNumber = numberMatch ? numberMatch[1] : '00001';
        signedFileName = generateSignedFileName(vatNumber, invoiceNumber);
        console.log(`[SDI ${environment.toUpperCase()}] XML firmato: ${signedFileName}`);
      } catch (signError: any) {
        console.error(`[SDI ${environment.toUpperCase()}] Errore firma XML:`, signError);
        // Se la firma fallisce, prova comunque senza firma (solo per test)
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

    console.log(`[SDI ${environment.toUpperCase()}] Invio fattura: ${signedFileName}`);

    try {
      manualAttempt = await sendInvoiceToSDIWithoutWSDL(xml, fileName, p7mBuffer, environment, certConfig);
      if (manualAttempt.success) {
        return manualAttempt;
      }
      console.warn(`[SDI ${environment.toUpperCase()}] Invio manuale SOAP fallito: ${manualAttempt.error}`);
    } catch (manualError: any) {
      console.error(`[SDI ${environment.toUpperCase()}] Errore invio manuale SOAP:`, manualError);
      manualAttempt = {
        success: false,
        error: manualError.message || 'Errore invio manuale',
        message: manualError.message,
        signedFileName,
        signedBuffer: p7mBuffer,
        debug: manualError,
      };
    }

    // Crea SOAP client con supporto MTOM
    // Per TEST, disabilita completamente la verifica SSL
    const wsdlOptions: any = {};
    
    if (environment === 'test') {
      // In test, disabilita completamente la verifica SSL
      wsdlOptions.rejectUnauthorized = false;
      console.warn(`[SDI TEST] Verifica certificati SSL disabilitata per test`);
    } else {
      // In produzione, usa la configurazione normale
      wsdlOptions.rejectUnauthorized = certConfig.rejectUnauthorized !== false;
    }
    
    if (certConfig.cert) {
      wsdlOptions.cert = certConfig.cert;
    }
    if (certConfig.key) {
      wsdlOptions.key = certConfig.key;
    }
    if (certConfig.ca && certConfig.ca.length > 0) {
      wsdlOptions.ca = certConfig.ca;
    }
    
    // Configurazione HTTPS agent per gestire meglio SSL in test
    if (environment === 'test') {
      // Disabilita completamente la verifica SSL per test
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      console.warn(`[SDI TEST] NODE_TLS_REJECT_UNAUTHORIZED impostato a 0 per test`);
    }
    
    const soapOptions: any = {
      wsdl_headers: {},
      wsdl_options: {
        ...wsdlOptions,
        cert: certConfig.cert,
        key: certConfig.key,
        ca: certConfig.ca && certConfig.ca.length > 0 ? certConfig.ca : undefined,
        rejectUnauthorized: wsdlOptions.rejectUnauthorized,
      },
      disableCache: true,
    };

    let soapClient: any;
    try {
      soapClient = await soap.createClientAsync(wsdlDefinition, soapOptions);
      soapClient.setEndpoint(wsdlEndpoint);
    } catch (wsdlError: any) {
      console.warn(`[SDI ${environment.toUpperCase()}] ⚠️ Errore utilizzo WSDL locale, passo al client manuale`, wsdlError);
      throw wsdlError;
    }

    const p7mBase64 = p7mBuffer.toString('base64');

    let result: any;
    
    try {
      if (!soapClient?.SdIRiceviFileService?.SdIRiceviFilePort?.RiceviFile && !soapClient.RiceviFile) {
        throw new Error('Metodo RiceviFile non disponibile nel client SOAP.');
      }

      const payload = {
        parametersIn: {
          NomeFile: signedFileName,
          File: p7mBase64,
        },
      };

      if (soapClient.RiceviFileAsync) {
        result = await soapClient.RiceviFileAsync(payload);
      } else {
        result = await soapClient.SdIRiceviFileService.SdIRiceviFilePort.RiceviFileAsync(payload);
      }
    } catch (soapError: any) {
      // Se l'errore è relativo a certificati SSL in test, prova senza verifica
      if (environment === 'test' && (
        soapError.message?.includes('self-signed certificate') ||
        soapError.message?.includes('certificate') ||
        soapError.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
      )) {
        console.warn(`[SDI TEST] Errore SSL, riprovo con verifica completamente disabilitata`);
        // Disabilita verifica SSL a livello globale per questa chiamata
        const originalReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        try {
          // Ricrea client SOAP senza verifica
          const testSoapClient = await soap.createClientAsync(wsdlDefinition, {
            wsdl_options: { ...soapOptions.wsdl_options, rejectUnauthorized: false },
            disableCache: true,
          });
          testSoapClient.setEndpoint(wsdlEndpoint);
          
          // Riprova la chiamata
          if (testSoapClient.RiceviFile) {
            result = await testSoapClient.RiceviFileAsync({
              parametersIn: {
                NomeFile: signedFileName,
                File: p7mBase64,
              },
            });
          } else {
            throw soapError; // Se non ha il metodo, rilancia l'errore originale
          }
        } finally {
          // Ripristina valore originale
          if (originalReject !== undefined) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalReject;
          } else {
            delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
          }
        }
      } else {
        throw soapError;
      }
    }

    // Parse risposta
    const responseWrapper = result[0] || result;
    const responseData = responseWrapper?.parametersOut || responseWrapper;
    const identificativoSDI = 
      responseData?.IdentificativoSdI || 
      responseData?.identificativoSDI;
    const dataOraRicezione = responseData?.DataOraRicezione || responseData?.dataOraRicezione || manualAttempt?.dataOraRicezione || null;
    const errore = responseData?.Errore;

    if (identificativoSDI) {
      console.log(`[SDI ${environment.toUpperCase()}] Fattura inviata con successo: ${identificativoSDI}`);
      return {
        success: true,
        identificativoSDI: String(identificativoSDI),
        message: 'Fattura inviata al SDI con successo',
        signedFileName,
        signedBuffer: p7mBuffer,
        soapEnvelope: manualAttempt?.soapEnvelope,
        debug: manualAttempt && !manualAttempt.success ? manualAttempt : undefined,
        dataOraRicezione: dataOraRicezione ? String(dataOraRicezione) : manualAttempt?.dataOraRicezione,
        soapResponse: manualAttempt?.soapResponse,
      };
    } else {
      if (!errore) {
        console.log(`[SDI ${environment.toUpperCase()}] Fattura presa in carico (Esito: OK)`);
        return {
          success: true,
          identificativoSDI: responseData?.IdentificativoSdI || 'PENDING',
          message: 'Fattura presa in carico dal SDI',
          signedFileName,
          signedBuffer: p7mBuffer,
          soapEnvelope: manualAttempt?.soapEnvelope,
          debug: manualAttempt && !manualAttempt.success ? manualAttempt : undefined,
          dataOraRicezione: dataOraRicezione ? String(dataOraRicezione) : manualAttempt?.dataOraRicezione,
          soapResponse: manualAttempt?.soapResponse,
        };
      }

      const erroreDescrizione = typeof errore === 'string' ? errore : JSON.stringify(errore);
      console.error(`[SDI ${environment.toUpperCase()}] Risposta SDI:`, JSON.stringify(responseData, null, 2));
      return {
        success: false,
        error: erroreDescrizione || 'Risposta SDI non valida',
        message: erroreDescrizione || 'Identificativo SDI non presente nella risposta',
        signedFileName,
        signedBuffer: p7mBuffer,
        soapEnvelope: manualAttempt?.soapEnvelope,
        soapResponse: manualAttempt?.soapResponse,
        debug: manualAttempt,
      };
    }
  } catch (error: any) {
    console.error(`[SDI ${environment.toUpperCase()}] Errore invio fattura:`, error);
    
    // Parse errori SOAP
    let errorMessage = error.message || 'Errore sconosciuto';
    if (error.response) {
      errorMessage = `Errore SDI: ${error.response.status} - ${error.response.statusText}`;
    }
    if (error.body) {
      errorMessage = `Errore SDI: ${JSON.stringify(error.body)}`;
    }
    if (error.root) {
      // Errore SOAP strutturato
      errorMessage = `Errore SOAP: ${JSON.stringify(error.root)}`;
    }

    return {
      success: false,
      error: errorMessage,
      message: `Errore durante l'invio al SDI: ${errorMessage}`,
      signedFileName,
      signedBuffer: p7mBuffer,
      soapEnvelope: manualAttempt?.soapEnvelope,
      soapResponse: manualAttempt?.soapResponse,
      debug: {
        manualAttempt,
        error,
      },
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

