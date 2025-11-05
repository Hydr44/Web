# Endpoint SDI (Sistema di Interscambio)

Questi endpoint permettono di ricevere fatture elettroniche e notifiche dal Sistema di Interscambio (SDI) italiano.

## Endpoint Disponibili

### 1. `/api/sdi/ricezione-fatture` (POST)
Riceve fatture elettroniche inviate dal SDI quando altri soggetti emettono fatture verso la tua partita IVA.

**Formato richiesta:**
- Content-Type: `application/xml` o `text/xml`
- Body: XML fattura elettronica (formato FatturaPA)

**Risposta:**
```json
{
  "success": true,
  "message": "Fattura ricevuta e salvata con successo",
  "invoice_id": "uuid-fattura"
}
```

### 2. `/api/sdi/ricezione-notifiche` (POST)
Riceve notifiche di esito dal SDI per fatture emesse:
- **RicevutaConsegna (RC)**: Fattura consegnata con successo
- **NotificaMancataConsegna (MC)**: Errore consegna
- **NotificaScarto (NS)**: Fattura scartata
- **NotificaEsito (NE)**: Esito committente (accettazione/rifiuto)
- **NotificaDecorrenzaTermini (DT)**: Accettazione tacita

**Formato richiesta:**
- Content-Type: `application/xml` o `text/xml`
- Body: XML notifica SDI

**Risposta:**
```json
{
  "success": true,
  "message": "Notifica processata",
  "invoice_id": "uuid-fattura",
  "notification_id": "identificativo-sdi"
}
```

### 3. `/api/sdi/test` (GET)
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
   - **Ricezione Fatture**: `https://rescuemanager.eu/api/sdi/ricezione-fatture`
   - **Ricezione Notifiche**: `https://rescuemanager.eu/api/sdi/ricezione-notifiche`

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

