"use client";

import { useEffect, useRef, useState } from "react";

const menuLinks = [
  { label: "Priser", href: "/priser" },
  { label: "Funktioner", href: "/funktioner" },
  { label: "Om oss", href: "/om-oss" },
  { label: "Kontakt", href: "/kontakt" },
];

export default function Header() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  const [isMenuAnimatingOut, setIsMenuAnimatingOut] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const openMenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsMenuAnimatingOut(false);
    setIsMenuMounted(true);
    requestAnimationFrame(() => {
      setIsMenuExpanded(true);
    });
  };

  const closeMenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (!isMenuMounted) {
      return;
    }
    setIsMenuExpanded(false);
    setIsMenuAnimatingOut(true);
    closeTimeoutRef.current = setTimeout(() => {
      setIsMenuMounted(false);
      setIsMenuAnimatingOut(false);
      closeTimeoutRef.current = null;
    }, 220);
  };

  const toggleMenu = () => {
    if (isMenuExpanded) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleLogin = () => {
    closeMenu();
    window.location.href = "/login";
  };

  const handleGetStarted = () => {
    closeMenu();
    setIsLoading(true);
    window.location.href = "/login";
  };

  const handleNavigate = () => {
    closeMenu();
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes mobileMenuEnter {
              0% {
                opacity: 0;
                transform: translateY(-12px) scale(0.97);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }

            @keyframes mobileMenuExit {
              0% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
              100% {
                opacity: 0;
                transform: translateY(-8px) scale(0.97);
              }
            }
          `,
        }}
      />

      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto relative z-50">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <a
              href="/"
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img src="/Logo.png" alt="Bokför.com" className="h-16 w-auto" />
              <span className="text-2xl font-bold text-white">Bokför.com</span>
            </a>

            {/* Menylänkar */}
            <nav className="hidden lg:flex items-center space-x-12 mt-2">
              {menuLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-slate-300 hover:text-white transition-colors text-lg font-bold"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Auth knappar */}
            <div className="hidden lg:flex items-center space-x-4">
              <button
                onClick={handleLogin}
                className="text-slate-300 hover:text-white transition-colors"
              >
                Logga in
              </button>
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? "Laddar..." : "Kom igång"}
              </button>
            </div>

            {/* Mobilmeny knapp */}
            <button
              type="button"
              className="lg:hidden inline-flex flex-col items-center justify-center w-12 h-12 gap-1.5 rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              aria-label={isMenuExpanded ? "Stäng meny" : "Öppna meny"}
              aria-expanded={isMenuExpanded}
              onClick={toggleMenu}
            >
              <span className="sr-only">Huvudmeny</span>
              <span
                className={`block h-0.5 w-6 bg-current transition-transform ${
                  isMenuExpanded ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-current transition-opacity ${
                  isMenuExpanded ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-0.5 w-6 bg-current transition-transform ${
                  isMenuExpanded ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </button>
          </div>

          {isMenuMounted && (
            <div
              className="lg:hidden absolute left-0 right-0 top-full mt-3 rounded-lg border border-white/10 bg-slate-950/90 backdrop-blur-xl p-4 space-y-3 shadow-2xl z-40"
              style={{
                animation: isMenuAnimatingOut
                  ? "mobileMenuExit 0.22s cubic-bezier(0.22, 1, 0.36, 1) forwards"
                  : "mobileMenuEnter 0.26s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              }}
            >
              <nav className="space-y-2">
                {menuLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={handleNavigate}
                    className="block rounded-md px-3 py-2 text-base font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleNavigate();
                    handleLogin();
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-base font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Logga in
                </button>
                <button
                  onClick={() => {
                    handleNavigate();
                    handleGetStarted();
                  }}
                  disabled={isLoading}
                  className="w-full rounded-md bg-blue-600 px-3 py-2 text-base font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Laddar..." : "Kom igång"}
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {isMenuMounted && (
        <button
          type="button"
          className={`fixed inset-0 z-30 bg-black/70 backdrop-blur-[1px] transition-opacity duration-200 ${
            isMenuExpanded ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0"
          }`}
          onClick={closeMenu}
        >
          <span className="sr-only">Stäng meny</span>
        </button>
      )}
    </>
  );
}
