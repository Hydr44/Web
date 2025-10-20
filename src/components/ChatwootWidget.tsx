"use client";

import { useEffect, useState } from "react";

const CHATWOOT_BASE_URL = "https://help.rescuemanager.eu";
const CHATWOOT_TOKEN = "9PaAY4hC3w34ZvL7nT1igeFy"; // quello che hai incollato

export default function ChatwootWidget() {
  const [loaded, setLoaded] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    // Evita duplicati se il componente viene montato più volte
    if ((window as any).chatwootSDK) {
      setLoaded(true);
      return;
    }

    const s = document.createElement("script");
    s.src = `${CHATWOOT_BASE_URL}/packs/js/sdk.js`;
    s.async = true;
    s.onload = () => setLoaded(true);
    s.onerror = () => console.warn("[Chatwoot] errore nel caricare lo script");
    document.head.appendChild(s);

    return () => {
      // non rimuovere lo script per evitare ricariche inutili tra route
    };
  }, []);

  useEffect(() => {
    if (!loaded || started) return;

    try {
      (window as any).chatwootSDK?.run({
        websiteToken: CHATWOOT_TOKEN,
        baseUrl: CHATWOOT_BASE_URL,
      });
      setStarted(true);

      // Alza lo z-index e sposta la bolla se serve
      const tryBump = () => {
        const el = document.getElementById("chatwoot_live_chat_widget");
        if (el) {
          el.style.zIndex = "2147483000";
          el.style.pointerEvents = "auto";
        }
      };

      tryBump();
      // ritenta dopo un attimo perché il DOM del widget è iniettato async
      setTimeout(tryBump, 600);
      setTimeout(tryBump, 1500);

      // Log utile in console
      console.log("[Chatwoot] SDK avviato");
    } catch (e) {
      console.warn("[Chatwoot] init error", e);
    }
  }, [loaded, started]);

  return null;
}
