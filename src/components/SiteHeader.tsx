"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { authManager, addAuthListener, type AuthUser } from "@/lib/auth";
import { LogOut, User2, Menu, X, ChevronDown, Home, Building2 } from "lucide-react";

type NavItem = { label: string; href: string; match?: (path: string) => boolean };

const NAV: NavItem[] = [
  { label: "Home", href: "/", match: (p) => p === "/" },
  { label: "Chi Siamo", href: "/chi-siamo", match: (p) => p === "/chi-siamo" },
  { label: "Contatti", href: "/contatti", match: (p) => p === "/contatti" },
];

const PRODOTTO_MODULES = [
  { label: "Trasporti", desc: "Gestione completa trasporti e tracking GPS" },
  { label: "RENTRI", desc: "Registro Elettronico Nazionale Tracciabilità Rifiuti" },
  { label: "Ricambi TecDoc", desc: "Magazzino ricambi con integrazione TecDoc" },
  { label: "Fatturazione Elettronica", desc: "Fatturazione elettronica via Sistema di Interscambio" },
  { label: "Contabilità", desc: "Prima nota e piano dei conti" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [currentOrg, setCurrentOrg] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [prodottoOpen, setProdottoOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

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
      setUser((prevUser) => {
        // Se l'utente si è appena disconnesso
        if (prevUser && !newUser) {
          setMenuOpen(false);
          setUserMenuOpen(false);
          setIsLoggingOut(true);
          setLogoutSuccess(true);
          
          setTimeout(() => {
            setUser(null);
            setOrgs([]);
            setCurrentOrg(null);
            setIsLoggingOut(false);
          }, 1500);
          
          // Auto-dismiss toast dopo 3 secondi
          setTimeout(() => {
            setLogoutSuccess(false);
          }, 3000);
          
          return prevUser; // Congela la UI per 1.5s
        }
        
        // Se era già un visitatore normale
        if (!newUser) {
          setMenuOpen(false);
          setUserMenuOpen(false);
          setOrgs([]);
          setCurrentOrg(null);
          return null;
        }

        return newUser;
      });
      
      // Carica organizzazioni per il nuovo utente autenticato
      if (newUser) {
        try {
          const { supabaseBrowser } = await import("@/lib/supabase-browser");
          const supabase = supabaseBrowser();
          const { data: orgsData } = await supabase.from("orgs").select("id, name");
          if (orgsData && orgsData.length > 0) {
            setOrgs(orgsData);
            setCurrentOrg(orgsData[0].name);
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
  const handleUserMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUserMenuOpen(!userMenuOpen);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (userMenuOpen && !target.closest('[data-dropdown]')) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Logout handler
  const handleLogout = async () => {
    if (isLoggingOut) {
      console.log("Logout already in progress, ignoring");
      return;
    }

    setUserMenuOpen(false);
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
    <>
      {/* Toast notification logout success */}
      {logoutSuccess && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-[10000] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
            <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-800">Disconnessione avvenuta con successo</span>
          </div>
        </div>
      )}
    
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-28">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden">
              <Image
                src="/logo_128.png"
                alt="RescueManager"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="hidden sm:block text-xl font-extrabold text-white tracking-tight">RESCUE<span className="text-blue-500">MANAGER</span></span>
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

            {/* Funzionalità dropdown */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (hoverTimeout) clearTimeout(hoverTimeout);
                const timeout = setTimeout(() => setProdottoOpen(true), 200);
                setHoverTimeout(timeout);
              }}
              onMouseLeave={() => {
                if (hoverTimeout) clearTimeout(hoverTimeout);
                const timeout = setTimeout(() => setProdottoOpen(false), 300);
                setHoverTimeout(timeout);
              }}
            >
              <button
                className="px-4 py-2 text-sm font-medium rounded transition-colors text-slate-400 hover:text-white flex items-center gap-1"
              >
                Funzionalità
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${prodottoOpen ? 'rotate-180' : ''}`} />
              </button>

              {prodottoOpen && (
                <div 
                  className="absolute top-full left-0 mt-1 w-[520px] bg-white shadow-xl border border-gray-200 p-4 z-50"
                  onMouseEnter={() => {
                    if (hoverTimeout) clearTimeout(hoverTimeout);
                    setProdottoOpen(true);
                  }}
                  onMouseLeave={() => {
                    if (hoverTimeout) clearTimeout(hoverTimeout);
                    const timeout = setTimeout(() => setProdottoOpen(false), 300);
                    setHoverTimeout(timeout);
                  }}
                >
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Funzioni base</div>
                      <Link href="/moduli/trasporti" onClick={() => setProdottoOpen(false)} className="block px-3 py-2 hover:bg-gray-50 transition-colors border-l-2 border-transparent hover:border-blue-600">
                        <div className="text-sm font-semibold text-gray-900">Trasporti & Tracking</div>
                        <div className="text-xs text-gray-500 mt-0.5">Soccorso, dispatch, mappa e stati intervento</div>
                      </Link>
                      <Link href="/moduli/clienti" onClick={() => setProdottoOpen(false)} className="block px-3 py-2 hover:bg-gray-50 transition-colors border-l-2 border-transparent hover:border-blue-600">
                        <div className="text-sm font-semibold text-gray-900">Clienti</div>
                        <div className="text-xs text-gray-500 mt-0.5">Anagrafica, storico servizi e statistiche</div>
                      </Link>
                      <Link href="/moduli/mezzi-autisti" onClick={() => setProdottoOpen(false)} className="block px-3 py-2 hover:bg-gray-50 transition-colors border-l-2 border-transparent hover:border-blue-600">
                        <div className="text-sm font-semibold text-gray-900">Mezzi & Autisti</div>
                        <div className="text-xs text-gray-500 mt-0.5">Flotta, scadenze automatiche e turni</div>
                      </Link>
                      <Link href="/moduli/piazzale" onClick={() => setProdottoOpen(false)} className="block px-3 py-2 hover:bg-gray-50 transition-colors border-l-2 border-transparent hover:border-blue-600">
                        <div className="text-sm font-semibold text-gray-900">Piazzale</div>
                        <div className="text-xs text-gray-500 mt-0.5">Posizioni veicoli, stati e scadenze deposito</div>
                      </Link>
                      <Link href="/moduli/preventivi" onClick={() => setProdottoOpen(false)} className="block px-3 py-2 hover:bg-gray-50 transition-colors border-l-2 border-transparent hover:border-blue-600">
                        <div className="text-sm font-semibold text-gray-900">Preventivi</div>
                        <div className="text-xs text-gray-500 mt-0.5">Offerte, accettazione e conversione ordine</div>
                      </Link>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Moduli speciali</div>
                      <Link href="/moduli/rvfu" onClick={() => setProdottoOpen(false)} className="block px-3 py-2 hover:bg-gray-50 transition-colors border-l-2 border-transparent hover:border-blue-600">
                        <div className="text-sm font-semibold text-gray-900">Registro Veicoli Fuori Uso</div>
                        <div className="text-xs text-gray-500 mt-0.5">Workflow D.Lgs 209/2003, radiazioni PRA</div>
                      </Link>
                      <Link href="/moduli/rentri" onClick={() => setProdottoOpen(false)} className="block px-3 py-2 hover:bg-gray-50 transition-colors border-l-2 border-transparent hover:border-blue-600">
                        <div className="text-sm font-semibold text-gray-900">Rifiuti RENTRI</div>
                        <div className="text-xs text-gray-500 mt-0.5">FIR digitali, registro, MUD automatico</div>
                      </Link>
                      <Link href="/moduli/sdi" onClick={() => setProdottoOpen(false)} className="block px-3 py-2 hover:bg-gray-50 transition-colors border-l-2 border-transparent hover:border-blue-600">
                        <div className="text-sm font-semibold text-gray-900">Fatturazione Elettronica</div>
                        <div className="text-xs text-gray-500 mt-0.5">Prima nota, conservazione sostitutiva e TS</div>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/chi-siamo"
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                pathname === "/chi-siamo" ? "text-white bg-white/10" : "text-slate-400 hover:text-white"
              }`}
            >
              Chi Siamo
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
            {pathname === "/login" || pathname === "/register" ? (
             <div className="w-4 sm:w-8" />
            ) : user || isLoggingOut ? (
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
                    onClick={handleUserMenuToggle}
                    className={`inline-flex items-center gap-2 rounded px-3 py-2 border transition-colors max-w-[200px] sm:max-w-[240px] ${
                      userMenuOpen 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <User2 className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs text-slate-300 max-w-[100px] sm:max-w-[140px] truncate font-medium" title={currentOrg || user?.email}>
                      {currentOrg || (user?.email && user.email.length > 20 ? `${user.email.split('@')[0].substring(0, 8)}...@${user.email.split('@')[1]}` : user?.email)}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform duration-200 shrink-0 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {userMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-1 w-64 bg-white shadow-xl border border-gray-200 p-2 z-[9999]"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <div className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-bold">Account</div>
                        <div className="text-sm font-semibold text-gray-900 truncate" title={currentOrg || user?.email}>{currentOrg || user?.email}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate" title={user?.email}>
                          {user?.email}
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <Link
                          href="/dashboard/org"
                          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Building2 className="h-4 w-4" />
                          <span className="font-medium">La Mia Organizzazione</span>
                        </Link>
                      </div>
                      
                      <div className="border-t border-gray-100"></div>
                      
                      <div className="pt-2">
                        <button
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors font-medium ${
                            isLoggingOut 
                              ? 'text-gray-400 cursor-not-allowed' 
                              : 'text-red-600 hover:bg-red-50 hover:text-red-700'
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
                              Esci dall'account
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded text-slate-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Accedi
                </Link>
                <Link
                  href="/contatti"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-bold"
                >
                  Richiedi Demo
                </Link>
              </>
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
    </>
  );
}