export default function StaffDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Staff Debug Page
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">✅ Subdomain Funziona</h3>
            <p className="text-green-700 text-sm">
              Il subdomain staff.rescuemanager.eu è configurato correttamente.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">🔧 Layout Isolato</h3>
            <p className="text-blue-700 text-sm">
              Questa pagina non dovrebbe caricare header/footer del sito principale.
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Controlla Console</h3>
            <p className="text-yellow-700 text-sm">
              Apri F12 → Console per verificare che non ci siano errori 404.
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex gap-4">
            <a 
              href="/staff/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
            >
              Vai al Login
            </a>
            <a 
              href="/staff/test"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium"
            >
              Pagina Test
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
