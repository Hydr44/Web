"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { authManager, addAuthListener, type AuthUser } from "@/lib/auth";
import { LogOut, User2, Menu, X, ChevronDown, Home } from "lucide-react";

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
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
            <span className="hidden sm:block text-xl font-extrabold text-white tracking-tight">RESCUE<span className="text-blue-500">.</span></span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                pathname === "/" ? "text-white bg-white/10" : "text-slate-400 hover:text-white"
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
                className="px-4 py-2 text-sm font-medium rounded transition-colors text-slate-400 hover:text-white flex items-center gap-1"
              >
                Prodotto
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${prodottoOpen ? 'rotate-180' : ''}`} />
              </button>

              {prodottoOpen && (
                <div className="absolute top-full left-0 mt-1 w-[560px] rounded-xl bg-[#1e293b] shadow-2xl border border-slate-700 p-4 z-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">Funzioni base</div>
                      <Link href="/moduli/trasporti" className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="text-sm font-medium text-white">Trasporti</div>
                        <div className="text-xs text-slate-400 mt-0.5">Soccorso, dispatch e tracking</div>
                      </Link>
                      <div className="px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                        <div className="text-sm font-medium text-white">Piazzale</div>
                        <div className="text-xs text-slate-400 mt-0.5">Gestione veicoli in deposito</div>
                      </div>
                      <div className="px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                        <div className="text-sm font-medium text-white">Clienti</div>
                        <div className="text-xs text-slate-400 mt-0.5">Anagrafica e storico</div>
                      </div>
                      <Link href="/moduli/ricambi" className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="text-sm font-medium text-white">Ricambi TecDoc</div>
                        <div className="text-xs text-slate-400 mt-0.5">Magazzino ricambi</div>
                      </Link>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">Moduli specializzati</div>
                      <Link href="/moduli/rvfu" className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="text-sm font-medium text-white">RVFU</div>
                        <div className="text-xs text-slate-400 mt-0.5">Radiazioni veicoli MIT</div>
                      </Link>
                      <Link href="/moduli/rentri" className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="text-sm font-medium text-white">RENTRI</div>
                        <div className="text-xs text-slate-400 mt-0.5">Registro rifiuti</div>
                      </Link>
                      <Link href="/moduli/sdi" className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="text-sm font-medium text-white">Fatturazione SDI</div>
                        <div className="text-xs text-slate-400 mt-0.5">Fatture elettroniche</div>
                      </Link>
                      <Link href="/moduli/contabilita" className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="text-sm font-medium text-white">Contabilità</div>
                        <div className="text-xs text-slate-400 mt-0.5">Prima nota e piano dei conti</div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/prezzi"
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                pathname === "/prezzi" ? "text-white bg-white/10" : "text-slate-400 hover:text-white"
              }`}
            >
              Prezzi
            </Link>

            <Link
              href="/contatti"
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                pathname === "/contatti" ? "text-white bg-white/10" : "text-slate-400 hover:text-white"
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
                  className="hidden sm:flex items-center gap-2 text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors font-bold"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>

                {/* User dropdown */}
                <div className="relative" data-dropdown>
                  <button
                    onClick={handleMenuToggle}
                    className={`inline-flex items-center gap-2 rounded px-3 py-2 border transition-colors max-w-[200px] sm:max-w-[240px] ${
                      menuOpen 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <User2 className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs text-slate-300 max-w-[100px] sm:max-w-[140px] truncate font-medium" title={user.email}>
                      {user.email && user.email.length > 20 ? `${user.email.split('@')[0].substring(0, 8)}...@${user.email.split('@')[1]}` : user.email}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[#1e293b] shadow-2xl border border-slate-700 p-1.5 z-[9999]"
                    >
                      <div className="p-3 border-b border-slate-700">
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Account</div>
                        <div className="text-sm font-medium text-white truncate" title={user.email}>{user.email}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {user.isGoogle ? "Google Account" : "Email Account"}
                        </div>
                      </div>
                      
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                        onClick={() => setMenuOpen(false)}
                      >
                        <User2 className="h-4 w-4" />
                        Impostazioni
                      </Link>
                      
                      <div className="border-t border-slate-700 my-1"></div>
                      
                      <button
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          isLoggingOut 
                            ? 'text-slate-500 cursor-not-allowed' 
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-bold"
              >
                PROVA GRATIS
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded hover:bg-white/10 transition-colors text-slate-400"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-800 py-3">
            <div className="flex flex-col gap-1">
              {NAV.map((item) => {
                const active = item.match ? item.match(pathname) : pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      active
                        ? "text-white bg-white/10"
                        : "text-slate-400 hover:text-white"
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