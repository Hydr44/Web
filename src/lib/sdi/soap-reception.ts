// Utility per gestire ricezione SOAP con MTOM dal SDI

import { NextRequest } from 'next/server';

/**
 * Estrae il file XML (.xml o .xml.p7m) da una richiesta SOAP multipart/related
 */
export async function extractFileFromSOAPMTOM(request: NextRequest): Promise<{
  fileName: string;
  fileContent: Buffer;
  xml: string;
  soapEnvelope?: string;
}> {
  const contentType = request.headers.get('content-type') || '';
  
  // Se non è multipart, prova a leggere direttamente come XML
  if (!contentType.includes('multipart')) {
    const xml = await request.text();
    return {
      fileName: 'fattura.xml',
      fileContent: Buffer.from(xml, 'utf8'),
      xml,
      soapEnvelope: xml,
    };
  }

  // Estrai boundary dal Content-Type
  const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/);
  if (!boundaryMatch) {
    throw new Error('Boundary non trovato nel Content-Type');
  }
  const boundary = boundaryMatch[1];
  
  // Leggi il body come buffer
  const bodyBuffer = Buffer.from(await request.arrayBuffer());
  const bodyString = bodyBuffer.toString('binary');
  
  // Dividi le parti multipart
  const parts = bodyString.split(`--${boundary}`);
  
  let fileName = 'fattura.xml';
  let fileContent: Buffer | null = null;
  let xml = '';
  let soapEnvelope = '';
  
  for (const part of parts) {
    // Skip empty parts
    if (!part.trim() || part.trim() === '--') continue;
    
    // Estrai header e body della parte
    const [headersRaw, ...bodyParts] = part.split('\r\n\r\n');
    const body = bodyParts.join('\r\n\r\n').trim();
    
    if (!body) continue;
    
    // Verifica se è la parte SOAP (XML)
    if (headersRaw.includes('Content-Type: text/xml') || headersRaw.includes('Content-Type: application/xml')) {
      // Questa è la parte SOAP envelope
      soapEnvelope = body;
      xml = body;
      
      // Estrai fileName dal SOAP body se presente
      const fileNameMatch = body.match(/<sdicoop:fileName>([^<]+)<\/sdicoop:fileName>/i) ||
                           body.match(/<fileName>([^<]+)<\/fileName>/i);
      if (fileNameMatch) {
        fileName = fileNameMatch[1];
      }
    }
    
    // Verifica se è l'allegato MTOM (file .xml.p7m)
    if (headersRaw.includes('Content-ID') || headersRaw.includes('Content-Transfer-Encoding: binary')) {
      // Questa è la parte allegato
      const contentIdMatch = headersRaw.match(/Content-ID:\s*<([^>]+)>/i);
      
      // Estrai il file come buffer (binary)
      fileContent = Buffer.from(body, 'binary');
      
      // Se il fileName non è stato trovato nel SOAP, prova a estrarlo dal Content-ID
      if (!fileName.match(/\.xml(\.p7m)?$/i)) {
        const contentId = contentIdMatch?.[1] || '';
        if (contentId.includes('.xml.p7m') || contentId.includes('.xml')) {
          fileName = contentId.split('@')[0] || fileName;
        }
      }
    }
  }
  
  // Se abbiamo trovato il file content, usalo
  // Altrimenti, usa l'XML diretto
  if (fileContent) {
    return {
      fileName,
      fileContent,
      xml: fileContent.toString('utf8'), // Prova a decodificare come UTF-8
      soapEnvelope: soapEnvelope || xml,
    };
  }
  
  // Fallback: usa l'XML dal SOAP envelope
  return {
    fileName,
    fileContent: Buffer.from(xml, 'utf8'),
    xml,
    soapEnvelope: soapEnvelope || xml,
  };
}

/**
 * Genera risposta SOAP per il SDI (legacy - usa createMatchingSOAPResponse invece)
 * @deprecated Usa createMatchingSOAPResponse per risposte che matchano l'input
 */
export function createSOAPResponse(
  esito: 'OK' | 'KO',
  message: string,
  identificativoSdI?: string
): string {
  const soapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sdicoop="http://www.fatturapa.gov.it/sdi/ws/ricevi_file/v1.0">
  <soapenv:Header/>
  <soapenv:Body>
    <sdicoop:RiceviFileResponse>
      <sdicoop:Esito>${esito}</sdicoop:Esito>
      ${identificativoSdI ? `<sdicoop:IdentificativoSdI>${identificativoSdI}</sdicoop:IdentificativoSdI>` : ''}
      <sdicoop:Message>${message}</sdicoop:Message>
    </sdicoop:RiceviFileResponse>
  </soapenv:Body>
</soapenv:Envelope>`;
  
  return soapResponse;
}

/**
 * Verifica se la richiesta è in formato SOAP
 */
export function isSOAPRequest(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type') || '';
  return contentType.includes('multipart/related') || 
         contentType.includes('text/xml') ||
         contentType.includes('application/xml') ||
         contentType.includes('application/soap+xml');
}
