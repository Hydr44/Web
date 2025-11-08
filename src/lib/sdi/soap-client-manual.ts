// SOAP Client manuale per SDI (senza WSDL)
// Usato quando il WSDL non è accessibile (403 Forbidden)
// Costruisce manualmente la richiesta SOAP secondo la documentazione SDI

import https from 'https';
import { URL } from 'url';
import { SDIEnvironment } from './certificates';
import { Buffer } from 'buffer';

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
    const signedFileName = fileName.replace('.xml', '.xml.p7m');
    const fileBase64 = p7mBuffer.toString('base64');

    const SOAP_SERVICE_NS = 'http://www.fatturapa.gov.it/sdi/ws/trasmissione/v1.0';
    const SOAP_TYPES_NS = 'http://www.fatturapa.gov.it/sdi/ws/trasmissione/v1.0/types';

    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${SOAP_SERVICE_NS}" xmlns:types="${SOAP_TYPES_NS}">
  <soapenv:Header/>
  <soapenv:Body>
    <types:fileSdIAccoglienza>
      <types:NomeFile>${signedFileName}</types:NomeFile>
      <types:File>${fileBase64}</types:File>
    </types:fileSdIAccoglienza>
  </soapenv:Body>
</soapenv:Envelope>`;

    const soapBuffer = Buffer.from(soapEnvelope, 'utf8');

    const endpointVariants =
      environment === 'test'
        ? [
            'https://testservizi.fatturapa.it/ricevi_file',
            'https://testservizi.fatturapa.it/SdIRiceviFile/Service.svc',
          ]
        : [
            'https://servizi.fatturapa.it/ricevi_file',
            'https://servizi.fatturapa.it/SdIRiceviFile/Service.svc',
          ];

    const soapAction = 'http://www.fatturapa.it/SdIRiceviFile/RiceviFile';

    console.log(`[SDI ${environment.toUpperCase()}] Invio fattura via SOAP base64: ${signedFileName}`);
    console.log(`[SDI ${environment.toUpperCase()}] Dimensione file .p7m: ${p7mBuffer.length} bytes`);
    console.log(`[SDI ${environment.toUpperCase()}] Dimensione SOAP: ${soapBuffer.length} bytes`);

    // Funzione helper per provare una richiesta SOAP con MTOM
    const trySOAPRequest = (
      endpointUrl: string,
      description: string
    ): Promise<SDITransmissionResult | null> => {
      return new Promise<SDITransmissionResult | null>((resolve) => {
        try {
          const url = new URL(endpointUrl);

          if (url.protocol !== 'https:') {
            console.warn(`[SDI ${environment.toUpperCase()}] Protocollo non supportato per l'endpoint ${endpointUrl}`);
            return resolve({
              success: false,
              error: 'Protocollo non supportato (solo HTTPS)',
              message: 'Endpoint non HTTPS',
              endpoint: endpointUrl,
            });
          }

          const httpsOptions: https.RequestOptions = {
            hostname: url.hostname,
            port: url.port ? Number(url.port) : 443,
            path: `${url.pathname}${url.search}`,
            method: 'POST',
            headers: {
              'Content-Type': 'text/xml; charset=utf-8',
              'Content-Length': soapBuffer.length,
              'SOAPAction': soapAction,
              Connection: 'close',
            },
            cert: certConfig.cert,
            key: certConfig.key,
            ca: certConfig.ca && certConfig.ca.length > 0 ? certConfig.ca : undefined,
            rejectUnauthorized:
              environment === 'test' ? certConfig.rejectUnauthorized === true ? true : false : certConfig.rejectUnauthorized !== false,
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
                const statusCode = res.statusCode || 0;
                const statusMessage = res.statusMessage || 'Unknown';

                console.log(`[SDI ${environment.toUpperCase()}] Risposta HTTP ${description}: ${statusCode} ${statusMessage}`);
                console.log(`[SDI ${environment.toUpperCase()}] Headers risposta:`, JSON.stringify(res.headers, null, 2));
                console.log(`[SDI ${environment.toUpperCase()}] Body risposta (primi 2000 caratteri):`, responseData.substring(0, 2000));
                console.log(`[SDI ${environment.toUpperCase()}] Dimensione body: ${responseData.length} caratteri`);

                if (statusCode === 200) {
                  // Parse risposta SOAP
                  const identificativoMatch = responseData.match(/<[^>]*IdentificativoSdI[^>]*>([^<]+)</i);
                  const erroreMatch = responseData.match(/<[^>]*Errore[^>]*>([^<]+)</i);
                  const dataRicezioneMatch = responseData.match(/<[^>]*DataOraRicezione[^>]*>([^<]+)</i);

                  const identificativoSDI = identificativoMatch ? identificativoMatch[1].trim() : null;
                  const errore = erroreMatch ? erroreMatch[1].trim() : null;
                  const dataOraRicezione = dataRicezioneMatch ? dataRicezioneMatch[1].trim() : null;

                  console.log(`[SDI ${environment.toUpperCase()}] Parsing risposta:`, {
                    identificativoSDI,
                    errore,
                    dataOraRicezione,
                  });

                  if (identificativoSDI && !errore) {
                    console.log(`[SDI ${environment.toUpperCase()}] ✅ Successo ${description}: ${identificativoSDI}`);
                    return resolve({
                      success: true,
                      identificativoSDI,
                      message: 'Fattura presa in carico dal SDI',
                      endpoint: endpointUrl,
                      httpStatus: statusCode,
                      soapResponse: responseData,
                      dataOraRicezione,
                    });
                  }

                  if (errore) {
                    console.warn(`[SDI ${environment.toUpperCase()}] ⚠️ ${description} risposta con errore ${errore}`);
                    return resolve({
                      success: false,
                      error: `Errore SDI ${errore}`,
                      message: `Risposta con errore ${errore}`,
                      endpoint: endpointUrl,
                      httpStatus: statusCode,
                      soapResponse: responseData,
                    });
                  }

                  console.warn(`[SDI ${environment.toUpperCase()}] ⚠️ ${description} risposta 200 ma non valida`);
                  console.warn(`[SDI ${environment.toUpperCase()}] Risposta completa:`, responseData);
                  return resolve({
                    success: false,
                    error: `Risposta SDI non valida (HTTP 200 ma senza identificativo)`,
                    message: `Endpoint risponde ma formato risposta non riconosciuto`,
                    endpoint: endpointUrl,
                    httpStatus: statusCode,
                    soapResponse: responseData,
                  });
                }

                // Se non è 200, questo endpoint non ha funzionato
                console.log(`[SDI ${environment.toUpperCase()}] ❌ ${description} fallito: ${statusCode} ${statusMessage}`);
                console.log(`[SDI ${environment.toUpperCase()}] Risposta completa:`, responseData);
                console.log(`[SDI ${environment.toUpperCase()}] Endpoint provato: ${endpointUrl}`);

                // Restituisci errore con dettagli
                resolve({
                  success: false,
                  error: `HTTP ${statusCode}: ${statusMessage}`,
                  message: responseData.substring(0, 500) || 'Nessuna risposta dal server',
                  endpoint: endpointUrl,
                  httpStatus: statusCode,
                  soapResponse: responseData,
                }); // Prova il prossimo endpoint
              } catch (parseError: any) {
                console.error(`[SDI ${environment.toUpperCase()}] Errore parsing risposta ${description}:`, parseError);
                resolve({
                  success: false,
                  error: `Errore parsing risposta: ${parseError.message}`,
                  message: responseData.substring(0, 500) || 'Risposta non leggibile',
                  endpoint: endpointUrl,
                  httpStatus: res.statusCode || undefined,
                  soapResponse: responseData,
                }); // Prova il prossimo endpoint
              }
            });
          });

          req.on('error', (error) => {
            console.error(`[SDI ${environment.toUpperCase()}] Errore richiesta HTTPS ${description}:`, error);
            console.error(`[SDI ${environment.toUpperCase()}] Stack trace:`, error.stack);
            // Restituisci errore con dettagli
            resolve({
              success: false,
              error: `Errore connessione: ${error.message}`,
              message: `Impossibile connettersi all'endpoint ${endpointUrl}`,
              endpoint: endpointUrl,
            }); // Prova il prossimo endpoint
          });

          req.setTimeout(30000, () => {
            req.destroy();
            console.error(`[SDI ${environment.toUpperCase()}] Timeout ${description} dopo 30 secondi`);
            // Restituisci errore con dettagli
            resolve({
              success: false,
              error: 'Timeout: nessuna risposta dopo 30 secondi',
              message: `L'endpoint ${endpointUrl} non ha risposto entro il timeout`,
              endpoint: endpointUrl,
            }); // Prova il prossimo endpoint
          });

          // Invia richiesta multipart
          req.write(soapBuffer);
          req.end();
        } catch (error: any) {
          console.error(`[SDI ${environment.toUpperCase()}] Errore preparazione richiesta ${description}:`, error.message);
          resolve({
            success: false,
            error: `Errore preparazione richiesta: ${error.message}`,
            message: 'Impossibile preparare la richiesta SOAP',
            endpoint: endpointUrl,
          }); // Prova il prossimo endpoint
        }
      });
    };

    const errors: Array<{ endpoint: string; statusCode?: number; httpStatus?: number; error?: string; response?: string }> = [];

    for (let i = 0; i < endpointVariants.length; i++) {
      const endpoint = endpointVariants[i];
      const description = `endpoint ${i + 1}/${endpointVariants.length}`;

      const result = await trySOAPRequest(endpoint, description);

      if (result && result.success) {
        return {
          ...result,
          signedFileName,
          signedBuffer: p7mBuffer,
          soapEnvelope,
        };
      }

      if (result && !result.success) {
        const statusMatch = result.error?.match(/HTTP (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : result.httpStatus;

        errors.push({
          endpoint: result.endpoint || endpoint,
          statusCode,
          httpStatus: result.httpStatus,
          error: result.error || 'Errore sconosciuto',
          response: result.message || 'Nessuna risposta',
        });
      } else {
        errors.push({
          endpoint,
          error: 'Endpoint non ha risposto o risposta non valida',
        });
      }

      if (i < endpointVariants.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.error(`[SDI ${environment.toUpperCase()}] ❌ Tutti gli endpoint hanno fallito`);
    console.error(`[SDI ${environment.toUpperCase()}] Dettagli errori:`, JSON.stringify(errors, null, 2));

    const errorSummary = errors.map((e, idx) =>
      `${idx + 1}. ${e.endpoint}: ${e.statusCode ? `HTTP ${e.statusCode}` : 'N/A'} - ${e.error || 'Nessun dettaglio'}`
    ).join('\n');

    return {
      success: false,
      error: `Tutti gli endpoint SDI hanno fallito. Dettagli:\n${errorSummary}\n\nVerifica URL, certificati e configurazione. Controlla i log di Vercel per dettagli completi.`,
      message: `Impossibile inviare fattura al SDI. ${endpointVariants.length} endpoint provati, tutti falliti.`,
      signedFileName,
      signedBuffer: p7mBuffer,
      soapEnvelope,
      debug: errors,
    };

  } catch (error: any) {
    console.error(`[SDI ${environment.toUpperCase()}] Errore invio manuale:`, error);
    return {
      success: false,
      error: error.message || 'Errore invio manuale al SDI',
      signedFileName,
      signedBuffer: p7mBuffer,
      soapEnvelope,
      debug: error,
    };
  }
}

