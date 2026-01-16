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
            globalThis.location.href = redirectUrl;
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
        className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center"
      >
        <CheckCircle className="h-8 w-8 text-white" />
      </motion.div>

      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Accesso Completato!
        </h3>
        <p className="text-gray-600">
          Reindirizzamento alla desktop app in corso...
        </p>
      </div>

      <div className="flex items-center justify-center space-x-2">
        <Monitor className="h-5 w-5 text-indigo-600" />
        <span className="text-sm text-gray-600">
          {isRedirecting ? "Reindirizzamento..." : `Reindirizzamento in ${countdown} secondi`}
        </span>
        <ArrowRight className="h-4 w-4 text-indigo-600" />
      </div>

      {!isRedirecting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full bg-gray-200 rounded-full h-2"
        >
          <motion.div
            className="bg-indigo-600 h-2 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "linear" }}
          />
        </motion.div>
      )}

      <div className="text-xs text-gray-500">
        Se il reindirizzamento non funziona automaticamente,{" "}
        <a 
          href={redirectUrl} 
          className="text-indigo-600 hover:text-indigo-500 underline"
        >
          clicca qui
        </a>
      </div>
    </motion.div>
  );
}
