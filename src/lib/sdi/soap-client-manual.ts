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
    // Genera nome file firmato
    const signedFileName = fileName.replace('.xml', '.xml.p7m');
    
    // IMPORTANTE: SDI richiede formato MTOM (Multipart/Related), NON base64 nel body SOAP!
    // Secondo documentazione: 03_invio_SOAP_esempio.md
    // Il file .p7m deve essere inviato come allegato MTOM separato
    
    // Genera boundary univoco per multipart
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startId = `rootpart@soapui.org`;
    const attachmentId = `allegato-p7m@rescuemanager`;
    
    // Costruisci SOAP envelope con riferimento MTOM (xop:Include)
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sdicoop="http://www.fatturapa.gov.it/sdi/ws/ricevi_file/v1.0">
  <soapenv:Header/>
  <soapenv:Body>
    <sdicoop:RiceviFileRequest>
      <sdicoop:fileName>${signedFileName}</sdicoop:fileName>
      <sdicoop:file>
        <xop:Include xmlns:xop="http://www.w3.org/2004/08/xop/include" href="cid:${attachmentId}"/>
      </sdicoop:file>
    </sdicoop:RiceviFileRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
    
    // Costruisci corpo multipart/related
    // Parte 1: SOAP envelope
    const part1 = `--${boundary}\r
Content-Type: text/xml; charset=utf-8\r
Content-Transfer-Encoding: 8bit\r
Content-ID: <${startId}>\r
\r
${soapEnvelope}\r
`;
    
    // Parte 2: Allegato file .p7m (binario)
    const part2 = `--${boundary}\r
Content-Type: application/octet-stream\r
Content-Transfer-Encoding: binary\r
Content-ID: <${attachmentId}>\r
\r
`;
    
    // Parte finale: chiusura boundary
    const partEnd = `\r
--${boundary}--\r
`;
    
    // Costruisci corpo completo multipart
    const multipartBody = Buffer.concat([
      Buffer.from(part1, 'utf8'),
      Buffer.from(part2, 'utf8'),
      p7mBuffer, // File binario .p7m
      Buffer.from(partEnd, 'utf8'),
    ]);
    
    // URL SDI endpoint SOAP
    // NOTA: L'endpoint potrebbe essere diverso dal WSDL
    // Prova diverse varianti basate sulla documentazione SDI
    const endpointVariants = [
      // Opzione 1: Endpoint standard SDI2WS (senza .wsdl)
      environment === 'test'
        ? 'https://testservizi.fatturapa.it/SdI2WS_Fatturazione_2.0/SdI2WS_Fatturazione_2.0'
        : 'https://servizi.fatturapa.it/SdI2WS_Fatturazione_2.0/SdI2WS_Fatturazione_2.0',
      // Opzione 2: Endpoint con path base (senza nome file)
      environment === 'test'
        ? 'https://testservizi.fatturapa.it/SdI2WS_Fatturazione_2.0'
        : 'https://servizi.fatturapa.it/SdI2WS_Fatturazione_2.0',
      // Opzione 3: Endpoint con .wsdl (potrebbe funzionare anche per SOAP)
      environment === 'test'
        ? 'https://testservizi.fatturapa.it/SdI2WS_Fatturazione_2.0/SdI2WS_Fatturazione_2.0.wsdl'
        : 'https://servizi.fatturapa.it/SdI2WS_Fatturazione_2.0/SdI2WS_Fatturazione_2.0.wsdl',
    ];
    
    const soapAction = 'http://www.fatturapa.gov.it/sdi/ws/ricevi_file/v1.0/RiceviFile';
    
    console.log(`[SDI ${environment.toUpperCase()}] Invio fattura via SOAP MTOM: ${signedFileName}`);
    console.log(`[SDI ${environment.toUpperCase()}] Dimensione file .p7m: ${p7mBuffer.length} bytes`);
    console.log(`[SDI ${environment.toUpperCase()}] Dimensione multipart: ${multipartBody.length} bytes`);
    console.log(`[SDI ${environment.toUpperCase()}] Boundary: ${boundary}`);
    
    // Funzione helper per provare una richiesta SOAP con MTOM
    const trySOAPRequest = (
      endpointUrl: string,
      description: string
    ): Promise<SDITransmissionResult | null> => {
      return new Promise<SDITransmissionResult | null>((resolve) => {
        try {
          const url = new URL(endpointUrl);
          
          // Opzioni HTTPS
          const httpsOptions: https.RequestOptions = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'POST',
            headers: {
              'Content-Type': `multipart/related; type="text/xml"; start="<${startId}>"; boundary="${boundary}"`,
              'MIME-Version': '1.0',
              'SOAPAction': soapAction,
              'Content-Length': multipartBody.length,
            },
            // Certificati per autenticazione (se disponibili)
            cert: certConfig.cert,
            key: certConfig.key,
            ca: certConfig.ca && certConfig.ca.length > 0 ? certConfig.ca : undefined,
            rejectUnauthorized: environment === 'test' ? false : (certConfig.rejectUnauthorized !== false),
          };
          
          console.log(`[SDI ${environment.toUpperCase()}] Tentativo ${description}:`);
          console.log(`[SDI ${environment.toUpperCase()}] Endpoint: ${endpointUrl}`);
          console.log(`[SDI ${environment.toUpperCase()}] SOAPAction: ${soapAction}`);
          
          const req = https.request(httpsOptions, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
              responseData += chunk.toString();
            });
            
            res.on('end', () => {
              try {
                console.log(`[SDI ${environment.toUpperCase()}] Risposta HTTP ${description}: ${res.statusCode} ${res.statusMessage}`);
                console.log(`[SDI ${environment.toUpperCase()}] Headers risposta:`, JSON.stringify(res.headers, null, 2));
                console.log(`[SDI ${environment.toUpperCase()}] Body risposta (primi 1000 caratteri):`, responseData.substring(0, 1000));
                
                if (res.statusCode === 200) {
                  // Parse risposta SOAP
                  const identificativoMatch = responseData.match(/<.*?IdentificativoSdI[^>]*>([^<]+)<\/.*?IdentificativoSdI[^>]*>/i);
                  const esitoMatch = responseData.match(/<.*?Esito[^>]*>([^<]+)<\/.*?Esito[^>]*>/i);
                  const messageMatch = responseData.match(/<.*?Message[^>]*>([^<]+)<\/.*?Message[^>]*>/i);
                  
                  const identificativoSDI = identificativoMatch ? identificativoMatch[1].trim() : null;
                  const esito = esitoMatch ? esitoMatch[1].trim() : null;
                  const message = messageMatch ? messageMatch[1].trim() : null;
                  
                  if (esito === 'OK' || esito === 'Ok' || identificativoSDI) {
                    console.log(`[SDI ${environment.toUpperCase()}] ✅ Successo ${description}: ${identificativoSDI || 'PENDING'}`);
                    return resolve({
                      success: true,
                      identificativoSDI: identificativoSDI || 'PENDING',
                      message: message || 'Fattura presa in carico dal SDI',
                    });
                  }
                }
                
                // Se non è 200, questo endpoint non ha funzionato
                console.log(`[SDI ${environment.toUpperCase()}] ❌ ${description} fallito: ${res.statusCode} ${res.statusMessage}`);
                console.log(`[SDI ${environment.toUpperCase()}] Risposta completa:`, responseData);
                console.log(`[SDI ${environment.toUpperCase()}] Endpoint provato: ${endpointUrl}`);
                resolve(null); // Prova il prossimo endpoint
              } catch (parseError: any) {
                console.error(`[SDI ${environment.toUpperCase()}] Errore parsing risposta ${description}:`, parseError);
                resolve(null); // Prova il prossimo endpoint
              }
            });
          });
          
          req.on('error', (error) => {
            console.error(`[SDI ${environment.toUpperCase()}] Errore richiesta HTTPS ${description}:`, error.message);
            resolve(null); // Prova il prossimo endpoint
          });
          
          req.setTimeout(30000, () => {
            req.destroy();
            console.error(`[SDI ${environment.toUpperCase()}] Timeout ${description}`);
            resolve(null); // Prova il prossimo endpoint
          });
          
          // Invia richiesta multipart
          req.write(multipartBody);
          req.end();
        } catch (error: any) {
          console.error(`[SDI ${environment.toUpperCase()}] Errore preparazione richiesta ${description}:`, error.message);
          resolve(null); // Prova il prossimo endpoint
        }
      });
    };
    
    // Prova ogni endpoint in sequenza
    console.log(`[SDI ${environment.toUpperCase()}] Invio fattura via SOAP manuale: ${signedFileName}`);
    console.log(`[SDI ${environment.toUpperCase()}] Provo ${endpointVariants.length} endpoint possibili...`);
    
    for (let i = 0; i < endpointVariants.length; i++) {
      const endpoint = endpointVariants[i];
      const description = `endpoint ${i + 1}/${endpointVariants.length}`;
      
      const result = await trySOAPRequest(endpoint, description);
      
      if (result && result.success) {
        // Successo! Restituisci il risultato
        return result;
      }
      
      // Se non è l'ultimo endpoint, aspetta un po' prima di provare il prossimo
      if (i < endpointVariants.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Tutti gli endpoint hanno fallito
    console.error(`[SDI ${environment.toUpperCase()}] ❌ Tutti gli endpoint hanno fallito`);
    return {
      success: false,
      error: 'Tutti gli endpoint SDI hanno fallito. Verifica URL, certificati e configurazione.',
      message: 'Impossibile inviare fattura al SDI. Verifica la configurazione degli endpoint.',
    };
    
  } catch (error: any) {
    console.error(`[SDI ${environment.toUpperCase()}] Errore invio manuale:`, error);
    return {
      success: false,
      error: error.message || 'Errore invio manuale al SDI',
    };
  }
}
