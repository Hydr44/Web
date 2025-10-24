"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Download,
  Wallet,
  Building2,
  Users,
  Settings,
  LifeBuoy,
  ChevronRight,
  LogOut,
  Zap,
  Shield,
} from "lucide-react";
import { useState } from "react";

type Item = {
  label: string;
  href?: string;
  icon?: React.ElementType;
  children?: Item[];
  badge?: string;
};

const NAV: Item[] = [
  { label: "Panoramica", href: "/dashboard", icon: LayoutGrid },
  { label: "Download", href: "/dashboard/download", icon: Download },
  { label: "Piano & licenze", href: "/dashboard/billing", icon: Wallet },
  { label: "Team & ruoli", href: "/dashboard/team", icon: Users },
  { label: "Impostazioni", href: "/dashboard/settings", icon: Settings },
  { label: "Supporto", href: "/dashboard/support", icon: LifeBuoy },
];

export default function SimpleDashboardShell({
  children,
  userEmail,
}: Readonly<{
  children: React.ReactNode;
  userEmail?: string;
}>) {
  const path = usePathname();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50/50 to-white">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
        {/* Sidebar Semplificata */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* User block */}
          {userEmail && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-blue-500/5 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-sm truncate">{userEmail}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Utente autenticato
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs uppercase tracking-wide text-gray-500 px-2 pb-3 font-semibold">
            Menu Principale
          </div>

          <div className="space-y-1">
            {NAV.map((item) => {
              const active = item.href ? path.startsWith(item.href) : false;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href || "#"}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all duration-200 group w-full"
              onClick={async () => {
                console.log("SimpleShell logout clicked");
                try {
                  const { performLogout } = await import('@/lib/logout');
                  await performLogout({
                    redirectTo: "/",
                    clearAll: true,
                    forceGoogleLogout: false
                  });
                } catch (err) {
                  console.error("SimpleShell logout error:", err);
                  globalThis.location.href = "/";
                }
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Esci dall&apos;account</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="min-h-[calc(100vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
