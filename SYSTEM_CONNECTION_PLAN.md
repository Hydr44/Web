# 🔗 PIANO DI CONNESSIONE SISTEMI

## 🎯 **OBIETTIVO**

Connettere **Sito Web** e **Desktop App** per:
- **Sincronizzazione dati** (login, abbonamenti, profili)
- **Controllo remoto** (manutenzione, aggiornamenti)
- **Gestione centralizzata** dal pannello admin

## 📋 **STRUTTURA WORKSPACE**

```
rescuemanager-workspace/
├── website/                    # Sito web (Next.js)
│   ├── src/
│   ├── supabase/
│   └── package.json
├── desktop-app/                # App desktop (Electron)
│   ├── src/
│   ├── electron/
│   └── package.json
├── shared-api/                 # API condivise
│   ├── auth/
│   ├── sync/
│   ├── admin/
│   └── package.json
└── docs/                      # Documentazione
    ├── api/
    ├── deployment/
    └── integration/
```

## 🔧 **ARCHITETTURA DI CONNESSIONE**

### **1. DATABASE UNIFICATO (Supabase)**
```
Supabase Database
├── auth.users                 # Utenti unificati
├── profiles                   # Profili utente
├── organizations             # Organizzazioni
├── subscriptions             # Abbonamenti
├── system_settings           # Impostazioni sistema
├── maintenance_mode          # Modalità manutenzione
├── app_versions              # Versioni app
└── sync_logs                 # Log sincronizzazione
```

### **2. API DI SINCRONIZZAZIONE**
```
shared-api/
├── auth/
│   ├── login.ts              # Login unificato
│   ├── logout.ts             # Logout unificato
│   └── sync-user.ts           # Sincronizzazione utente
├── sync/
│   ├── data-sync.ts          # Sincronizzazione dati
│   ├── subscription-sync.ts   # Sincronizzazione abbonamenti
│   └── profile-sync.ts        # Sincronizzazione profili
├── admin/
│   ├── maintenance.ts         # Controllo manutenzione
│   ├── updates.ts             # Gestione aggiornamenti
│   └── system-control.ts      # Controllo sistema
└── webhooks/
    ├── user-updated.ts        # Webhook utente aggiornato
    ├── subscription-changed.ts # Webhook abbonamento cambiato
    └── system-maintenance.ts  # Webhook manutenzione
```

## 🚀 **FUNZIONALITÀ DI CONNESSIONE**

### **1. AUTENTICAZIONE OAUTH TRAMITE SITO WEB**

#### **Login Desktop → Sito Web → Desktop**
```typescript
// 1. Desktop app avvia processo OAuth
GET /api/auth/oauth/desktop?app_id=desktop_app&redirect_uri=desktop://auth/callback

// 2. Sito web mostra login
// Utente fa login su sito web
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

// 3. Sito web redirige a desktop app
// Redirect: desktop://auth/callback?code=oauth_code&state=state

// 4. Desktop app scambia code per token
POST /api/auth/oauth/exchange
{
  "code": "oauth_code",
  "state": "state",
  "app_id": "desktop_app"
}

// 5. Risposta con token di accesso
{
  "success": true,
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscription": "premium",
    "organization": "Company Name"
  }
}
```

#### **Persistenza Sessione Desktop**
```typescript
// Desktop app salva token localmente
localStorage.setItem('access_token', access_token);
localStorage.setItem('refresh_token', refresh_token);
localStorage.setItem('user_data', JSON.stringify(user));

// Verifica sessione all'avvio
export async function checkSession() {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) return null;
  
  // Verifica token con server
  const response = await fetch('/api/auth/verify', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (response.ok) {
    return JSON.parse(localStorage.getItem('user_data'));
  } else {
    // Token scaduto, prova refresh
    return await refreshSession();
  }
}

// Refresh token automatico
export async function refreshSession() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;
  
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return JSON.parse(localStorage.getItem('user_data'));
  } else {
    // Refresh fallito, richiedi nuovo login
    localStorage.clear();
    return null;
  }
}
```

#### **Sincronizzazione Desktop**
```typescript
// Desktop app verifica stato utente
GET /api/sync/user-status?sync_token=xxx

// Risposta
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "subscription": "premium",
    "organization": "Company Name",
    "last_sync": "2024-01-01T00:00:00Z"
  },
  "subscription": {
    "plan": "premium",
    "status": "active",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

### **2. SINCRONIZZAZIONE DATI**

#### **Profilo Utente**
```typescript
// Sito web aggiorna profilo
PUT /api/sync/profile
{
  "full_name": "New Name",
  "phone": "+1234567890",
  "address": "New Address"
}

