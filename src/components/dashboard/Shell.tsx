// src/components/dashboard/Shell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Download,
  Wallet,
  Building2,
  LifeBuoy,
  ChevronRight,
  LogOut,
  Shield,
  Database,
  User,
  Bell,
} from "lucide-react";
import * as React from "react";

type Item = {
  label: string;
  href?: string;
  icon?: React.ElementType;
  children?: Item[];
  badge?: string;
};

const NAV: Item[] = [
  { label: "Panoramica", href: "/dashboard", icon: LayoutGrid },
  { label: "Organizzazione", href: "/dashboard/org", icon: Building2 },
  { label: "Pagamenti", href: "/dashboard/billing", icon: Wallet },
  { label: "Sicurezza", href: "/dashboard/security", icon: Shield },
  { label: "Privacy", href: "/dashboard/privacy", icon: Database },
  { label: "Supporto", href: "/dashboard/support", icon: LifeBuoy },
];

const NavLink: React.FC<{
  href: string;
  children: React.ReactNode;
  active: boolean;
  icon?: React.ElementType;
  badge?: string;
}> = ({ href, children, active, icon: Icon, badge }) => {
  return (
    <div>
      <Link
        href={href}
        className={`group flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? "bg-[#0f172a] text-white"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
        aria-current={active ? "page" : undefined}
      >
        {Icon && (
          <Icon className={`h-4 w-4 ${
            active ? "text-white" : "text-gray-400 group-hover:text-gray-600"
          }`} />
        )}
        <span className="flex-1">{children}</span>
        {badge && (
          <span className={`text-xs px-1.5 py-0.5 font-bold ${
            active
              ? "bg-white/20 text-white"
              : "bg-blue-50 text-blue-600"
          }`}>
            {badge}
          </span>
        )}
      </Link>
    </div>
  );
};

const NavGroup: React.FC<{ item: Item; activePath: string }> = ({ item, activePath }) => {
  const [open, setOpen] = React.useState(
    item.children?.some(child => child.href && activePath.startsWith(child.href)) ?? false
  );
  const Icon = item.icon;

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
          open
            ? "text-gray-900 bg-gray-50"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        {Icon && (
          <Icon className={`h-4 w-4 ${open ? "text-gray-700" : "text-gray-400"}`} />
        )}
        <span className="flex-1 text-left">{item.label}</span>
        <div className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          <ChevronRight className="h-3 w-3 text-gray-400" />
        </div>
      </button>

      <div className={`ml-6 mt-1 space-y-0.5 border-l border-gray-200 pl-3 ${open ? "block" : "hidden"}`}>
        {item.children?.map((child) => {
          const active = child.href ? activePath.startsWith(child.href) : false;
          return (
            <NavLink
              key={child.label}
              href={child.href || "#"}
              active={active}
              icon={child.icon}
              badge={child.badge}
            >
              {child.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default function DashboardShell({
  children,
  userEmail,
  orgName,
}: Readonly<{
  children: React.ReactNode;
  userEmail?: string;
  orgName?: string;
}>) {
  const path = usePathname();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [frozenOrgName, setFrozenOrgName] = React.useState(orgName);
  const [frozenUserEmail, setFrozenUserEmail] = React.useState(userEmail);

  // Aggiorna i dati congelati quando cambiano (se non in logout)
  React.useEffect(() => {
    if (!isLoggingOut) {
      setFrozenOrgName(orgName);
      setFrozenUserEmail(userEmail);
    }
  }, [orgName, userEmail, isLoggingOut]);

  return (
    <div className="min-h-screen bg-gray-50 pt-28">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-28 lg:h-[calc(100vh-112px)] p-4 bg-white border-r border-gray-200">
          <nav aria-label="Menu dashboard" className="h-full flex flex-col">
            {frozenUserEmail && (
              <div className="mb-4 p-3 border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0f172a] flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-sm truncate" title={frozenOrgName || frozenUserEmail}>{frozenOrgName || frozenUserEmail}</div>
                    <div className="text-xs text-gray-400 truncate" title={frozenUserEmail}>{frozenUserEmail}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs uppercase tracking-widest text-gray-400 px-3 pb-2 font-bold">
              Menu
            </div>

            <div className="flex-1 space-y-0.5">
              {NAV.map((item) => {
                if (item.children?.length) {
                  return (
                    <div key={item.label}>
                      <NavGroup item={item} activePath={path} />
                    </div>
                  );
                }
                const active = item.href ? path.startsWith(item.href) : false;
                const Icon = item.icon;
                return (
                  <div key={item.label}>
                    <NavLink
                      href={item.href || "#"}
                      active={active}
                      icon={Icon}
                      badge={item.badge}
                    >
                      {item.label}
                    </NavLink>
                  </div>
                );
              })}
            </div>

            <button
              onClick={async () => {
                if (isLoggingOut) return;
                setIsLoggingOut(true);
                try {
                  const { authManager } = await import("@/lib/auth");
                  await authManager.logout();
                } catch (err) {
                  globalThis.location.href = "/";
                } finally {
                  // Reset dopo timeout per congelamento dati
                  setTimeout(() => setIsLoggingOut(false), 1500);
                }
              }}
              disabled={isLoggingOut}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                isLoggingOut 
                  ? "text-gray-400 cursor-not-allowed" 
                  : "text-red-500 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              {isLoggingOut ? (
                <>
                  <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="truncate">Disconnessione...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 shrink-0" />
                  Esci dall'account
                </>
              )}
            </button>
          </nav>
        </aside>

        {/* Content */}
        <section className="p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}