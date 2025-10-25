"use client";

import { useState } from "react";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function Avatar({ src, alt = "Avatar", size = "md", className = "" }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5", 
    lg: "h-6 w-6",
    xl: "h-8 w-8"
  };

  // Se non c'è src o c'è stato un errore, mostra icona
  if (!src || imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center ${className}`}>
        <User className={`${iconSizes[size]} text-gray-400`} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  );
}
