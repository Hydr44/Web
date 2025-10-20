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
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useMemo, useState } from "react";
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
  { label: "Download", href: "/download", icon: Download },
  // Unica voce per la fatturazione → tutto il resto nel Billing Portal
  { label: "Piano & licenze", href: "/dashboard/billing", icon: Wallet },
  {
    label: "Organizzazione",
    icon: Building2,
    children: [
      { label: "Team & ruoli", href: "/dashboard/team", icon: Users },
      { label: "Azienda", href: "/dashboard/org" },
      // (Categorie in pausa)
    ],
  },
  { label: "Impostazioni", href: "/dashboard/settings", icon: Settings },
  { label: "Supporto", href: "/dashboard/support", icon: LifeBuoy },
];

function NavLink({
  href,
  children,
  active,
  icon: Icon,
  badge,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
  icon?: React.ElementType;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
        active ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {Icon && <Icon className="h-4 w-4 text-gray-500" />}
      <span className="flex-1">{children}</span>
      {badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-900 text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function NavGroup({ item, activePath }: { item: Item; activePath: string }) {
  const anyChildActive = useMemo(
    () => (item.children ?? []).some((c) => (c.href ? activePath.startsWith(c.href) : false)),
    [item.children, activePath]
  );
  const [open, setOpen] = useState<boolean>(anyChildActive);
  const Icon = item.icon;

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          anyChildActive ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
        }`}
        aria-expanded={open}
        aria-controls={`group-${item.label}`}
      >
        {Icon && <Icon className="h-4 w-4 text-gray-500" />}
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {open && (
        <div id={`group-${item.label}`} className="mt-1 pl-6 space-y-1">
          {(item.children ?? []).map((child) => {
            const active = child.href ? activePath.startsWith(child.href) : false;
            return (
              <NavLink
                key={child.label}
                href={child.href!}
                active={active}
                icon={child.icon}
                badge={child.badge}
              >
                {child.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string;
}) {
  const path = usePathname();

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="grid grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside
          className="border-r bg-white md:sticky md:top-16 md:h-[calc(100vh-64px)] p-3 flex flex-col"
          role="navigation"
          aria-label="Menu dashboard"
        >
          {/* User block */}
          {userEmail && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-gray-50 border text-xs">
              <div className="font-medium text-gray-800 truncate">{userEmail}</div>
              <div className="text-[11px] text-gray-500">Utente autenticato</div>
            </div>
          )}

          <div className="text-[10px] uppercase tracking-wide text-gray-500 px-2 pb-2">Menu</div>

          <div className="flex-1">
            {NAV.map((item) => {
              if (item.children?.length) {
                return <NavGroup key={item.label} item={item} activePath={path} />;
              }
              const active = item.href ? path.startsWith(item.href) : false;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  href={item.href!}
                  active={active}
                  icon={Icon}
                  badge={item.badge}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          <form action="/logout" method="POST" className="mt-4 px-2">
            <button className="inline-flex items-center gap-2 text-sm text-red-600 hover:underline">
              <LogOut className="h-4 w-4" /> Esci
            </button>
          </form>
        </aside>

        {/* Content */}
        <section className="p-4 md:p-8">{children}</section>
      </div>
    </div>
  );
}