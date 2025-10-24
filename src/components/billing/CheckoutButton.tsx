"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface CheckoutButtonProps {
  priceId: string;
  currentPlan: string;
  planName: string;
  isActive: boolean;
  className?: string;
}

export default function CheckoutButton({ 
  priceId, 
  currentPlan, 
  planName, 
  isActive, 
  className = "" 
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (isActive || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Usa la nuova API checkout unificata
      const checkoutUrl = `/api/checkout?price=${encodeURIComponent(priceId)}&return=${encodeURIComponent("/dashboard/billing")}`;
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      setIsLoading(false);
    }
  };

  if (isActive) {
    return (
      <button
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 bg-green-600 text-white ${className}`}
        disabled
      >
        <CheckCircle2 className="h-4 w-4" />
        Piano Attivo
      </button>
    );
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
        isLoading
          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
          : "bg-gray-900 text-white hover:bg-gray-800"
      } ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowRight className="h-4 w-4" />
      )}
      {isLoading ? "Caricamento..." : `Scegli ${planName}`}
    </button>
  );
}
