// Generatore XML FatturaPA 1.2.2 conforme

export interface FatturaPAData {
  // Dati trasmittente
  idTrasmittente: {
    idPaese: string;
    idCodice: string;
  };
  
  // Dati fattura
  progressivoInvio: string;
  formatoTrasmissione: 'FPR12' | 'FPA12';
  codiceDestinatario?: string;
  pecDestinatario?: string;
  
  // Cedente/Prestatore
  cedentePrestatore: {
    idFiscaleIVA: {
      idPaese: string;
      idCodice: string;
    };
    codiceFiscale?: string;
    denominazione: string;
    regimeFiscale: string;
    sede: {
      indirizzo: string;
      cap: string;
      comune: string;
      provincia: string;
      nazione: string;
    };
  };
  
  // Cessionario/Committente
  cessionarioCommittente: {
    idFiscaleIVA?: {
      idPaese: string;
      idCodice: string;
    };
    codiceFiscale?: string;
    denominazione: string;
    sede: {
      indirizzo: string;
      cap: string;
      comune: string;
      provincia: string;
      nazione: string;
    };
  };
  
  // Dati documento
  tipoDocumento: string;
  divisa: string;
  data: string;
  numero: string;
  importoTotaleDocumento: number;
  
  // Dettaglio linee
  dettaglioLinee: Array<{
    numeroLinea: number;
    descrizione: string;
    quantita?: number;
    unitaMisura?: string;
    prezzoUnitario: number;
    prezzoTotale: number;
    aliquotaIVA: number;
  }>;
  
  // Dati riepilogo
  datiRiepilogo: Array<{
    aliquotaIVA: number;
    imponibileImporto: number;
    imposta: number;
    natura?: string;
    esigibilitaIVA?: string;
    riferimentoNormativo?: string;
  }>;
  
  // Dati pagamento
  datiPagamento?: {
    condizioniPagamento: string;
    dettaglioPagamento: Array<{
      modalitaPagamento: string;
      importoPagamento: number;
    }>;
  };
}

/**
 * Sanitizza testo per XML (escape caratteri speciali)
 */
