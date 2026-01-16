# 🔧 FIX DEPLOY OAUTH ENDPOINT

## Problema
L'endpoint `/api/auth/oauth/desktop` non funziona su Vercel (produzione). Il browser si apre ma è completamente vuoto.

## Soluzione

### 1. Verifica che l'endpoint sia stato deployato
- Vai su [Vercel Dashboard](https://vercel.com)
- Controlla gli ultimi deploy
- Verifica che il file `src/app/api/auth/oauth/desktop/route.ts` sia presente nel deploy

### 2. Test manuale dell'endpoint
Apri nel browser:
```
https://rescuemanager.eu/api/auth/oauth/desktop?app_id=desktop_app&redirect_uri=http://localhost:3001/auth/callback&state=test
```

**Risultato atteso:**
- Se vedi una pagina HTML con "Reindirizzamento in corso..." → L'endpoint funziona
- Se vedi un errore 404 → L'endpoint non è stato deployato
- Se vedi un errore 500 → C'è un errore nel codice

### 3. Se l'endpoint non funziona su Vercel

**Opzione A: Force deploy**
```bash
cd website
git add .
git commit -m "fix: OAuth desktop endpoint"
git push
```
Poi su Vercel, vai su **Deployments** → **Redeploy** l'ultimo deploy

**Opzione B: Verifica log Vercel**
1. Vai su Vercel Dashboard
2. Seleziona il progetto
3. Vai su **Logs**
4. Cerca errori relativi a `/api/auth/oauth/desktop`

### 4. Verifica variabili d'ambiente su Vercel
1. Vai su **Settings** → **Environment Variables**
2. Verifica che siano presenti:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 5. Test locale (se necessario)
Se vuoi testare localmente prima di deployare:
```bash
cd website
npm run dev
```
Poi testa: `http://localhost:3000/api/auth/oauth/desktop?app_id=desktop_app&redirect_uri=http://localhost:3001/auth/callback&state=test`

## Note
- L'endpoint restituisce sempre HTML redirect (non HTTP redirect) per compatibilità con browser Electron
- Se il browser è completamente vuoto, probabilmente l'endpoint non risponde o c'è un errore di rete
