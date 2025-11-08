// Utility per parsare SOAP envelope e generare risposte coerenti con l'input

import { DOMParser } from '@xmldom/xmldom';

export interface SOAPOperation {
  localName: string;
  namespaceURI: string;
  prefix: string;
  qname: string;
  soapNamespaceURI: string;
}

const SOAP_1_2_NAMESPACE = 'http://www.w3.org/2003/05/soap-envelope';
const SOAP_1_1_NAMESPACE = 'http://schemas.xmlsoap.org/soap/envelope/';
const SOAP_1_2_CONTENT_TYPE = 'application/soap+xml; charset=utf-8';
const SOAP_1_1_CONTENT_TYPE = 'text/xml; charset=utf-8';

export function sanitizeSOAPEnvelope(rawEnvelope: string): string {
  if (!rawEnvelope) {
    return '';
  }

  let sanitized = rawEnvelope.replace(/^\uFEFF/, '');
  sanitized = sanitized.replace(/^[\u0000-\u001F]+/, '');

  const firstTagIndex = sanitized.indexOf('<');
  if (firstTagIndex > 0) {
    sanitized = sanitized.slice(firstTagIndex);
  }

  return sanitized.trimStart();
}

/**
 * Estrae l'operazione SOAP (primo elemento del Body) con namespace e prefix
 */
export function extractSOAPOperation(soapEnvelope: string): SOAPOperation | null {
  try {
    const sanitizedEnvelope = sanitizeSOAPEnvelope(soapEnvelope);
    const parser = new DOMParser({
      errorHandler: {
        warning: () => undefined,
        error: (msg: string) => console.error('[SOAP Parser] DOM error:', msg),
      },
    });

    const document = parser.parseFromString(sanitizedEnvelope, 'text/xml');
    const envelope = document.documentElement;

    if (!envelope) {
      console.warn('[SOAP Parser] Envelope non trovato nel SOAP');
      return null;
    }

    const soapNamespaceURI = envelope.namespaceURI || SOAP_1_2_NAMESPACE;

    // Trova il nodo Body (indipendentemente dal prefix)
    const bodyNode = Array.from(envelope.childNodes).find(
      (node) => node.nodeType === 1 && node.localName === 'Body'
    ) as Element | undefined
      || envelope.getElementsByTagName('Body')[0];

    if (!bodyNode) {
      console.warn('[SOAP Parser] Body non trovato nel SOAP envelope');
      return null;
    }

    // Primo elemento figlio del Body = operazione SOAP
    const operationNode = Array.from(bodyNode.childNodes).find((node) => node.nodeType === 1) as Element | undefined;

    if (!operationNode) {
      console.warn('[SOAP Parser] Nessun elemento operazione nel SOAP Body');
      return null;
    }

    const localName = operationNode.localName || operationNode.nodeName;
    const namespaceURI = operationNode.namespaceURI || '';
    const prefix = operationNode.prefix || '';
    const qname = prefix ? `${prefix}:${localName}` : localName;

    return {
      localName,
      namespaceURI,
      prefix,
      qname,
      soapNamespaceURI,
    };
  } catch (error: any) {
    console.error('[SOAP Parser] Errore estrazione operazione:', error);
    return null;
  }
}

export interface SOAPResponseOptions {
  identificativoSdI?: string;
}

/**
 * Genera una risposta SOAP 1.2 (o 1.1 se richiesto nell'envelope) che matcha l'operazione ricevuta
 */
export function createMatchingSOAPResponse(
  operation: SOAPOperation,
  esito: 'OK' | 'KO',
  options: SOAPResponseOptions = {}
): { xml: string; contentType: string } {
  const { localName, namespaceURI, prefix, soapNamespaceURI } = operation;

  const responseLocalName = `${localName}Response`;
  const responseNamespaceURI = namespaceURI || 'http://www.fatturapa.gov.it/sdi/ws/ricevi_file/v1.0';

  // Evita conflitto con il prefix SOAP (usiamo sempre "soap" per l'envelope)
  const responsePrefix = prefix && prefix !== 'soap' ? prefix : 'ns';

  const soapNamespace = soapNamespaceURI === SOAP_1_1_NAMESPACE
    ? SOAP_1_1_NAMESPACE
    : SOAP_1_2_NAMESPACE;

  const soapPrefix = 'soap';
  const contentType = soapNamespace === SOAP_1_1_NAMESPACE
    ? SOAP_1_1_CONTENT_TYPE
    : SOAP_1_2_CONTENT_TYPE;

  const identificativoSdI = options.identificativoSdI;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<${soapPrefix}:Envelope xmlns:${soapPrefix}="${soapNamespace}" xmlns:${responsePrefix}="${responseNamespaceURI}">
  <${soapPrefix}:Header/>
  <${soapPrefix}:Body>
    <${responsePrefix}:${responseLocalName}>
      <${responsePrefix}:esito>${esito}</${responsePrefix}:esito>
      ${identificativoSdI ? `<${responsePrefix}:IdentificativoSdI>${identificativoSdI}</${responsePrefix}:IdentificativoSdI>` : ''}
    </${responsePrefix}:${responseLocalName}>
  </${soapPrefix}:Body>
</${soapPrefix}:Envelope>`;

  return { xml, contentType };
}

export function getSOAPContentType(soapNamespaceURI?: string): string {
  return soapNamespaceURI === SOAP_1_1_NAMESPACE
    ? SOAP_1_1_CONTENT_TYPE
    : SOAP_1_2_CONTENT_TYPE;
}

