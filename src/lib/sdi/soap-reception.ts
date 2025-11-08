// Utility per gestire ricezione SOAP con MTOM dal SDI

import { NextRequest } from 'next/server';
import { DOMParser } from '@xmldom/xmldom';
import { extractXMLFromP7M } from './xml-signer';
import { sanitizeSOAPEnvelope } from './soap-parser';

export interface FileSdIConMetadatiResult {
  fileName: string;
  fileContent: Buffer;
  xml: string;
  metadataXml?: string;
  metadata: Record<string, any>;
}

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
      soapEnvelope = sanitizeSOAPEnvelope(body);
      xml = soapEnvelope;
      
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
 * Genera risposta SOAP 1.2 generica per SDI
 */
export function createSOAPResponse(
  esito: 'OK' | 'KO',
  message: string,
  identificativoSdI?: string
): string {
  const soapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:sdicoop="http://www.fatturapa.gov.it/sdi/ws/ricevi_file/v1.0">
  <soap:Header/>
  <soap:Body>
    <sdicoop:RiceviFileResponse>
      <sdicoop:Esito>${esito}</sdicoop:Esito>
      ${identificativoSdI ? `<sdicoop:IdentificativoSdI>${identificativoSdI}</sdicoop:IdentificativoSdI>` : ''}
      ${message ? `<sdicoop:Message>${message}</sdicoop:Message>` : ''}
    </sdicoop:RiceviFileResponse>
  </soap:Body>
</soap:Envelope>`;
  
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

function getFirstElementText(node: Element, localName: string): string | null {
  const byNS = node.getElementsByTagNameNS?.('*', localName);
  if (byNS && byNS.length > 0) {
    return byNS[0].textContent?.trim() || null;
  }
  const byName = node.getElementsByTagName(localName);
  if (byName && byName.length > 0) {
    return byName[0].textContent?.trim() || null;
  }
  return null;
}

export function extractFileSdIConMetadati(soapEnvelope: string): FileSdIConMetadatiResult | null {
  try {
    const sanitizedEnvelope = sanitizeSOAPEnvelope(soapEnvelope);
    const parser = new DOMParser({
      errorHandler: {
        warning: () => undefined,
        error: (msg: string) => console.error('[SOAP Reception] DOM error:', msg),
      },
    });

    const document = parser.parseFromString(sanitizedEnvelope, 'text/xml');
    const operationNode = document.getElementsByTagNameNS?.('*', 'fileSdIConMetadati')?.[0]
      || document.getElementsByTagName('fileSdIConMetadati')?.[0];

    if (!operationNode) {
      return null;
    }

    const metadata: Record<string, any> = {
      source: 'fileSdIConMetadati',
    };

    const identificativoSdI = getFirstElementText(operationNode, 'IdentificativoSdI');
    if (identificativoSdI) {
      metadata.identificativoSdI = identificativoSdI;
    }

    const nomeFile = getFirstElementText(operationNode, 'NomeFile');
    const fileBase64 = getFirstElementText(operationNode, 'File');
    const nomeFileMetadati = getFirstElementText(operationNode, 'NomeFileMetadati');
    const metadatiBase64 = getFirstElementText(operationNode, 'Metadati');

    if (!fileBase64) {
      metadata.missingFileNode = true;
      return {
        fileName: nomeFile || 'sdi-file.p7m',
        fileContent: Buffer.from(''),
        xml: '',
        metadata,
      };
    }

    const fileBuffer = Buffer.from(fileBase64.replace(/\s+/g, ''), 'base64');
    metadata.fileSize = fileBuffer.length;

    let xml = '';
    if (fileBuffer.length > 0) {
      const isP7M = (nomeFile || '').toLowerCase().endsWith('.p7m');
      try {
        xml = isP7M ? extractXMLFromP7M(fileBuffer) : fileBuffer.toString('utf8');
        metadata.extractedXmlLength = xml.length;
        metadata.fileType = isP7M ? 'pkcs7' : 'xml';
        if (!xml.trim()) {
          metadata.extractedXmlEmpty = true;
        }
      } catch (error: any) {
        metadata.extractionError = error?.message || 'Unknown extraction error';
      }
    }

    let metadataXml: string | undefined;
    if (metadatiBase64) {
      try {
        const decodedMetadata = Buffer.from(metadatiBase64.replace(/\s+/g, ''), 'base64').toString('utf8');
        metadataXml = decodedMetadata;
        metadata.metadataXmlLength = decodedMetadata.length;

        try {
          const metaDoc = parser.parseFromString(decodedMetadata, 'text/xml');
          const root = metaDoc?.documentElement;
          if (root) {
            const parsed: Record<string, string> = {};
            const children = Array.from(root.childNodes || []).filter((child) => child.nodeType === 1) as Element[];
            for (const child of children) {
              const key = child.localName || child.nodeName;
              const value = child.textContent?.trim() || '';
              if (key) {
                parsed[key] = value;
              }
            }
            if (Object.keys(parsed).length > 0) {
              metadata.metadataParsed = parsed;
            }
          }
        } catch (metaParseError: any) {
          metadata.metadataParseError = metaParseError?.message || 'Unknown metadata parse error';
        }
      } catch (decodeMetaError: any) {
        metadata.metadataDecodeError = decodeMetaError?.message || 'Unknown metadata decode error';
      }
    }

    if (nomeFile) {
      metadata.nomeFile = nomeFile;
    }
    if (nomeFileMetadati) {
      metadata.nomeFileMetadati = nomeFileMetadati;
    }

    return {
      fileName: nomeFile || 'sdi-file.p7m',
      fileContent: fileBuffer,
      xml,
      metadataXml,
      metadata,
    };
  } catch (error: any) {
    console.error('[SOAP Reception] Errore estrazione fileSdIConMetadati:', error);
    return null;
  }
}
