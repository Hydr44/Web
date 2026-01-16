"use client";

export default function OAuthTestPage() {
  console.log('[OAuthTest] Page loaded');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-800 mb-4">TEST PAGE</h1>
        <p className="text-red-600">Se vedi questa pagina, il routing funziona!</p>
        <p className="text-sm text-red-500 mt-2">URL: {typeof window !== 'undefined' ? window.location.href : 'server'}</p>
        <p className="text-sm text-red-500">Search: {typeof window !== 'undefined' ? window.location.search : 'server'}</p>
      </div>
    </div>
  );
}
