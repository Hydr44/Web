/**
 * RENTRI FIR Builder
 * Costruisce il payload JSON per la creazione di un FIR digitale su RENTRI
 * 
 * Riferimento: RENTRI API v1.0 - POST /formulari/v1.0/
 */

export interface FIRLocal {
  id: string;
  org_id: string;
  numero_fir?: string;
  anno: number;
  data_creazione: string;
  
  // Produttore
  produttore_cf: string;
  produttore_nome: string;
  produttore_indirizzo: string;
  produttore_pec?: string;
  produttore_num_iscr_sito?: string;
  
  // Trasportatore
  trasportatore_cf: string;
  trasportatore_nome: string;
  trasportatore_targa: string;
  trasportatore_albo?: string;
  trasportatore_pec?: string;
  trasportatore_rimorchio?: string;
  
  // Destinatario
  destinatario_cf: string;
  destinatario_nome: string;
  destinatario_indirizzo: string;
  destinatario_autorizzazione?: string;
  destinatario_autorizzazione_tipo?: string;
  destinatario_attivita?: string; // R1-R13, D1-D15
  destinatario_pec?: string;
  destinatario_num_iscr_sito?: string;
  
  // Conducente (OBBLIGATORIO per trasporto terrestre)
  conducente_nome?: string;
  conducente_cognome?: string;
  
  // Rifiuti
  codici_eer: Array<{
    codice: string;
    descrizione?: string;
    quantita: number;
    unita: string;
    stato_fisico: string;
    caratteristiche_pericolo?: string[];
  }>;
  
  // Provenienza rifiuto (OBBLIGATORIO)
  rifiuto_provenienza?: string; // U=Urbano, S=Speciale
  
  // Trasporto
  data_inizio_trasporto?: string;
  data_fine_trasporto?: string;
  note?: string;
}

/**
 * Costruisce il payload per POST /formulari/v1.0/
 */
export function buildRentriFIRPayload(fir: FIRLocal, numIscrSitoOperatore: string) {
  // Parse indirizzi
  const prodIndirizzo = parseIndirizzo(fir.produttore_indirizzo);
  const destIndirizzo = parseIndirizzo(fir.destinatario_indirizzo);
  
  // Usa primo rifiuto come "rifiuto" principale (RENTRI vuole singolo, non array)
  const rifiutoPrincipale = fir.codici_eer[0];
  
  const payload = {
    // NumIscrSito formato: OP123XXXXXXXX00-MI00001
    num_iscr_sito: numIscrSitoOperatore || "OP100011134-MI00001",
    
    dati_partenza: {
      // NO numero_fir - lo assegna RENTRI
      
      // Produttore
      produttore: {
        ...(fir.produttore_num_iscr_sito && {
          num_iscr_sito: fir.produttore_num_iscr_sito
        }),
        luogo_produzione: {
          indirizzo: prodIndirizzo.via || "Via Esempio",
          civico: prodIndirizzo.civico || "1",
          citta: {
            comune_id: prodIndirizzo.comuneIdISTAT || "015146" // Milano ISTAT
          }
        }
      },
      
      // Destinatario
      destinatario: {
        codice_fiscale: fir.destinatario_cf,
        denominazione: fir.destinatario_nome,
        indirizzo: {
          indirizzo: destIndirizzo.via || "Via Destinazione",
          civico: destIndirizzo.civico || "1",
          citta: {
            comune_id: destIndirizzo.comuneIdISTAT || "015146" // Milano ISTAT
          }
        },
        ...(fir.destinatario_autorizzazione && {
          autorizzazione: {
            numero: fir.destinatario_autorizzazione,
            // Valori validi: RecSmalArt208, AIA, RecProcSemplificata, etc.
            tipo: fir.destinatario_autorizzazione_tipo || "RecSmalArt208"
          }
        }),
        // Attività recupero/smaltimento (R1-R13, D1-D15)
        attivita: fir.destinatario_attivita || "R13" // Default: Messa in riserva
      },
      
      // Trasportatori (ARRAY, non singolo!)
      trasportatori: [
        {
          codice_fiscale: fir.trasportatore_cf,
          denominazione: fir.trasportatore_nome,
          // Numero albo: OPZIONALE in DEMO se non registrato
          // Solo se presente E validato da RENTRI
          // ...(fir.trasportatore_albo && normalizeAlbo(fir.trasportatore_albo)),
          tipo_trasporto: "Terrestre"
        }
      ],
      
      // Rifiuto (SINGOLO, non array!)
      rifiuto: {
        codice_eer: rifiutoPrincipale.codice,
        // Provenienza: U=Urbano, S=Speciale (OBBLIGATORIO)
        provenienza: fir.rifiuto_provenienza || "S",
        // Caratteristiche pericolo: SEMPRE presente come array (anche vuoto se rifiuto non pericoloso)
        caratteristiche_pericolo: rifiutoPrincipale.caratteristiche_pericolo || [],
        stato_fisico: rifiutoPrincipale.stato_fisico, // Già in formato RENTRI corretto dal form
        verificato_in_partenza: false,
        quantita: {
          unita_misura: rifiutoPrincipale.unita,
          valore: parseFloat(rifiutoPrincipale.quantita.toString())
        }
      }
    },
    
    // Dati trasporto partenza (OBBLIGATORIO con conducente!)
    ...(fir.data_inizio_trasporto && {
      dati_trasporto_partenza: {
        conducente: {
          nome: fir.conducente_nome || "Da Specificare",
          cognome: fir.conducente_cognome || "Da Specificare"
        },
        targa_automezzo: fir.trasportatore_targa.toUpperCase(),
        ...(fir.trasportatore_rimorchio && {
          targa_rimorchio: fir.trasportatore_rimorchio.toUpperCase()
        }),
        data_ora_inizio_trasporto: new Date(fir.data_inizio_trasporto).toISOString()
      }
    })
  };
  
  return payload;
}

