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
  Shield,
  Database,
  User,
  Bell,
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
      { label: "Dashboard", href: "/dashboard/org" },
      { label: "Membri", href: "/dashboard/org/members" },
      { label: "Analytics", href: "/dashboard/org/analytics" },
      { label: "Impostazioni", href: "/dashboard/org/settings" },
    ],
  },
  { label: "Pagamenti", href: "/dashboard/billing", icon: Wallet },
  { label: "Sicurezza", href: "/dashboard/security", icon: Shield },
  { label: "Privacy", href: "/dashboard/privacy", icon: Database },
  { label: "Profilo", href: "/dashboard/profile", icon: User },
  { label: "Notifiche", href: "/dashboard/notifications", icon: Bell },
  { label: "Download", href: "/dashboard/download", icon: Download },
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
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          active 
            ? "bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-500/20" 
            : "text-slate-400 hover:bg-[#1a2536] hover:text-slate-200"
        }`}
        aria-current={active ? "page" : undefined}
      >
        {Icon && (
          <Icon className={`h-5 w-5 transition-colors ${
            active ? "text-white" : "text-slate-500 group-hover:text-slate-300"
          }`} />
        )}
        <span className="flex-1">{children}</span>
        {badge && (
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            active 
              ? "bg-white/20 text-white" 
              : "bg-blue-500/20 text-blue-400"
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
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          open 
            ? "text-slate-200 bg-[#1a2536]" 
            : "text-slate-400 hover:bg-[#1a2536] hover:text-slate-200"
        }`}
      >
        {Icon && (
          <Icon className={`h-5 w-5 transition-colors ${
            open ? "text-slate-300" : "text-slate-500"
          }`} />
        )}
        <span className="flex-1 text-left">{item.label}</span>
        <div className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>

      <div className={`ml-6 mt-2 space-y-1 border-l border-[#243044] pl-3 ${open ? "block" : "hidden"}`}>
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
    <div className="min-h-screen bg-[#141c27] pt-20">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] p-4 bg-[#0c1929] border-r border-[#243044]">
          <nav aria-label="Menu dashboard" className="h-full flex flex-col">
            {/* User block */}
            {userEmail && (
              <div className="mb-4 p-3 rounded-xl bg-[#1a2536] border border-[#243044]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-blue-500 to-emerald-400 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-200 text-sm truncate">{userEmail}</div>
                    <div className="text-xs text-slate-500">Account attivo</div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs uppercase tracking-wider text-slate-500 px-3 pb-3 font-semibold">
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

            {/* Logout rimosso - usa solo quello dell'header */}
            <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-[#1a2536]/50">
              <LogOut className="h-4 w-4" /> 
              Esci dal menu in alto
            </div>
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