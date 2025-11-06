// Utility per parsare SOAP envelope e estrarre QName e namespace

export interface SOAPOperation {
  localName: string;
  namespaceURI: string;
  prefix: string;
  qname: string;
}

/**
 * Estrae QName e namespace dell'elemento nel Body del SOAP envelope
 */
export function extractSOAPOperation(soapEnvelope: string): SOAPOperation | null {
  try {
    // Estrai il Body
    const bodyMatch = soapEnvelope.match(/<[^:]*:Body[^>]*>([\s\S]*?)<\/[^:]*:Body>/i);
    if (!bodyMatch || !bodyMatch[1]) {
      console.warn('[SOAP Parser] Body non trovato nel SOAP envelope');
      return null;
    }

    const bodyContent = bodyMatch[1].trim();
    
    // Estrai il primo elemento nel Body (l'operazione)
    const operationMatch = bodyContent.match(/<([^:>]+):([^:>]+)[^>]*>/);
    if (!operationMatch) {
      // Prova senza namespace prefix
      const operationMatchNoPrefix = bodyContent.match(/<([^:>\/\s]+)[^>]*>/);
      if (!operationMatchNoPrefix) {
        console.warn('[SOAP Parser] Operazione non trovata nel Body');
        return null;
      }
      
      const localName = operationMatchNoPrefix[1];
      
      // Cerca namespace nel tag o negli attributi
      const namespaceMatch = bodyContent.match(/xmlns(?::([^=]+))?="([^"]+)"/);
      const namespaceURI = namespaceMatch ? namespaceMatch[2] : '';
      const prefix = namespaceMatch && namespaceMatch[1] ? namespaceMatch[1] : '';
      
      return {
        localName,
        namespaceURI,
        prefix,
        qname: prefix ? `${prefix}:${localName}` : localName,
      };
    }
    
    const prefix = operationMatch[1];
    const localName = operationMatch[2];
    
    // Estrai namespace URI dal tag o dagli attributi
    let namespaceURI = '';
    
    // Cerca nel tag stesso
    const tagNamespaceMatch = bodyContent.match(new RegExp(`<${prefix}:${localName}[^>]*xmlns(?::${prefix})?="([^"]+)"`));
    if (tagNamespaceMatch) {
      namespaceURI = tagNamespaceMatch[1];
    } else {
      // Cerca negli attributi xmlns del tag padre o nell'envelope
      const envelopeNamespaceMatch = soapEnvelope.match(new RegExp(`xmlns:${prefix}="([^"]+)"`));
      if (envelopeNamespaceMatch) {
        namespaceURI = envelopeNamespaceMatch[1];
      } else {
        // Cerca xmlns senza prefix nel tag
        const defaultNamespaceMatch = bodyContent.match(/xmlns="([^"]+)"/);
        if (defaultNamespaceMatch) {
          namespaceURI = defaultNamespaceMatch[1];
        }
      }
    }
    
    return {
      localName,
      namespaceURI,
      prefix,
      qname: `${prefix}:${localName}`,
    };
  } catch (error: any) {
    console.error('[SOAP Parser] Errore estrazione operazione:', error);
    return null;
  }
}

/**
 * Genera risposta SOAP che matcha l'operazione in ingresso
 */
export function createMatchingSOAPResponse(
  operation: SOAPOperation,
  esito: 'OK' | 'KO',
  message?: string,
  identificativoSdI?: string
): string {
  const { localName, namespaceURI, prefix } = operation;
  
  // Nome elemento Response (es. riceviFile -> riceviFileResponse)
  const responseLocalName = `${localName}Response`;
  
  // Namespace prefix per la risposta
  const responsePrefix = prefix || 'ns';
  
  // Namespace URI (usa quello dell'input o default SDI)
  const responseNamespaceURI = namespaceURI || 'http://www.fatturapa.gov.it/sdi/ws/ricevi_file/v1.0';
  
  // Namespace SOAP envelope (usa SOAP 1.2 se presente nell'input, altrimenti SOAP 1.1)
  const soapNamespace = namespaceURI?.includes('soap12') || namespaceURI?.includes('soap-envelope') 
    ? 'http://www.w3.org/2003/05/soap-envelope'
    : 'http://schemas.xmlsoap.org/soap/envelope/';
  
  const soapPrefix = soapNamespace.includes('2003') ? 'soap' : 'soapenv';
  
  // Costruisci risposta SOAP
  const soapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<${soapPrefix}:Envelope xmlns:${soapPrefix}="${soapNamespace}" xmlns:${responsePrefix}="${responseNamespaceURI}">
  <${soapPrefix}:Header/>
  <${soapPrefix}:Body>
    <${responsePrefix}:${responseLocalName}>
      <${responsePrefix}:esito>${esito}</${responsePrefix}:esito>
      ${identificativoSdI ? `<${responsePrefix}:IdentificativoSdI>${identificativoSdI}</${responsePrefix}:IdentificativoSdI>` : ''}
      ${message ? `<${responsePrefix}:Message>${message}</${responsePrefix}:Message>` : ''}
    </${responsePrefix}:${responseLocalName}>
  </${soapPrefix}:Body>
</${soapPrefix}:Envelope>`;
  
  return soapResponse;
}

