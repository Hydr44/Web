# Endpoint SDI (Sistema di Interscambio)

Questi endpoint permettono di ricevere fatture elettroniche e notifiche dal Sistema di Interscambio (SDI) italiano.

## Endpoint Disponibili

### 1. `/api/sdi/trasmissione` (POST)
Invia fatture elettroniche al SDI (ambiente PRODUZIONE).

**Formato richiesta:**
- Content-Type: `application/json`
- Body: `{ "invoice_id": "uuid-fattura", "xml": "..." }` (xml opzionale)

**Risposta:**
```json
{
  "success": true,
  "message": "Fattura inviata al SDI",
  "identificativo_sdi": "SDI-123456",
  "invoice_id": "uuid-fattura"
}
```

### 2. `/api/sdi/test/trasmissione` (POST)
Invia fatture elettroniche al SDI (ambiente TEST).

**Formato richiesta:**
- Content-Type: `application/json`
- Body: `{ "invoice_id": "uuid-fattura", "xml": "..." }` (xml opzionale)

### 3. `/api/sdi/ricezione` (POST)
**Endpoint unificato** che riceve sia fatture elettroniche che notifiche dal SDI (ambiente PRODUZIONE).

Il sistema riconosce automaticamente se il XML ricevuto è una fattura o una notifica.

**Fatture ricevute:**
- Content-Type: `application/xml` o `text/xml`
- Body: XML fattura elettronica (formato FatturaPA)

**Notifiche ricevute:**
- **RicevutaConsegna (RC)**: Fattura consegnata con successo
- **NotificaMancataConsegna (MC)**: Errore consegna
- **NotificaScarto (NS)**: Fattura scartata
- **NotificaEsito (NE)**: Esito committente (accettazione/rifiuto)
- **NotificaDecorrenzaTermini (DT)**: Accettazione tacita

**Risposta:**
```json
{
  "success": true,
  "message": "Fattura/Notifica ricevuta e processata",
  "invoice_id": "uuid-fattura",
  "notification_id": "identificativo-sdi" // Solo per notifiche
}
```

### 4. `/api/sdi/test/ricezione` (POST)
**Endpoint unificato** che riceve sia fatture elettroniche che notifiche dal SDI (ambiente TEST).

Funziona esattamente come `/api/sdi/ricezione` ma per l'ambiente di test.

### 5. `/api/sdi/test` (GET)
Endpoint di test per verificare la configurazione SDI e ottenere gli URL degli endpoint.

**Risposta:**
```json
{
  "success": true,
  "message": "Endpoint SDI test attivo",
  "endpoints": {
    "ricezione_fatture": "https://rescuemanager.eu/api/sdi/ricezione-fatture",
    "ricezione_notifiche": "https://rescuemanager.eu/api/sdi/ricezione-notifiche",
    "test": "https://rescuemanager.eu/api/sdi/test"
  }
}
```

## Registrazione sul Portale SDI

Per registrare questi endpoint sul portale SDI:

1. Accedi a: https://www.fatture.gov.it/
2. Vai su "Area Riservata" → "Configurazione Endpoint"
3. Inserisci gli endpoint:
   - **Ricezione (Fatture e Notifiche)**: `https://rescuemanager.eu/api/sdi/ricezione`
   
   **Nota**: L'endpoint di ricezione gestisce automaticamente sia fatture che notifiche. Sul portale SDI, registra lo stesso URL per entrambi i tipi di ricezione.

## Ambiente di Test

Prima di utilizzare in produzione, testa gli endpoint in ambiente SDI di test:

1. Registra gli endpoint in ambiente di test SDI
2. Invia fatture di prova
3. Verifica che le notifiche vengano ricevute correttamente

## Note Tecniche

- Gli endpoint supportano sia XML diretto che JSON wrapper
- Supporto CORS per chiamate cross-origin
- Logging completo per debug
- Salvataggio automatico nel database Supabase
- Gestione errori robusta

## Database

Gli endpoint utilizzano le seguenti tabelle Supabase:
- `invoices`: Salvataggio fatture ricevute/emesse
- `sdi_events`: Log di tutti gli eventi SDI

## Sicurezza

⚠️ **IMPORTANTE**: In produzione, considera:
- Autenticazione tramite token/certificato
- Validazione XML
- Rate limiting
- Monitoring e alerting

