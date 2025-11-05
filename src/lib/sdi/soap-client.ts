// SOAP Client per trasmissione fatture al SDI

import soap from 'soap';
import { SDIEnvironment, getSOAPClientConfig } from './certificates';

export interface SDITransmissionResult {
  success: boolean;
  identificativoSDI?: string;
  error?: string;
  message?: string;
}

/**
 * Invia fattura al SDI tramite web service SOAP
 */
export async function sendInvoiceToSDI(
  xml: string,
  fileName: string,
  environment: SDIEnvironment = 'production'
): Promise<SDITransmissionResult> {
  try {
    // WSDL URL
    const wsdlUrl = environment === 'test'
      ? 'https://testservizi.fatturapa.it/SdI2WS_Fatturazione_2.0/SdI2WS_Fatturazione_2.0.wsdl'
      : 'https://servizi.fatturapa.it/SdI2WS_Fatturazione_2.0/SdI2WS_Fatturazione_2.0.wsdl';

    // Configurazione certificati
    const certConfig = getSOAPClientConfig(environment);

    console.log(`[SDI ${environment.toUpperCase()}] Invio fattura: ${fileName}`);

    // Crea SOAP client
    const soapClient = await soap.createClientAsync(wsdlUrl, {
      wsdl_options: {
        cert: certConfig.cert,
        key: certConfig.key,
        ca: certConfig.ca,
        rejectUnauthorized: certConfig.rejectUnauthorized,
      },
    });

    // Codifica XML in base64
    const xmlBase64 = Buffer.from(xml, 'utf8').toString('base64');

    // Chiama metodo TrasmettiFattura
    const result = await soapClient.TrasmettiFatturaAsync({
      fileFattura: xmlBase64,
      nomeFile: fileName,
    });

    // Parse risposta
    const response = result[0];
    const identificativoSDI = response?.IdentificativoSDI || response?.identificativoSDI;

    if (identificativoSDI) {
      console.log(`[SDI ${environment.toUpperCase()}] Fattura inviata con successo: ${identificativoSDI}`);
      return {
        success: true,
        identificativoSDI,
        message: 'Fattura inviata al SDI con successo',
      };
    } else {
      console.error(`[SDI ${environment.toUpperCase()}] Risposta SDI senza identificativo:`, response);
      return {
        success: false,
        error: 'Risposta SDI non valida',
        message: response?.message || 'Identificativo SDI non presente nella risposta',
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

    return {
      success: false,
      error: errorMessage,
      message: `Errore durante l'invio al SDI: ${errorMessage}`,
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

