import type { Metadata } from "next";
import Link from "next/link";
import { 
  Users, 
  Building2, 
  Settings, 
  Target, 
  BarChart3, 
  CreditCard, 
  Shield, 
  Database, 
  Server, 
  Globe, 
  Zap, 
  LogOut,
  Menu,
  X
} from "lucide-react";

export const metadata: Metadata = {
  title: "Staff Panel - RescueManager",
  description: "Pannello di controllo per lo staff di RescueManager",
};

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/staff" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Staff Panel</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                <Globe className="h-4 w-4" />
                <span>staff.rescuemanager.eu</span>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-6 space-y-2">
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Marketing
              </h2>
              <Link
                href="/staff/marketing"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <Target className="h-5 w-5" />
                <span>Gestione Lead</span>
              </Link>
            </div>

            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Amministrazione
              </h2>
              <Link
                href="/staff/admin"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <Settings className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/staff/admin/users"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <Users className="h-5 w-5" />
                <span>Utenti</span>
              </Link>
              <Link
                href="/staff/admin/organizations"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <Building2 className="h-5 w-5" />
                <span>Organizzazioni</span>
              </Link>
              <Link
                href="/staff/admin/billing"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <CreditCard className="h-5 w-5" />
                <span>Fatturazione</span>
              </Link>
            </div>

            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Sistema
              </h2>
              <Link
                href="/staff/admin/system"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <Server className="h-5 w-5" />
                <span>Configurazioni</span>
              </Link>
              <Link
                href="/staff/admin/analytics"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Analytics</span>
              </Link>
              <Link
                href="/staff/admin/security"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                <Shield className="h-5 w-5" />
                <span>Sicurezza</span>
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