function escapeXml(text: any): string {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Genera XML FatturaPA 1.2.2 conforme
 */
export function generateFatturaPAXML(data: FatturaPAData): string {
  const {
    idTrasmittente,
    progressivoInvio,
    formatoTrasmissione,
    codiceDestinatario,
    pecDestinatario,
    cedentePrestatore,
    cessionarioCommittente,
    tipoDocumento,
    divisa,
    data: dataFattura,
    numero,
    importoTotaleDocumento,
    dettaglioLinee,
    datiRiepilogo,
    datiPagamento,
  } = data;

  // Genera dettaglio linee
  const lineeXML = dettaglioLinee.map((linea: any) => `
    <DettaglioLinee>
      <NumeroLinea>${linea.numeroLinea}</NumeroLinea>
      ${linea.tipoCessionePrestazione ? `<TipoCessionePrestazione>${escapeXml(linea.tipoCessionePrestazione)}</TipoCessionePrestazione>` : ''}
      <Descrizione>${escapeXml(linea.descrizione)}</Descrizione>
      ${linea.quantita != null ? `<Quantita>${linea.quantita.toFixed(2)}</Quantita>` : ''}
      ${linea.unitaMisura ? `<UnitaMisura>${escapeXml(linea.unitaMisura)}</UnitaMisura>` : ''}
      <PrezzoUnitario>${linea.prezzoUnitario.toFixed(2)}</PrezzoUnitario>
      <PrezzoTotale>${linea.prezzoTotale.toFixed(2)}</PrezzoTotale>
      <AliquotaIVA>${linea.aliquotaIVA.toFixed(2)}</AliquotaIVA>
      ${linea.natura ? `<Natura>${escapeXml(linea.natura)}</Natura>` : ''}
      ${linea.esigibilitaIVA ? `<EsigibilitaIVA>${escapeXml(linea.esigibilitaIVA)}</EsigibilitaIVA>` : ''}
    </DettaglioLinee>`).join('');

  // Genera dati riepilogo
  const riepilogoXML = datiRiepilogo.map((riepilogo: any) => `
      <DatiRiepilogo>
        <AliquotaIVA>${riepilogo.aliquotaIVA.toFixed(2)}</AliquotaIVA>
        ${riepilogo.natura ? `<Natura>${escapeXml(riepilogo.natura)}</Natura>` : ''}
        ${riepilogo.esigibilitaIVA ? `<EsigibilitaIVA>${escapeXml(riepilogo.esigibilitaIVA)}</EsigibilitaIVA>` : ''}
        <ImponibileImporto>${riepilogo.imponibileImporto.toFixed(2)}</ImponibileImporto>
        <Imposta>${riepilogo.imposta.toFixed(2)}</Imposta>
        ${riepilogo.riferimentoNormativo ? `<RiferimentoNormativo>${escapeXml(riepilogo.riferimentoNormativo)}</RiferimentoNormativo>` : ''}
      </DatiRiepilogo>`).join('');

  // Genera dati pagamento
  const pagamentoXML = datiPagamento ? `
    <DatiPagamento>
      <CondizioniPagamento>${escapeXml(datiPagamento.condizioniPagamento)}</CondizioniPagamento>
      ${datiPagamento.dettaglioPagamento.map((pagamento) => `
      <DettaglioPagamento>
        <ModalitaPagamento>${escapeXml(pagamento.modalitaPagamento)}</ModalitaPagamento>
        <ImportoPagamento>${pagamento.importoPagamento.toFixed(2)}</ImportoPagamento>
      </DettaglioPagamento>`).join('')}
    </DatiPagamento>` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="${escapeXml(formatoTrasmissione)}" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 http://www.fatturapa.gov.it/export/documenti/fatturapa/v1.4/Schema_VFPR12_v1.2.3.xsd">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>${escapeXml(idTrasmittente.idPaese)}</IdPaese>
        <IdCodice>${escapeXml(idTrasmittente.idCodice)}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${escapeXml(progressivoInvio)}</ProgressivoInvio>
      <FormatoTrasmissione>${escapeXml(formatoTrasmissione)}</FormatoTrasmissione>
      ${codiceDestinatario ? `<CodiceDestinatario>${escapeXml(codiceDestinatario)}</CodiceDestinatario>` : ''}
      ${pecDestinatario ? `<PECDestinatario>${escapeXml(pecDestinatario)}</PECDestinatario>` : ''}
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>${escapeXml(cedentePrestatore.idFiscaleIVA.idPaese)}</IdPaese>
          <IdCodice>${escapeXml(cedentePrestatore.idFiscaleIVA.idCodice)}</IdCodice>
        </IdFiscaleIVA>
        ${cedentePrestatore.codiceFiscale ? `<CodiceFiscale>${escapeXml(cedentePrestatore.codiceFiscale)}</CodiceFiscale>` : ''}
        <Anagrafica>
          <Denominazione>${escapeXml(cedentePrestatore.denominazione)}</Denominazione>
        </Anagrafica>
        <RegimeFiscale>${escapeXml(cedentePrestatore.regimeFiscale)}</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escapeXml(cedentePrestatore.sede.indirizzo)}</Indirizzo>
        <CAP>${escapeXml(cedentePrestatore.sede.cap)}</CAP>
        <Comune>${escapeXml(cedentePrestatore.sede.comune)}</Comune>
        <Provincia>${escapeXml(cedentePrestatore.sede.provincia)}</Provincia>
        <Nazione>${escapeXml(cedentePrestatore.sede.nazione)}</Nazione>
      </Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        ${cessionarioCommittente.idFiscaleIVA ? `
        <IdFiscaleIVA>
          <IdPaese>${escapeXml(cessionarioCommittente.idFiscaleIVA.idPaese)}</IdPaese>
          <IdCodice>${escapeXml(cessionarioCommittente.idFiscaleIVA.idCodice)}</IdCodice>
        </IdFiscaleIVA>` : ''}
        ${cessionarioCommittente.codiceFiscale ? `<CodiceFiscale>${escapeXml(cessionarioCommittente.codiceFiscale)}</CodiceFiscale>` : ''}
        <Anagrafica>
          <Denominazione>${escapeXml(cessionarioCommittente.denominazione)}</Denominazione>
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escapeXml(cessionarioCommittente.sede.indirizzo)}</Indirizzo>
        <CAP>${escapeXml(cessionarioCommittente.sede.cap)}</CAP>
        <Comune>${escapeXml(cessionarioCommittente.sede.comune)}</Comune>
        <Provincia>${escapeXml(cessionarioCommittente.sede.provincia)}</Provincia>
        <Nazione>${escapeXml(cessionarioCommittente.sede.nazione)}</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>${escapeXml(tipoDocumento)}</TipoDocumento>
        <Divisa>${escapeXml(divisa)}</Divisa>
        <Data>${escapeXml(dataFattura)}</Data>
        <Numero>${escapeXml(numero)}</Numero>
        <ImportoTotaleDocumento>${importoTotaleDocumento.toFixed(2)}</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      ${lineeXML}
      ${riepilogoXML}
    </DatiBeniServizi>
    ${pagamentoXML}
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
}

