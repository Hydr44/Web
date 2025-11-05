// SOAP Client manuale per SDI (senza WSDL)
// Usato quando il WSDL non è accessibile (403 Forbidden)
// Costruisce manualmente la richiesta SOAP secondo la documentazione SDI

import https from 'https';
import { URL } from 'url';
import { SDIEnvironment } from './certificates';

export interface SDITransmissionResult {
  success: boolean;
  identificativoSDI?: string;
  error?: string;
  message?: string;
}

/**
 * Invia fattura al SDI senza WSDL (costruisce manualmente la richiesta SOAP)
 * @param xml XML FatturaPA da inviare
 * @param fileName Nome file originale
 * @param p7mBuffer Buffer del file .p7m firmato
 * @param environment Ambiente SDI (test o production)
 * @param certConfig Configurazione certificati
 */
export async function sendInvoiceToSDIWithoutWSDL(
  xml: string,
  fileName: string,
  p7mBuffer: Buffer,
  environment: SDIEnvironment,
  certConfig: any
): Promise<SDITransmissionResult> {
  try {
    // URL SDI endpoint (senza .wsdl)
    // Secondo documentazione SDI, l'endpoint è lo stesso del WSDL ma senza estensione
    const baseUrl = environment === 'test'
      ? 'https://testservizi.fatturapa.it/SdI2WS_Fatturazione_2.0/SdI2WS_Fatturazione_2.0'
      : 'https://servizi.fatturapa.it/SdI2WS_Fatturazione_2.0/SdI2WS_Fatturazione_2.0';
    
    // Genera nome file firmato
    const signedFileName = fileName.replace('.xml', '.xml.p7m');
    
    // Codifica file .p7m in base64
    const p7mBase64 = p7mBuffer.toString('base64');
    
    // Costruisci SOAP envelope secondo documentazione SDI
    // Namespace: http://www.fatturapa.gov.it/sdi/ws/ricevi_file/v1.0
    // Metodo: RiceviFileRequest (secondo manuale implementazione)
    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sdicoop="http://www.fatturapa.gov.it/sdi/ws/ricevi_file/v1.0">
  <soapenv:Header/>
  <soapenv:Body>
    <sdicoop:RiceviFileRequest>
      <sdicoop:fileName>${signedFileName}</sdicoop:fileName>
      <sdicoop:file>${p7mBase64}</sdicoop:file>
    </sdicoop:RiceviFileRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
    
    // Parse URL
    const url = new URL(baseUrl);
    
    // Opzioni HTTPS
    const httpsOptions: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://www.fatturapa.gov.it/sdi/ws/ricevi_file/v1.0/RiceviFile',
        'Content-Length': Buffer.byteLength(soapBody),
      },
      // Certificati per autenticazione (se disponibili)
      cert: certConfig.cert,
      key: certConfig.key,
      ca: certConfig.ca && certConfig.ca.length > 0 ? certConfig.ca : undefined,
      rejectUnauthorized: certConfig.rejectUnauthorized !== false,
    };
    
    // In test, disabilita verifica SSL se necessario
    if (environment === 'test') {
      httpsOptions.rejectUnauthorized = false;
      console.warn(`[SDI TEST] Verifica SSL disabilitata per richiesta manuale SOAP`);
    }
    
    console.log(`[SDI ${environment.toUpperCase()}] Invio fattura via SOAP manuale: ${signedFileName}`);
    console.log(`[SDI ${environment.toUpperCase()}] Endpoint: ${baseUrl}`);
    
    // Esegui richiesta HTTPS
    return new Promise<SDITransmissionResult>((resolve, reject) => {
      const req = https.request(httpsOptions, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk.toString();
        });
        
        res.on('end', () => {
          try {
            console.log(`[SDI ${environment.toUpperCase()}] Risposta HTTP: ${res.statusCode}`);
            console.log(`[SDI ${environment.toUpperCase()}] Risposta body:`, responseData.substring(0, 500));
            
            if (res.statusCode !== 200) {
              return resolve({
                success: false,
                error: `Errore SDI: ${res.statusCode} - ${res.statusMessage}`,
                message: `Risposta SDI non valida: ${res.statusCode}`,
              });
            }
            
            // Parse risposta SOAP
            // Cerca IdentificativoSdI nella risposta XML
            const identificativoMatch = responseData.match(/<.*?IdentificativoSdI[^>]*>([^<]+)<\/.*?IdentificativoSdI[^>]*>/i);
            const esitoMatch = responseData.match(/<.*?Esito[^>]*>([^<]+)<\/.*?Esito[^>]*>/i);
            const messageMatch = responseData.match(/<.*?Message[^>]*>([^<]+)<\/.*?Message[^>]*>/i);
            
            const identificativoSDI = identificativoMatch ? identificativoMatch[1].trim() : null;
            const esito = esitoMatch ? esitoMatch[1].trim() : null;
            const message = messageMatch ? messageMatch[1].trim() : null;
            
            if (esito === 'OK' || esito === 'Ok') {
              console.log(`[SDI ${environment.toUpperCase()}] Fattura inviata con successo: ${identificativoSDI || 'PENDING'}`);
              return resolve({
                success: true,
                identificativoSDI: identificativoSDI || 'PENDING',
                message: message || 'Fattura presa in carico dal SDI',
              });
            } else if (identificativoSDI) {
              console.log(`[SDI ${environment.toUpperCase()}] Fattura inviata: ${identificativoSDI}`);
              return resolve({
                success: true,
                identificativoSDI,
                message: message || 'Fattura inviata al SDI',
              });
            } else {
              console.error(`[SDI ${environment.toUpperCase()}] Risposta SDI non valida:`, responseData);
              return resolve({
                success: false,
                error: 'Risposta SDI non valida',
                message: message || 'Identificativo SDI non presente nella risposta',
              });
            }
          } catch (parseError: any) {
            console.error(`[SDI ${environment.toUpperCase()}] Errore parsing risposta:`, parseError);
            return resolve({
              success: false,
              error: `Errore parsing risposta SDI: ${parseError.message}`,
              message: 'Impossibile parsare la risposta SDI',
            });
          }
        });
      });
      
      req.on('error', (error) => {
        console.error(`[SDI ${environment.toUpperCase()}] Errore richiesta HTTPS:`, error);
        resolve({
          success: false,
          error: `Errore richiesta HTTPS: ${error.message}`,
          message: 'Impossibile connettersi al SDI',
        });
      });
      
      // Invia richiesta
      req.write(soapBody);
      req.end();
    });
  } catch (error: any) {
    console.error(`[SDI ${environment.toUpperCase()}] Errore invio manuale:`, error);
    return {
      success: false,
      error: error.message || 'Errore invio manuale al SDI',
    };
  }
}

