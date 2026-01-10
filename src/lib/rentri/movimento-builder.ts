/**
 * RENTRI Movimento Builder
 * Costruisce il payload JSON per la trasmissione di movimenti registro su RENTRI
 * 
 * Riferimento: RENTRI API v1.0 - POST /dati-registri/v1.0/operatore/{identificativo_registro}/movimenti
 */

export interface MovimentoLocale {
  id: string;
  org_id: string;
  registro_id: string;
  
  // Riferimenti (obbligatorio)
  anno: number;
  progressivo: number;
  data_ora_registrazione: string;
  causale_operazione: string; // DT, NP, T*, RE, I, aT, M, TR, T*aT
  
  // Rifiuto (obbligatorio se causale != "M")
  codice_eer: string;
  descrizione_eer?: string;
  quantita: number;
  unita_misura: string; // kg, t, m3, l, etc.
  stato_fisico?: string; // SP, S, FP, L, VS
  caratteristiche_pericolo?: string[]; // HP01-HP15
  provenienza_codice?: string; // U=Urbano, S=Speciale
  destinato_attivita?: string; // R1-R13, D1-D15, CR
  
  // FIR integrazione (per causali aT, TR, T*, T*aT)
  riferimento_fir?: string;
  
  // Esito (obbligatorio per causali aT, T*aT)
  esito_accettazione?: "Accettato" | "Rifiutato" | "AccettatoParzialmente";
  quantita_accettata?: number;
  note_esito?: string;
  
  // Note
  note?: string;
  
  // VFU
  veicolo_fuori_uso?: boolean;
  vfu_numero_registro?: string;
  vfu_data_registro?: string;
  
  // Trasporto transfrontaliero
  trasporto_transfrontaliero?: boolean;
  tipo_trasporto_transfrontaliero?: string; // DM, DA
  
  // Peso verificato
  peso_verificato_destino?: number;
}

/**
 * Costruisce il payload MovimentoModel per RENTRI
 */
export function buildRentriMovimentoPayload(movimento: MovimentoLocale) {
  const payload: any = {
    // Riferimenti (OBBLIGATORIO)
    riferimenti: {
      numero_registrazione: {
        anno: movimento.anno,
        progressivo: movimento.progressivo
      },
      data_ora_registrazione: movimento.data_ora_registrazione, // ISO 8601 UTC
      // Causale operazione (obbligatoria tranne per stoccaggio istantaneo)
      ...(movimento.causale_operazione && {
        causale_operazione: movimento.causale_operazione
      })
    }
  };
  
  // Rifiuto (obbligatorio se causale != "M")
  if (movimento.causale_operazione !== "M") {
    payload.rifiuto = {
      codice_eer: movimento.codice_eer,
      ...(movimento.descrizione_eer && {
        descrizione_eer: movimento.descrizione_eer
      }),
      stato_fisico: movimento.stato_fisico || "S", // Default: Solido
      quantita: {
        valore: movimento.quantita,
        unita_misura: movimento.unita_misura
      },
      // Caratteristiche pericolo (array, anche vuoto se non pericoloso)
      caratteristiche_pericolo: movimento.caratteristiche_pericolo || [],
      // Provenienza (U=Urbano, S=Speciale)
      ...(movimento.provenienza_codice && {
        provenienza: movimento.provenienza_codice
      }),
      // Destinato attività (R1-R13, D1-D15, CR)
      ...(movimento.destinato_attivita && {
        destinato_attivita: movimento.destinato_attivita
      })
    };
  } else {
    // Materiali (obbligatorio se causale == "M")
    // TODO: Implementare quando necessario
    // payload.materiali = { ... };
  }
  
  // Integrazione FIR (obbligatorio per causali aT, TR, T*, T*aT)
  const causaliConFIR = ["aT", "TR", "T*", "T*aT"];
  if (movimento.causale_operazione && causaliConFIR.includes(movimento.causale_operazione)) {
    if (movimento.riferimento_fir) {
      payload.integrazione_fir = {
        numero_fir: movimento.riferimento_fir
      };
    }
  }
  
  // Esito (obbligatorio per causali aT, T*aT)
  // Nota: Schema esatto da verificare con OpenAPI spec dati-registri
  // Implementazione base basata su logica operativa standard
  if (movimento.causale_operazione && ["aT", "T*aT"].includes(movimento.causale_operazione)) {
    payload.esito = {
      // Esito accettazione: tipicamente "Accettato", "Rifiutato", "AccettatoParzialmente"
      // Se non specificato, default "Accettato" (caso più comune)
      esito_accettazione: movimento.esito_accettazione || "Accettato",
      // Quantità accettata (opzionale, se non specificato usa quantità rifiuto)
      ...(movimento.quantita_accettata !== undefined && {
        quantita_accettata: movimento.quantita_accettata
      }),
      // Note esito (opzionale)
      ...(movimento.note_esito && {
        note_esito: movimento.note_esito.substring(0, 500)
      })
    };
  }
  
  // Annotazioni (opzionale, max 500 caratteri)
  if (movimento.note && movimento.note.length > 0) {
    payload.annotazioni = movimento.note.substring(0, 500);
  }
  
  return payload;
}

