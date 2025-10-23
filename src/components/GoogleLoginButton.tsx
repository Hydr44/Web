"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { motion } from "framer-motion";
import { Chrome } from "lucide-react";

interface GoogleLoginButtonProps {
  readonly onSuccess?: () => void;
  readonly onError?: (error: string) => void;
  readonly className?: string;
}

export default function GoogleLoginButton({ 
  onSuccess, 
  onError, 
  className = "" 
}: GoogleLoginButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    
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
        console.error('Google login error:', error);
        onError?.(error.message || 'Errore durante il login con Google');
        return;
      }

      // Il redirect avviene automaticamente
      onSuccess?.();
      
    } catch (error) {
      console.error('Unexpected error during Google login:', error);
      onError?.('Errore imprevisto durante il login con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className={`
        w-full py-3 px-6 rounded-xl border-2 border-gray-200 
        bg-white text-gray-700 font-semibold 
        hover:bg-gray-50 hover:border-gray-300 
        transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center gap-3
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Accesso in corso...</span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Chrome className="h-5 w-5 text-blue-500" />
          <span>Continua con Google</span>
        </div>
      )}
    </motion.button>
  );
}
