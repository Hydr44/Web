"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { authManager, addAuthListener, type AuthUser } from "@/lib/auth";
import { LogIn, LogOut, User2, Menu, X, ChevronDown, Home } from "lucide-react";

type NavItem = { label: string; href: string; match?: (path: string) => boolean };

const NAV: NavItem[] = [
  { label: "Home", href: "/", match: (p) => p === "/" },
  { label: "Prodotto", href: "/prodotto", match: (p) => p.startsWith("/prodotto") },
  { label: "Prezzi", href: "/prezzi", match: (p) => p.startsWith("/prezzi") },
  { label: "Accessi", href: "/download", match: (p) => p.startsWith("/download") },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [currentOrg, setCurrentOrg] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setScrolled(globalThis.scrollY > 20);
    globalThis.addEventListener("scroll", handleScroll);
    return () => globalThis.removeEventListener("scroll", handleScroll);
  }, []);

  // Auth state management
  useEffect(() => {
    // Inizializza auth manager
    authManager.initialize().then(() => {
      setUser(authManager.getCurrentUser());
    });

    // Listener per cambiamenti di autenticazione
    const removeListener = addAuthListener(async (newUser) => {
      console.log("Auth state changed:", newUser?.email);
      setUser(newUser);
      
      // Se l'utente si è disconnesso, chiudi il menu
      if (!newUser) {
        setMenuOpen(false);
        setIsLoggingOut(false);
        setOrgs([]);
        setCurrentOrg(null);
      } else {
        // Carica organizzazioni per l'utente autenticato
        try {
          const { supabaseBrowser } = await import("@/lib/supabase-browser");
          const supabase = supabaseBrowser();
          const { data: orgsData } = await supabase.from("orgs").select("id, name");
          if (orgsData) {
            setOrgs(orgsData);
          }
        } catch (error) {
          console.error("Error loading organizations:", error);
        }
      }
    });

    return () => {
      removeListener();
    };
  }, []);

  // Dropdown toggle
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (menuOpen && !target.closest('[data-dropdown]')) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpen]);

  // Logout handler
  const handleLogout = async () => {
    if (isLoggingOut) {
      console.log("Logout already in progress, ignoring");
      return;
    }

    setMenuOpen(false);
    setIsLoggingOut(true);
    console.log("=== HEADER LOGOUT START ===");
    
    try {
      await authManager.logout();
    } catch (error) {
      console.error("Header logout error:", error);
      // Fallback: redirect forzato
      globalThis.location.href = "/";
    } finally {
      // Reset dopo timeout
      setTimeout(() => setIsLoggingOut(false), 3000);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-[#0c1929]/98 backdrop-blur-md shadow-lg shadow-black/20" : "bg-[#0c1929]/95 backdrop-blur-sm"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <Image
                src="/logoufficiale_1024.png"
                alt="RescueManager"
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-bold text-white">RescueManager</div>
              <div className="text-xs text-slate-400 -mt-1">Gestione Trasporti</div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.match ? item.match(pathname) : pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 group ${
                    active
                      ? "text-emerald-400"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {item.label}
                  {/* underline animata */}
                  <span
                    className={`absolute left-0 -bottom-1 h-0.5 w-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300 ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                    aria-hidden
                  />
                  {/* background hover */}
                  <span
                    className={`absolute inset-0 -mx-2 -my-1 rounded-lg bg-white/5 transition-all duration-300 ${
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Dashboard link */}
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-400 text-white hover:shadow-md hover:shadow-emerald-500/20 transition-all duration-300 font-medium"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>

                {/* Organization selector */}
                {orgs.length > 0 && (
                  <div className="hidden md:block relative">
                    <select
                      className="text-xs rounded-xl ring-1 ring-slate-600 px-3 py-2 bg-[#1a2536] text-slate-300 hover:ring-blue-500/40 hover:bg-[#243044] transition-all duration-300 appearance-none pr-8 cursor-pointer"
                      value={currentOrg ?? ''}
                      onChange={async (e) => {
                        const val = e.target.value || null;
                        setCurrentOrg(val);
                        await fetch("/api/org/select", { 
                          method: "POST", 
                          headers: { "Content-Type": "application/json" }, 
                          body: JSON.stringify({ org_id: val }) 
                        });
                        globalThis.location.reload();
                      }}
                    >
                      <option value="">Seleziona org</option>
                      {orgs.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
                  </div>
                )}
                
                {/* User dropdown */}
                <div className="relative" data-dropdown>
                  <button
                    onClick={handleMenuToggle}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 transition-all duration-300 group max-w-[200px] sm:max-w-[240px] ${
                      menuOpen 
                        ? 'ring-blue-500 bg-blue-500/10' 
                        : 'ring-slate-600 hover:bg-[#1a2536] hover:ring-blue-500/40'
                    }`}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 flex items-center justify-center">
                      <User2 className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs text-slate-300 max-w-[100px] sm:max-w-[140px] md:max-w-[160px] truncate font-medium flex-shrink-0" title={user.email}>
                      {user.email && user.email.length > 20 ? `${user.email.split('@')[0].substring(0, 8)}...@${user.email.split('@')[1]}` : user.email}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#1a2536] shadow-lg shadow-black/30 border border-[#243044] p-2 z-[9999]"
                    >
                      <div className="p-3 border-b border-[#243044]">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Account</div>
                        <div className="text-sm font-medium text-slate-200 break-all max-w-full overflow-hidden">
                          <span className="block truncate" title={user.email}>{user.email}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {user.isGoogle ? "Google Account" : "Email Account"}
                        </div>
                      </div>
                      
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-[#243044] transition-colors duration-200"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User2 className="h-4 w-4" />
                        Impostazioni
                      </Link>
                      
                      <div className="border-t border-[#243044] my-1"></div>
                      
                      <button
                        className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-200 ${
                          isLoggingOut 
                            ? 'text-slate-500 bg-[#243044] cursor-not-allowed' 
                            : 'text-red-400 hover:bg-red-500/10'
                        }`}
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? (
                          <>
                            <div className="h-4 w-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                            Disconnessione...
                          </>
                        ) : (
                          <>
                            <LogOut className="h-4 w-4" />
                            Esci dall&apos;account
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-400 text-white hover:shadow-md hover:shadow-emerald-500/20 transition-all duration-300 font-medium"
              >
                <LogIn className="h-4 w-4" />
                Accedi
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors duration-200 text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-[#243044] py-4">
            <div className="flex flex-col gap-2">
              {NAV.map((item) => {
                const active = item.match ? item.match(pathname) : pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                      active
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}