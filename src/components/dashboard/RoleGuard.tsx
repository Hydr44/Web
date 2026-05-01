"use client";

import React from "react";
import Link from "next/link";
import { ShieldOff, Loader2 } from "lucide-react";
import { useUserRole, type OrgRole } from "@/lib/useUserRole";

interface RoleGuardProps {
  /** Lista di role autorizzati. Default: ["owner"] */
  allow?: OrgRole[];
  /** Cosa renderizzare se autorizzato */
  children: React.ReactNode;
  /** Personalizza il messaggio di blocco */
  blockedMessage?: string;
}

/**
 * Wrapper che blocca il rendering se l'utente non ha uno dei role richiesti.
 * Mostra una schermata "Accesso negato" elegante con link al dashboard.
 *
 * Esempio:
 *  <RoleGuard allow={["owner", "admin"]}>
 *    <BillingPage />
 *  </RoleGuard>
 */
export default function RoleGuard({ allow = ["owner"], children, blockedMessage }: RoleGuardProps) {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!role || !allow.includes(role)) {
    return (
      <div className="max-w-lg mx-auto py-16">
        <div className="bg-white border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 bg-red-50 flex items-center justify-center mx-auto mb-4">
            <ShieldOff className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Accesso non autorizzato</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            {blockedMessage || "Questa sezione è riservata al proprietario dell'organizzazione. Il tuo ruolo è "}
            <strong className="text-gray-700">{role || "non assegnato"}</strong>.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-5 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Torna alla Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
