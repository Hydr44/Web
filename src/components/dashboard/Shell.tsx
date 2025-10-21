// src/components/dashboard/Shell.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
  { label: "Download", href: "/dashboard/download", icon: Download },
  // Unica voce per la fatturazione → tutto il resto nel Billing Portal
  { label: "Piano & licenze", href: "/dashboard/billing/subscription", icon: Wallet },
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
}: Readonly<{
  href: string;
  children: React.ReactNode;
  active: boolean;
  icon?: React.ElementType;
  badge?: string;
}>) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
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
              : "bg-primary/10 text-primary"
          }`}>
            {badge}
          </span>
        )}
      </Link>
    </motion.div>
  );
}

function NavGroup({ item, activePath }: Readonly<{ item: Item; activePath: string }>) {
  const anyChildActive = useMemo(
    () => (item.children ?? []).some((c) => (c.href ? activePath.startsWith(c.href) : false)),
    [item.children, activePath]
  );
  const [open, setOpen] = useState<boolean>(anyChildActive);
  const Icon = item.icon;

  return (
    <div className="mb-2">
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
          anyChildActive 
            ? "bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary border border-primary/20" 
            : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900"
        }`}
        aria-expanded={open}
        aria-controls={`group-${item.label}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {Icon && (
          <Icon className={`h-5 w-5 transition-colors ${
            anyChildActive ? "text-primary" : "text-gray-500"
          }`} />
        )}
        <span className="flex-1 text-left">{item.label}</span>
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="h-4 w-4" />
        </motion.div>
      </motion.button>

      <motion.div
        id={`group-${item.label}`}
        initial={false}
        animate={{ 
          height: open ? "auto" : 0,
          opacity: open ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="mt-2 ml-4 space-y-1">
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
      </motion.div>
    </div>
  );
}

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
        <motion.aside 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] p-6 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 shadow-xl"
        >
          <nav aria-label="Menu dashboard" className="h-full flex flex-col">
            {/* User block */}
            {userEmail && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-blue-500/5 border border-primary/20"
              >
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
              </motion.div>
            )}

            <div className="text-xs uppercase tracking-wide text-gray-500 px-2 pb-3 font-semibold">
              Menu Principale
            </div>

            <div className="flex-1 space-y-1">
              {NAV.map((item, index) => {
                if (item.children?.length) {
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      <NavGroup item={item} activePath={path} />
                    </motion.div>
                  );
                }
                const active = item.href ? path.startsWith(item.href) : false;
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                  >
                    <NavLink
                      href={item.href!}
                      active={active}
                      icon={Icon}
                      badge={item.badge}
                    >
                      {item.label}
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>

            <motion.form 
              action="/logout" 
              method="POST" 
              className="mt-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <motion.button 
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <LogOut className="h-5 w-5" /> 
                Esci dall&apos;account
              </motion.button>
            </motion.form>
          </nav>
        </motion.aside>

        {/* Content */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-6 lg:p-8"
        >
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </motion.section>
      </div>
    </div>
  );
}