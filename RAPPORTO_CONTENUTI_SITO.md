# RAPPORTO CONTENUTI SITO — Analisi completa e proposte

Data: 12 febbraio 2026

---

## PROBLEMA PRINCIPALE

Il sito comunica che RescueManager è un gestionale per **soccorso stradale / trasporti / flotte**.
In realtà RescueManager è una piattaforma SaaS per **autodemolizioni** e **centri di soccorso stradale** italiani, che include:

- Gestione trasporti e soccorso stradale (dispatch, autisti, rapportini)
- **Radiazioni RVFU** (demolizione veicoli, certificati, fascicolo digitale)
- **Fatturazione elettronica** (FatturaPA, SDI, XML)
- **RENTRI** (registro rifiuti)
- **Registro auto** (confische, sequestri, deposito giudiziario)
- App mobile per autisti
- Analytics e reportistica

Il sito attuale **non menziona quasi mai** demolizioni, RVFU, deposito giudiziario, confische, sequestri, RENTRI — che sono i moduli più differenzianti e di valore.

---

## PAGINA PER PAGINA

### 1. HOMEPAGE (`page.tsx`) — PRIORITÀ ALTA

#### DA CAMBIARE:
- **Titolo hero**: "Riduci i tempi di intervento fino al 32%" → troppo generico, sembra un'app di logistica qualsiasi
- **Sottotitolo**: "Dalla chiamata al traino" → manca completamente il lato demolizioni/RVFU
- **Badge "Operatività h24 per il soccorso stradale"** → troppo limitato
- **Value bullets**: solo "Dispatch", "Rapportini", "Fatture & analytics" → mancano i moduli chiave
- **Sezione "Gestione completa flotta"** → parla solo di flotta/turni/manutenzioni, non dei moduli reali
- **Sezione "Tutto quello che ti serve"** → solo 3 features generiche (dispatch, rapportini, analytics)
- **Stats "Oltre 120 officine"** → verificare se il numero è reale o inventato
- **Stats "8 consorzi in 5 regioni"** → verificare
- **Stats "5.000+ interventi/mese"** → verificare
- **Testimonial "Consorzio Sicilia"** → è reale o inventato?
- **Sezione integrazioni**: "Registro Nazionale Trasporti" sotto logo RENTRI → RENTRI è Registro Nazionale Tracciabilità Rifiuti, NON trasporti
- **Prezzi homepage** (€19.99, €98.99, €149.99) → diversi dalla pagina prezzi (€29, €79, €199). Quale è corretto?

#### DA AGGIUNGERE:
- Menzione esplicita di **autodemolizioni** e **centri di soccorso stradale** nel titolo
- I moduli chiave: **Radiazioni RVFU**, **Fatturazione elettronica SDI**, **RENTRI**, **Registro auto**
- Caso d'uso reale: "Dalla confisca alla radiazione, dal soccorso alla fattura"
- Differenziatore: unico gestionale che integra RVFU + SDI + RENTRI

