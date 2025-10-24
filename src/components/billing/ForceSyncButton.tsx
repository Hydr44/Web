"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForceSyncButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleForceSync = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Prima testa l'API di debug semplice
      console.log("🔧 Testing simple debug API...");
      const debugResponse = await fetch("/api/billing/debug-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log("🔍 Debug data:", debugData);
        
        if (debugData.ok) {
          setResult({ 
            success: true, 
            message: `Debug OK - Environment: ${JSON.stringify(debugData.debug.environment)}` 
          });
          return;
        }
      } else {
        const errorData = await debugResponse.json();
        setResult({ 
          success: false, 
          message: `Debug failed: ${errorData.error}` 
        });
        return;
      }

      // Se il debug funziona, prova il test sync diretto
      console.log("🧪 Testing sync API...");
      const testResponse = await fetch("/api/billing/test-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (testResponse.ok) {
        const testData = await testResponse.json();
        if (testData.ok) {
          setResult({ 
            success: true, 
            message: `Test sync completato! Piano: ${testData.plan}` 
          });
          setTimeout(() => {
            globalThis.location.reload();
          }, 2000);
          return;
        }
      }

      // Se il test fallisce, prova il sync completo
      const response = await fetch("/api/billing/force-sync-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.ok) {
        setResult({ 
          success: true, 
          message: `Abbonamento sincronizzato! Piano: ${data.plan}` 
        });
        // Ricarica la pagina dopo 2 secondi per mostrare i cambiamenti
        setTimeout(() => {
          globalThis.location.reload();
        }, 2000);
      } else {
        setResult({ 
          success: false, 
          message: data.error || "Errore durante la sincronizzazione" 
        });
      }
    } catch (error) {
      console.error("Force sync error:", error);
      setResult({ 
        success: false, 
        message: "Errore di connessione" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleForceSync}
        disabled={isLoading}
        className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
          isLoading
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : "bg-gray-900 text-white hover:bg-gray-800"
        }`}
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {isLoading ? "Sincronizzazione..." : "Sincronizza"}
      </button>

      {result && (
        <div className={`absolute top-full left-0 mt-2 p-3 rounded-xl border text-sm whitespace-nowrap z-10 ${
          result.success
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {result.message}
          </div>
        </div>
      )}
    </div>
  );
}
