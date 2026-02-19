"use client";

import { RefreshCw, AlertTriangle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50/50 to-white flex items-center justify-center px-4">
            <div className="max-w-lg mx-auto text-center">
                {/* Icona errore */}
                <div className="mb-8">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-red-500/10 to-orange-500/10 flex items-center justify-center">
                        <AlertTriangle className="h-12 w-12 text-red-500" />
                    </div>
                </div>

                {/* Titolo */}
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Qualcosa è andato storto
                </h2>

                {/* Descrizione */}
                <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                    Si è verificato un errore imprevisto. Puoi riprovare o tornare alla pagina precedente.
                </p>

                {/* Dettaglio errore (solo in dev) */}
                {process.env.NODE_ENV === "development" && error?.message && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-left">
                        <p className="text-sm font-mono text-red-700 break-words">{error.message}</p>
                        {error.digest && (
                            <p className="text-xs text-red-500 mt-1">Digest: {error.digest}</p>
                        )}
                    </div>
                )}

                {/* Azioni */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                        onClick={reset}
                        className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Riprova
                    </button>

                    <button
                        onClick={() => globalThis.location.href = "/"}
                        className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300"
                    >
                        Torna alla Home
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-8 text-sm text-gray-500">
                    Se il problema persiste,{" "}
                    <a href="mailto:info@rescuemanager.eu" className="text-blue-600 hover:underline font-medium">
                        contatta il supporto
                    </a>
                </div>
            </div>
        </div>
    );
}
