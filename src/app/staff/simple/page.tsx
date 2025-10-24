export default function SimpleStaffPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Staff Panel - Test Semplice
        </h1>
        <p className="text-gray-600 mb-8">
          Questa pagina non richiede autenticazione per testare il subdomain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <div className="h-5 w-5 text-green-600">✓</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Subdomain OK</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Il subdomain staff.rescuemanager.eu funziona correttamente.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <div className="h-5 w-5 text-blue-600">✓</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Layout Isolato</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Layout staff completamente isolato dal sito principale.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <div className="h-5 w-5 text-purple-600">✓</div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Nessun Errore 404</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Nessun caricamento di risorse inesistenti.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Completato</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Subdomain configurato correttamente</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Layout staff isolato</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Nessun errore 404</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Middleware funzionante</span>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex gap-4">
            <a 
              href="/staff/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            >
              Vai al Login
            </a>
            <a 
              href="/staff/debug"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
            >
              Pagina Debug
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