/**
 * Normalizza numero iscrizione albo al formato RENTRI
 * Pattern: ^([A-Za-z]{2})/([0-9]{6})$ (es: MI/123456)
 */
function normalizeAlbo(albo: string): { numero_iscrizione_albo: string } | {} {
  if (!albo) return {};
  
  const parts = albo.split('/');
  if (parts.length !== 2) return {};
  
  const provincia = parts[0].toUpperCase().substring(0, 2);
  const numero = parts[1].padStart(6, '0').substring(0, 6); // Pad a 6 cifre
  
  return {
    numero_iscrizione_albo: `${provincia}/${numero}`
  };
}

/**
 * Mappa stato fisico locale → codice RENTRI
 * Codici RENTRI: SP, S, FP, L, VS
 */
function mapStatoFisicoToRENTRI(statoFisico: string): string {
  // Se già in formato RENTRI corretto (SP, S, FP, L, VS), ritorna così com'è
  if (['SP', 'S', 'FP', 'L', 'VS'].includes(statoFisico)) {
    return statoFisico;
  }
  
  // Altrimenti mappa da testo esteso (backward compatibility)
  const mapping: Record<string, string> = {
    'solido': 'S',
    'liquido': 'L',
    'fangoso': 'FP',
    'polvere': 'SP',
    'pulverulento': 'SP',
    'vischioso': 'VS',
    'sciropposo': 'VS'
  };
  return mapping[statoFisico.toLowerCase()] || 'S'; // Default: Solido
}

/**
 * Parse indirizzo testuale in componenti
 * Es: "Via Roma 123, 20100 Milano (MI)" → { via: "Via Roma", civico: "123", cap: "20100", comune: "Milano", provincia: "MI" }
 */