function normalizeProgressivoInvio(value: string | null | undefined): string {
  const fallback = '00001';
  if (!value) return fallback;
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return cleaned.slice(0, 10) || fallback;
}

function normalizeCodiceDestinatario(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.toUpperCase().trim();
  if (cleaned.length === 0) return undefined;
  return cleaned.slice(0, 7);
}

/**
 * Converte dati fattura da database a formato FatturaPA
 */
export function invoiceToFatturaPAData(invoice: any, orgSettings?: any): FatturaPAData {
  const items = invoice.invoice_items || [];
  const sdi = invoice.meta?.sdi || {};
  const org = orgSettings || {};

  const customerAddressRaw = invoice.customer_address;
  const sdiCessionarioAddress = sdi.cessionario?.address;
  const customerAddress =
    customerAddressRaw && typeof customerAddressRaw === 'object'
      ? customerAddressRaw
      : sdiCessionarioAddress && typeof sdiCessionarioAddress === 'object'
        ? sdiCessionarioAddress
        : null;
  const customerStreet =
    typeof customerAddressRaw === 'string' && customerAddressRaw
      ? customerAddressRaw
      : customerAddress?.street || 'Via';
  const customerZip = invoice.customer_zip || customerAddress?.zip || '00000';
  const customerCity = invoice.customer_city || customerAddress?.city || 'Comune';
  const customerProvince = invoice.customer_province || customerAddress?.province || 'XX';
  const customerCountry = invoice.customer_country || customerAddress?.country || 'IT';

  // Calcola totali
  const imponibile = items.reduce((sum: number, item: any) => 
    sum + (Number(item.qty || 0) * Number(item.price || 0)), 0);
  
  const iva = items.reduce((sum: number, item: any) => 
    sum + (Number(item.qty || 0) * Number(item.price || 0) * (Number(item.vat_perc || 22) / 100)), 0);

  // Raggruppa aliquote IVA per riepilogo
  const aliquoteMap = new Map<number, { imponibile: number; imposta: number }>();
  items.forEach((item: any) => {
    const aliquota = Number(item.vat_perc || 22);
    const imponibileItem = Number(item.qty || 0) * Number(item.price || 0);
    const impostaItem = imponibileItem * (aliquota / 100);
    
    if (aliquoteMap.has(aliquota)) {
      const existing = aliquoteMap.get(aliquota)!;
      existing.imponibile += imponibileItem;
      existing.imposta += impostaItem;
    } else {
      aliquoteMap.set(aliquota, { imponibile: imponibileItem, imposta: impostaItem });
    }
  });

  const datiRiepilogo = Array.from(aliquoteMap.entries()).map(([aliquota, dati]) => {
    // Trova natura e esigibilità dalla prima linea con questa aliquota
    const firstItem = items.find((item: any) => Number(item.vat_perc || 22) === aliquota);
    return {
      aliquotaIVA: aliquota,
      imponibileImporto: dati.imponibile,
      imposta: dati.imposta,
      natura: firstItem?.natura || sdi.riepilogo_iva?.[0]?.natura || undefined,
      esigibilitaIVA: firstItem?.esigibilita || sdi.riepilogo_iva?.[0]?.esigibilita || undefined,
      riferimentoNormativo: sdi.riepilogo_iva?.[0]?.riferimento_normativo || undefined,
    };
  });

  const progressivoInvioRaw =
    sdi.trasmissione?.progressivo_invio ||
    invoice.meta?.progressivo_invio ||
    invoice.number ||
    `00001`;

  const codiceDestinatarioRaw =
    sdi.trasmissione?.codice_destinatario ||
    invoice.customer_sdi_code;

  return {
    idTrasmittente: {
      idPaese: 'IT',
      idCodice: sdi.cedente_prestatore?.id_fiscale_iva?.id_codice || org.vat_number || '02166430856',
    },
    progressivoInvio: normalizeProgressivoInvio(progressivoInvioRaw),
    formatoTrasmissione: 'FPR12',
    codiceDestinatario: normalizeCodiceDestinatario(codiceDestinatarioRaw),
    pecDestinatario: sdi.trasmissione?.pec_destinatario || invoice.customer_pec,
    cedentePrestatore: {
      idFiscaleIVA: {
        idPaese: 'IT',
        idCodice: sdi.cedente_prestatore?.id_fiscale_iva?.id_codice || org.vat_number || '02166430856',
      },
      codiceFiscale: sdi.cedente_prestatore?.codice_fiscale || org.tax_code,
      denominazione: sdi.cedente_prestatore?.denominazione || org.name || 'RescueManager',
      regimeFiscale: sdi.cedente_prestatore?.regime_fiscale || 'RF01',
      sede: {
        indirizzo: sdi.cedente_prestatore?.sede?.indirizzo || org.address || 'Via',
        cap: sdi.cedente_prestatore?.sede?.cap || org.zip_code || '00000',
        comune: sdi.cedente_prestatore?.sede?.comune || org.city || 'Comune',
        provincia: sdi.cedente_prestatore?.sede?.provincia || org.province || 'XX',
        nazione: 'IT',
      },
    },
    cessionarioCommittente: {
      idFiscaleIVA: invoice.customer_vat ? {
        idPaese: 'IT',
        idCodice: invoice.customer_vat.replace(/^IT/, ''),
      } : undefined,
      codiceFiscale: invoice.customer_tax_code,
      denominazione: invoice.customer_name || 'Cliente',
      sede: {
        indirizzo: customerStreet,
        cap: customerZip,
        comune: customerCity,
        provincia: customerProvince,
        nazione: customerCountry,
      },
    },
    tipoDocumento: sdi.documento?.tipo_documento || 'TD01',
    divisa: invoice.currency || 'EUR',
    data: invoice.date || new Date().toISOString().split('T')[0],
    numero: invoice.number || '1',
    importoTotaleDocumento: imponibile + iva,
    dettaglioLinee: items.map((item: any, index: number) => ({
      numeroLinea: index + 1,
      descrizione: item.descr || item.description || 'Prodotto/Servizio',
      quantita: item.qty ? Number(item.qty) : undefined,
      unitaMisura: item.unit || 'PZ',
      prezzoUnitario: Number(item.price || 0),
      prezzoTotale: Number(item.qty || 0) * Number(item.price || 0),
      aliquotaIVA: Number(item.vat_perc || 22),
      natura: item.natura || sdi.dettaglio_linee?.[index]?.natura || undefined,
      esigibilitaIVA: item.esigibilita || sdi.dettaglio_linee?.[index]?.esigibilita || undefined,
      tipoCessionePrestazione: item.tipo_cessione || sdi.dettaglio_linee?.[index]?.tipo_cessione || undefined,
    })),
    datiRiepilogo,
    datiPagamento: sdi.pagamento ? {
      condizioniPagamento: sdi.pagamento.condizioni || 'TP02',
      dettaglioPagamento: [{
        modalitaPagamento: sdi.pagamento.modalita || 'MP05',
        importoPagamento: imponibile + iva,
      }],
    } : undefined,
  };
}