#### DA TOGLIERE:
- Stats inventati (se non reali)
- Testimonial finto (se non reale)
- Duplicazione sezione prezzi (c'è già la pagina /prezzi)

---

### 2. PAGINA PRODOTTO (`prodotto/page.tsx`) — PRIORITÀ MEDIA

#### COSA VA BENE:
- I 6 moduli sono corretti e ben descritti
- Modulo Trasporti, Radiazioni RVFU, Fatturazione Elettronica, App Mobile, Analytics, Integrazioni

#### DA CAMBIARE:
- **Titolo hero**: "Moduli completi per ogni aspetto del soccorso stradale" → aggiungere "e autodemolizioni"
- **Sottotitolo**: "Dal dispatch alla fatturazione, dalla gestione autisti al magazzino" → non c'è nessun modulo magazzino
- **Badge "Tutto il ciclo del soccorso"** → aggiungere "e demolizioni"
- **CTA "Richiedi demo gratuita"** → il link va a /contatti che è una pagina vuota/brutta
- **Stats floating "-32% tempi intervento"** → verificare se reale
- **FAQ "Serve installazione sui PC?"** → risposta dice "web-based" ma c'è anche l'app desktop Electron

#### DA AGGIUNGERE:
- Menzione del **deposito giudiziario** e **confische/sequestri** nel modulo trasporti
- Menzione di **bollo virtuale**, **ritenuta d'acconto**, **cassa previdenziale** nel modulo fatturazione
- Menzione di **solleciti pagamento** nel modulo fatturazione

---

### 3. PAGINA PREZZI (`prezzi/page.tsx`) — PRIORITÀ ALTA

#### DA CAMBIARE:
- **Prezzi diversi dalla homepage!** Homepage dice €19.99/€98.99/€149.99, questa pagina dice €29/€79/€199
- **Descrizioni generiche**: "Perfetto per piccole aziende che iniziano" → non dice nulla del settore
- **Features generiche**: "Fino a 5 veicoli", "Fino a 10 conducenti", "Dashboard base" → non menziona i moduli reali
- **Piano Professional**: "Fino a 25 veicoli, 50 conducenti" → sembra un'app di fleet management
- **Piano Enterprise**: "Veicoli illimitati, Conducenti illimitati" → idem

#### DA CAMBIARE CON:
- Features specifiche per autodemolizioni: "Modulo Radiazioni RVFU", "Fatturazione SDI", "RENTRI", ecc.
- Descrizioni settoriali: "Per autodemolizioni con 1-5 mezzi di soccorso"
- Allineare i prezzi con la homepage (decidere quali sono quelli giusti)

---

### 4. PAGINA CONTATTI (`contatti/page.tsx`) — PRIORITÀ ALTA

#### PROBLEMI GRAVI:
- **Pagina quasi vuota**: solo un form base senza stile
- **Titolo "Richiedi demo"** → dovrebbe essere "Contattaci" (c'è già /demo per le demo)
- **Bottone nero** `bg-black` → non coerente col design navy
- **Nessuna informazione di contatto**: manca email, telefono, indirizzo
- **Form non funziona**: non ha handler, non invia nulla
- **Nessun design**: pagina bruttissima rispetto al resto del sito

#### DA RIFARE COMPLETAMENTE:
- Design coerente col sito
- Info contatto reali (email, telefono, orari)
- Form funzionante con invio a API
- Mappa o indirizzo fisico

---

### 5. PAGINA CHI SIAMO (`chi-siamo/page.tsx`) — PRIORITÀ MEDIA

#### PROBLEMI:
- **Team inventato**: "Marco Rossi" CEO, "Sara Bianchi" CTO, "Luca Verdi" Head of Product → sono reali?
- **Immagini team**: puntano a `/team/marco-rossi.jpg` ecc. → probabilmente non esistono
- **Valori generici**: "Passione", "Affidabilità", "Innovazione", "Collaborazione" → copia-incolla da template
- **Nessuna storia aziendale reale**

#### DA CAMBIARE:
- Inserire info reali sull'azienda/fondatore
- Rimuovere team finto se non reale
- Raccontare la storia vera: perché è nato RescueManager, per chi

---

### 6. PAGINA DEMO (`demo/page.tsx`) — PRIORITÀ BASSA

#### COSA VA BENE:
- Form completo con tutti i campi necessari
- Invia a `/api/contact`

#### DA CAMBIARE:
- Verificare che l'API `/api/contact` funzioni davvero
- Testi generici da personalizzare

---

### 7. PAGINA DOWNLOAD (`download/page.tsx`) — PRIORITÀ BASSA

#### DA CAMBIARE:
- **Link download desktop**: puntano a `#` (placeholder) → inserire link reali o rimuovere
- **App mobile "In arrivo"** → aggiornare se è già disponibile (Expo 54 + React Native)
- **Screenshot**: usa `/670shots_so.png` per tutto → servono screenshot reali

---

### 8. PAGINA BLOG, PRESS, CARRIERE — PRIORITÀ BASSA

- Verificare se queste pagine hanno contenuto reale o sono placeholder
- Se sono vuote, meglio rimuoverle dal footer e dalla navigazione

---

### 9. FOOTER (`SiteFooter.tsx`) — PRIORITÀ MEDIA

#### DA CAMBIARE:
- **Link "Chi siamo", "Carriere", "Blog", "Press"** → se le pagine sono vuote, rimuovere
- **Descrizione**: "dalla chiamata al traino" → aggiungere demolizioni/RVFU
- **Manca**: numero di telefono, indirizzo fisico, social media

---

### 10. HEADER (`SiteHeader.tsx`) — PRIORITÀ BASSA

#### DA CAMBIARE:
- **Link "Accessi"** → nome confuso, meglio "Download" o "App"
- **Manca**: link diretto a "Contatti" nella nav principale

---

## PROBLEMI TRASVERSALI

### A. Numeri e statistiche non verificati
Tutto il sito usa numeri che sembrano inventati:
- "120 officine" — è reale?
- "8 consorzi in 5 regioni" — è reale?
- "5.000+ interventi/mese" — è reale?
- "-32% tempi di intervento" — è reale?
- "+18% interventi/mezzo" — è reale?
- "99.9% uptime" — è reale?
- "< 2m presa → dispatch" — è reale?

**AZIONE**: Confermare quali numeri sono reali. Rimuovere quelli inventati o sostituirli con dati verificabili.

### B. Prezzi incoerenti
- Homepage: €19.99 / €98.99 / €149.99
- Pagina prezzi: €29 / €79 / €199

**AZIONE**: Decidere i prezzi corretti e allinearli ovunque.

### C. Identità confusa
Il sito oscilla tra:
- "Gestionale soccorso stradale" (titolo meta)
- "Gestione Trasporti" (sottotitolo header)
- "Gestione flotta" (sezione homepage)

Nessuno di questi comunica il vero valore: **piattaforma completa per autodemolizioni e soccorso stradale con integrazioni governative (RVFU, SDI, RENTRI)**.

**AZIONE**: Definire un posizionamento chiaro. Proposta:
> "Il gestionale completo per autodemolizioni e soccorso stradale: dalla confisca alla radiazione, dal soccorso alla fattura elettronica."

### D. CTA e link rotti
- Molti "Scopri di più" non portano da nessuna parte
- "Richiedi demo" a volte va a /demo, a volte a /contatti
- "Vedi dettagli" sui piani punta a `#pricing` (stesso punto della pagina)
- "Attiva subito" punta a `#pricing` (non fa nulla)

**AZIONE**: Tutti i CTA devono portare a pagine reali e funzionanti.

### E. Screenshot e immagini
- `/670shots_so.png` usato ovunque come unico screenshot
- `/mockups/dashboard-mockup.jpg` — è aggiornato col nuovo design?
- Immagini team probabilmente inesistenti

**AZIONE**: Creare screenshot reali dell'app aggiornata.

---

## RIEPILOGO PRIORITÀ

| # | Cosa | Priorità | Effort |
|---|------|----------|--------|
| 1 | Allineare prezzi homepage ↔ pagina prezzi | **CRITICO** | Basso |
| 2 | Riscrivere hero homepage con identità corretta | **ALTO** | Medio |
| 3 | Rifare pagina contatti (è vuota/brutta) | **ALTO** | Medio |
| 4 | Aggiungere moduli chiave (RVFU, SDI, RENTRI) nei testi | **ALTO** | Medio |
| 5 | Correggere "Registro Nazionale Trasporti" → "Tracciabilità Rifiuti" | **ALTO** | Basso |
| 6 | Verificare/rimuovere stats inventati | **ALTO** | Basso |
| 7 | Riscrivere features piani prezzi con moduli reali | **MEDIO** | Medio |
| 8 | Sistemare pagina chi-siamo (team reale o rimuovere) | **MEDIO** | Medio |
| 9 | Rimuovere link a pagine vuote (blog, press, carriere) | **MEDIO** | Basso |
| 10 | Fix CTA rotti e link placeholder | **MEDIO** | Basso |
| 11 | Aggiornare screenshot con app reale | **BASSO** | Alto |
| 12 | Sistemare FAQ con risposte accurate | **BASSO** | Basso |

---

## PROSSIMI PASSI

1. **L'utente deve confermare**: prezzi corretti, stats reali, info team, posizionamento
2. Poi implemento tutte le modifiche ai testi in un unico commit
