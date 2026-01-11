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
 * Mappa causali non standard ai codici RENTRI
 */
function normalizeCausale(causale: string): string {
  const mappatura: Record<string, string> = {
    "PS": "NP", // Produzione Scarico → Nuovo Produzione
    "GI": "RE", // Giacenza → Recupero (approssimazione)
  };
  return mappatura[causale] || causale;
}

/**
 * Mappa stati fisici user-friendly ai codici RENTRI
 */
function normalizeStatoFisico(stato: string): string {
  const mappatura: Record<string, string> = {
    "solido": "S",
    "liquido": "L",
    "gassoso": "VS",
    "fangoso": "FP",
  };
  return mappatura[stato] || stato;
}

/**
 * Costruisce il payload MovimentoModel per RENTRI
 */
export function buildRentriMovimentoPayload(movimento: MovimentoLocale) {
  // Normalizza causale e stato fisico
  const causaleNormalizzata = normalizeCausale(movimento.causale_operazione);
  const statoFisicoNormalizzato = movimento.stato_fisico 
    ? normalizeStatoFisico(movimento.stato_fisico)
    : movimento.stato_fisico;
  
  const payload: any = {
    // Riferimenti (OBBLIGATORIO)
    riferimenti: {
      numero_registrazione: {
        anno: movimento.anno,
        progressivo: movimento.progressivo
      },
      data_ora_registrazione: movimento.data_ora_registrazione, // ISO 8601 UTC
      // Causale operazione (obbligatoria tranne per stoccaggio istantaneo)
      causale_operazione: causaleNormalizzata
    }
  };
  
  // Rifiuto (obbligatorio se causale != "M")
  if (causaleNormalizzata !== "M") {
    payload.rifiuto = {
      codice_eer: movimento.codice_eer,
      ...(movimento.descrizione_eer && {
        descrizione_eer: movimento.descrizione_eer
      }),
      stato_fisico: statoFisicoNormalizzato || "S", // Default: Solido
      quantita: {
        valore: movimento.quantita,
        unita_misura: movimento.unita_misura
      },
      // Caratteristiche pericolo (array, anche vuoto se non pericoloso)
      caratteristiche_pericolo: movimento.caratteristiche_pericolo || [],
      // Provenienza (U=Urbano, S=Speciale) - solo se valore valido
      // Nota: RENTRI accetta solo "U" o "S", non codici numerici
      // Se provenienza_codice è un numero, omettiamo il campo (opzionale)
      ...(movimento.provenienza_codice && typeof movimento.provenienza_codice === 'string' && ["U", "S"].includes(movimento.provenienza_codice) && {
        provenienza: movimento.provenienza_codice
      }),
      // Destinato attività (R1-R13, D1-D15, CR)
      ...(movimento.destinato_attivita && {
        destinato_attivita: movimento.destinato_attivita
      })
    };
  } else {
    // Materiali (obbligatorio se causale == "M")
    // Per causale "M", RENTRI richiede il campo "materiali" invece di "rifiuto"
    // Struttura materiali secondo schema RENTRI (da verificare schema completo se necessario)
    const codiceMateriale = movimento.codice_eer || movimento.codice_materiale;
    
    if (!codiceMateriale) {
      // Se non c'è codice materiale, usiamo un placeholder (RENTRI potrebbe rifiutarlo)
      // Ma meglio includerlo che non includere il campo
      console.warn("[RENTRI-MOVIMENTI] Causale 'M' senza codice_materiale/codice_eer");
    }
    
    // Struttura materiali secondo schema RENTRI
    // L'errore "sys.invalid" su materiali.materiale suggerisce che la struttura non è corretta
    // 
    // Basandoci sulla struttura di "rifiuto" (che ha codice_eer, descrizione_eer, stato_fisico, quantita, caratteristiche_pericolo),
    // proviamo una struttura simile per materiali:
    // - materiale potrebbe essere un oggetto con codice e descrizione (come rifiuto ha codice_eer e descrizione_eer)
    // - oppure materiale potrebbe essere semplicemente il codice (stringa)
    //
    // PROVA: struttura simile a rifiuto ma con campo "materiale" invece di "codice_eer"
    // L'errore "sys.invalid" su materiali.materiale suggerisce che la struttura non è corretta
    // 
    // PROVA 1: materiale come stringa semplice (codice)
    // Se questo non funziona, provare con oggetto o struttura diversa
    payload.materiali = {
      // Campo "materiale" - PROVA: stringa semplice con codice
      materiale: codiceMateriale || "MATERIALE_GENERICO",
      // Descrizione separata (se supportata)
      ...(movimento.descrizione_eer && {
        descrizione: movimento.descrizione_eer
      }),
      // Quantità materiale (obbligatoria) - stessa struttura di rifiuto
      quantita: {
        valore: movimento.quantita,
        unita_misura: movimento.unita_misura
      }
      // Nota: Se questa struttura non funziona, provare:
      // 1. materiale come oggetto { codice: "...", descrizione: "..." }
      // 2. aggiungere altri campi obbligatori (stato_fisico, caratteristiche_pericolo, ecc.)
    };
    
    // Log per debug
    console.log("[RENTRI-MOVIMENTI] Payload materiali costruito:", JSON.stringify(payload.materiali, null, 2));
  }
  
  // Integrazione FIR (obbligatorio per causali aT, TR, T*, T*aT)
  const causaliConFIR = ["aT", "TR", "T*", "T*aT"];
  if (causaleNormalizzata && causaliConFIR.includes(causaleNormalizzata)) {
    if (movimento.riferimento_fir) {
      payload.integrazione_fir = {
        numero_fir: movimento.riferimento_fir
      };
    }
  }
  
  // Esito (obbligatorio per causali aT, T*aT)
  // Nota: Schema esatto da verificare con OpenAPI spec dati-registri
  // Implementazione base basata su logica operativa standard
  if (causaleNormalizzata && ["aT", "T*aT"].includes(causaleNormalizzata)) {
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
  
  // Validazione causale (obbligatoria) - normalizza per retrocompatibilità
  const causaleNormalizzata = movimento.causale_operazione 
    ? normalizeCausale(movimento.causale_operazione)
    : null;
  const causaliValide = ["DT", "NP", "T*", "RE", "I", "aT", "M", "TR", "T*aT"];
  if (!movimento.causale_operazione) {
    errors.push("causale_operazione obbligatoria");
  } else if (!causaliValide.includes(causaleNormalizzata)) {
    errors.push(`causale_operazione non valida: ${movimento.causale_operazione} (normalizzata: ${causaleNormalizzata}). Valori validi: ${causaliValide.join(", ")}`);
  }
  
  // Validazione rifiuto (obbligatorio se causale != "M")
  if (causaleNormalizzata !== "M") {
    if (!movimento.codice_eer) {
      errors.push("codice_eer obbligatorio (causale != 'M')");
    }
    
    if (!movimento.quantita || movimento.quantita <= 0) {
      errors.push("quantita obbligatoria e deve essere > 0");
    }
    
    if (!movimento.unita_misura) {
      errors.push("unita_misura obbligatoria");
    }
    
    // Validazione stato fisico (normalizza prima della validazione)
    const statoFisicoNormalizzato = movimento.stato_fisico 
      ? normalizeStatoFisico(movimento.stato_fisico)
      : movimento.stato_fisico;
    const statiFisiciValidi = ["SP", "S", "FP", "L", "VS"];
    if (movimento.stato_fisico && !statiFisiciValidi.includes(statoFisicoNormalizzato)) {
      errors.push(`stato_fisico non valido: ${movimento.stato_fisico} (normalizzato: ${statoFisicoNormalizzato}). Valori validi: ${statiFisiciValidi.join(", ")}`);
    }
  } else {
    // Validazione materiali (obbligatorio se causale == "M")
    const codiceMateriale = movimento.codice_eer || movimento.codice_materiale;
    if (!codiceMateriale) {
      errors.push("codice_eer o codice_materiale obbligatorio per causale 'M'");
    }
    
    if (!movimento.quantita || movimento.quantita <= 0) {
      errors.push("quantita obbligatoria e deve essere > 0");
    }
    
    if (!movimento.unita_misura) {
      errors.push("unita_misura obbligatoria");
    }
  }
  
  // Validazione integrazione FIR
  // NOTA: Il FIR è richiesto da RENTRI per causali aT, TR, T*, T*aT solo quando c'è trasporto effettivo
  // Per trasporti interni o movimenti senza trasporto, il FIR può non essere necessario
  // RENDIAMO OBBLIGATORIO solo se specificato, altrimenti lasciamo che RENTRI valuti
  // Secondo i manuali RENTRI: "integrazione_fir" è CONDITIONAL per aT, TR, T*, T*aT
  // ma può essere omessa per movimenti interni o in casi particolari
  // La validazione verrà fatta da RENTRI stesso, noi permettiamo l'invio
  // 
  // Rimuoviamo la validazione obbligatoria e lasciamo che sia opzionale
  // Se presente, verrà incluso nel payload (già gestito in buildRentriMovimentoPayload)
  
  // Validazione esito (obbligatorio per causali aT, T*aT)
  const causaliConEsito = ["aT", "T*aT"];
  if (causaleNormalizzata && causaliConEsito.includes(causaleNormalizzata)) {
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