// Desktop app riceve notifica
WebSocket: profile_updated
{
  "user_id": "uuid",
  "changes": {
    "full_name": "New Name",
    "phone": "+1234567890",
    "address": "New Address"
  }
}
```

#### **Abbonamenti**
```typescript
// Cambio abbonamento
POST /api/sync/subscription
{
  "user_id": "uuid",
  "plan": "premium",
  "status": "active",
  "expires_at": "2024-12-31T23:59:59Z"
}

// Notifica a entrambi i sistemi
WebSocket: subscription_updated
{
  "user_id": "uuid",
  "subscription": {
    "plan": "premium",
    "status": "active",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

### **3. FUNZIONALITÀ AVANZATE**

#### **3.1 Notifiche Push Unificate**
```typescript
// Sistema di notifiche cross-platform
export class NotificationService {
  // Notifica da sito web
  async sendWebNotification(userId: string, message: string) {
    await fetch('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        type: 'web',
        message: message,
        action_url: '/dashboard'
      })
    });
  }
  
  // Notifica da desktop app
  async sendDesktopNotification(userId: string, message: string) {
    await fetch('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        type: 'desktop',
        message: message,
        action_url: 'desktop://open/dashboard'
      })
    });
  }
  
  // Notifica universale (entrambi i sistemi)
  async sendUniversalNotification(userId: string, message: string) {
    await Promise.all([
      this.sendWebNotification(userId, message),
      this.sendDesktopNotification(userId, message)
    ]);
  }
}
```

#### **3.2 Sincronizzazione File e Dati**
```typescript
// Sincronizzazione file tra sistemi
export class FileSyncService {
  // Upload file da desktop a cloud
  async uploadFile(file: File, userId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    });
    
    return response.json();
  }
  
  // Download file da cloud a desktop
  async downloadFile(fileId: string) {
    const response = await fetch(`/api/files/download/${fileId}`);
    return response.blob();
  }
  
  // Sincronizzazione automatica
  async syncFiles(userId: string) {
    const response = await fetch(`/api/files/sync/${userId}`);
    const files = await response.json();
    
    // Sincronizza file locali
    for (const file of files) {
      if (file.status === 'updated') {
        await this.downloadFile(file.id);
      }
    }
  }
}
```

#### **3.3 Backup e Ripristino**
```typescript
// Sistema di backup automatico
export class BackupService {
  // Backup dati utente
  async backupUserData(userId: string) {
    const response = await fetch('/api/backup/create', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    });
    
    return response.json();
  }
  
  // Ripristino dati
  async restoreUserData(userId: string, backupId: string) {
    const response = await fetch('/api/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ 
        user_id: userId, 
        backup_id: backupId 
      })
    });
    
    return response.json();
  }
  
  // Backup automatico programmato
  async scheduleBackup(userId: string, frequency: 'daily' | 'weekly' | 'monthly') {
    await fetch('/api/backup/schedule', {
      method: 'POST',
      body: JSON.stringify({ 
        user_id: userId, 
        frequency: frequency 
      })
    });
  }
}
```

#### **3.4 Analytics e Monitoraggio**
```typescript
// Sistema di analytics unificato
export class AnalyticsService {
  // Traccia evento da sito web
  async trackWebEvent(event: string, data: any) {
    await fetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        source: 'website',
        event: event,
        data: data,
        timestamp: new Date().toISOString()
      })
    });
  }
  
  // Traccia evento da desktop app
  async trackDesktopEvent(event: string, data: any) {
    await fetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({
        source: 'desktop',
        event: event,
        data: data,
        timestamp: new Date().toISOString()
      })
    });
  }
  
  // Dashboard analytics per admin
  async getAnalytics(userId: string, period: string) {
    const response = await fetch(`/api/analytics/user/${userId}?period=${period}`);
    return response.json();
  }
}
```

### **4. CONTROLLO REMOTO**

#### **Modalità Manutenzione**
```typescript
// Admin attiva manutenzione
POST /api/admin/maintenance
{
  "enabled": true,
  "message": "Sistema in manutenzione",
  "estimated_duration": "2 hours"
}

// Siti verificano stato
GET /api/system/status

// Risposta
{
  "maintenance_mode": true,
  "message": "Sistema in manutenzione",
  "estimated_duration": "2 hours",
  "allowed_users": ["admin@example.com"]
}
```

#### **Gestione Aggiornamenti**
```typescript
// Admin imposta nuova versione
POST /api/admin/updates
{
  "version": "2.1.0",
  "required": true,
  "message": "Aggiornamento obbligatorio disponibile",
  "download_url": "https://example.com/update.zip"
}

// App verifica aggiornamenti
GET /api/updates/check?current_version=2.0.0

// Risposta
{
  "update_available": true,
  "version": "2.1.0",
  "required": true,
  "message": "Aggiornamento obbligatorio disponibile",
  "download_url": "https://example.com/update.zip",
  "block_app": true
}
```

## 🏗️ **IMPLEMENTAZIONE STEP-BY-STEP**

### **FASE 1: SETUP WORKSPACE (1 giorno)**

#### **1.1 Riorganizzare Progetti**
```bash
# Creare workspace
mkdir rescuemanager-workspace
cd rescuemanager-workspace

# Spostare progetti
mv ../webapp website
mv ../desktop-app desktop-app

# Creare API condivise
mkdir shared-api
mkdir docs
```

#### **1.2 Setup Database Unificato**
```sql
-- Aggiungere tabelle per sincronizzazione
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE maintenance_mode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT FALSE,
  message TEXT,
  estimated_duration VARCHAR(255),
  allowed_users TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(50) NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  message TEXT,
  download_url TEXT,
  block_app BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'website' or 'desktop'
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **FASE 2: API DI SINCRONIZZAZIONE (2-3 giorni)**

#### **2.1 Autenticazione Unificata**
```typescript
// shared-api/auth/login.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  // Autenticazione Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  
  // Genera sync token
  const syncToken = generateSyncToken(data.user.id);
  
  return NextResponse.json({
    success: true,
    user: data.user,
    sync_token: syncToken
  });
}
```

#### **2.2 Sincronizzazione Dati**
```typescript
// shared-api/sync/data-sync.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const syncToken = searchParams.get('sync_token');
  
  // Verifica token
  const userId = verifySyncToken(syncToken);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  
  // Recupera dati utente
  const userData = await getUserData(userId);
  
  return NextResponse.json({
    user: userData,
    last_sync: new Date().toISOString()
  });
}
```

#### **2.3 WebSocket per Notifiche**
```typescript
// shared-api/websocket/notifications.ts
export class NotificationService {
  private clients = new Map<string, WebSocket>();
  
