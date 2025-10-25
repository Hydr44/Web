"use client";

interface SimpleLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
}

export default function SimpleLoader({ 
  size = "md", 
  text = "Caricamento...",
  className = ""
}: SimpleLoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Dots animation */}
      <div className="flex space-x-1">
        <div 
          className="bg-blue-600 rounded-full animate-bounce"
          style={{
            width: '8px',
            height: '8px',
            animationDelay: '0ms',
            animationDuration: '1s'
          }}
        />
        <div 
          className="bg-blue-600 rounded-full animate-bounce"
          style={{
            width: '8px',
            height: '8px',
            animationDelay: '150ms',
            animationDuration: '1s'
          }}
        />
        <div 
          className="bg-blue-600 rounded-full animate-bounce"
          style={{
            width: '8px',
            height: '8px',
            animationDelay: '300ms',
            animationDuration: '1s'
          }}
        />
      </div>
      {text && (
        <p className="mt-3 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
}

export function SimpleLoadingPage({ text = "Caricamento..." }: { text?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <SimpleLoader size="lg" text={text} />
    </div>
  );
}
