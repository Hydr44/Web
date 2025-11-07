// Utility functions for SDI endpoints

import { NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';

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

export interface SDIParsedInvoice {
  tipoDocumento?: string;
  numero?: string;
  data?: string;
  partitaIva?: string;
  codiceDestinatario?: string;
  [key: string]: any;
}

export interface SDINotificationData {
  tipoNotifica?: string;
  idSDI?: string;
  identificativoSDI?: string;
  esito?: string;
  [key: string]: any;
}

export interface SDINotificationResolution {
  status?: string;
  statusMessage: string;
  normalizedType: string;
}

export function parseSDIXML(xml: string): SDIParsedInvoice {
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

export function parseSDINotification(xml: string): SDINotificationData {
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

function normalizeNotificationType(rawType: string): string {
  return rawType.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export function resolveNotificationStatus(
  notification: SDINotificationData,
  fallbackType?: string
): SDINotificationResolution {
  const rawType = (notification.tipoNotifica || fallbackType || '').trim();
  const normalizedType = rawType ? normalizeNotificationType(rawType) : 'UNKNOWN';
  const esito = (notification.esito || '').trim().toUpperCase();

  let status: string | undefined;
  let statusMessage = '';

  switch (normalizedType) {
    case 'RICEVUTACONSEGNA':
    case 'RC':
      status = 'delivered';
      statusMessage = 'Fattura consegnata dal SDI';
      break;
    case 'NOTIFICAMANCATACONSEGNA':
    case 'MANCATACONSEGNA':
    case 'MC':
      status = 'delivery_failed';
      statusMessage = 'Mancata consegna: recapito disponibile sul portale SDI';
      break;
    case 'NOTIFICASCARTO':
    case 'SCARTO':
    case 'NS':
      status = 'rejected';
      statusMessage = 'Fattura scartata dal SDI';
      break;
    case 'NOTIFICADECORRENZATERMINI':
    case 'DECORRENZATERMINI':
    case 'DT':
      status = 'delivered_by_terms';
      statusMessage = 'Decorrenza termini: fattura accettata per silenzio-assenso';
      break;
    case 'NOTIFICAESITO':
    case 'ESITOCOMMITTENTE':
    case 'NE':
    case 'EC':
      status = esito === 'ES01' || esito === 'EC01' ? 'accepted' : 'rejected';
      statusMessage = status === 'accepted'
        ? 'Esito committente: accettata'
        : `Esito committente: ${esito || 'rifiutata'}`;
      break;
    case 'ARCHIVIAZIONE':
    case 'ARCHIVIATA':
      status = 'archived';
      statusMessage = 'Ciclo SDI archiviato';
      break;
    case 'UNKNOWN':
      statusMessage = 'Notifica SDI ricevuta';
      break;
    default:
      statusMessage = rawType
        ? `Notifica SDI ricevuta (${rawType})`
        : 'Notifica SDI ricevuta';
      break;
  }

  return {
    status,
    statusMessage,
    normalizedType,
  };
}

export function logSupabaseError(context: string, error: PostgrestError | null) {
  if (error) {
    console.error(`[Supabase Error] ${context}:`, {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
}

