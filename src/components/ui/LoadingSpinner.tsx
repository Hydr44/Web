"use client";

import { useEffect, useState } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = "md", 
  className = "",
  text = "Caricamento..."
}: LoadingSpinnerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay per evitare flash
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        {/* Spinner principale */}
        <div 
          className={`${sizeClasses[size]} border-2 border-gray-200 rounded-full`}
          style={{
            borderTopColor: '#3b82f6',
            animation: 'spin 1s linear infinite',
            transformOrigin: 'center'
          }}
        />
        {/* Spinner secondario per effetto */}
        <div 
          className={`${sizeClasses[size]} border-2 border-transparent border-t-blue-300 rounded-full absolute top-0 left-0`}
          style={{
            animation: 'spin 1.5s linear infinite reverse',
            transformOrigin: 'center'
          }}
        />
      </div>
      {text && (
        <p className="mt-3 text-sm text-gray-600 animate-pulse">{text}</p>
      )}
      
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export function LoadingPage({ text = "Caricamento..." }: { text?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

export function LoadingCard({ text = "Caricamento..." }: { text?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function LoadingButton({ text = "Caricamento..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center px-4 py-2">
      <LoadingSpinner size="sm" text={text} />
    </div>
  );
}