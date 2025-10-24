"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { LogIn, LogOut, User2, Menu, X, ChevronDown, Home, ArrowRight } from "lucide-react";

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
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('right');
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [currentOrg, setCurrentOrg] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Menu toggle clicked, current state:", menuOpen);
    
    if (!menuOpen) {
      // Calcola la posizione ottimale del dropdown
      setTimeout(() => {
        const button = document.querySelector('[aria-haspopup="menu"]') as HTMLElement;
        if (button) {
          const rect = button.getBoundingClientRect();
          const viewportWidth = window.innerWidth;
          const dropdownWidth = 288; // w-72 = 18rem = 288px
          
          // Se il dropdown esce a destra, posizionalo a sinistra
          if (rect.right + dropdownWidth > viewportWidth) {
            setDropdownPosition('left');
          } else {
            setDropdownPosition('right');
          }
        }
      }, 0);
    }
    
    setMenuOpen(!menuOpen);
    console.log("Menu state after toggle:", !menuOpen);
  };

  // scroll style
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // read session (client) just to toggle Accedi/Registrati vs Dashboard/Esci
  useEffect(() => {
    const supabase = supabaseBrowser();
    
    // Funzione per aggiornare lo stato utente
    const updateUserState = async (user: any) => {
      setEmail(user?.email ?? null);
      if (user) {
        // carica org correnti e disponibili + controllo admin + info OAuth
        const prof = await supabase.from("profiles").select("current_org, is_admin, provider, avatar_url, full_name").eq("id", user.id).maybeSingle();
        setCurrentOrg((prof.data as { current_org?: string })?.current_org ?? null);
        setIsAdmin((prof.data as { is_admin?: boolean })?.is_admin ?? false);
        
        // Log info OAuth per debug
        if (prof.data) {
          console.log("User profile loaded:", {
            provider: (prof.data as any)?.provider,
            hasAvatar: !!(prof.data as any)?.avatar_url,
            fullName: (prof.data as any)?.full_name
          });
        }
        // Carica organizzazioni dell'utente con gestione errori
        try {
          const { data: memberships, error: memError } = await supabase
            .from("org_members")
            .select("org_id")
            .eq("user_id", user.id);
          
          if (memError) {
            console.warn("Errore caricamento memberships:", memError);
            setOrgs([]);
          } else if (Array.isArray(memberships) && memberships.length > 0) {
            const orgIds = memberships.map(m => m.org_id);
            const { data: orgs, error: orgError } = await supabase
              .from("orgs")
              .select("id, name")
              .in("id", orgIds);
            
            if (orgError) {
              console.warn("Errore caricamento organizzazioni:", orgError);
              setOrgs([]);
            } else {
              setOrgs((orgs as { id: string; name: string }[]) ?? []);
            }
          } else {
            setOrgs([]);
          }
        } catch (error) {
          console.warn("Errore generale caricamento org:", error);
          setOrgs([]);
        }
      } else {
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
      await updateUserState(session?.user);
    });

    // Listener per evento personalizzato dal login
    const handleAuthStateChange = async (event: CustomEvent) => {
      console.log("Custom auth state change event:", event.detail);
      await updateUserState(event.detail.user);
    };

    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
    };
  }, []);

  const nav = useMemo(
    () =>
      NAV.map((n) => ({
        ...n,
        active: (n.match ? n.match(pathname) : pathname === n.href) || false,
      })),
    [pathname]
  );

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "bg-white/95 backdrop-blur-xl border-b border-gray-200/60 shadow-xl shadow-black/10" 
          : "bg-white/90 backdrop-blur-lg"
      }`}
    >
      <nav className="container relative flex h-20 items-center justify-between overflow-hidden">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative overflow-hidden rounded-xl">
            <Image 
              src="/logoufficiale_1024.png" 
              alt="RescueManager" 
              width={240} 
              height={64} 
              priority 
              className="transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>

        {/* Center nav (desktop) */}
        <div className="hidden lg:flex items-center gap-8">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative group text-sm font-medium transition-all duration-300 ${
                item.active 
                  ? "text-primary" 
                  : "text-gray-700 hover:text-primary"
              }`}
            >
              <span className="relative z-10">{item.label}</span>
              {/* underline animata */}
              <span
                className={`absolute left-0 -bottom-1 h-0.5 w-full rounded-full bg-gradient-to-r from-primary to-blue-600 transition-all duration-300 ${
                  item.active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
                aria-hidden
              />
              {/* background hover */}
              <span
                className={`absolute inset-0 -mx-2 -my-1 rounded-lg bg-primary/5 transition-all duration-300 ${
                  item.active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
                aria-hidden
              />
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden lg:flex items-center gap-3">
          {email ? (
            <>
              {/* Dashboard link con icona */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 font-medium"
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>

              {/* Avatar/menu migliorato */}
              <div className="relative flex items-center gap-2">
                {orgs.length > 0 && (
                  <div className="relative">
                    <select
                      className="text-xs rounded-xl ring-1 ring-gray-200 px-3 py-2 bg-white hover:ring-primary/30 hover:bg-primary/5 transition-all duration-300 appearance-none pr-8 cursor-pointer"
                      value={currentOrg ?? ''}
                      onChange={async (e) => {
                        const val = e.target.value || null;
                        setCurrentOrg(val);
                        await fetch("/api/org/select", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ org_id: val }) });
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
                
                <div className="relative">
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
                    <>
                      {/* Backdrop per chiudere il menu */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => {
                          console.log("Backdrop clicked, closing menu");
                          setMenuOpen(false);
                        }}
                      />
                      
                      <div
                        role="menu"
                        className={`fixed w-64 sm:w-72 rounded-2xl border-2 border-primary/20 bg-white shadow-2xl shadow-black/20 p-2`}
                        style={{ 
                          zIndex: 999999,
                          position: 'fixed',
                          top: '80px',
                          right: dropdownPosition === 'right' ? '20px' : 'auto',
                          left: dropdownPosition === 'right' ? 'auto' : '20px',
                          backgroundColor: 'white',
                          border: '2px solid rgba(59, 130, 246, 0.2)'
                        }}
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
                      
                      {/* Admin panel rimosso - accesso separato */}
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                        onClick={async () => {
                          setMenuOpen(false);
                          console.log("Logout clicked");
                          
                          try {
                            const supabase = supabaseBrowser();
                            
                            // Logout da Supabase
                            const { error } = await supabase.auth.signOut();
                            if (error) {
                              console.error("Logout error:", error);
                            }
                            
                            // Pulisci tutti i dati locali
                            localStorage.clear();
                            sessionStorage.clear();
                            
                            // Pulisci cookie Supabase
                            const cookiesToClear = [
                              'sb-access-token',
                              'sb-refresh-token', 
                              'supabase-auth-token',
                              'sb-ienzdgrqalltvkdkuamp-auth-token'
                            ];
                            
                            cookiesToClear.forEach(cookieName => {
                              document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.rescuemanager.eu`;
                              document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                            });
                            
                            console.log("Logout successful, redirecting...");
                            
                            // Redirect immediato alla homepage
                            window.location.href = "/";
                            
                          } catch (err) {
                            console.error("Logout exception:", err);
                            // Anche in caso di errore, forza il redirect
                            window.location.href = "/";
                          }
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Esci dall&apos;account
                      </button>
                    </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/demo"
                className="text-sm px-4 py-2 rounded-xl ring-1 ring-primary/30 text-primary hover:bg-primary/10 hover:ring-primary/50 transition-all duration-300 font-medium"
              >
                Demo
              </Link>
              <Link
                href="/preventivo"
                className="text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 font-medium"
              >
                Preventivo
              </Link>
              <Link
                href="/login"
                className="text-sm px-4 py-2 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-300 font-medium"
                onClick={() => {
                  console.log("Login link clicked");
                }}
              >
                Accedi
              </Link>
              <Link
                href="/register"
                className="text-sm px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
              >
                Registrati
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger migliorato */}
        <button
          className="lg:hidden inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-primary/30 transition-all duration-300"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Apri menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <X className="h-5 w-5 text-gray-600" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Mobile drawer migliorato */}
        {menuOpen && (
          <div className="lg:hidden absolute top-20 left-0 right-0 w-full max-w-full border-b border-gray-200/60 bg-white/95 backdrop-blur-xl shadow-xl">
            <div className="container mx-auto px-4 py-6 flex flex-col gap-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    item.active 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                  {item.active && <ArrowRight className="h-4 w-4 ml-auto" />}
                </Link>
              ))}

              <div className="border-t border-gray-200 my-4"></div>

              {email ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg transition-all duration-300 font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Link>
                  
                  {/* Admin panel rimosso - accesso separato */}
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  <button 
                    className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-300 font-medium"
                    onClick={async () => {
                      setMenuOpen(false);
                      console.log("Mobile logout clicked");
                      try {
                        // BYPASS: Pulisci anche il bypass auth
                        
                        const supabase = supabaseBrowser();
                        const { error } = await supabase.auth.signOut();
                        if (error) {
                          console.error("Mobile logout error:", error);
                          alert("Errore durante il logout: " + error.message);
                        } else {
                          console.log("Mobile logout successful");
                          // Pulisci localStorage
                          localStorage.removeItem("sb-" + process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] + "-auth-token");
                          // Redirect alla home
                          window.location.href = "/";
                        }
                      } catch (err) {
                        console.error("Mobile logout exception:", err);
                        alert("Errore durante il logout");
                      }
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Esci dall&apos;account
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/demo"
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm ring-1 ring-primary/30 text-primary hover:bg-primary/10 transition-all duration-300 font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    Demo
                  </Link>
                  <Link
                    href="/preventivo"
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-lg transition-all duration-300 font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    Preventivo
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-300 font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    <LogIn className="h-4 w-4" />
                    Accedi
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300 font-medium"
                    onClick={() => setMenuOpen(false)}
                  >
                    Registrati
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}