"use client";

import { useEffect, useState } from "react";


interface OAuthRedirectProps {
  redirectUrl: string;
  onComplete?: () => void;
}

export default function OAuthRedirect({ redirectUrl, onComplete }: OAuthRedirectProps) {
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress bar with JS instead of framer-motion
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + (100 / 30); // ~3 seconds at 100ms intervals
      });
    }, 100);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRedirecting(true);
          clearInterval(timer);
          clearInterval(progressInterval);
          
          // Redirect alla desktop app
          setTimeout(() => {
            console.log('[OAuthRedirect] Redirecting to:', redirectUrl);
            try {
              window.location.replace(redirectUrl);
            } catch (err) {
              console.error('[OAuthRedirect] Redirect error:', err);
              try {
                globalThis.location.href = redirectUrl;
              } catch (err2) {
                console.error('[OAuthRedirect] All redirect methods failed:', err2);
              }
            }
            onComplete?.();
          }, 500);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(progressInterval);
    };
  }, [redirectUrl, onComplete]);

  return (
    <div className="rm-card">
      <p className="rm-eyebrow">Autorizzazione concessa</p>
      <h2 style={{ marginTop: 10 }}>Accesso completato</h2>
      <p className="rm-muted" style={{ marginTop: 8 }}>
        Stiamo riportando l&apos;autorizzazione all&apos;applicazione desktop.
      </p>

      <div className="rm-righe" style={{ marginTop: 16 }}>
        <div className="rm-riga">
          <span>Stato</span>
          <span className="rm-stato rm-stato--corso">
            {isRedirecting
              ? "Ritorno all'applicazione in corso"
              : `Ritorno all'applicazione tra ${countdown} secondi`}
          </span>
        </div>
      </div>

      {!isRedirecting && (
        <div
          style={{
            marginTop: 14,
            height: 2,
            width: "100%",
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            className="transition-all duration-100 ease-linear"
            style={{
              width: `${Math.min(progress, 100)}%`,
              height: "100%",
              background: "var(--brand)",
            }}
          />
        </div>
      )}

      <p className="rm-muted" style={{ marginTop: 16 }}>
        Se l&apos;applicazione non si apre da sola,{" "}
        <a href={redirectUrl}>riporta l&apos;autorizzazione a mano</a>.
      </p>
    </div>
  );
}
