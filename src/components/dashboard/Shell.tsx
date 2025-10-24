// src/components/dashboard/Shell.tsx
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
} from "lucide-react";
import { useMemo } from "react";
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
  {
    label: "Organizzazione",
    icon: Building2,
    children: [
      { label: "Team & Ruoli", href: "/dashboard/team" },
      { label: "Azienda", href: "/dashboard/org" },
    ],
  },
  { label: "Piani & Licenze", href: "/dashboard/billing", icon: Wallet },
  { label: "Download", href: "/dashboard/download", icon: Download },
  {
    label: "Impostazioni",
    icon: Settings,
    children: [
      { label: "Generali", href: "/dashboard/settings" },
      { label: "Notifiche", href: "/dashboard/settings/notifications" },
    ],
  },
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
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
          active 
            ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25" 
            : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900"
        }`}
        aria-current={active ? "page" : undefined}
      >
        {Icon && (
          <Icon className={`h-5 w-5 transition-colors ${
            active ? "text-white" : "text-gray-500 group-hover:text-gray-700"
          }`} />
        )}
        <span className="flex-1">{children}</span>
        {badge && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            active 
              ? "bg-white/20 text-white" 
              : "bg-blue-100 text-blue-800"
          }`}>
            {badge}
          </span>
        )}
        <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
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
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
          open 
            ? "text-gray-900 bg-gray-100" 
            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        {Icon && (
          <Icon className={`h-5 w-5 transition-colors ${
            open ? "text-gray-700" : "text-gray-500 group-hover:text-gray-700"
          }`} />
        )}
        <span className="flex-1 text-left">{item.label}</span>
        <div className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>

      <div className={`ml-6 mt-2 space-y-1 border-l border-gray-200 pl-3 ${open ? "block" : "hidden"}`}>
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
}: Readonly<{
  children: React.ReactNode;
  userEmail?: string;
}>) {
  const path = usePathname();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50/50 to-white">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] p-6 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 shadow-xl">
          <nav aria-label="Menu dashboard" className="h-full flex flex-col">
            {/* User block */}
            {userEmail && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-blue-500/5 border border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
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

            <div className="flex-1 space-y-1">
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
                try {
                  // Logout da Supabase
                  const { createClient } = await import('@supabase/supabase-js');
                  const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                  );
                  
                  await supabase.auth.signOut();
                  
                  // Pulisci dati locali
                  localStorage.clear();
                  sessionStorage.clear();
                  
                  // Redirect
                  window.location.href = "/";
                } catch (err) {
                  console.error("Logout error:", err);
                  window.location.href = "/";
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
            >
              <LogOut className="h-5 w-5" /> 
              Esci dall&apos;account
            </button>
          </nav>
        </aside>

        {/* Content */}
        <section className="p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}