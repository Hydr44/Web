// src/lib/auth.ts
"use client";

import { supabaseBrowser } from "./supabase-browser";

export interface AuthUser {
  id: string;
  email: string;
  provider: string;
  isGoogle: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
}

/**
 * Sistema di autenticazione unificato e robusto
 * Gestisce login, logout, e gestione stato utente
 */
export class AuthManager {
  private static instance: AuthManager;
  private isInitialized = false;
  private currentUser: AuthUser | null = null;
  private readonly listeners: Set<(user: AuthUser | null) => void> = new Set();

  private constructor() {}

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * Inizializza il sistema di autenticazione
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log("=== AUTH MANAGER INIT ===");
    
    const supabase = supabaseBrowser();
    
    // Carica stato iniziale
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Auth init error:", error);
    } else if (user) {
      this.currentUser = this.transformUser(user);
      console.log("Initial user loaded:", this.currentUser.email);
    }

    // Listener per cambiamenti di autenticazione
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUser = this.transformUser(session.user);
        this.notifyListeners();
        console.log("User signed in:", this.currentUser.email);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.notifyListeners();
        console.log("User signed out");
      }
    });

    this.isInitialized = true;
    console.log("=== AUTH MANAGER INIT COMPLETE ===");
  }

  /**
   * Login con email e password
   */
  async loginWithPassword(email: string, password: string): Promise<LoginResult> {
    console.log("=== LOGIN WITH PASSWORD ===");
    console.log("Email:", email);

    try {
      const supabase = supabaseBrowser();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        const user = this.transformUser(data.user);
        this.currentUser = user;
        this.notifyListeners();
        
        console.log("Login successful:", user.email);
        return { success: true, user };
      }

      return { success: false, error: "No user data received" };
    } catch (error) {
      console.error("Login exception:", error);
      return { success: false, error: "Errore imprevisto durante l'accesso" };
    }
  }

  /**
   * Login con Google OAuth
   */
  async loginWithGoogle(): Promise<LoginResult> {
    console.log("=== LOGIN WITH GOOGLE ===");

    try {
      const supabase = supabaseBrowser();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${globalThis.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error("Google login error:", error);
        return { success: false, error: error.message };
      }

      // Il redirect avviene automaticamente
      return { success: true };
    } catch (error) {
      console.error("Google login exception:", error);
      return { success: false, error: "Errore durante il login con Google" };
    }
  }

  /**
   * Logout completo
   */
  async logout(): Promise<LogoutResult> {
    console.log("=== LOGOUT START ===");

    try {
      const supabase = supabaseBrowser();
      
      // Verifica utente corrente
      const { data: { user } } = await supabase.auth.getUser();
      const isGoogleUser = user?.app_metadata?.provider === 'google';
      
      console.log("Current user:", user?.email, "Provider:", user?.app_metadata?.provider);

      // Logout da Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase logout error:", error);
      } else {
        console.log("Supabase logout successful");
      }

      // Pulisci stato locale
      this.currentUser = null;
      this.notifyListeners();

      // Pulisci storage
      localStorage.clear();
      sessionStorage.clear();

      // Pulisci cookie
      this.clearCookies();

      // Gestione Google OAuth logout
      if (isGoogleUser) {
        console.log("Google OAuth logout - redirecting to Google");
        const returnUrl = `${globalThis.location.origin}?logout=success`;
        const googleLogoutUrl = `https://accounts.google.com/logout?continue=${encodeURIComponent(returnUrl)}`;
        globalThis.location.href = googleLogoutUrl;
        return { success: true };
      }

      // Logout standard
      console.log("Standard logout - redirecting to home");
      globalThis.location.href = "/";
      return { success: true };

    } catch (error) {
      console.error("Logout error:", error);
      globalThis.location.href = "/";
      return { success: false, error: "Errore durante il logout" };
    }
  }

  /**
   * Ottieni utente corrente
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Verifica se l'utente è autenticato
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Aggiungi listener per cambiamenti di stato
   */
  addListener(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Trasforma user Supabase in AuthUser
   */
  private transformUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email || '',
      provider: user.app_metadata?.provider || 'email',
      isGoogle: user.app_metadata?.provider === 'google'
    };
  }

  /**
   * Notifica tutti i listener
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentUser);
      } catch (error) {
        console.error("Listener error:", error);
      }
    }
  }

  /**
   * Pulisci tutti i cookie
   */
  private clearCookies(): void {
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-ienzdgrqalltvkdkuamp-auth-token',
      'sb-ienzdgrqalltvkdkuamp-auth-token-code-verifier'
    ];

    for (const cookieName of cookiesToClear) {
      // Clear for current domain
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      // Clear for parent domain
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.rescuemanager.eu`;
      // Clear for localhost
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost`;
    }
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance();

// Export convenience functions
export const loginWithPassword = (email: string, password: string) => 
  authManager.loginWithPassword(email, password);

export const loginWithGoogle = () => 
  authManager.loginWithGoogle();

export const logout = () => 
  authManager.logout();

export const getCurrentUser = () => 
  authManager.getCurrentUser();

export const isAuthenticated = () => 
  authManager.isAuthenticated();

export const addAuthListener = (listener: (user: AuthUser | null) => void) => 
  authManager.addListener(listener);
