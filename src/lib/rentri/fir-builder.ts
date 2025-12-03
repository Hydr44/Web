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
  destinatario_pec?: string;
  destinatario_num_iscr_sito?: string;
  
  // Rifiuti
  codici_eer: Array<{
    codice: string;
    descrizione?: string;
    quantita: number;
    unita: string;
    stato_fisico: string;
    caratteristiche_pericolo?: string[];
  }>;
  
  // Trasporto
  data_inizio_trasporto?: string;
  data_fine_trasporto?: string;
  note?: string;
}

/**
 * Costruisce il payload per POST /formulari/v1.0/
 */
export function buildRentriFIRPayload(fir: FIRLocal, numIscrSitoOperatore: string) {
  // Parse indirizzo produttore
  const prodIndirizzo = parseIndirizzo(fir.produttore_indirizzo);
  const destIndirizzo = parseIndirizzo(fir.destinatario_indirizzo);
  
  const payload = {
    num_iscr_sito: numIscrSitoOperatore, // NumIscrSito dell'operatore che trasmette
    
    dati_partenza: {
      // Numero FIR (opzionale, RENTRI lo assegna se manca)
      ...(fir.numero_fir && { numero_fir: fir.numero_fir }),
      
      // Produttore
      produttore: {
        codice_fiscale: fir.produttore_cf,
        denominazione: fir.produttore_nome,
        ...(fir.produttore_num_iscr_sito && {
          num_iscr_sito: fir.produttore_num_iscr_sito
        }),
        luogo_produzione: {
          indirizzo: prodIndirizzo.via,
          civico: prodIndirizzo.civico || "SNC",
          citta: {
            comune_id: prodIndirizzo.comuneId || "F205", // Default Milano
            cap: prodIndirizzo.cap || "20100"
          }
        }
      },
      
      // Trasportatore
      trasportatore: {
        codice_fiscale: fir.trasportatore_cf,
        denominazione: fir.trasportatore_nome,
        targa: fir.trasportatore_targa.toUpperCase(),
        ...(fir.trasportatore_rimorchio && {
          rimorchio: fir.trasportatore_rimorchio.toUpperCase()
        }),
        ...(fir.trasportatore_albo && {
          albo_gestori: {
            numero: fir.trasportatore_albo
          }
        })
      },
      
      // Destinatario
      destinatario: {
        codice_fiscale: fir.destinatario_cf,
        denominazione: fir.destinatario_nome,
        ...(fir.destinatario_num_iscr_sito && {
          num_iscr_sito: fir.destinatario_num_iscr_sito
        }),
        indirizzo: {
          indirizzo: destIndirizzo.via,
          civico: destIndirizzo.civico || "SNC",
          citta: {
            comune_id: destIndirizzo.comuneId || "F205",
            cap: destIndirizzo.cap || "20100"
          }
        },
        ...(fir.destinatario_autorizzazione && {
          autorizzazione: {
            numero: fir.destinatario_autorizzazione,
            tipo: fir.destinatario_autorizzazione_tipo || "AIA" // AIA, AUA, AU, Ordinaria, Semplificata
          }
        })
      },
      
      // Rifiuti (array)
      rifiuti: fir.codici_eer.map(r => ({
        codice_eer: r.codice,
        ...(r.descrizione && { descrizione: r.descrizione }),
        quantita: {
          valore: r.quantita,
          unita_misura: r.unita
        },
        stato_fisico: r.stato_fisico,
        ...(r.caratteristiche_pericolo && r.caratteristiche_pericolo.length > 0 && {
          caratteristiche_pericolo: r.caratteristiche_pericolo
        })
      }))
    },
    
    // Trasporto iniziale (se presente)
    ...(fir.data_inizio_trasporto && {
      trasporto_iniziale: {
        data_ora_inizio: new Date(fir.data_inizio_trasporto).toISOString()
      }
    })
  };
  
  return payload;
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
  
  // TODO: Lookup comuneId da tabella comuni (API RENTRI o DB locale)
  const comuneId = getComuneId(comune, provincia);
  
  return {
    via: via || indirizzo,
    civico,
    cap,
    comune,
    provincia,
    comuneId
  };
}

/**
 * Mappa nome comune → codice catastale (semplificato)
 */
function getComuneId(comune?: string, provincia?: string): string {
  if (!comune) return "F205"; // Default: Milano
  
  const comuni: Record<string, string> = {
    "MILANO": "F205",
    "ROMA": "H501",
    "TORINO": "L219",
    "NAPOLI": "F839",
    "PALERMO": "G273",
    "GENOVA": "D969",
    "BOLOGNA": "A944",
    "FIRENZE": "D612",
    "LAINATE": "E412",
    "PARABIAGO": "G325",
    "SARONNO": "I433",
    "GALLARATE": "D869",
    // ... altri comuni comuni
  };
  
  const comuneNorm = comune.toUpperCase();
  return comuni[comuneNorm] || "F205"; // Default: Milano
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

