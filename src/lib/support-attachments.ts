/**
 * Helper allegati ticket di supporto (storage su Cloudflare R2).
 * Metadati salvati in ticket_messages.attachments come array di Attachment.
 */
import { randomUUID } from 'crypto';
import { uploadToR2, getSignedDownloadUrl } from '@/lib/r2-storage';

export interface Attachment {
  name: string;
  key: string;
  size: number;
  type: string;
}

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_ATTACHMENTS_PER_MSG = 5;

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'text/'];
const ALLOWED_MIME_EXACT = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'application/octet-stream',
]);

export function isAllowedType(mime: string): boolean {
  if (!mime) return false;
  if (ALLOWED_MIME_EXACT.has(mime)) return true;
  return ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p));
}

const sanitize = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';

/** Carica un File (Web API) su R2 sotto support/<ticketId>/ e ritorna i metadati. */
export async function uploadTicketFile(ticketId: string, file: File): Promise<Attachment> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`File troppo grande (max ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB)`);
  }
  if (!isAllowedType(file.type)) {
    throw new Error(`Tipo file non consentito: ${file.type || 'sconosciuto'}`);
  }
  const safe = sanitize(file.name);
  const key = `support/${ticketId}/${randomUUID()}_${safe}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await uploadToR2(key, buf, file.type || 'application/octet-stream');
  return { name: file.name, key, size: file.size, type: file.type || 'application/octet-stream' };
}

/** Valida e normalizza un array di metadati allegati ricevuto dal client. */
export function normalizeAttachments(input: unknown): Attachment[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((a): a is Attachment =>
      !!a && typeof a === 'object' &&
      typeof (a as Attachment).key === 'string' &&
      typeof (a as Attachment).name === 'string'
    )
    .slice(0, MAX_ATTACHMENTS_PER_MSG)
    .map((a) => ({
      name: String(a.name).slice(0, 200),
      key: String(a.key),
      size: Number(a.size) || 0,
      type: String(a.type || 'application/octet-stream'),
    }));
}

/** URL firmato (10 min) per scaricare un allegato. La key deve appartenere al ticket. */
export async function signedAttachmentUrl(ticketId: string, key: string): Promise<string | null> {
  if (!key.startsWith(`support/${ticketId}/`)) return null;
  return getSignedDownloadUrl(key, 600);
}
