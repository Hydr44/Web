export default function StaffPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="h-8 w-8 text-blue-600">🏢</div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Staff Panel
          </h1>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Benvenuto nel pannello di controllo staff di RescueManager. 
            Seleziona una delle opzioni qui sotto per iniziare.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <a 
              href="/staff/simple"
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <div className="h-6 w-6 text-blue-600">✓</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Semplice</h3>
              <p className="text-gray-600 text-sm">
                Pagina di test senza autenticazione per verificare il subdomain.
              </p>
            </a>
            
            <a 
              href="/staff/debug"
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <div className="h-6 w-6 text-green-600">🔍</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Debug</h3>
              <p className="text-gray-600 text-sm">
                Pagina di debug minimale per test rapidi.
              </p>
            </a>
            
            <a 
              href="/staff/test"
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <div className="h-6 w-6 text-purple-600">🧪</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Test</h3>
              <p className="text-gray-600 text-sm">
                Pagina di test per verificare il funzionamento.
              </p>
            </a>
            
            <a 
              href="/staff/login"
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <div className="h-6 w-6 text-yellow-600">🔐</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Login</h3>
              <p className="text-gray-600 text-sm">
                Accedi al pannello staff con le tue credenziali.
              </p>
            </a>
            
            <a 
              href="/staff/marketing"
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <div className="h-6 w-6 text-pink-600">📊</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Marketing</h3>
              <p className="text-gray-600 text-sm">
                Gestisci i lead e le richieste demo/preventivo.
              </p>
            </a>
            
            <a 
              href="/staff/admin"
              className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <div className="h-6 w-6 text-red-600">⚙️</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin</h3>
              <p className="text-gray-600 text-sm">
                Pannello di amministrazione completo.
              </p>
            </a>
          </div>
          
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🎉 Subdomain Staff Funzionante!
            </h3>
            <p className="text-blue-700 text-sm">
              Il subdomain <code className="bg-blue-100 px-2 py-1 rounded">staff.rescuemanager.eu</code> è configurato correttamente 
              e isolato dal sito principale. Puoi navigare tra le diverse sezioni senza problemi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}