# 🔐 Vercel Environment Variables Setup

## ⚠️ CRITICAL - JWT_SECRET Mancante

Il pen test ha rilevato che `JWT_SECRET` non è configurato su Vercel, causando errori 500 sugli endpoint protetti.

## 🚀 Setup Immediato

### 1. Genera JWT Secret Sicuro

```bash
# Genera un secret casuale di 64 caratteri
openssl rand -base64 64
```

Output esempio:
```
xK9mP2vN8qR5tY7wE3sA6dF1gH4jL0zX9cV8bN2mQ5pR7tY0wE3sA6dF1gH4jL0z
```

### 2. Configura su Vercel

**Via Dashboard:**
1. Vai su https://vercel.com/hydr44/web/settings/environment-variables
2. Aggiungi nuova variabile:
   - **Name:** `JWT_SECRET`
   - **Value:** `<il secret generato sopra>`
   - **Environment:** Production, Preview, Development (tutti)
3. Click "Save"
4. Redeploy il progetto

**Via CLI:**
```bash
vercel env add JWT_SECRET production
# Incolla il secret quando richiesto

vercel env add JWT_SECRET preview
vercel env add JWT_SECRET development
```

### 3. Verifica

Dopo il redeploy, testa:
```bash
curl -X POST https://rescuemanager.eu/api/admin/create-user \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","orgId":"test"}'
```

**Risposta attesa:** HTTP 401 (non 500)

---

## 📋 Altre Environment Variables Richieste

### Obbligatorie (già configurate):
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET`

### Da Configurare (se non presenti):
- ⚠️ `JWT_SECRET` - **CRITICO** (min 32 caratteri)
- ⚠️ `ADMIN_API_SECRET` - Rimosso per sicurezza (non configurare)

### Opzionali:
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics
- `NEXT_PUBLIC_META_PIXEL_ID` - Meta Pixel
- `NEXT_PUBLIC_HOTJAR_ID` - Hotjar
- `NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN` - Chatwoot

---

## 🔒 Security Best Practices

1. **JWT_SECRET:**
   - Minimo 32 caratteri (raccomandato 64)
   - Usa caratteri casuali (a-zA-Z0-9+/=)
   - NON riutilizzare tra ambienti
   - Ruota ogni 90 giorni

2. **Service Role Keys:**
   - Mai esporre nel client
   - Solo in API routes server-side
   - Monitora accessi

3. **Webhook Secrets:**
   - Diversi per ogni servizio
   - Verifica sempre signature

---

## 🚨 Troubleshooting

### Errore: "JWT_SECRET must be configured"
- La variabile non è configurata su Vercel
- Segui step 1-2 sopra

### Errore: "JWT_SECRET must be at least 32 characters"
- Il secret è troppo corto
- Rigenera con `openssl rand -base64 64`

### Errore 500 su endpoint protetti
- JWT_SECRET mancante o invalido
- Verifica su Vercel dashboard

---

## ✅ Checklist Post-Setup

- [ ] JWT_SECRET generato (64 caratteri)
- [ ] Configurato su Vercel (production + preview + dev)
- [ ] Redeploy effettuato
- [ ] Test endpoint → HTTP 401 (non 500)
- [ ] Pen test ripetuto → tutti test PASS
