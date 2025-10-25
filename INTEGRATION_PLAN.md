# 🔗 PIANO DI INTEGRAZIONE SITO WEB + DESKTOP APP

## 📋 **STRUTTURA ATTUALE**

### **Sito Web** (Next.js)
```
webapp/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/            # Componenti React
│   ├── lib/                   # Utilities
│   └── hooks/                 # React Hooks
├── supabase/                  # Database migrations
└── public/                    # Assets statici
```

### **Desktop App** (Electron + React)
```
desktop-app/
├── src/
│   ├── components/            # Componenti React
│   ├── pages/                 # Pagine dell'app
│   ├── lib/                   # Utilities
│   ├── hooks/                 # React Hooks
│   └── integrations/          # Supabase client
├── electron/                  # Electron main process
└── supabase/                  # Database migrations
```

## 🎯 **OBIETTIVI INTEGRAZIONE**

### ✅ **Codice Condiviso**
- **Types**: TypeScript interfaces
- **Utils**: Funzioni utility
- **Components**: Componenti React riutilizzabili
- **Hooks**: React hooks condivisi
- **API**: Client Supabase unificato

### ✅ **Database Unificato**
- **Schema**: Stesso database Supabase
- **Migrations**: Sincronizzate
- **Auth**: Sistema di autenticazione unificato

### ✅ **Sviluppo Coordinato**
- **Cursor**: Modifiche simultanee
- **Git**: Repository separati ma sincronizzati
- **Deploy**: Solo sito web su GitHub

## 🔧 **IMPLEMENTAZIONE STEP-BY-STEP**

### **FASE 1: Analisi e Preparazione**

#### **1.1 Identificare Codice Condiviso**
```bash
# Analizzare componenti simili
find src/components -name "*.tsx" -o -name "*.jsx"
find desktop-app/src/components -name "*.tsx" -o -name "*.jsx"
```

#### **1.2 Identificare Utils Condivise**
```bash
# Analizzare utilities
find src/lib -name "*.ts" -o -name "*.js"
find desktop-app/src/lib -name "*.ts" -o -name "*.js"
```

#### **1.3 Identificare Types Condivisi**
```bash
# Analizzare types
find src -name "*.d.ts" -o -name "types.ts"
find desktop-app/src -name "*.d.ts" -o -name "types.ts"
```

### **FASE 2: Creare Struttura Condivisa**

#### **2.1 Cartella Shared**
```
shared/
├── types/
│   ├── user.ts
│   ├── organization.ts
│   └── index.ts
├── utils/
│   ├── auth.ts
│   ├── validation.ts
│   └── index.ts
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingSpinner.tsx
│   └── forms/
│       ├── LoginForm.tsx
│       └── UserForm.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useSupabase.ts
│   └── index.ts
└── api/
    ├── supabase.ts
    ├── auth.ts
    └── index.ts
```

#### **2.2 Symlink per Sviluppo**
```bash
# Creare symlink per sviluppo
ln -s ../../shared src/shared
ln -s ../../shared desktop-app/src/shared
```

### **FASE 3: Sincronizzazione Database**

#### **3.1 Unificare Migrations**
```bash
# Copiare migrations dal desktop app
cp desktop-app/supabase/migrations/* supabase/migrations/

# Verificare conflitti
git diff supabase/migrations/
```

#### **3.2 Sincronizzare Schema**
```typescript
// shared/types/database.ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          // ... altri campi
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          // ... altri campi
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          // ... altri campi
        };
      };
      // ... altre tabelle
    };
  };
}
```

### **FASE 4: Componenti Condivisi**

#### **4.1 UI Components**
```typescript
// shared/components/ui/Button.tsx
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  onClick
}) => {
  // Implementazione condivisa
};
```

#### **4.2 Forms Condivisi**
```typescript
// shared/components/forms/LoginForm.tsx
export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  loading,
  error
}) => {
  // Form di login condiviso
};
```

### **FASE 5: Hooks Condivisi**

#### **5.1 Auth Hook**
```typescript
// shared/hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Logica di autenticazione condivisa
  
  return { user, loading, login, logout };
};
```

#### **5.2 Supabase Hook**
```typescript
// shared/hooks/useSupabase.ts
export const useSupabase = () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  return supabase;
};
```

### **FASE 6: API Condivisa**

#### **6.1 Supabase Client**
```typescript
// shared/api/supabase.ts
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

#### **6.2 Auth API**
```typescript
// shared/api/auth.ts
export const authAPI = {
  login: async (email: string, password: string) => {
    // Logica di login condivisa
  },
  logout: async () => {
    // Logica di logout condivisa
  },
  register: async (userData: RegisterData) => {
    // Logica di registrazione condivisa
  }
};
```

## 🚀 **WORKFLOW DI SVILUPPO**

### **Sviluppo Simultaneo**
1. **Modifica condivisa**: Cambi in `shared/`
2. **Test locale**: Sia web che desktop
3. **Commit**: Solo sito web su GitHub
4. **Sync**: Desktop app aggiornata localmente

### **Script di Sincronizzazione**
```bash
#!/bin/bash
# sync-desktop.sh

# Copiare modifiche dal sito web al desktop app
cp -r src/shared/* desktop-app/src/shared/
cp -r supabase/migrations/* desktop-app/supabase/migrations/

# Aggiornare dependencies se necessario
cd desktop-app && npm install
```

## 📱 **VANTAGGI DELL'INTEGRAZIONE**

### ✅ **Codice Riutilizzabile**
- **Components**: Stessi componenti UI
- **Logic**: Stessa logica di business
- **Types**: Types condivisi e consistenti

### ✅ **Sviluppo Efficiente**
- **Modifiche simultanee**: Un cambio, due app aggiornate
- **Testing**: Test condivisi
- **Debugging**: Debug unificato

### ✅ **Manutenzione Semplificata**
- **Bug fixes**: Una correzione, due app
- **Features**: Una feature, due app
- **Updates**: Aggiornamenti coordinati

## 🎯 **PROSSIMI PASSI**

1. **Analizzare**: Identificare codice condiviso
2. **Creare shared**: Struttura cartelle condivise
3. **Symlink**: Collegare per sviluppo
4. **Migrare**: Spostare codice condiviso
5. **Testare**: Verificare funzionamento
6. **Sincronizzare**: Script di sync automatico
