// src/components/HeaderGate.tsx
"use client";
import { usePathname } from "next/navigation";
import * as React from "react";

/** Nasconde i children nelle route della dashboard */
export default function HeaderGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hide =
    pathname?.startsWith("/dashboard") ||
    pathname === "/dashboard"; // sicurezza

  if (hide) return null;
  return <>{children}</>;
}
