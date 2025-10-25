"use client";

import { useState } from "react";
import LoadingSpinner, { LoadingPage, LoadingCard } from "@/components/ui/LoadingSpinner";
import SimpleLoader, { SimpleLoadingPage } from "@/components/ui/SimpleLoader";

export default function TestLoadingPage() {
  const [showSpinner, setShowSpinner] = useState(false);
  const [showSimple, setShowSimple] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Loading Components</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Test Spinner */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Loading Spinner</h2>
            <div className="space-y-4">
              <button
                onClick={() => setShowSpinner(!showSpinner)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {showSpinner ? 'Nascondi' : 'Mostra'} Spinner
              </button>
              
              {showSpinner && (
                <div className="space-y-4">
                  <LoadingSpinner size="sm" text="Small" />
                  <LoadingSpinner size="md" text="Medium" />
                  <LoadingSpinner size="lg" text="Large" />
                  <LoadingSpinner size="xl" text="Extra Large" />
                </div>
              )}
            </div>
          </div>

          {/* Test Simple Loader */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Simple Loader</h2>
            <div className="space-y-4">
              <button
                onClick={() => setShowSimple(!showSimple)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {showSimple ? 'Nascondi' : 'Mostra'} Simple Loader
              </button>
              
              {showSimple && (
                <div className="space-y-4">
                  <SimpleLoader size="sm" text="Small" />
                  <SimpleLoader size="md" text="Medium" />
                  <SimpleLoader size="lg" text="Large" />
                  <SimpleLoader size="xl" text="Extra Large" />
                </div>
              )}
            </div>
          </div>

          {/* Test Loading Cards */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Loading Cards</h2>
            <div className="space-y-4">
              <LoadingCard text="Caricamento dati..." />
              <LoadingCard text="Elaborazione..." />
            </div>
          </div>

          {/* Test Full Page */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Full Page Loading</h2>
            <div className="space-y-4">
              <button
                onClick={() => {
                  // Simula loading per 3 secondi
                  const overlay = document.createElement('div');
                  overlay.className = 'fixed inset-0 bg-gray-50 flex items-center justify-center z-50';
                  overlay.innerHTML = `
                    <div class="text-center">
                      <div class="animate-spin rounded-full h-16 w-16 border-2 border-blue-200 border-t-blue-600 mx-auto"></div>
                      <p class="mt-4 text-gray-600">Test Loading...</p>
                    </div>
                  `;
                  document.body.appendChild(overlay);
                  
                  setTimeout(() => {
                    document.body.removeChild(overlay);
                  }, 3000);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Test Full Page Loading
              </button>
            </div>
          </div>
        </div>

        {/* CSS Animation Test */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">CSS Animation Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Tailwind animate-spin</p>
            </div>
            <div className="text-center">
              <div 
                className="rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600 mx-auto mb-2"
                style={{ animation: 'spin 1s linear infinite' }}
              ></div>
              <p className="text-sm text-gray-600">Inline style animation</p>
            </div>
            <div className="text-center">
              <div className="animate-bounce bg-blue-600 rounded-full h-8 w-8 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Tailwind animate-bounce</p>
            </div>
            <div className="text-center">
              <div className="animate-pulse bg-blue-600 rounded-full h-8 w-8 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Tailwind animate-pulse</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
