// src/lib/logout.ts
"use client";

import { supabaseBrowser } from "./supabase-browser";

export interface LogoutOptions {
  redirectTo?: string;
  clearAll?: boolean;
  forceGoogleLogout?: boolean;
}

// Flag per prevenire logout multipli
let isLoggingOut = false;

/**
 * Sistema di logout unificato e robusto
 * Gestisce tutti i tipi di logout: standard, Google OAuth, e cleanup completo
 */
export async function performLogout(options: LogoutOptions = {}): Promise<void> {
  // Prevenire logout multipli
  if (isLoggingOut) {
    console.log("Logout already in progress, ignoring duplicate call");
    return;
  }

  isLoggingOut = true;

  const {
    redirectTo = "/",
    clearAll = true,
    forceGoogleLogout = false
  } = options;

  console.log("=== LOGOUT START ===");
  console.log("Options:", { redirectTo, clearAll, forceGoogleLogout });

  try {
    const supabase = supabaseBrowser();
    
    // 1. Verifica utente corrente
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting user:", userError);
    }
    
    console.log("Current user:", user?.email, "Provider:", user?.app_metadata?.provider);

    // 2. Dispatch logout event IMMEDIATAMENTE per aggiornare UI
    console.log("Dispatching logout event...");
    globalThis.dispatchEvent(new CustomEvent('logout', { 
      detail: { 
        userEmail: user?.email,
        provider: user?.app_metadata?.provider 
      } 
    }));

    // 3. Logout da Supabase
    console.log("Performing Supabase signOut...");
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error("Supabase signOut error:", signOutError);
    } else {
      console.log("Supabase signOut successful");
    }

    // 4. Pulizia dati locali
    if (clearAll) {
      console.log("Clearing local storage...");
      localStorage.clear();
      sessionStorage.clear();
      
      // Pulizia specifica per RescueManager
      localStorage.removeItem("rescuemanager-auth");
      localStorage.removeItem("rescuemanager-user");
      localStorage.removeItem("rescuemanager-org");
    }

    // 5. Pulizia cookie (tentativo)
    console.log("Clearing cookies...");
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
      // Clear for parent domain (if applicable)
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.rescuemanager.eu`;
      // Clear for localhost (development)
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost`;
    }

    // 6. Gestione Google OAuth logout
    const isGoogleUser = user?.app_metadata?.provider === 'google';
    const shouldForceGoogleLogout = forceGoogleLogout || isGoogleUser;
    
    if (shouldForceGoogleLogout) {
      console.log("Google OAuth logout required");
      
      // Per Google OAuth, dobbiamo fare logout da Google stesso
      const returnUrl = `${globalThis.location.origin}${redirectTo}?logout=success`;
      const googleLogoutUrl = `https://accounts.google.com/logout?continue=${encodeURIComponent(returnUrl)}`;
      
      console.log("Redirecting to Google logout:", googleLogoutUrl);
      globalThis.location.href = googleLogoutUrl;
      return;
    }

    // 7. Logout standard - redirect
    console.log("Standard logout - redirecting to:", redirectTo);
    globalThis.location.href = redirectTo;

  } catch (error) {
    console.error("Logout error:", error);
    
    // Anche in caso di errore, forza il redirect
    console.log("Forcing redirect due to error");
    globalThis.location.href = redirectTo;
  } finally {
    // Reset flag dopo timeout per sicurezza
    setTimeout(() => {
      isLoggingOut = false;
    }, 5000);
  }
}

/**
 * Logout rapido per uso interno
 */
export async function quickLogout(): Promise<void> {
  return performLogout({ 
    redirectTo: "/",
    clearAll: true 
  });
}

/**
 * Logout completo con pulizia forzata
 */
export async function fullLogout(): Promise<void> {
  return performLogout({ 
    redirectTo: "/",
    clearAll: true,
    forceGoogleLogout: true 
  });
}

/**
 * Logout con redirect personalizzato
 */
export async function logoutWithRedirect(redirectTo: string): Promise<void> {
  return performLogout({ 
    redirectTo,
    clearAll: true 
  });
}
