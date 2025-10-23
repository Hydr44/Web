"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "white" | "gray";
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = "md", 
  color = "primary", 
  text,
  className = "" 
}: LoadingSpinnerProps) {
  const prefersReducedMotion = useReducedMotion();

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  const colorClasses = {
    primary: "border-primary border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-400 border-t-transparent"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  const reducedMotionVariants = {
    animate: {
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-2 ${colorClasses[color]} rounded-full`}
        variants={prefersReducedMotion ? reducedMotionVariants : spinnerVariants}
        animate="animate"
      />
      {text && (
        <span className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {text}
        </span>
      )}
    </div>
  );
}
