"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Monitor } from "lucide-react";

interface OAuthRedirectProps {
  redirectUrl: string;
  onComplete?: () => void;
}

export default function OAuthRedirect({ redirectUrl, onComplete }: OAuthRedirectProps) {
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsRedirecting(true);
          clearInterval(timer);
          
          // Redirect alla desktop app
          setTimeout(() => {
            console.log('[OAuthRedirect] Redirecting to:', redirectUrl);
            console.log('[OAuthRedirect] Current location:', globalThis.location.href);
            try {
              // Usa window.location.replace() invece di href per evitare problemi con history
              window.location.replace(redirectUrl);
              console.log('[OAuthRedirect] Redirect initiated with replace()');
            } catch (err) {
              console.error('[OAuthRedirect] Redirect error:', err);
              // Fallback: prova con href
              try {
                globalThis.location.href = redirectUrl;
                console.log('[OAuthRedirect] Fallback redirect with href');
              } catch (err2) {
                console.error('[OAuthRedirect] All redirect methods failed:', err2);
                // Ultimo fallback: mostra link cliccabile
                const errorDiv = document.createElement('div');
                errorDiv.innerHTML = `
                  <p style="color: red; margin-top: 20px;">
                    Reindirizzamento automatico fallito. 
                    <a href="${redirectUrl}" style="color: blue; text-decoration: underline;">Clicca qui per continuare</a>
                  </p>
                `;
                document.body.appendChild(errorDiv);
              }
            }
            onComplete?.();
          }, 500);
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [redirectUrl, onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 dark:from-neutral-900 dark:via-indigo-950/20 dark:to-purple-950/20 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5 p-8 border border-white/20 dark:border-white/10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-6"
        >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg"
      >
        <CheckCircle className="h-8 w-8 text-white" />
      </motion.div>

      <div>
        <h3 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Autenticazione completata
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Reindirizzamento alla desktop app in corso...
        </p>
      </div>

      <div className="flex items-center justify-center space-x-2">
        <Monitor className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {isRedirecting ? "Reindirizzamento..." : `Reindirizzamento in ${countdown} secondi`}
        </span>
        <ArrowRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
      </div>

      {!isRedirecting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
        >
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "linear" }}
          />
        </motion.div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Se il reindirizzamento non funziona automaticamente,{" "}
        <a 
          href={redirectUrl} 
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline"
        >
          clicca qui
        </a>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
