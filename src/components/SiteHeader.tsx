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
  { label: "Contatti", href: "/contatti", match: (p) => p === "/contatti" },
];

const PRODOTTO_MODULES = [
  { label: "Trasporti", desc: "Gestione completa trasporti e tracking GPS" },
  { label: "RENTRI", desc: "Registro Elettronico Nazionale Tracciabilità Rifiuti" },
  { label: "Ricambi TecDoc", desc: "Magazzino ricambi con integrazione TecDoc" },
  { label: "SDI - Fatturazione Elettronica", desc: "Fatturazione elettronica via Sistema di Interscambio" },
  { label: "Contabilità", desc: "Prima nota e piano dei conti" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [currentOrg, setCurrentOrg] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [prodottoOpen, setProdottoOpen] = useState(false);

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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      scrolled ? "bg-white shadow-md" : "bg-white"
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-10 h-10">
              <Image
                src="/logoufficiale_1024.png"
                alt="RescueManager"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="hidden sm:block text-lg font-bold text-gray-900">RescueManager</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === "/" ? "text-[#2563EB] bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Home
            </Link>

            {/* Prodotto dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setProdottoOpen(true)}
              onMouseLeave={() => setProdottoOpen(false)}
            >
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50 flex items-center gap-1"
              >
                Prodotto
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${prodottoOpen ? 'rotate-180' : ''}`} />
              </button>

              {prodottoOpen && (
                <div className="absolute top-full left-0 mt-1 w-[560px] rounded-xl bg-white shadow-xl border border-gray-200 p-4 z-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-2">Funzioni base</div>
                      <Link href="/moduli/trasporti" className="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="text-sm font-medium text-gray-900">Trasporti</div>
                        <div className="text-xs text-gray-500 mt-0.5">Soccorso, dispatch e tracking</div>
                      </Link>
                      <div className="px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-default">
                        <div className="text-sm font-medium text-gray-900">Piazzale</div>
                        <div className="text-xs text-gray-500 mt-0.5">Gestione veicoli in deposito</div>
                      </div>
                      <div className="px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-default">
                        <div className="text-sm font-medium text-gray-900">Clienti</div>
                        <div className="text-xs text-gray-500 mt-0.5">Anagrafica e storico</div>
                      </div>
                      <Link href="/moduli/ricambi" className="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="text-sm font-medium text-gray-900">Ricambi TecDoc</div>
                        <div className="text-xs text-gray-500 mt-0.5">Magazzino ricambi</div>
                      </Link>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-2">Moduli specializzati</div>
                      <Link href="/moduli/rvfu" className="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="text-sm font-medium text-gray-900">RVFU</div>
                        <div className="text-xs text-gray-500 mt-0.5">Radiazioni veicoli MIT</div>
                      </Link>
                      <Link href="/moduli/rentri" className="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="text-sm font-medium text-gray-900">RENTRI</div>
                        <div className="text-xs text-gray-500 mt-0.5">Registro rifiuti</div>
                      </Link>
                      <Link href="/moduli/sdi" className="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="text-sm font-medium text-gray-900">Fatturazione SDI</div>
                        <div className="text-xs text-gray-500 mt-0.5">Fatture elettroniche</div>
                      </Link>
                      <Link href="/moduli/contabilita" className="block px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="text-sm font-medium text-gray-900">Contabilità</div>
                        <div className="text-xs text-gray-500 mt-0.5">Prima nota e piano dei conti</div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/prezzi"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === "/prezzi" ? "text-[#2563EB] bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Prezzi
            </Link>

            <Link
              href="/contatti"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname === "/contatti" ? "text-[#2563EB] bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Contatti
            </Link>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 transition-colors font-medium"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>

                {/* User dropdown */}
                <div className="relative" data-dropdown>
                  <button
                    onClick={handleMenuToggle}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 border transition-colors max-w-[200px] sm:max-w-[240px] ${
                      menuOpen 
                        ? 'border-[#2563EB] bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center">
                      <User2 className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 max-w-[100px] sm:max-w-[140px] truncate font-medium" title={user.email}>
                      {user.email && user.email.length > 20 ? `${user.email.split('@')[0].substring(0, 8)}...@${user.email.split('@')[1]}` : user.email}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white shadow-xl border border-gray-200 p-1.5 z-[9999]"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <div className="text-xs text-gray-400 uppercase tracking-wide">Account</div>
                        <div className="text-sm font-medium text-gray-900 truncate" title={user.email}>{user.email}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {user.isGoogle ? "Google Account" : "Email Account"}
                        </div>
                      </div>
                      
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User2 className="h-4 w-4" />
                        Impostazioni
                      </Link>
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          isLoggingOut 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? (
                          <>
                            <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <LogIn className="h-4 w-4" />
                Accedi
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-3">
            <div className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active = item.match ? item.match(pathname) : pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? "text-[#2563EB] bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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