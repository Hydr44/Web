// src/hooks/useCookieConsent.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
};

const STORAGE_KEY = "cookie-consent";
const SESSION_ID_KEY = "cookie-session-id";
const CONSENT_VERSION = "1.0";

// Genera o recupera session ID univoco
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

// Maschera IP (rimuove ultimo ottetto per privacy)
function maskIp(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) {
    parts[3] = "0";
    return parts.join(".");
  }
  return ip;
}

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carica preferenze salvate
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
        setHasConsent(true);
      } catch {
        setHasConsent(false);
      }
    } else {
      setHasConsent(false);
    }
    setIsLoading(false);
  }, []);

  // Salva consenso (localStorage + database)
  const saveConsent = useCallback(async (prefs: CookiePreferences) => {
    if (typeof window === "undefined") return;

    // Salva in localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setHasConsent(true);

    // Salva su database per audit GDPR
    try {
      const supabase = supabaseBrowser();
      const sessionId = getSessionId();

      // Ottieni user_id se autenticato
      const { data: { user } } = await supabase.auth.getUser();

      // Ottieni IP e user agent (se disponibili)
      let ipAddress: string | null = null;
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipResponse.json();
        ipAddress = maskIp(ipData.ip); // Maschera IP per privacy
      } catch {
        // Ignora errori IP
      }

      const userAgent = navigator.userAgent;

      // Inserisci consenso
      await supabase.from("cookie_consents").insert({
        user_id: user?.id || null,
        session_id: sessionId,
        essential: prefs.essential,
        analytics: prefs.analytics,
        functional: prefs.functional,
        marketing: prefs.marketing,
        ip_address: ipAddress,
        user_agent: userAgent,
        consent_version: CONSENT_VERSION,
      });

      console.log("[CookieConsent] Consenso salvato su database");
    } catch (error) {
      console.error("[CookieConsent] Errore salvataggio database:", error);
      // Non bloccare l'utente se il DB fallisce
    }

    // Trigger evento per script esterni
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: prefs }));
    }
  }, []);

  // Accetta tutti i cookie
  const acceptAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: true,
      functional: true,
      marketing: true,
    });
  }, [saveConsent]);

  // Rifiuta cookie non essenziali
  const rejectNonEssential = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: false,
      functional: false,
      marketing: false,
    });
  }, [saveConsent]);

  // Salva preferenze personalizzate
  const savePreferences = useCallback((prefs: CookiePreferences) => {
    saveConsent(prefs);
  }, [saveConsent]);

  // Resetta consenso (per testare)
  const resetConsent = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
    setPreferences(DEFAULT_PREFERENCES);
    setHasConsent(false);
  }, []);

  return {
    preferences,
    hasConsent,
    isLoading,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    resetConsent,
  };
}
