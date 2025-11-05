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
    data,
    numero,
    importoTotaleDocumento,
    dettaglioLinee,
    datiRiepilogo,
    datiPagamento,
  } = data;

  // Genera dettaglio linee
  const lineeXML = dettaglioLinee.map((linea) => `
    <DettaglioLinee>
      <NumeroLinea>${linea.numeroLinea}</NumeroLinea>
      <Descrizione>${escapeXml(linea.descrizione)}</Descrizione>
      ${linea.quantita != null ? `<Quantita>${linea.quantita.toFixed(2)}</Quantita>` : ''}
      ${linea.unitaMisura ? `<UnitaMisura>${escapeXml(linea.unitaMisura)}</UnitaMisura>` : ''}
      <PrezzoUnitario>${linea.prezzoUnitario.toFixed(2)}</PrezzoUnitario>
      <PrezzoTotale>${linea.prezzoTotale.toFixed(2)}</PrezzoTotale>
      <AliquotaIVA>${linea.aliquotaIVA.toFixed(2)}</AliquotaIVA>
    </DettaglioLinee>`).join('');

  // Genera dati riepilogo
  const riepilogoXML = datiRiepilogo.map((riepilogo) => `
      <DatiRiepilogo>
        <AliquotaIVA>${riepilogo.aliquotaIVA.toFixed(2)}</AliquotaIVA>
        <ImponibileImporto>${riepilogo.imponibileImporto.toFixed(2)}</ImponibileImporto>
        <Imposta>${riepilogo.imposta.toFixed(2)}</Imposta>
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
<p:FatturaElettronica versione="FPR12" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_FatturaPA_versione_1.2.xsd">
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
        <Data>${escapeXml(data)}</Data>
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

/**
 * Converte dati fattura da database a formato FatturaPA
 */
export function invoiceToFatturaPAData(invoice: any, orgSettings?: any): FatturaPAData {
  const items = invoice.invoice_items || [];
  const sdi = invoice.meta?.sdi || {};
  const org = orgSettings || {};

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

  const datiRiepilogo = Array.from(aliquoteMap.entries()).map(([aliquota, dati]) => ({
    aliquotaIVA: aliquota,
    imponibileImporto: dati.imponibile,
    imposta: dati.imposta,
  }));

  return {
    idTrasmittente: {
      idPaese: 'IT',
      idCodice: sdi.cedente_prestatore?.id_fiscale_iva?.id_codice || org.vat_number || '02166430856',
    },
    progressivoInvio: invoice.number || `00001`,
    formatoTrasmissione: 'FPR12',
    codiceDestinatario: sdi.trasmissione?.codice_destinatario || invoice.customer_sdi_code,
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
        indirizzo: invoice.customer_address || 'Via',
        cap: invoice.customer_zip || '00000',
        comune: invoice.customer_city || 'Comune',
        provincia: invoice.customer_province || 'XX',
        nazione: 'IT',
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

