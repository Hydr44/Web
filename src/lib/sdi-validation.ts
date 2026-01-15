/**
 * Libreria Validazione Fatture SDI
 * Validazione formale e chiamate API esterne per CF, P.IVA, Codice Destinatario
 */

// ============================================================================
// VALIDAZIONE CODICE FISCALE
// ============================================================================

/**
 * Valida formato codice fiscale italiano
 */
export function validateCodiceFiscale(cf: string): { valid: boolean; error?: string } {
  if (!cf) {
    return { valid: false, error: 'Codice fiscale obbligatorio' };
  }

  const cleanCf = cf.toUpperCase().replace(/\s/g, '');

  if (cleanCf.length !== 16) {
    return { valid: false, error: 'Il codice fiscale deve essere di 16 caratteri' };
  }

  const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
  if (!cfRegex.test(cleanCf)) {
    return { valid: false, error: 'Formato codice fiscale non valido' };
  }

  // Controllo carattere di controllo
  const checksum = validateCFChecksum(cleanCf);
  if (!checksum) {
    return { valid: false, error: 'Codice fiscale non valido (checksum errato)' };
  }

  return { valid: true };
}

/**
 * Valida checksum codice fiscale
 */
function validateCFChecksum(cf: string): boolean {
  const dispari = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23];
  const pari = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];

  let somma = 0;
  for (let i = 0; i < 15; i++) {
    const char = cf[i];
    const isNumber = char >= '0' && char <= '9';
    const charCode = isNumber ? char.charCodeAt(0) - 48 : char.charCodeAt(0) - 65;

    if (i % 2 === 0) {
      // Posizione dispari (0-indexed)
      somma += isNumber ? dispari[charCode] : dispari[charCode];
    } else {
      // Posizione pari
      somma += isNumber ? pari[charCode] : pari[charCode];
    }
  }

  const resto = somma % 26;
  const carattereControllo = String.fromCharCode(65 + resto);

  return cf[15] === carattereControllo;
}

/**
 * Verifica coerenza CF con dati anagrafici
 */
