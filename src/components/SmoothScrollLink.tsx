"use client";
import { useRouter } from "next/navigation";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { motion } from "framer-motion";

interface SmoothScrollLinkProps {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly sectionId?: string;
  readonly offset?: number;
  readonly onClick?: () => void;
}

export function SmoothScrollLink({ 
  href, 
  children, 
  className = "", 
  sectionId,
  offset = 80,
  onClick 
}: SmoothScrollLinkProps) {
  const router = useRouter();
  const { scrollToSection } = useSmoothScroll();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (onClick) {
      onClick();
    }

    // Se è un link interno alla stessa pagina
    if (href.startsWith("#")) {
      const targetSection = href.substring(1);
      scrollToSection(targetSection, offset);
    } else if (sectionId) {
      // Se è specificato un sectionId
      scrollToSection(sectionId, offset);
    } else {
      // Navigazione normale
      router.push(href);
    }
  };

  return (
    <motion.a
      href={href}
      onClick={handleClick}
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.a>
  );
}
