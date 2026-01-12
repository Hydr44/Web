# Script PowerShell per avviare il server di sviluppo Next.js
# Esegui questo script dalla directory website

Write-Host "🚀 Avvio configurazione progetto Next.js..." -ForegroundColor Cyan

# Verifica se Node.js è installato
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js trovato: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js non trovato. Installa Node.js da https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Verifica se npm è installato
try {
    $npmVersion = npm --version
    Write-Host "✅ npm trovato: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm non trovato. Installa npm." -ForegroundColor Red
    exit 1
}

# Verifica se esiste .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  File .env.local non trovato. Creazione file di esempio..." -ForegroundColor Yellow
    
    $envContent = @"
# Next.js Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Configuration (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe Configuration (optional for development)
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# RENTRI JWT Configuration (optional for development)
RENTRI_JWT_PRIVATE_KEY=
RENTRI_JWT_PRIVATE_KEY_FILE=
RENTRI_JWT_CERT=
RENTRI_JWT_CERT_FILE=
RENTRI_JWT_AUDIENCE=rentrigov.demo.api
RENTRI_JWT_ISSUER=
RENTRI_JWT_TTL_SECONDS=55

# Cron Secret (optional for development)
CRON_SECRET=dev-secret-change-in-prod

# Cookie Domain (optional)
NEXT_PUBLIC_COOKIE_DOMAIN=
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Host "✅ File .env.local creato. Aggiungi le tue chiavi API!" -ForegroundColor Green
    Write-Host "⚠️  IMPORTANTE: Compila NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY per far funzionare l'app!" -ForegroundColor Yellow
} else {
    Write-Host "✅ File .env.local trovato" -ForegroundColor Green
}

# Verifica se node_modules esiste
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installazione dipendenze..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Errore durante l'installazione delle dipendenze" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ node_modules trovato" -ForegroundColor Green
}

# Test diagnostica rapida
Write-Host "`n🔍 Esecuzione diagnostica..." -ForegroundColor Cyan
node test-start.js 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Diagnostica completata" -ForegroundColor Green
} else {
    Write-Host "⚠️  Alcuni controlli diagnostici potrebbero aver fallito" -ForegroundColor Yellow
}

# Avvia il server di sviluppo
Write-Host "`n🚀 Avvio server di sviluppo Next.js..." -ForegroundColor Cyan
Write-Host "   Il server sarà disponibile su http://localhost:3000" -ForegroundColor Gray
Write-Host "   Premi Ctrl+C per fermare il server" -ForegroundColor Gray
Write-Host "`n"

# Prova prima con Turbopack, se fallisce prova senza
Write-Host "Tentativo 1: Con Turbopack..." -ForegroundColor Yellow
npm run dev

# Se arriviamo qui, il comando è terminato (errore o interruzione)
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Turbopack potrebbe aver causato problemi. Prova senza Turbopack:" -ForegroundColor Yellow
    Write-Host "   npm run dev:no-turbo" -ForegroundColor Cyan
}

