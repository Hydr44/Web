# Modulo SDI — Contenuti pagina

## 1) Hero
- **Eyebrow**: Modulo Specializzato
- **Titolo**: Fatturazione Elettronica.
- **Sottotitolo**: Sistema di Interscambio (SDI) dell'Agenzia delle Entrate. Fatture elettroniche XML, invio automatico, notifiche SDI, conservazione sostitutiva.

## 2) Alert obbligatorietà
Banner ambra con icona:
> **Obbligatorio per tutti dal 2019** — tutte le fatture B2B e B2C devono essere elettroniche e passare per SDI.

## 3) Problema / Perché serve
Gestire fatture senza integrazione SDI significa:
- Rischio sanzioni (da 90% a 180% dell'imposta non versata)
- Fatture scartate da SDI per errori XML
- Nessuna tracciabilità delle notifiche (accettazione/rifiuto)
- Conservazione documenti non conforme
- Tempo perso a compilare manualmente XML

> Il modulo SDI gestisce tutto il ciclo di vita della fattura elettronica, dall'emissione alla conservazione.

## 4) Cosa fai con RescueManager SDI

### 4.1 Creazione Fatture Elettroniche
Compilazione guidata con validazione XML:
- Form semplificato per dati cliente e righe
- Validazione in tempo reale del formato XML
- Calcolo automatico IVA, ritenute, bollo
- Anteprima PDF prima dell'invio
- Numerazione automatica progressiva

### 4.2 Invio Automatico a SDI
Trasmissione sicura via SFTP:
- Generazione XML FatturaPA conforme
- Firma digitale del file
- Invio automatico a SDI via SFTP
- Tracciamento ID trasmissione
- Retry automatico in caso di errore

### 4.3 Gestione Notifiche SDI
Ricezione e processamento automatico:
- **RC** (Ricevuta Consegna) — Fattura consegnata al destinatario
- **NS** (Notifica Scarto) — Fattura scartata, correzione necessaria
- **MC** (Mancata Consegna) — Destinatario non ha ricevuto
- **NE** (Notifica Esito) — Accettazione/rifiuto da parte del cliente
- **DT** (Decorrenza Termini) — Fattura accettata per silenzio-assenso

Tutte le notifiche vengono associate automaticamente alla fattura.

### 4.4 Fatture Passive (Fornitori)
Import automatico fatture ricevute:
- Download automatico da SDI via SFTP
- Parsing XML e estrazione dati
- Registrazione in contabilità
- Notifica al destinatario interno
- Archiviazione automatica

### 4.5 Conservazione Sostitutiva
Archiviazione conforme per 10 anni:
- Conservazione XML originale + PDF
- Marca temporale e firma digitale
- Indice dei documenti conservati
- Export per commercialista
- Conformità normativa garantita

### 4.6 Funzionalità Avanzate
- **Bollo virtuale** — Gestione imposta di bollo su fatture esenti IVA
- **Ritenuta d'acconto** — Calcolo automatico ritenuta 20%
- **Cassa previdenziale** — Gestione contributi professionisti
- **Note di credito** — Storno fatture con TD04
- **Solleciti pagamento** — Reminder automatici per fatture scadute

## 5) Come funziona
1. **Configura certificato SDI**
   Carica il certificato digitale per la firma delle fatture.
2. **Crea fattura**
   Compila il form con dati cliente e righe, il sistema genera l'XML.
3. **Invia a SDI**
   Un click per firmare e inviare la fattura al Sistema di Interscambio.
4. **Ricevi notifiche**
   Il sistema scarica automaticamente le notifiche SDI e le associa alla fattura.
5. **Conserva**
   Archiviazione automatica conforme per 10 anni.

## 6) Flusso Operativo
1. **Emissione** — Crea fattura e genera XML
2. **Invio SDI** — Trasmissione via SFTP con firma digitale
3. **Ricevuta Consegna** — SDI conferma la consegna
4. **Notifica Esito** — Cliente accetta/rifiuta (o silenzio-assenso dopo 15gg)
5. **Conservazione** — Archiviazione automatica con marca temporale

## 7) Vantaggi
- **Conformità garantita**
  XML sempre valido, nessuna fattura scartata.
- **Zero errori**
  Validazione in tempo reale e calcoli automatici.
- **Tempo risparmiato**
  Niente compilazione manuale XML o portale Agenzia Entrate.
- **Tracciabilità completa**
  Storico notifiche SDI e stato fatture sempre visibile.
- **Conservazione automatica**
  Conforme per 10 anni, niente da fare manualmente.

## 8) FAQ
- **Serve un certificato digitale?**
  Sì, per firmare le fatture. Puoi usare un certificato di firma digitale o CNS.
- **Cosa succede se una fattura viene scartata?**
  Ricevi una notifica NS con il motivo dello scarto. Correggi e reinvia.
- **Le fatture passive vengono importate automaticamente?**
  Sì, il sistema scarica automaticamente le fatture ricevute da SDI e le registra.
- **La conservazione è conforme alla normativa?**
  Sì, conservazione sostitutiva con marca temporale per 10 anni come richiesto dalla legge.

## 9) CTA
- Titolo: Fatture elettroniche senza pensieri.
- Sottotitolo: Invio automatico, notifiche SDI, conservazione conforme. Demo gratuita.
- Bottone: Richiedi demo
