"use client";
import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t shadow-lg">
      <div className="rm-container py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p className="text-sm text-gray-700">
          Utilizziamo cookie tecnici e analitici per migliorare l’esperienza.
          Per maggiori informazioni leggi la nostra{" "}
          <a href="/cookie" className="underline hover:text-primary">Cookie Policy</a>.
        </p>
        <div className="flex gap-2">
          <button
            onClick={reject}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
          >
            Rifiuta
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
}
