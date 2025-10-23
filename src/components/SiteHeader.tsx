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
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);
  const [currentOrg, setCurrentOrg] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
        // carica org correnti e disponibili + controllo admin
        const prof = await supabase.from("profiles").select("current_org, is_admin").eq("id", user.id).maybeSingle();
        setCurrentOrg((prof.data as { current_org?: string })?.current_org ?? null);
        setIsAdmin((prof.data as { is_admin?: boolean })?.is_admin ?? false);
        const mem1 = await supabase.from("org_members").select("org_id").eq("user_id", user.id);
        const orgIds = new Set<string>();
        if (Array.isArray(mem1.data)) {
          for (const m of mem1.data as { org_id: string }[]) orgIds.add(m.org_id);
        }
        if (orgIds.size === 0) {
          const mem2 = await supabase.from("organization_members").select("org_id").eq("user_id", user.id);
          if (Array.isArray(mem2.data)) {
            for (const m of mem2.data as { org_id: string }[]) orgIds.add(m.org_id);
          }
        }
        // Tabella memberships non esiste, rimuoviamo questo controllo
        const list = await supabase.from("orgs").select("id, name").in("id", Array.from(orgIds));
        setOrgs((list.data as { id: string; name: string }[]) ?? []);
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
      <nav className="container relative flex h-20 items-center justify-between">
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
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-primary/30 transition-all duration-300 group"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                      <User2 className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-700 max-w-[140px] truncate font-medium">{email}</span>
                    <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200/60 bg-white/95 backdrop-blur-xl shadow-2xl shadow-black/10 p-2 z-50"
                    >
                      <div className="p-3 border-b border-gray-100">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Account</div>
                        <div className="text-sm font-medium text-gray-900 truncate">{email}</div>
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
                            // BYPASS: Pulisci anche il bypass auth
                            
                            const supabase = supabaseBrowser();
                            const { error } = await supabase.auth.signOut();
                            if (error) {
                              console.error("Logout error:", error);
                              alert("Errore durante il logout: " + error.message);
                            } else {
                              console.log("Logout successful");
                              // Pulisci localStorage
                              localStorage.removeItem("sb-" + process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0] + "-auth-token");
                              // Redirect alla home
                              window.location.href = "/";
                            }
                          } catch (err) {
                            console.error("Logout exception:", err);
                            alert("Errore durante il logout");
                          }
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Esci dall&apos;account
                      </button>
                    </div>
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
          <div className="lg:hidden absolute top-20 left-0 w-full border-b border-gray-200/60 bg-white/95 backdrop-blur-xl shadow-xl">
            <div className="container py-6 flex flex-col gap-2">
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