function parseIndirizzo(indirizzo: string) {
  const parts = indirizzo.split(",").map(s => s.trim());
  
  // Prima parte: via + civico
  const viaParts = parts[0]?.split(/\s+/) || [];
  const civico = viaParts[viaParts.length - 1]?.match(/^\d+/) ? viaParts.pop() : undefined;
  const via = viaParts.join(" ");
  
  // Seconda parte: CAP + Comune (Provincia)
  const capMatch = parts[1]?.match(/\b(\d{5})\b/);
  const cap = capMatch ? capMatch[1] : undefined;
  
  const comuneMatch = parts[1]?.match(/\d{5}\s+([^(]+)/);
  const comune = comuneMatch ? comuneMatch[1].trim() : undefined;
  
  const provMatch = parts[1]?.match(/\(([A-Z]{2})\)/);
  const provincia = provMatch ? provMatch[1] : undefined;
  
  // Lookup comuneId ISTAT da tabella comuni
  const comuneIdISTAT = getComuneId(comune, provincia);
  
  return {
    via: via || indirizzo,
    civico,
    cap,
    comune,
    provincia,
    comuneId: undefined, // Vecchio codice catastale (deprecato)
    comuneIdISTAT // Nuovo: codice ISTAT a 6 cifre
  };
}

/**
 * Mappa nome comune → codice catastale (semplificato)
 */
function getComuneId(comune?: string, provincia?: string): string {
  if (!comune) return "015146"; // Default: Milano ISTAT
  
  // Codici ISTAT (6 cifre) - DA USARE per RENTRI
  const comuniISTAT: Record<string, string> = {
    "MILANO": "015146",
    "ROMA": "058091",
    "TORINO": "001272",
    "NAPOLI": "063049",
    "PALERMO": "082053",
    "GENOVA": "010025",
    "BOLOGNA": "037006",
    "FIRENZE": "048017",
    "LAINATE": "015118",
    "PARABIAGO": "015173",
    "SARONNO": "012115",
    "GALLARATE": "012076"
  };
  
  const comuneNorm = comune.toUpperCase();
  return comuniISTAT[comuneNorm] || "015146"; // Default: Milano ISTAT
}

/**
 * Valida FIR prima di trasmissione
 */
export function validateFIRForRentri(fir: FIRLocal): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Produttore
  if (!fir.produttore_cf) errors.push("Produttore CF mancante");
  if (!fir.produttore_nome) errors.push("Produttore nome mancante");
  if (!fir.produttore_indirizzo) errors.push("Produttore indirizzo mancante");
  
  // Trasportatore
  if (!fir.trasportatore_cf) errors.push("Trasportatore CF mancante");
  if (!fir.trasportatore_nome) errors.push("Trasportatore nome mancante");
  if (!fir.trasportatore_targa) errors.push("Trasportatore targa mancante");
  
  // Destinatario
  if (!fir.destinatario_cf) errors.push("Destinatario CF mancante");
  if (!fir.destinatario_nome) errors.push("Destinatario nome mancante");
  if (!fir.destinatario_indirizzo) errors.push("Destinatario indirizzo mancante");
  
  // Rifiuti
  if (!fir.codici_eer || fir.codici_eer.length === 0) {
    errors.push("Nessun rifiuto specificato");
  } else {
    fir.codici_eer.forEach((r, i) => {
      if (!r.codice || !/^\d{6}$/.test(r.codice)) {
        errors.push(`Rifiuto ${i+1}: codice EER non valido (deve essere 6 cifre)`);
      }
      if (!r.quantita || r.quantita <= 0) {
        errors.push(`Rifiuto ${i+1}: quantità non valida`);
      }
      if (!r.stato_fisico) {
        errors.push(`Rifiuto ${i+1}: stato fisico mancante`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Mappa stato RENTRI dettagliato → stato semplificato locale
 */
export function mapRentriStatoToLocal(rentriStato: string): string {
  const mapping: Record<string, string> = {
    'InserimentoQuantita': 'trasmesso',
    'InserimentoQuantitaTrasportoIniziale': 'trasmesso',
    'InserimentoTrasportoIniziale': 'trasmesso',
    'FirmaProduttoreTrasportatoreIniziale': 'trasmesso',
    'FirmaTrasportatoreIniziale': 'trasmesso',
    'FirmaProduttore': 'trasmesso',
    'InserimentoTrasportoSuccessivo': 'trasmesso',
    'FirmaTrasportatoreSuccessivo': 'trasmesso',
    'InserimentoAccettazione': 'trasmesso',
    'FirmaAccettazione': 'trasmesso',
    'Accettato': 'accettato',
    'RespintoAccettatoParzialmente': 'rifiutato',
    'Annullato': 'annullato'
  };
  
  return mapping[rentriStato] || 'trasmesso';
}


