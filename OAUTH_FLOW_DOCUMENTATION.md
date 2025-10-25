# 🔐 DOCUMENTAZIONE FLUSSO OAUTH DESKTOP

## 📋 **FLUSSO COMPLETO DI AUTENTICAZIONE**

### **1. AVVIO LOGIN DESKTOP**
```
Desktop App
├── Utente clicca "Login"
├── App apre browser con URL OAuth
└── Browser naviga a: https://rescuemanager.eu/auth/oauth/desktop?app_id=desktop_app&redirect_uri=desktop://auth/callback
```

### **2. LOGIN SUL SITO WEB**
```
Sito Web
├── Mostra pagina di login
├── Utente inserisce credenziali
├── Verifica credenziali con Supabase
├── Genera OAuth code
└── Redirect a: desktop://auth/callback?code=oauth_code&state=state
```

### **3. RITORNO ALLA DESKTOP APP**
```
Desktop App
├── Intercetta redirect desktop://
├── Estrae code e state
├── Scambia code per access_token
├── Salva token localmente
└── Mostra dashboard autenticata
```

## 🔧 **IMPLEMENTAZIONE TECNICA**

### **Desktop App - Avvio OAuth**
```typescript
// desktop-app/src/lib/oauth.ts
export class OAuthService {
  private static readonly OAUTH_URL = 'https://rescuemanager.eu/auth/oauth/desktop';
  private static readonly REDIRECT_URI = 'desktop://auth/callback';
  
  static async startLogin() {
    const state = generateRandomState();
    const appId = 'desktop_app';
    
    // Salva state per verifica
    localStorage.setItem('oauth_state', state);
    
    // Apri browser con URL OAuth
    const oauthUrl = `${this.OAUTH_URL}?app_id=${appId}&redirect_uri=${this.REDIRECT_URI}&state=${state}`;
    
    // Apri browser (Electron)
    const { shell } = require('electron');
    await shell.openExternal(oauthUrl);
    
    // Aspetta callback
    return this.waitForCallback();
  }
  
  private static async waitForCallback(): Promise<AuthResult> {
    return new Promise((resolve, reject) => {
      // Intercetta URL scheme
      const { protocol } = require('electron');
      
      protocol.registerHttpProtocol('desktop', (request, callback) => {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        
        // Verifica state
        const savedState = localStorage.getItem('oauth_state');
        if (state !== savedState) {
          reject(new Error('Invalid state'));
          return;
        }
        
        // Scambia code per token
        this.exchangeCodeForToken(code).then(resolve).catch(reject);
      });
    });
  }
  
  private static async exchangeCodeForToken(code: string): Promise<AuthResult> {
    const response = await fetch('https://rescuemanager.eu/api/auth/oauth/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        app_id: 'desktop_app'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Salva token localmente
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      return data;
    } else {
      throw new Error(data.error);
    }
  }
}
```

### **Sito Web - Gestione OAuth**
```typescript
// website/src/app/auth/oauth/desktop/page.tsx
export default function DesktopOAuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const appId = searchParams.get('app_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  
  const handleLogin = async (email: string, password: string) => {
    try {
      // Login con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // Genera OAuth code
      const oauthCode = generateOAuthCode(data.user.id);
      
      // Salva code temporaneamente
      await supabase
        .from('oauth_codes')
        .insert({
          code: oauthCode,
          user_id: data.user.id,
          app_id: appId,
          expires_at: new Date(Date.now() + 5 * 60 * 1000) // 5 minuti
        });
      
      // Redirect a desktop app
      const redirectUrl = `${redirectUri}?code=${oauthCode}&state=${state}`;
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Login per Desktop App</h1>
        <LoginForm onSubmit={handleLogin} />
      </div>
    </div>
  );
}
```

### **API OAuth Exchange**
```typescript
// website/src/app/api/auth/oauth/exchange/route.ts
export async function POST(request: Request) {
  try {
    const { code, app_id } = await request.json();
    
    // Verifica code
    const { data: oauthData, error } = await supabase
      .from('oauth_codes')
      .select('*')
      .eq('code', code)
      .eq('app_id', app_id)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !oauthData) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }
    
    // Recupera dati utente
    const { data: userData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', oauthData.user_id)
      .single();
    
    // Genera JWT token
    const accessToken = generateJWT({
      user_id: oauthData.user_id,
      app_id: app_id,
      type: 'access'
    });
    
    const refreshToken = generateJWT({
      user_id: oauthData.user_id,
      app_id: app_id,
      type: 'refresh'
    });
    
    // Elimina code usato
    await supabase
      .from('oauth_codes')
      .delete()
      .eq('code', code);
    
    return NextResponse.json({
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        subscription: userData.subscription,
        organization: userData.organization
      }
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## 🔄 **PERSISTENZA SESSIONE**

### **Verifica Sessione all'Avvio**
```typescript
// desktop-app/src/lib/session.ts
export class SessionService {
  static async checkSession(): Promise<User | null> {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return null;
    
    try {
      // Verifica token con server
      const response = await fetch('https://rescuemanager.eu/api/auth/verify', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        return userData;
      } else {
        // Token scaduto, prova refresh
        return await this.refreshSession();
      }
    } catch (error) {
      console.error('Session check failed:', error);
      return null;
    }
  }
  
  static async refreshSession(): Promise<User | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;
    
    try {
      const response = await fetch('https://rescuemanager.eu/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Salva nuovi token
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        
        return JSON.parse(localStorage.getItem('user_data') || '{}');
      } else {
        // Refresh fallito, richiedi nuovo login
        localStorage.clear();
        return null;
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      localStorage.clear();
      return null;
    }
  }
  
  static async logout(): Promise<void> {
    const accessToken = localStorage.getItem('access_token');
    
    if (accessToken) {
      try {
        await fetch('https://rescuemanager.eu/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Pulisci storage locale
    localStorage.clear();
  }
}
```

## 🛡️ **SICUREZZA**

### **Validazione Token**
```typescript
// website/src/app/api/auth/verify/route.ts
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    
    // Verifica JWT token
    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Verifica che il token non sia scaduto
    if (payload.exp < Date.now() / 1000) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
    
    return NextResponse.json({ valid: true, user_id: payload.user_id });
    
  } catch (error) {
    return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
  }
}
```

### **Refresh Token**
```typescript
// website/src/app/api/auth/refresh/route.ts
export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json();
    
    // Verifica refresh token
    const payload = verifyJWT(refresh_token);
    if (!payload || payload.type !== 'refresh') {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }
    
    // Genera nuovi token
    const newAccessToken = generateJWT({
      user_id: payload.user_id,
      app_id: payload.app_id,
      type: 'access'
    });
    
    const newRefreshToken = generateJWT({
      user_id: payload.user_id,
      app_id: payload.app_id,
      type: 'refresh'
    });
    
    return NextResponse.json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
  }
}
```

## 🎯 **VANTAGGI DEL SISTEMA OAUTH**

### ✅ **Sicurezza**
- **Token JWT**: Sicurezza avanzata
- **Refresh automatico**: Sessione sempre attiva
- **Logout centralizzato**: Controllo completo

### ✅ **Esperienza Utente**
- **Login unificato**: Stesse credenziali ovunque
- **Persistenza**: Rimanere connessi
- **Sincronizzazione**: Dati sempre aggiornati

### ✅ **Controllo Admin**
- **Monitoraggio**: Vedi chi è connesso
- **Blocco remoto**: Controllo accessi
- **Log attività**: Tracciamento completo