export function validateCFAnagrafica(
  cf: string,
  nome: string,
  cognome: string,
  dataNascita?: string,
  sesso?: string,
  comuneNascita?: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!cf || cf.length !== 16) {
    return { valid: false, errors: ['Codice fiscale non valido'] };
  }

  const cleanCf = cf.toUpperCase().replace(/\s/g, '');

  // Estrai parti CF
  const cfCognome = cleanCf.substring(0, 3);
  const cfNome = cleanCf.substring(3, 6);
  const cfData = cleanCf.substring(6, 8);
  const cfMese = cleanCf.substring(8, 9);
  const cfGiorno = cleanCf.substring(9, 11);
  const cfComune = cleanCf.substring(11, 15);

  // Verifica cognome
  if (cognome) {
    const cognomeCode = extractConsonantsVowels(cognome).substring(0, 3);
    if (cfCognome !== cognomeCode) {
      errors.push(`Cognome "${cognome}" non corrisponde al codice fiscale`);
    }
  }

  // Verifica nome
  if (nome) {
    const nomeCode = extractConsonantsVowels(nome).substring(0, 3);
    if (cfNome !== nomeCode) {
      errors.push(`Nome "${nome}" non corrisponde al codice fiscale`);
    }
  }

  // Verifica data nascita e sesso
  if (dataNascita && sesso) {
    const date = new Date(dataNascita);
    const year = date.getFullYear() % 100;
    const month = date.getMonth() + 1;
    let day = date.getDate();

    const months = ['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'T'];
    const expectedMonth = months[month - 1];

    if (sesso.toUpperCase() === 'F') {
      day += 40;
    }

    const expectedYear = String(year).padStart(2, '0');
    const expectedDay = String(day).padStart(2, '0');

    if (cfData !== expectedYear) {
      errors.push(`Anno di nascita non corrisponde al codice fiscale`);
    }
    if (cfMese !== expectedMonth) {
      errors.push(`Mese di nascita non corrisponde al codice fiscale`);
    }
    if (cfGiorno !== expectedDay) {
      errors.push(`Giorno di nascita/sesso non corrisponde al codice fiscale`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function extractConsonantsVowels(str: string): string {
  const consonants = str.toUpperCase().replace(/[^BCDFGHJKLMNPQRSTVWXYZ]/g, '');
  const vowels = str.toUpperCase().replace(/[^AEIOU]/g, '');
  return (consonants + vowels + 'XXX').substring(0, 3);
}

// ============================================================================
// VALIDAZIONE PARTITA IVA
// ============================================================================

/**
 * Valida formato partita IVA italiana
 */
export function validatePartitaIVA(piva: string): { valid: boolean; error?: string } {
  if (!piva) {
    return { valid: false, error: 'Partita IVA obbligatoria' };
  }

  // Rimuovi prefisso IT se presente
  const cleanPiva = piva.replace(/^IT/i, '').replace(/\s/g, '');

  if (cleanPiva.length !== 11) {
    return { valid: false, error: 'La partita IVA deve essere di 11 cifre' };
  }

  if (!/^\d{11}$/.test(cleanPiva)) {
    return { valid: false, error: 'La partita IVA deve contenere solo cifre' };
  }

  // Controllo checksum Luhn
  const checksum = validatePIVAChecksum(cleanPiva);
  if (!checksum) {
    return { valid: false, error: 'Partita IVA non valida (checksum errato)' };
  }

  return { valid: true };
}

/**
 * Valida checksum partita IVA (algoritmo Luhn)
 */
function validatePIVAChecksum(piva: string): boolean {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let digit = parseInt(piva[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(piva[10]);
}

/**
 * Valida partita IVA con Vies (API UE)
 * Vies usa SOAP, implementiamo chiamata diretta
 */
export async function validatePIVAVies(
  piva: string,
  countryCode: string = 'IT'
): Promise<{ valid: boolean; exists?: boolean; name?: string; address?: string; error?: string }> {
  try {
    // Prima validazione formale
    const formal = validatePartitaIVA(piva);
    if (!formal.valid) {
      return { valid: false, error: formal.error };
    }

    // Rimuovi prefisso IT se presente
    const cleanPiva = piva.replace(/^IT/i, '').replace(/\s/g, '');

    // Vies SOAP endpoint
    const viesUrl = 'https://ec.europa.eu/taxation_customs/vies/services/checkVatService';
    
    // SOAP envelope per checkVat
    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soap:Header/>
  <soap:Body>
    <tns:checkVat>
      <tns:countryCode>${countryCode}</tns:countryCode>
      <tns:vatNumber>${cleanPiva}</tns:vatNumber>
    </tns:checkVat>
  </soap:Body>
</soap:Envelope>`;

    try {
      const response = await fetch(viesUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'urn:ec.europa.eu:taxud:vies:services:checkVat/checkVat'
        },
        body: soapEnvelope
      });

      if (!response.ok) {
        return { valid: true, exists: undefined, error: 'Errore chiamata Vies' };
      }

      const xmlText = await response.text();
      
      // Parse risposta SOAP
      const validMatch = xmlText.match(/<valid>(true|false)<\/valid>/i);
      const nameMatch = xmlText.match(/<name>(.*?)<\/name>/i);
      const addressMatch = xmlText.match(/<address>(.*?)<\/address>/i);
      const faultMatch = xmlText.match(/<faultstring>(.*?)<\/faultstring>/i);

      if (faultMatch) {
        return { valid: true, exists: false, error: faultMatch[1] };
      }

      if (validMatch) {
        const isValid = validMatch[1].toLowerCase() === 'true';
        const name = nameMatch ? nameMatch[1].trim() : undefined;
        const address = addressMatch ? addressMatch[1].trim() : undefined;

        return {
          valid: true,
          exists: isValid,
          name: name || undefined,
          address: address || undefined
        };
      }

      // Se non riusciamo a parsare, restituiamo comunque validazione formale
      return { valid: true, exists: undefined };
    } catch (fetchError: any) {
      // Se la chiamata fallisce, restituiamo comunque validazione formale
      console.warn('[SDI-VALIDATION] Errore chiamata Vies:', fetchError.message);
      return { valid: true, exists: undefined, error: 'Servizio Vies temporaneamente non disponibile' };
    }
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

// ============================================================================
// VALIDAZIONE CODICE DESTINATARIO
// ============================================================================

/**
 * Valida formato codice destinatario
 */
export function validateCodiceDestinatario(
  codice: string,
  formatoTrasm: 'FPR12' | 'FPA12' | 'FSM10' = 'FPR12'
): { valid: boolean; error?: string } {
  if (!codice) {
    return { valid: false, error: 'Codice destinatario obbligatorio' };
  }

  const cleanCodice = codice.trim().toUpperCase();

  // FPR12 e FSM10: 6 caratteri
  // FPA12: 7 caratteri
  const lunghezzaAttesa = (formatoTrasm === 'FPA12') ? 7 : 6;

  if (cleanCodice.length !== lunghezzaAttesa) {
    return {
      valid: false,
      error: `Codice destinatario per ${formatoTrasm} deve essere di ${lunghezzaAttesa} caratteri`
    };
  }

  // Formato alfanumerico
  if (!/^[A-Z0-9]+$/.test(cleanCodice)) {
    return { valid: false, error: 'Codice destinatario deve essere alfanumerico' };
  }

  return { valid: true };
}

/**
 * Valida codice destinatario PA con IPA (Indice Pubblica Amministrazione)
 * IPA REST API pubblica
 */
export async function validateCodiceDestinatarioIPA(
  codice: string
): Promise<{ valid: boolean; exists?: boolean; denominazione?: string; error?: string }> {
  try {
    // Prima validazione formale
    const formal = validateCodiceDestinatario(codice, 'FPA12');
    if (!formal.valid) {
      return { valid: false, error: formal.error };
    }

    const cleanCodice = codice.trim().toUpperCase();

    // IPA REST API - endpoint dati amministrazioni
    // L'API IPA fornisce un JSON con tutte le amministrazioni
    // Possiamo scaricare e cercare nel JSON, oppure usare endpoint specifico se disponibile
    const ipaUrl = 'https://www.indicepa.gov.it/ipa-dati/dati/amm.json';

    try {
      const response = await fetch(ipaUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RescueManager-SDI-Validation/1.0'
        }
      });

      if (!response.ok) {
        return { valid: true, exists: undefined, error: 'Errore chiamata IPA' };
      }

      const data = await response.json();

      // IPA restituisce un oggetto con struttura:
      // { "data": [{ cod_amm, des_amm, ... }, ...] }
      // Oppure array diretto
      const amministrazioni = Array.isArray(data) ? data : (data.data || data.amm || []);

      // Cerca il codice nell'array delle amministrazioni
      // La struttura IPA standard: cod_amm (codice amministrazione) e des_amm (denominazione)
      const amministrazione = amministrazioni.find((amm: any) => {
        // Prova vari campi possibili
        const codiciPossibili = [
          amm.cod_amm,
          amm.codice_amm,
          amm.codice,
          amm.codice_destinatario,
          amm.codice_ipa,
          amm.cod_amm_ipa
        ];
        return codiciPossibili.some(cod => cod && cod.toUpperCase() === cleanCodice);
      });

      if (amministrazione) {
        return {
          valid: true,
          exists: true,
          denominazione: amministrazione.des_amm || 
                        amministrazione.denominazione || 
                        amministrazione.nome || 
                        amministrazione.des_ente ||
                        undefined
        };
      }

      // Se non trovato, potrebbe essere un codice valido ma non presente nell'elenco
      // (alcuni codici potrebbero essere attivi ma non ancora nell'elenco pubblico)
      return { valid: true, exists: false };
    } catch (fetchError: any) {
      // Se la chiamata fallisce, restituiamo comunque validazione formale
      console.warn('[SDI-VALIDATION] Errore chiamata IPA:', fetchError.message);
      return { valid: true, exists: undefined, error: 'Servizio IPA temporaneamente non disponibile' };
    }
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

// ============================================================================
// VALIDAZIONE GENERALE FATTURA
// ============================================================================

export interface InvoiceValidationResult {
  valid: boolean;
  errors: Array<{ campo: string; messaggio: string; severita: number }>;
  warnings: Array<{ campo: string; messaggio: string; severita: number }>;
}

/**
 * Valida tutti i campi principali di una fattura
 */
export async function validateInvoice(invoice: any): Promise<InvoiceValidationResult> {
  const errors: Array<{ campo: string; messaggio: string; severita: number }> = [];
  const warnings: Array<{ campo: string; messaggio: string; severita: number }> = [];

  // Validazione CF/P.IVA cliente
  if (invoice.customer_tax_code) {
    const cfValidation = validateCodiceFiscale(invoice.customer_tax_code);
    if (!cfValidation.valid) {
      errors.push({
        campo: 'customer_tax_code',
        messaggio: cfValidation.error || 'Codice fiscale non valido',
        severita: 9
      });
    }
  }

  if (invoice.customer_vat) {
    const pivaValidation = validatePartitaIVA(invoice.customer_vat);
    if (!pivaValidation.valid) {
      errors.push({
        campo: 'customer_vat',
        messaggio: pivaValidation.error || 'Partita IVA non valida',
        severita: 9
      });
    } else {
      // Validazione esistenza con Vies (opzionale, non blocca se fallisce)
      try {
        const viesResult = await validatePIVAVies(invoice.customer_vat);
        if (viesResult.exists === false) {
          warnings.push({
            campo: 'customer_vat',
            messaggio: 'Partita IVA non trovata in anagrafe Vies. Verificare che sia corretta.',
            severita: 7
          });
        } else if (viesResult.exists === true && viesResult.name) {
          // P.IVA valida e trovata - potremmo verificare coerenza con denominazione
          if (invoice.customer_name && 
              invoice.customer_name.toLowerCase() !== viesResult.name.toLowerCase() &&
              !invoice.customer_name.toLowerCase().includes(viesResult.name.toLowerCase()) &&
              !viesResult.name.toLowerCase().includes(invoice.customer_name.toLowerCase())) {
            warnings.push({
              campo: 'customer_vat',
              messaggio: `Denominazione potrebbe non corrispondere. Vies riporta: "${viesResult.name}"`,
              severita: 6
            });
          }
        }
      } catch (viesError) {
        // Ignora errori Vies, non blocca validazione
        console.warn('[SDI-VALIDATION] Errore validazione Vies:', viesError);
      }
    }
  }

  // Validazione codice destinatario
  if (invoice.meta?.sdi?.trasmissione?.codice_destinatario) {
    const formato = invoice.meta?.sdi?.trasmissione?.formato_trasmissione || 'FPR12';
    const cdValidation = validateCodiceDestinatario(
      invoice.meta.sdi.trasmissione.codice_destinatario,
      formato
    );
    if (!cdValidation.valid) {
      errors.push({
        campo: 'codice_destinatario',
        messaggio: cdValidation.error || 'Codice destinatario non valido',
        severita: 8
      });
    } else if (formato === 'FPA12') {
      // Se è PA, verifica con IPA
      try {
        const ipaResult = await validateCodiceDestinatarioIPA(invoice.meta.sdi.trasmissione.codice_destinatario);
        if (ipaResult.exists === false) {
          warnings.push({
            campo: 'codice_destinatario',
            messaggio: 'Codice destinatario PA non trovato in IPA. Verificare che sia corretto e attivo.',
            severita: 7
          });
        } else if (ipaResult.exists === true && ipaResult.denominazione) {
          // Codice valido e trovato - potremmo verificare coerenza con denominazione
          if (invoice.customer_name && 
              invoice.customer_name.toLowerCase() !== ipaResult.denominazione.toLowerCase() &&
              !invoice.customer_name.toLowerCase().includes(ipaResult.denominazione.toLowerCase()) &&
              !ipaResult.denominazione.toLowerCase().includes(invoice.customer_name.toLowerCase())) {
            warnings.push({
              campo: 'codice_destinatario',
              messaggio: `Denominazione potrebbe non corrispondere. IPA riporta: "${ipaResult.denominazione}"`,
              severita: 6
            });
          }
        }
      } catch (ipaError) {
        // Ignora errori IPA, non blocca validazione
        console.warn('[SDI-VALIDATION] Errore validazione IPA:', ipaError);
      }
    }
  }

  // Validazione data
  if (invoice.date) {
    const invoiceDate = new Date(invoice.date);
    const today = new Date();
    if (invoiceDate > today) {
      warnings.push({
        campo: 'date',
        messaggio: 'Data fattura futura',
        severita: 6
      });
    }
  }

  // Validazione importi
  if (invoice.items && invoice.items.length > 0) {
    const totalImponibile = invoice.items.reduce((sum: number, item: any) => {
      return sum + (Number(item.qty || 0) * Number(item.price || 0));
    }, 0);

    const totalIva = invoice.items.reduce((sum: number, item: any) => {
      const imponibile = Number(item.qty || 0) * Number(item.price || 0);
      return sum + (imponibile * Number(item.vat_perc || 0) / 100);
    }, 0);

    const expectedTotal = totalImponibile + totalIva;
    const actualTotal = Number(invoice.total || 0);

    if (Math.abs(expectedTotal - actualTotal) > 0.01) {
      errors.push({
        campo: 'total',
        messaggio: `Totale non corrisponde: atteso ${expectedTotal.toFixed(2)}, trovato ${actualTotal.toFixed(2)}`,
        severita: 8
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
