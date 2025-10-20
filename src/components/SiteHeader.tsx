"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { LogIn, LogOut, User2 } from "lucide-react";

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
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null));
    return () => subscription.unsubscribe();
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
      className={`sticky top-0 z-50 transition-all ${
        scrolled ? "bg-white/90 backdrop-blur border-b shadow-sm" : "bg-transparent"
      }`}
    >
      {!scrolled && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/20 backdrop-blur"
        />
      )}

      <nav className="container relative flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="RescueManager" width={180} height={48} priority />
        </Link>

        {/* Center nav (desktop) */}
        <div className="hidden md:flex items-center gap-6">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative text-sm transition-colors ${
                item.active ? "text-gray-900" : "text-gray-700 hover:text-gray-900"
              }`}
            >
              {item.label}
              {/* underline animata */}
              <span
                className={`absolute left-0 -bottom-1 h-[2px] w-full rounded-full bg-current transition-transform duration-200 ${
                  item.active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`}
                aria-hidden
              />
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          {!email ? (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
              >
                <LogIn className="h-4 w-4" />
                Accedi
              </Link>
              <Link
                href="/register"
                className="text-sm px-3 py-2 rounded-full ring-1 ring-brand text-brand hover:bg-brand/10 transition"
              >
                Registrati
              </Link>
              <Link
                href="/contatti"
                className="text-sm px-3 py-2 rounded-full bg-brand text-white hover:bg-brand-700 transition shadow-sm"
              >
                Richiedi demo
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="text-sm px-3 py-2 rounded-full bg-gray-900 text-white hover:opacity-90 transition"
              >
                Dashboard
              </Link>

              {/* Avatar/menu semplice */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 ring-gray-200 hover:bg-gray-50"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <User2 className="h-4 w-4 text-gray-600" />
                  <span className="text-xs text-gray-700 max-w-[160px] truncate">{email}</span>
                </button>
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg p-2"
                  >
                    <Link
                      role="menuitem"
                      href="/dashboard/settings"
                      className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Impostazioni
                    </Link>
                    <form role="menuitem" action="/logout" method="POST">
                      <button
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LogOut className="h-4 w-4" />
                        Esci
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 ring-1 ring-gray-200"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Apri menu"
          aria-expanded={menuOpen}
        >
          <span className="i-[hamburger]" />
          <div className="sr-only">Menu</div>
        </button>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full border-b bg-white/95 backdrop-blur">
            <div className="container py-4 flex flex-col gap-2">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    item.active ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {!email ? (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Accedi
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg px-3 py-2 text-sm ring-1 ring-brand text-brand hover:bg-brand/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    Registrati
                  </Link>
                  <Link
                    href="/contatti"
                    className="rounded-lg px-3 py-2 text-sm bg-brand text-white text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Richiedi demo
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-lg px-3 py-2 text-sm bg-gray-900 text-white text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <form action="/logout" method="POST" onSubmit={() => setMenuOpen(false)}>
                    <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      Esci
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}