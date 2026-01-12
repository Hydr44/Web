# 🔧 Soluzione Problemi Avvio Server

## Problemi Comuni e Soluzioni

### 1. Errore: "Cannot find module 'next'"
**Soluzione:**
```powershell
cd website
npm install
```

### 2. Errore: "Port 3000 is already in use"
**Soluzione:**
- Chiudi altri processi Node.js in esecuzione
- Oppure Next.js userà automaticamente la porta 3001, 3002, ecc.

### 3. Errore: "Supabase non configurato"
**Soluzione:**
Crea/aggiorna il file `.env.local` con:
```env
NEXT_PUBLIC_SUPABASE_URL=la_tua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=la_tua_chiave
SUPABASE_SERVICE_ROLE_KEY=la_tua_service_key
```

### 4. Errore con Turbopack
**Soluzione:**
Usa la versione senza Turbopack:
```powershell
npm run dev:no-turbo
```

### 5. Errore: "ENOENT" o "spawn ENOENT"
**Soluzione:**
- Verifica che Node.js sia installato: `node --version`
- Verifica che npm sia installato: `npm --version`
- Riavvia il terminale/PowerShell

### 6. Problemi con PowerShell
**Soluzione:**
Usa il file batch invece:
```cmd
cd website
start-dev.bat
```

## Test Diagnostica

Esegui lo script di test:
```powershell
cd website
node test-start.js
```

Questo verificherà:
- ✅ Versione Node.js
- ✅ Presenza di node_modules
- ✅ Presenza di .env.local
- ✅ Versione Next.js installata

## Comandi di Avvio

### Metodo 1: Script Automatico
```powershell
cd website
.\start-dev.ps1
```

### Metodo 2: Comando Diretto
```powershell
cd website
npm run dev
```

### Metodo 3: Senza Turbopack (se ci sono problemi)
```powershell
cd website
npm run dev:no-turbo
```

## Verifica Server Avviato

Dopo l'avvio, dovresti vedere:
```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Ready in Xs
```

Apri il browser su `http://localhost:3000` per verificare.

## Se Nulla Funziona

1. **Reinstalla dipendenze:**
```powershell
cd website
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

2. **Verifica Node.js:**
```powershell
node --version  # Dovrebbe essere 18+ o 20+
npm --version
```

3. **Pulisci cache Next.js:**
```powershell
cd website
Remove-Item -Recurse -Force .next
npm run dev
```

