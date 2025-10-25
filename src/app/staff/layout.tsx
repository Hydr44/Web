"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { staffAuth, StaffUser } from "@/lib/staff-auth-client";
import { 
  Shield, 
  Globe, 
  LogOut,
  User,
  Settings,
  BarChart3,
  Users,
  Building2,
  Mail,
  TrendingUp,
  Bell,
  FileText,
  Activity,
  Clock
} from "lucide-react";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      // Skip authentication check for login page
      if (pathname === '/staff/login') {
        setLoading(false);
        return;
      }

      const currentUser = staffAuth.getCurrentUser();
      if (!currentUser) {
        router.push('/staff/login');
        return;
      }
      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, [router, pathname]);

  const handleLogout = async () => {
    await staffAuth.logout();
    router.push('/staff/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  // For login page, just render children without header
  if (pathname === '/staff/login') {
    return <>{children}</>;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/staff/admin',
      icon: BarChart3,
      current: pathname === '/staff/admin'
    },
    {
      name: 'Utenti App',
      href: '/staff/admin/users',
      icon: Users,
      current: pathname.startsWith('/staff/admin/users')
    },
    {
      name: 'Organizzazioni',
      href: '/staff/admin/organizations',
      icon: Building2,
      current: pathname.startsWith('/staff/admin/organizations')
    },
    {
      name: 'Staff Management',
      href: '/staff/admin/staff',
      icon: Shield,
      current: pathname.startsWith('/staff/admin/staff')
    },
    {
      name: 'Lead Management',
      href: '/staff/marketing',
      icon: Mail,
      current: pathname.startsWith('/staff/marketing')
    },
    {
      name: 'Analytics',
      href: '/staff/admin/analytics',
      icon: TrendingUp,
      current: pathname.startsWith('/staff/admin/analytics')
    },
    {
      name: 'Audit Log',
      href: '/staff/admin/audit',
      icon: Activity,
      current: pathname.startsWith('/staff/admin/audit')
    },
    {
      name: 'Sessioni',
      href: '/staff/admin/sessions',
      icon: Clock,
      current: pathname.startsWith('/staff/admin/sessions')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/staff" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Staff Panel</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
                <Globe className="h-4 w-4" />
                <span>staff.rescuemanager.eu</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.full_name}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {user.staff_role}
                </span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    item.current
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}