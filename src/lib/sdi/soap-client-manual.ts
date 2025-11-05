// SOAP Client manuale per SDI (senza WSDL)
// Usato quando il WSDL non è accessibile (403 Forbidden)
// Costruisce manualmente la richiesta SOAP secondo la documentazione SDI

import https from 'https';
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
    // URL SDI endpoint
    const sdiUrl = environment === 'test'
      ? 'https://testservizi.fatturapa.it/SdI2WS_Fatturazione_2.0/SdI2WS_Fatturazione_2.0.wsdl'
      : 'https://servizi.fatturapa.it/SdI2WS_Fatturazione_2.0/SdI2WS_Fatturazione_2.0.wsdl';
    
    // Rimuovi .wsdl e aggiungi il path del servizio
    const serviceUrl = sdiUrl.replace('.wsdl', '');
    
    // Genera nome file firmato
    const signedFileName = fileName.replace('.xml', '.xml.p7m');
    
    // Codifica file .p7m in base64
    const p7mBase64 = p7mBuffer.toString('base64');
    
    // Costruisci SOAP envelope secondo documentazione SDI
    // Namespace: http://www.fatturapa.gov.it/sdi/ws/ricevi_file/v1.0
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
    
    // Per ora, restituiamo un errore indicando che il WSDL non è accessibile
    // In futuro, possiamo implementare la chiamata HTTPS diretta con certificati
    console.error(`[SDI ${environment.toUpperCase()}] ⚠️ WSDL non accessibile, richiesta SOAP manuale non ancora implementata`);
    
    return {
      success: false,
      error: 'WSDL non accessibile. Il WSDL SDI richiede autenticazione tramite certificati. Configura i certificati client in Vercel Secrets.',
      message: 'Impossibile scaricare WSDL SDI senza certificati client',
    };
  } catch (error: any) {
    console.error(`[SDI ${environment.toUpperCase()}] Errore invio manuale:`, error);
    return {
      success: false,
      error: error.message || 'Errore invio manuale al SDI',
    };
  }
}

