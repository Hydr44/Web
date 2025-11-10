export type SDIEsitoCode = 'EC01' | 'EC02';

export interface BuildEsitoCommittenteOptions {
  identificativoSdI: string;
  numeroFattura?: string | null;
  dataFattura?: string | null;
  nomeFileFattura?: string | null;
  esito?: SDIEsitoCode;
  descrizione?: string | null;
  messageIdCommittente?: string | null;
  nomeFileEsito?: string | null;
}

export interface BuildEsitoCommittenteResult {
  xml: string;
  nomeFile: string;
  messageIdCommittente: string;
  esito: SDIEsitoCode;
}

const NS_MESSAGGI = 'http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/messaggi/v1.0';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeFileBaseName(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 50);
}

export function generateMessageIdCommittente(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  const base = `RM${timestamp}${random}`;
  return base.slice(0, 14);
}

function computeEsitoFileName(nomeFileFattura?: string | null, esito: SDIEsitoCode = 'EC01'): string {
  const suffix = esito === 'EC01' ? 'EC01' : 'EC02';
  const base = nomeFileFattura
    ? sanitizeFileBaseName(nomeFileFattura.replace(/(\.xml)?(\.p7m)?$/i, ''))
    : `Esito_${Date.now()}`;
  return `${base}_${suffix}.xml`;
}

export function buildEsitoCommittenteXML(options: BuildEsitoCommittenteOptions): BuildEsitoCommittenteResult {
  const {
    identificativoSdI,
    numeroFattura,
    dataFattura,
    nomeFileFattura,
    esito = 'EC01',
    descrizione,
    messageIdCommittente,
    nomeFileEsito,
  } = options;

  const messageId = (messageIdCommittente && messageIdCommittente.trim().slice(0, 14)) || generateMessageIdCommittente();
  const nomeFile = nomeFileEsito
    ? sanitizeFileBaseName(nomeFileEsito.replace(/(\.xml)?$/i, '')) + '.xml'
    : computeEsitoFileName(nomeFileFattura, esito);

  const annoFattura = dataFattura && dataFattura.trim() ? new Date(dataFattura).getFullYear().toString() : undefined;
  const numero = numeroFattura?.trim();

  const riferimenti: string[] = [];
  if (annoFattura && !Number.isNaN(Number(annoFattura))) {
    riferimenti.push(`<AnnoFattura>${escapeXml(annoFattura)}</AnnoFattura>`);
  }
  if (numero) {
    riferimenti.push(`<NumeroFattura>${escapeXml(numero)}</NumeroFattura>`);
  }

  const riferimentiXml = riferimenti.length > 0
    ? `<RiferimentoFattura>${riferimenti.join('')}</RiferimentoFattura>`
    : '';

  const descrizioneXml = descrizione && descrizione.trim()
    ? `<Descrizione>${escapeXml(descrizione.trim())}</Descrizione>`
    : '';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<EsitoCommittente xmlns="${NS_MESSAGGI}">
  <IdentificativoSdI>${escapeXml(identificativoSdI)}</IdentificativoSdI>
  ${riferimentiXml}
  <Esito>${esito}</Esito>
  ${descrizioneXml}
  <MessageIdCommittente>${escapeXml(messageId)}</MessageIdCommittente>
</EsitoCommittente>`;

  return {
    xml,
    nomeFile,
    messageIdCommittente: messageId,
    esito,
  };
}