  subscribe(userId: string, ws: WebSocket) {
    this.clients.set(userId, ws);
  }
  
  notifyUser(userId: string, event: string, data: any) {
    const client = this.clients.get(userId);
    if (client) {
      client.send(JSON.stringify({ event, data }));
    }
  }
  
  notifyAll(event: string, data: any) {
    this.clients.forEach(client => {
      client.send(JSON.stringify({ event, data }));
    });
  }
}
```

### **FASE 3: CONTROLLO REMOTO (2-3 giorni)**

#### **3.1 Modalità Manutenzione**
```typescript
// shared-api/admin/maintenance.ts
export async function POST(request: Request) {
  const { enabled, message, estimated_duration, allowed_users } = await request.json();
  
  // Salva in database
  await supabase
    .from('maintenance_mode')
    .upsert({
      enabled,
      message,
      estimated_duration,
      allowed_users
    });
  
  // Notifica tutti i client
  notificationService.notifyAll('maintenance_mode', {
    enabled,
    message,
    estimated_duration
  });
  
  return NextResponse.json({ success: true });
}
```

#### **3.2 Gestione Aggiornamenti**
```typescript
// shared-api/admin/updates.ts
export async function POST(request: Request) {
  const { version, required, message, download_url, block_app } = await request.json();
  
  // Salva nuova versione
  await supabase
    .from('app_versions')
    .insert({
      version,
      required,
      message,
      download_url,
      block_app
    });
  
  // Notifica app desktop
  notificationService.notifyAll('app_update', {
    version,
    required,
    message,
    download_url,
    block_app
  });
  
  return NextResponse.json({ success: true });
}
```

### **FASE 4: INTEGRAZIONE SITI (2-3 giorni)**

#### **4.1 Sito Web - Verifica Manutenzione**
```typescript
// website/src/lib/system-status.ts
export async function checkSystemStatus() {
  const response = await fetch('/api/system/status');
  const data = await response.json();
  
  if (data.maintenance_mode) {
    // Mostra pagina manutenzione
    window.location.href = '/maintenance';
  }
}
```

#### **4.2 Desktop App - Verifica Aggiornamenti**
```typescript
// desktop-app/src/lib/update-checker.ts
export async function checkForUpdates() {
  const response = await fetch('/api/updates/check');
  const data = await response.json();
  
  if (data.update_available) {
    if (data.required) {
      // Blocca app e mostra aggiornamento
      showUpdateDialog(data);
    } else {
      // Mostra notifica aggiornamento opzionale
      showOptionalUpdate(data);
    }
  }
}
```

### **FASE 5: PANNELLO ADMIN (2-3 giorni)**

#### **5.1 Controllo Sistema**
```typescript
// website/src/app/staff/admin/system/page.tsx
export default function SystemControlPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [appVersions, setAppVersions] = useState([]);
  
  const toggleMaintenance = async () => {
    await fetch('/api/admin/maintenance', {
      method: 'POST',
      body: JSON.stringify({
        enabled: !maintenanceMode,
        message: 'Sistema in manutenzione'
      })
    });
  };
  
  const releaseUpdate = async (version: string) => {
    await fetch('/api/admin/updates', {
      method: 'POST',
      body: JSON.stringify({
        version,
        required: true,
        message: 'Aggiornamento obbligatorio'
      })
    });
  };
  
  return (
    <div>
      <h1>Controllo Sistema</h1>
      
      <div className="maintenance-control">
        <h2>Modalità Manutenzione</h2>
        <button onClick={toggleMaintenance}>
          {maintenanceMode ? 'Disattiva' : 'Attiva'} Manutenzione
        </button>
      </div>
      
      <div className="update-control">
        <h2>Gestione Aggiornamenti</h2>
        <button onClick={() => releaseUpdate('2.1.0')}>
          Rilascia Aggiornamento 2.1.0
        </button>
      </div>
    </div>
  );
}
```

## 🚀 **VANTAGGI DELLA CONNESSIONE**

### ✅ **Sincronizzazione Automatica**
- **Login**: Stesso utente su entrambi i sistemi
- **Dati**: Modifiche sincronizzate in tempo reale
- **Abbonamenti**: Stato unificato

### ✅ **Controllo Centralizzato**
- **Manutenzione**: Un pulsante per entrambi i sistemi
- **Aggiornamenti**: Gestione centralizzata
- **Monitoraggio**: Stato unificato

### ✅ **Esperienza Utente**
- **Consistenza**: Stessa esperienza ovunque
- **Sincronizzazione**: Dati sempre aggiornati
- **Notifiche**: Comunicazione unificata

## 📊 **TIMELINE STIMATA**

- **Fase 1**: 1 giorno
- **Fase 2**: 2-3 giorni
- **Fase 3**: 2-3 giorni
- **Fase 4**: 2-3 giorni
- **Fase 5**: 2-3 giorni

**TOTALE**: 9-13 giorni

## 🔒 **FUNZIONALITÀ AVANZATE AGGIUNTE**

### **AUTENTICAZIONE OAUTH DESKTOP**
- **Login tramite sito web**: Desktop app → Sito web → Desktop app
- **Persistenza sessione**: Rimanere connessi anche dopo riavvio
- **Refresh token automatico**: Sessione sempre attiva
- **Logout sicuro**: Controllo centralizzato

### **NOTIFICHE UNIFICATE**
- **Push notifications**: Cross-platform
- **Notifiche universali**: Sito + Desktop
- **Sistema di messaggistica**: Comunicazione unificata

### **SINCRONIZZAZIONE FILE**
- **Upload/Download**: File tra sistemi
- **Sincronizzazione automatica**: Dati sempre aggiornati
- **Cloud storage**: Backup automatico

### **SICUREZZA AVANZATA**
- **Controllo dispositivi**: Verifica autorizzazioni
- **Log attività**: Monitoraggio completo
- **Blocco remoto**: Controllo accessi
- **Sospensione utenti**: Gestione centralizzata

### **ANALYTICS E MONITORAGGIO**
- **Tracking unificato**: Eventi da entrambi i sistemi
- **Dashboard analytics**: Statistiche complete
- **Monitoraggio real-time**: Stato sistema

### **GESTIONE LICENZE**
- **Verifica licenze**: Controllo abbonamenti
- **Attivazione licenze**: Gestione centralizzata
- **Scadenze**: Monitoraggio automatico

## 🎯 **PROSSIMI PASSI**

1. **✅ Approvare piano**: Confermare strategia
2. **🏗️ Setup workspace**: Riorganizzare progetti
3. **🗄️ Database**: Aggiungere tabelle sincronizzazione
4. **🔌 API**: Creare API condivise
5. **🔗 Integrazione**: Collegare sistemi
6. **🧪 Testing**: Verificare funzionamento
7. **🔒 Sicurezza**: Implementare controlli avanzati
8. **📊 Analytics**: Setup monitoraggio
