// Utility functions for SDI endpoints

import { NextResponse } from 'next/server';

export interface SDIResponse {
  success: boolean;
  message?: string;
  error?: string;
  invoice_id?: string;
  notification_id?: string;
}

export function createSDIResponse(
  data: SDIResponse,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export function parseSDIXML(xml: string): {
  tipoDocumento?: string;
  numero?: string;
  data?: string;
  partitaIva?: string;
  codiceDestinatario?: string;
  [key: string]: any;
} {
  try {
    // Simple XML parsing for test purposes
    // In production, use a proper XML parser like xml2js or fast-xml-parser
    
    const tipoDocumentoMatch = xml.match(/<TipoDocumento>([^<]+)<\/TipoDocumento>/i);
    const numeroMatch = xml.match(/<Numero>([^<]+)<\/Numero>/i);
    const dataMatch = xml.match(/<Data>([^<]+)<\/Data>/i);
    const partitaIvaMatch = xml.match(/<PartitaIVA>([^<]+)<\/PartitaIVA>/i);
    const codiceDestinatarioMatch = xml.match(/<CodiceDestinatario>([^<]+)<\/CodiceDestinatario>/i);
    
    return {
      tipoDocumento: tipoDocumentoMatch?.[1],
      numero: numeroMatch?.[1],
      data: dataMatch?.[1],
      partitaIva: partitaIvaMatch?.[1],
      codiceDestinatario: codiceDestinatarioMatch?.[1],
      raw: xml,
    };
  } catch (error) {
    console.error('Errore parsing XML SDI:', error);
    return { raw: xml };
  }
}

export function parseSDINotification(xml: string): {
  tipoNotifica?: string;
  idSDI?: string;
  identificativoSDI?: string;
  esito?: string;
  [key: string]: any;
} {
  try {
    // Parse SDI notification XML
    const tipoNotificaMatch = xml.match(/<TipoNotifica>([^<]+)<\/TipoNotifica>/i);
    const idSDIMatch = xml.match(/<IdSDI>([^<]+)<\/IdSDI>/i);
    const identificativoSDIMatch = xml.match(/<IdentificativoSDI>([^<]+)<\/IdentificativoSDI>/i);
    const esitoMatch = xml.match(/<Esito>([^<]+)<\/Esito>/i);
    
    return {
      tipoNotifica: tipoNotificaMatch?.[1],
      idSDI: idSDIMatch?.[1],
      identificativoSDI: identificativoSDIMatch?.[1],
      esito: esitoMatch?.[1],
      raw: xml,
    };
  } catch (error) {
    console.error('Errore parsing notifica SDI:', error);
    return { raw: xml };
  }
}

