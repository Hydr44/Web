// Utility functions for SDI endpoints

import { NextResponse } from 'next/server';
import type { PostgrestError } from '@supabase/supabase-js';
import { DOMParser } from '@xmldom/xmldom';

export interface SDIResponse {
  success: boolean;
  message?: string;
  error?: string;
  invoice_id?: string;
  notification_id?: string;
  identificativo_sdi?: string;
}

export function createSDIResponse(
  data: SDIResponse,
  status: number = 200,
  origin?: string | null,
  allowHeaders?: string | null
): NextResponse {
  const allowOrigin = origin ?? '*';
  const allowedHeaders =
    allowHeaders && allowHeaders.trim().length > 0
      ? allowHeaders
      : '*';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': allowedHeaders,
  };

  if (origin) {
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Vary'] = 'Origin';
  }

  return NextResponse.json(data, {
    status,
    headers,
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
  messageId?: string;
  pecMessageId?: string;
  [key: string]: any;
}

export interface SDINotificationResolution {
  status?: string;
  statusMessage: string;
  normalizedType: string;
}

function getElementText(doc: Document, tagName: string): string | undefined {
  const elements = doc.getElementsByTagName(tagName);
  if (elements && elements.length > 0) {
    return elements[0].textContent || undefined;
  }
  // Fallback per namespace (es. ns2:TipoDocumento)
  const allElements = doc.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    if (allElements[i].localName === tagName) {
      return allElements[i].textContent || undefined;
    }
  }
  return undefined;
}

export function parseSDIXML(xml: string): SDIParsedInvoice {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    return {
      tipoDocumento: getElementText(doc, 'TipoDocumento'),
      numero: getElementText(doc, 'Numero'),
      data: getElementText(doc, 'Data'),
      partitaIva: getElementText(doc, 'PartitaIVA'),
      codiceDestinatario: getElementText(doc, 'CodiceDestinatario'),
      raw: xml,
    };
  } catch (error) {
    console.error('Errore parsing XML SDI (DOM):', error);
    return { raw: xml };
  }
}

export function parseSDINotification(xml: string): SDINotificationData {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    return {
      tipoNotifica: getElementText(doc, 'TipoNotifica'),
      idSDI: getElementText(doc, 'IdSDI'),
      identificativoSDI: getElementText(doc, 'IdentificativoSdI'),
      esito: getElementText(doc, 'Esito'),
      messageId: getElementText(doc, 'MessageId'),
      pecMessageId: getElementText(doc, 'PecMessageId'),
      raw: xml,
    };
  } catch (error) {
    console.error('Errore parsing notifica SDI (DOM):', error);
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

