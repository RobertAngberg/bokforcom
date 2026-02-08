"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "../_lib/auth-client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// SVG Ikoner
const icons = {
  home: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  bokfor: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
      />
    </svg>
  ),
  historik: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  faktura: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  rapporter: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  bokslut: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
  personal: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  installningar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  login: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
      />
    </svg>
  ),
};

type IconKey = keyof typeof icons;

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks: { href: string; label: string; icon: IconKey }[] = [
    { href: "/", label: "Hem", icon: "home" },
    { href: "/bokfor", label: "Bokför", icon: "bokfor" },
    { href: "/historik", label: "Historik", icon: "historik" },
    { href: "/faktura", label: "Fakturor", icon: "faktura" },
    { href: "/rapporter", label: "Rapporter", icon: "rapporter" },
    { href: "/bokslut", label: "Bokslut", icon: "bokslut" },
    { href: "/personal", label: "Personal", icon: "personal" },
    ...(session?.user
      ? [{ href: "/installningar", label: "Inställningar", icon: "installningar" as IconKey }]
      : []),
  ];

  const guestLinks: { href: string; label: string; icon: IconKey }[] = [
    { href: "/", label: "Hem", icon: "home" },
    { href: "/login", label: "Logga in", icon: "login" },
  ];

  const currentLinks = session?.user ? navLinks : guestLinks;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Dölj sidebar på login-sidan
  if (pathname === "/login") {
    return null;
  }

  // Dölj sidebar på framsidan för icke-inloggade användare
  if (pathname === "/" && !session?.user) {
    return null;
  }

  // Dölj sidebar på publika marknadsföringssidor
  const publicRoutes = ["/priser", "/funktioner", "/om-oss", "/kontakt"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-56 flex-col bg-cyan-950 border-r border-slate-950/40 z-50">
        {/* Logo */}
        <div className="flex items-center justify-center h-20 border-b border-slate-950/40">
          <Link href="/">
            <Image
              src="/Logo.png"
              alt="Bokför.com"
              width={48}
              height={48}
              className="h-12 w-auto"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
          {currentLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive(href)
                  ? "bg-cyan-800 text-white shadow-md"
                  : "text-cyan-100 hover:bg-cyan-800/50 hover:text-white"
              }`}
            >
              <span className={isActive(href) ? "text-cyan-300" : "text-cyan-400"}>
                {icons[icon]}
              </span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-950/40 text-center text-[10px] text-white/70">
          © 2026 Bokför.com
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 w-full bg-cyan-950 border-b border-slate-950/40">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/">
            <Image
              src="/Logo.png"
              alt="Bokför.com"
              width={48}
              height={48}
              className="h-10 w-auto"
            />
          </Link>

          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Stäng meny" : "Öppna meny"}
            aria-expanded={isMobileMenuOpen}
            className="inline-flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-cyan-700 text-white transition-colors hover:border-cyan-500 hover:bg-cyan-800"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span className="sr-only">Navigationsmeny</span>
            <span
              className={`block h-0.5 w-5 bg-current transition-transform ${
                isMobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-current transition-opacity ${
                isMobileMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-current transition-transform ${
                isMobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="border-t border-slate-950/40 bg-slate-950/95 backdrop-blur-sm px-4 py-3">
            <div className="flex flex-col gap-1">
              {currentLinks.map(({ href, label, icon }) => (
                <Link
                  key={`${href}-mobile`}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(href)
                      ? "bg-cyan-800/80 text-white"
                      : "text-slate-100 hover:bg-cyan-800/60 hover:text-white"
                  }`}
                >
                  <span className={isActive(href) ? "text-cyan-300" : "text-cyan-400"}>
                    {icons[icon]}
                  </span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="sr-only">Stäng meny</span>
        </button>
      )}
    </>
  );
}
