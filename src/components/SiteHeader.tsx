"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { performLogout } from "@/lib/logout";
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
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [currentOrg, setCurrentOrg] = useState<string | null>(null);
  const [, setIsAdmin] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setScrolled(globalThis.scrollY > 20);
    globalThis.addEventListener("scroll", handleScroll);
    return () => globalThis.removeEventListener("scroll", handleScroll);
  }, []);

  // Auth state management
  useEffect(() => {
    const supabase = supabaseBrowser();

    const updateUserState = async (user: any) => {
      if (user) {
        setEmail(user.email);
        
        // Carica organizzazioni
        const { data: orgsData } = await supabase.from("orgs").select("id, name");
        if (orgsData) {
          setOrgs(orgsData);
        }

        // Carica profilo utente
        const { data: profile } = await supabase.from("profiles").select("current_org, is_admin").eq("id", user.id).single();
        if (profile) {
          setCurrentOrg(profile.current_org);
          setIsAdmin(profile.is_admin || false);
        }
      } else {
        setEmail(null);
        setCurrentOrg(null);
        setOrgs([]);
        setIsAdmin(false);
      }
    };

    // Carica stato iniziale
    supabase.auth.getUser().then(async ({ data }) => {
      await updateUserState(data.user);
    });

    // Listener per cambiamenti di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email);
      await updateUserState(session?.user);
    });

    // Listener per logout event
    const handleLogoutEvent = (event: CustomEvent) => {
      console.log("Logout event received:", event.detail);
      setEmail(null);
      setCurrentOrg(null);
      setOrgs([]);
      setIsAdmin(false);
      setMenuOpen(false);
    };

    globalThis.addEventListener('logout', handleLogoutEvent as EventListener);

    return () => {
      subscription.unsubscribe();
      globalThis.removeEventListener('logout', handleLogoutEvent as EventListener);
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

  // Logout handler usando il nuovo sistema
  const handleLogout = async () => {
    if (isLoggingOut) {
      console.log("Logout already in progress, ignoring");
      return;
    }

    setMenuOpen(false);
    setIsLoggingOut(true);
    console.log("=== HEADER LOGOUT START ===");
    
    try {
      await performLogout({
        redirectTo: "/",
        clearAll: true,
        forceGoogleLogout: false // Lascia che il sistema decida automaticamente
      });
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
      scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white/80 backdrop-blur-sm"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <Image
                src="/logo-rentri.png"
                alt="RescueManager"
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <div className="text-xl font-bold text-gray-900">RescueManager</div>
              <div className="text-xs text-gray-500 -mt-1">Gestione Trasporti</div>
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
                      ? "text-primary"
                      : "text-gray-600 hover:text-primary"
                  }`}
                >
                  {item.label}
                  {/* underline animata */}
                  <span
                    className={`absolute left-0 -bottom-1 h-0.5 w-full rounded-full bg-gradient-to-r from-primary to-blue-600 transition-all duration-300 ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                    aria-hidden
                  />
                  {/* background hover */}
                  <span
                    className={`absolute inset-0 -mx-2 -my-1 rounded-lg bg-primary/5 transition-all duration-300 ${
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
            {email ? (
              <>
                {/* Dashboard link */}
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 font-medium"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>

                {/* Organization selector */}
                {orgs.length > 0 && (
                  <div className="hidden md:block relative">
                    <select
                      className="text-xs rounded-xl ring-1 ring-gray-200 px-3 py-2 bg-white hover:ring-primary/30 hover:bg-primary/5 transition-all duration-300 appearance-none pr-8 cursor-pointer"
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
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                  </div>
                )}
                
                {/* User dropdown */}
                <div className="relative" data-dropdown>
                  <button
                    onClick={handleMenuToggle}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 transition-all duration-300 group max-w-[200px] sm:max-w-[240px] ${
                      menuOpen 
                        ? 'ring-primary bg-primary/5' 
                        : 'ring-gray-200 hover:bg-gray-50 hover:ring-primary/30'
                    }`}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                      <User2 className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-700 max-w-[100px] sm:max-w-[140px] md:max-w-[160px] truncate font-medium flex-shrink-0" title={email}>
                      {email && email.length > 20 ? `${email.split('@')[0].substring(0, 8)}...@${email.split('@')[1]}` : email}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white shadow-2xl shadow-black/20 border border-gray-200 p-2 z-[9999]"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account</div>
                        <div className="text-sm font-medium text-gray-900 break-all max-w-full overflow-hidden">
                          <span className="block truncate" title={email || ""}>{email}</span>
                        </div>
                      </div>
                      
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User2 className="h-4 w-4" />
                        Impostazioni
                      </Link>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-200 ${
                          isLoggingOut 
                            ? 'text-gray-500 bg-gray-50 cursor-not-allowed' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? (
                          <>
                            <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 font-medium"
              >
                <LogIn className="h-4 w-4" />
                Accedi
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col gap-2">
              {NAV.map((item) => {
                const active = item.match ? item.match(pathname) : pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                      active
                        ? "text-primary bg-primary/5"
                        : "text-gray-600 hover:text-primary hover:bg-primary/5"
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