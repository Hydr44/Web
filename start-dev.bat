@echo off
REM Script batch per avviare il server di sviluppo Next.js
REM Esegui questo script dalla directory website

echo 🚀 Avvio configurazione progetto Next.js...

REM Verifica se Node.js è installato
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js non trovato. Installa Node.js da https://nodejs.org/
    pause
    exit /b 1
)

REM Verifica se npm è installato
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm non trovato. Installa npm.
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js trovato: %NODE_VERSION%
)

npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm trovato: %NPM_VERSION%
)

REM Verifica se esiste .env.local
if not exist ".env.local" (
    echo ⚠️  File .env.local non trovato. Creazione file di esempio...
    
    (
        echo # Next.js Configuration
        echo NEXT_PUBLIC_SITE_URL=http://localhost:3000
        echo.
        echo # Supabase Configuration ^(required^)
        echo NEXT_PUBLIC_SUPABASE_URL=
        echo NEXT_PUBLIC_SUPABASE_ANON_KEY=
        echo SUPABASE_SERVICE_ROLE_KEY=
        echo.
        echo # Stripe Configuration ^(optional for development^)
        echo STRIPE_PUBLIC_KEY=
        echo STRIPE_SECRET_KEY=
        echo STRIPE_WEBHOOK_SECRET=
        echo.
        echo # RENTRI JWT Configuration ^(optional for development^)
        echo RENTRI_JWT_PRIVATE_KEY=
        echo RENTRI_JWT_PRIVATE_KEY_FILE=
        echo RENTRI_JWT_CERT=
        echo RENTRI_JWT_CERT_FILE=
        echo RENTRI_JWT_AUDIENCE=rentrigov.demo.api
        echo RENTRI_JWT_ISSUER=
        echo RENTRI_JWT_TTL_SECONDS=55
        echo.
        echo # Cron Secret ^(optional for development^)
        echo CRON_SECRET=dev-secret-change-in-prod
        echo.
        echo # Cookie Domain ^(optional^)
        echo NEXT_PUBLIC_COOKIE_DOMAIN=
    ) > .env.local
    
    echo ✅ File .env.local creato. Aggiungi le tue chiavi API!
    echo ⚠️  IMPORTANTE: Compila NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY per far funzionare l'app!
) else (
    echo ✅ File .env.local trovato
)

REM Verifica se node_modules esiste
if not exist "node_modules" (
    echo 📦 Installazione dipendenze...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Errore durante l'installazione delle dipendenze
        pause
        exit /b 1
    )
) else (
    echo ✅ node_modules trovato
)

REM Avvia il server di sviluppo
echo.
echo 🚀 Avvio server di sviluppo Next.js...
echo    Il server sarà disponibile su http://localhost:3000
echo.

call npm run dev

