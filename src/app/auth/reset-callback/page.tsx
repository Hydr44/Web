"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ResetCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleResetCallback = async () => {
      console.log("[RESET-CALLBACK] Inizio processamento...");
      
      try {
        const supabase = supabaseBrowser();
        
        console.log("[RESET-CALLBACK] Controllo sessione...");
        
        // Supabase gestisce automaticamente l'hash fragment (#access_token=...)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        console.log("[RESET-CALLBACK] Sessione:", session ? "TROVATA" : "NON TROVATA");
        console.log("[RESET-CALLBACK] Errore:", sessionError);

        if (sessionError) {
          console.error("[RESET-CALLBACK] Error getting session:", sessionError);
          setError("Link non valido o scaduto. Richiedi un nuovo link di reset.");
          
          // Redirect al reset dopo 3 secondi
          setTimeout(() => {
            router.push("/reset?error=invalid_link");
          }, 3000);
          return;
        }

        if (!session) {
          console.log("[RESET-CALLBACK] Nessuna sessione, provo a fare redirect diretto...");
          
          // Forse la sessione non è ancora pronta, prova redirect diretto
          setTimeout(() => {
            console.log("[RESET-CALLBACK] Redirect a /update-password");
            router.push("/update-password");
          }, 1000);
          return;
        }

        // Sessione valida
        console.log("[RESET-CALLBACK] Sessione valida! User:", session.user.email);
        
        // Pulisci hash e redirect
        if (typeof window !== "undefined") {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Redirect a update-password
        console.log("[RESET-CALLBACK] Redirect a /update-password");
        router.push("/update-password");

      } catch (err) {
        console.error("[RESET-CALLBACK] Errore durante callback:", err);
        setError("Si è verificato un errore. Riprova.");
        
        setTimeout(() => {
          router.push("/reset");
        }, 3000);
      }
    };

    handleResetCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Link Non Valido
          </h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <p className="text-sm text-gray-500">
            Reindirizzamento in corso...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Verifica link in corso...
        </h2>
        <p className="text-gray-600 text-sm">
          Attendi qualche secondo
        </p>
      </div>
    </div>
  );
}

