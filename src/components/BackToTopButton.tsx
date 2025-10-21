"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { SmoothScrollLink } from "@/components/SmoothScrollLink";

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <SmoothScrollLink
            href="#hero"
            className="group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <ArrowUp className="h-6 w-6 group-hover:-translate-y-0.5 transition-transform" />
          </SmoothScrollLink>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
