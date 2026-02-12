"use client";

import { useEffect, useState } from "react";
import { CheckCircle, ArrowRight, Monitor } from "lucide-react";

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
    <div className="rounded-2xl bg-[#1a2536] border border-[#243044] p-8">
      <div className="text-center space-y-6">
        <div className="mx-auto h-14 w-14 bg-emerald-600 rounded-xl flex items-center justify-center">
          <CheckCircle className="h-7 w-7 text-white" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            Autenticazione completata
          </h3>
          <p className="text-sm text-slate-400">
            Reindirizzamento alla desktop app in corso...
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Monitor className="h-4 w-4 text-blue-400" />
          <span className="text-sm text-slate-400">
            {isRedirecting ? "Reindirizzamento..." : `Reindirizzamento in ${countdown} secondi`}
          </span>
          <ArrowRight className="h-4 w-4 text-blue-400" />
        </div>

        {!isRedirecting && (
          <div className="w-full bg-[#243044] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        <div className="text-xs text-slate-500">
          Se il reindirizzamento non funziona automaticamente,{" "}
          <a href={redirectUrl} className="text-blue-400 hover:underline">
            clicca qui
          </a>
        </div>
      </div>
    </div>
  );
}
