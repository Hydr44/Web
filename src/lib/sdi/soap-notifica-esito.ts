import https from 'https';
import { URL } from 'url';
import { Buffer } from 'buffer';
import { SDIEnvironment, SOAPCertConfig } from './certificates';

export interface NotificaEsitoRequest {
  identificativoSdI: string;
  nomeFile: string;
  fileBase64: string;
  environment: SDIEnvironment;
  certConfig: SOAPCertConfig;
}

export interface NotificaEsitoResult {
  success: boolean;
  esito?: string;
  scartoNomeFile?: string | null;
  scartoFileBase64?: string | null;
  httpStatus?: number;
  soapResponse?: string;
  endpoint?: string;
  error?: string;
  message?: string;
}

/**
 * Invia una notifica di esito committente al Sistema di Interscambio
 */
export async function sendNotificaEsitoToSDI({
  identificativoSdI,
  nomeFile,
  fileBase64,
  environment,
  certConfig,
}: NotificaEsitoRequest): Promise<NotificaEsitoResult> {
  const SOAP_SERVICE_NS = 'http://www.fatturapa.gov.it/sdi/ws/ricezione/v1.0';
  const SOAP_TYPES_NS = 'http://www.fatturapa.gov.it/sdi/ws/ricezione/v1.0/types';
  const SOAP_ACTION = 'http://www.fatturapa.it/SdIRicezioneNotifiche/NotificaEsito';

  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="${SOAP_SERVICE_NS}" xmlns:types="${SOAP_TYPES_NS}">
  <soapenv:Header/>
  <soapenv:Body>
    <types:fileSdI>
      <types:IdentificativoSdI>${identificativoSdI}</types:IdentificativoSdI>
      <types:NomeFile>${nomeFile}</types:NomeFile>
      <types:File>${fileBase64}</types:File>
    </types:fileSdI>
  </soapenv:Body>
</soapenv:Envelope>`;

  const soapBuffer = Buffer.from(soapEnvelope, 'utf8');

  const endpoints =
    environment === 'test'
      ? ['https://testservizi.fatturapa.it/ricevi_notifica']
      : ['https://servizi.fatturapa.it/ricevi_notifica'];

  const tryEndpoint = (endpointUrl: string): Promise<NotificaEsitoResult> => {
    return new Promise((resolve) => {
      try {
        const url = new URL(endpointUrl);

        if (url.protocol !== 'https:') {
          return resolve({
            success: false,
            error: 'Protocollo non supportato',
            message: 'SdI accetta solo endpoint HTTPS',
            endpoint: endpointUrl,
          });
        }

        const requestOptions: https.RequestOptions = {
          hostname: url.hostname,
          port: url.port ? Number(url.port) : 443,
          path: `${url.pathname}${url.search}`,
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'Content-Length': soapBuffer.length,
            SOAPAction: SOAP_ACTION,
            Connection: 'close',
          },
          cert: certConfig.cert,
          key: certConfig.key,
          ca: certConfig.ca,
          rejectUnauthorized: certConfig.rejectUnauthorized !== undefined ? certConfig.rejectUnauthorized : environment === 'production',
        };

        console.log(`[SDI ${environment.toUpperCase()}] Invio NotificaEsito (IdentificativoSdI=${identificativoSdI})`);
        console.log(`[SDI ${environment.toUpperCase()}] Endpoint: ${endpointUrl}`);

        const req = https.request(requestOptions, (res) => {
          let responseData = '';

          res.on('data', (chunk) => {
            responseData += chunk.toString();
          });

          res.on('end', () => {
            const statusCode = res.statusCode || 0;
            const statusMessage = res.statusMessage || '';

            console.log(`[SDI ${environment.toUpperCase()}] Risposta NotificaEsito: ${statusCode} ${statusMessage}`);
            console.log(`[SDI ${environment.toUpperCase()}] Headers risposta:`, JSON.stringify(res.headers, null, 2));
            console.log(`[SDI ${environment.toUpperCase()}] Body risposta (primi 2000 char):`, responseData.substring(0, 2000));

            if (statusCode !== 200) {
              return resolve({
                success: false,
                error: `HTTP ${statusCode}`,
                message: responseData.substring(0, 500) || 'Nessun contenuto',
                endpoint: endpointUrl,
                httpStatus: statusCode,
                soapResponse: responseData,
              });
            }

            const faultMatch = responseData.match(/<faultstring[^>]*>([^<]+)<\/faultstring>/i);
            if (faultMatch) {
              return resolve({
                success: false,
                error: faultMatch[1]?.trim() || 'SOAP Fault',
                message: responseData.substring(0, 500),
                endpoint: endpointUrl,
                httpStatus: statusCode,
                soapResponse: responseData,
              });
            }

            const esitoMatch = responseData.match(/<[^>]*Esito[^>]*>([^<]+)</i);
            const scartoNomeMatch = responseData.match(/<[^>]*ScartoEsito[^>]*>[\s\S]*?<[^>]*NomeFile[^>]*>([^<]+)</i);
            const scartoFileMatch = responseData.match(/<[^>]*ScartoEsito[^>]*>[\s\S]*?<[^>]*File[^>]*>([^<]+)</i);

            return resolve({
              success: true,
              esito: esitoMatch ? esitoMatch[1].trim() : undefined,
              scartoNomeFile: scartoNomeMatch ? scartoNomeMatch[1].trim() : null,
              scartoFileBase64: scartoFileMatch ? scartoFileMatch[1].trim() : null,
              endpoint: endpointUrl,
              httpStatus: statusCode,
              soapResponse: responseData,
            });
          });
        });

        req.on('error', (error) => {
          console.error(`[SDI ${environment.toUpperCase()}] Errore NotificaEsito:`, error);
          resolve({
            success: false,
            error: `Errore connessione: ${error.message}`,
            message: 'Impossibile contattare il servizio SdI',
            endpoint: endpointUrl,
          });
        });

        req.setTimeout(30000, () => {
          req.destroy();
          resolve({
            success: false,
            error: 'Timeout',
            message: `Nessuna risposta dal servizio entro 30 secondi`,
            endpoint: endpointUrl,
          });
        });

        req.write(soapBuffer);
        req.end();
      } catch (error: any) {
        console.error(`[SDI ${environment.toUpperCase()}] Errore preparazione NotificaEsito:`, error);
        resolve({
          success: false,
          error: error.message || 'Errore preparazione richiesta',
          message: 'Impossibile preparare la richiesta SOAP',
          endpoint: endpointUrl,
        });
      }
    });
  };

  for (const endpoint of endpoints) {
    const result = await tryEndpoint(endpoint);
    if (result.success) {
      return result;
    }
  }

  return {
    success: false,
    error: 'Tutti gli endpoint SdI hanno fallito',
    message: 'Verifica certificati, endpoint e payload NotificaEsito.',
  };
}