/**
 * Valida un movimento locale prima della trasmissione
 */
export function validateMovimentoForRentri(movimento: MovimentoLocale): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validazione riferimenti obbligatori
  if (!movimento.anno || movimento.anno < 1980 || movimento.anno > 2050) {
    errors.push("Anno deve essere tra 1980 e 2050");
  }
  
  if (!movimento.progressivo || movimento.progressivo < 1) {
    errors.push("Progressivo deve essere >= 1");
  }
  
  if (!movimento.data_ora_registrazione) {
    errors.push("data_ora_registrazione obbligatoria");
  }
  
  // Validazione causale
  const causaliValide = ["DT", "NP", "T*", "RE", "I", "aT", "M", "TR", "T*aT"];
  if (movimento.causale_operazione && !causaliValide.includes(movimento.causale_operazione)) {
    errors.push(`causale_operazione non valida: ${movimento.causale_operazione}. Valori validi: ${causaliValide.join(", ")}`);
  }
  
  // Validazione rifiuto (obbligatorio se causale != "M")
  if (movimento.causale_operazione !== "M") {
    if (!movimento.codice_eer) {
      errors.push("codice_eer obbligatorio (causale != 'M')");
    }
    
    if (!movimento.quantita || movimento.quantita <= 0) {
      errors.push("quantita obbligatoria e deve essere > 0");
    }
    
    if (!movimento.unita_misura) {
      errors.push("unita_misura obbligatoria");
    }
    
    // Validazione stato fisico
    const statiFisiciValidi = ["SP", "S", "FP", "L", "VS"];
    if (movimento.stato_fisico && !statiFisiciValidi.includes(movimento.stato_fisico)) {
      errors.push(`stato_fisico non valido: ${movimento.stato_fisico}. Valori validi: ${statiFisiciValidi.join(", ")}`);
    }
  }
  
  // Validazione integrazione FIR
  const causaliConFIR = ["aT", "TR", "T*", "T*aT"];
  if (movimento.causale_operazione && causaliConFIR.includes(movimento.causale_operazione)) {
    if (!movimento.riferimento_fir) {
      errors.push(`riferimento_fir obbligatorio per causale ${movimento.causale_operazione}`);
    }
  }
  
  // Validazione esito (obbligatorio per causali aT, T*aT)
  const causaliConEsito = ["aT", "T*aT"];
  if (movimento.causale_operazione && causaliConEsito.includes(movimento.causale_operazione)) {
    // Campo esito è sempre presente (con default "Accettato" se non specificato)
    // Validazione aggiuntiva se necessario
    if (movimento.esito_accettazione && !["Accettato", "Rifiutato", "AccettatoParzialmente"].includes(movimento.esito_accettazione)) {
      errors.push(`esito_accettazione non valido: ${movimento.esito_accettazione}. Valori validi: Accettato, Rifiutato, AccettatoParzialmente`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Mappa esito RENTRI al formato locale
 */
export function mapRentriEsitoToLocal(esitoRentri: any): {
  stato: string;
  errori?: any[];
  movimenti_validati?: any[];
} {
  return {
    stato: esitoRentri.stato || "errore",
    errori: esitoRentri.errori || [],
    movimenti_validati: esitoRentri.movimenti_validati || []
  };
}

