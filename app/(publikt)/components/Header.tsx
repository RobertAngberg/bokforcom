"use client";

import { useState } from "react";

const menuLinks = [
  { label: "Priser", href: "/priser" },
  { label: "Funktioner", href: "/funktioner" },
  { label: "Om oss", href: "/om-oss" },
  { label: "Kontakt", href: "/kontakt" },
];

export default function Header() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleGetStarted = () => {
    setIsLoading(true);
    window.location.href = "/login";
  };

  const handleNavigate = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-2xl font-bold text-white">Bokföringsapp</span>
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
            aria-label={isMenuOpen ? "Stäng meny" : "Öppna meny"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span className="sr-only">Huvudmeny</span>
            <span
              className={`block h-0.5 w-6 bg-current transition-transform ${
                isMenuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-current transition-opacity ${
                isMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-current transition-transform ${
                isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden mt-4 rounded-lg border border-white/10 bg-slate-950/80 backdrop-blur p-4 space-y-3">
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
  );
}
