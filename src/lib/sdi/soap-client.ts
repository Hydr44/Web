// SOAP Client per trasmissione fatture al SDI
// Supporta invio con MTOM (Multipart/Related) per file .xml.p7m

import { Buffer } from 'buffer';
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
    // WSDL URL
    // NOTA: Il WSDL SDI richiede autenticazione tramite certificati
    // Secondo il manuale di implementazione, l'endpoint SOAP potrebbe essere:
    // 1. Lo stesso URL del WSDL (ma senza .wsdl per le chiamate SOAP)
    // 2. Contenuto nel WSDL stesso (tag <soap:address location="..."/>)
    // 3. Fornito dal portale SDI dopo la registrazione
    //
    // ATTENZIONE: Se tutti gli endpoint restituiscono 404, potrebbe essere necessario:
    // - Registrare gli endpoint sul portale SDI prima di poter inviare fatture
    // - Ottenere l'URL corretto dal portale dopo la registrazione
    // - Verificare che l'ambiente test sia accessibile
    const wsdlUrl = environment === 'test'
      ? 'https://testservizi.fatturapa.it/SdI2RiceviFile/Service.svc?wsdl'
      : 'https://servizi.fatturapa.it/SdI2RiceviFile/Service.svc?wsdl';

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
    
    // Configurazione client SOAP
    // IMPORTANTE: Il WSDL SDI richiede autenticazione tramite certificati
    // Passiamo i certificati anche nel download del WSDL tramite wsdl_options
    const soapOptions: any = {
      wsdl_options: {
        ...wsdlOptions,
        // Passiamo certificati anche per scaricare il WSDL
        cert: certConfig.cert,
        key: certConfig.key,
        ca: certConfig.ca,
        rejectUnauthorized: certConfig.rejectUnauthorized !== false,
      },
      // Abilita MTOM per invio file binari
      forceSoap12Headers: false,
      disableCache: true,
    };
    
    // La libreria soap usa wsdl_options per configurare anche il download del WSDL
    // Se i certificati sono configurati, verranno usati anche per scaricare il WSDL
    
    let soapClient: any;
    try {
      soapClient = await soap.createClientAsync(wsdlUrl, soapOptions);
    } catch (wsdlError: any) {
      // Se il download del WSDL fallisce per 403, proviamo a costruire manualmente la richiesta SOAP
      if (wsdlError.message?.includes('403') || wsdlError.message?.includes('Forbidden')) {
        console.warn(`[SDI ${environment.toUpperCase()}] ⚠️ WSDL non accessibile (403), costruisco richiesta SOAP manualmente`);
        // Costruiamo manualmente la richiesta SOAP senza WSDL
        // Usiamo la struttura documentata nel manuale SDI
        return await sendInvoiceToSDIWithoutWSDL(xml, fileName, p7mBuffer, environment, certConfig);
      }
      throw wsdlError;
    }

    // Codifica file .p7m in base64 per trasmissione
    const p7mBase64 = p7mBuffer.toString('base64');

    // Chiama metodo RiceviFile (SDICoop Web Service)
    // Il metodo può variare in base al WSDL, verifica il nome corretto
    let result: any;
    
    try {
      // Prova diversi nomi di metodo in ordine di priorità
      if (soapClient.RiceviFile) {
        result = await soapClient.RiceviFileAsync({
          fileName: signedFileName,
          file: p7mBase64, // SDI può accettare base64 o MTOM
        });
      } else if (soapClient.RiceviFileRequest) {
        // Metodo alternativo con struttura più complessa (MTOM)
        result = await soapClient.RiceviFileRequestAsync({
          fileName: signedFileName,
          file: {
            _: p7mBase64,
            '$attributes': {
              'href': `cid:${signedFileName.replace(/\./g, '-')}`,
            },
          },
        });
      } else if (soapClient.TrasmettiFattura) {
        // Metodo alternativo (vecchio formato)
        result = await soapClient.TrasmettiFatturaAsync({
          nomeFile: signedFileName,
          fileFattura: p7mBase64,
        });
      } else {
        // Fallback: cerca metodo generico
        const methods = Object.keys(soapClient).filter(k => 
          (k.includes('Ricevi') || k.includes('Trasmetti')) && 
          !k.includes('Async') && 
          typeof soapClient[k] === 'function'
        );
        if (methods.length > 0) {
          const method = methods[0];
          console.log(`[SDI ${environment.toUpperCase()}] Usando metodo: ${method}`);
          result = await soapClient[method + 'Async']({
            fileName: signedFileName,
            file: p7mBase64,
          });
        } else {
          throw new Error('Metodo SOAP non trovato nel WSDL. Verifica il nome del metodo.');
        }
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
          const testWsdlOptions = { ...wsdlOptions, rejectUnauthorized: false };
          const testSoapClient = await soap.createClientAsync(wsdlUrl, {
            wsdl_options: testWsdlOptions,
            forceSoap12Headers: false,
            disableCache: true,
          });
          
          // Riprova la chiamata
          if (testSoapClient.RiceviFile) {
            result = await testSoapClient.RiceviFileAsync({
              fileName: signedFileName,
              file: p7mBase64,
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
    const response = result[0] || result;
    const identificativoSDI = 
      response?.IdentificativoSdI || 
      response?.identificativoSDI || 
      response?.IdentificativoSDI ||
      response?.IdentificativoSdI ||
      response?.Esito?.IdentificativoSdI;

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
          dataOraRicezione: manualAttempt?.dataOraRicezione,
      };
    } else {
      // Verifica anche Esito OK
      const esito = response?.Esito || response?.esito;
      if (esito === 'OK' || esito === 'Ok') {
        console.log(`[SDI ${environment.toUpperCase()}] Fattura presa in carico (Esito: OK)`);
        return {
          success: true,
          identificativoSDI: response?.IdentificativoSdI || 'PENDING',
          message: 'Fattura presa in carico dal SDI',
          signedFileName,
          signedBuffer: p7mBuffer,
            soapEnvelope: manualAttempt?.soapEnvelope,
            debug: manualAttempt && !manualAttempt.success ? manualAttempt : undefined,
            dataOraRicezione: manualAttempt?.dataOraRicezione,
        };
      }

      console.error(`[SDI ${environment.toUpperCase()}] Risposta SDI:`, JSON.stringify(response, null, 2));
      return {
        success: false,
        error: 'Risposta SDI non valida',
        message: response?.Message || response?.message || 'Identificativo SDI non presente nella risposta',
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

