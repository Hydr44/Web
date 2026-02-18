"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Building2,
  BarChart3,
  Mail,
  Settings,
  Shield,
  UserPlus,
  Activity,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
  Bell,
  Database,
  Monitor,
  Download,
  Power
} from "lucide-react";
import Link from "next/link";

interface AdminCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  delay: number;
}

const AdminCard = ({ title, description, icon, href, delay }: AdminCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
  >
    <Link href={href} className="block p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-blue-600">{icon}</div>
        <span className="text-sm font-medium text-gray-500">Vai</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </Link>
  </motion.div>
);

export default function StaffAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Pannello Amministratore</h1>
        <p className="text-lg text-gray-600 mb-10">
          Gestisci tutti gli aspetti della piattaforma: utenti, staff, organizzazioni, lead e analytics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AdminCard
            title="Dashboard"
            description="Panoramica generale e statistiche chiave della piattaforma."
            icon={<BarChart3 className="h-8 w-8" />}
            href="/staff/admin/dashboard"
            delay={0.1}
          />
          <AdminCard
            title="Gestione Staff"
            description="Crea, modifica ed elimina gli account del personale interno."
            icon={<Users className="h-8 w-8" />}
            href="/staff/admin/staff"
            delay={0.2}
          />
          <AdminCard
            title="Gestione Utenti App"
            description="Visualizza e gestisci tutti gli utenti registrati all'applicazione."
            icon={<UserPlus className="h-8 w-8" />}
            href="/staff/admin/users"
            delay={0.3}
          />
          <AdminCard
            title="Gestione Organizzazioni"
            description="Amministra le organizzazioni, i loro membri e le impostazioni."
            icon={<Building2 className="h-8 w-8" />}
            href="/staff/admin/organizations"
            delay={0.4}
          />
          <AdminCard
            title="Lead Management"
            description="Gestisci i lead generati da demo e richieste di preventivo."
            icon={<Mail className="h-8 w-8" />}
            href="/staff/marketing"
            delay={0.5}
          />
          <AdminCard
            title="Analytics & Reporting"
            description="Accedi a report dettagliati e analisi delle performance."
            icon={<TrendingUp className="h-8 w-8" />}
            href="/staff/admin/analytics"
            delay={0.6}
          />
          <AdminCard
            title="Impostazioni Globali"
            description="Configura le impostazioni generali dell'applicazione."
            icon={<Settings className="h-8 w-8" />}
            href="/staff/admin/settings"
            delay={0.7}
          />
          <AdminCard
            title="Audit Log"
            description="Visualizza la cronologia delle attività e delle modifiche del sistema."
            icon={<FileText className="h-8 w-8" />}
            href="/staff/admin/audit"
            delay={0.8}
          />
          <AdminCard
            title="Notifiche"
            description="Gestisci le notifiche e gli alert del sistema."
            icon={<Bell className="h-8 w-8" />}
            href="/staff/admin/notifications"
            delay={0.9}
          />
          <AdminCard
            title="Remote Control"
            description="Controlla manutenzione, versioni e monitora le app desktop."
            icon={<Monitor className="h-8 w-8" />}
            href="/staff/admin/remote-control"
            delay={1.0}
          />
        </div>
      </motion.div>
    </div>
  );
}