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
    <div className="bg-white border border-gray-200 p-8 sm:p-12">
      <div className="text-center space-y-6">
        {/* Success Icon */}
        <div className="mx-auto h-16 w-16 bg-blue-600 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>

        <div>
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
            Autenticazione completata
          </h3>
          <p className="text-base text-gray-600">
            Reindirizzamento alla desktop app in corso...
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 py-4">
          <Monitor className="h-5 w-5 text-blue-600" />
          <span className="text-lg font-semibold text-gray-900">
            {isRedirecting ? "Reindirizzamento..." : `${countdown}s`}
          </span>
          <ArrowRight className="h-5 w-5 text-blue-600" />
        </div>

        {!isRedirecting && (
          <div className="w-full bg-gray-100 h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-100 ease-linear"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        <div className="text-sm text-gray-500 pt-4">
          Se il reindirizzamento non funziona,{" "}
          <a href={redirectUrl} className="text-blue-600 font-semibold hover:underline">
            clicca qui
          </a>
        </div>
      </div>
    </div>
  );
}
