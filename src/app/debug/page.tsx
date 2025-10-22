"use client";

import { useState } from "react";

export default function DebugPage() {
  const [message, setMessage] = useState("");

  const clearAuth = () => {
    localStorage.removeItem("rescuemanager-auth");
    localStorage.removeItem("sb-" + process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] + "-auth-token");
    setMessage("Auth data cleared! Refresh the page.");
  };

  const checkAuth = () => {
    const auth = localStorage.getItem("rescuemanager-auth");
    const supabaseAuth = localStorage.getItem("sb-" + process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] + "-auth-token");
    
    setMessage(`Bypass Auth: ${auth ? "EXISTS" : "NOT FOUND"}\nSupabase Auth: ${supabaseAuth ? "EXISTS" : "NOT FOUND"}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Debug Auth</h1>
        
        <div className="space-y-4">
          <button
            onClick={clearAuth}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Clear All Auth Data
          </button>
          
          <button
            onClick={checkAuth}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Check Auth Status
          </button>
        </div>
        
        {message && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre className="text-sm">{message}</pre>
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Click "Clear All Auth Data"</li>
            <li>Refresh the page</li>
            <li>Go to /login</li>
            <li>Login normally</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
