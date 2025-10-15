"use client";

import { useState } from "react";

export default function Header() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    setIsLoading(true);
    window.location.href = "/login";
  };

  return (
    <header className="px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
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
        <nav className="hidden md:flex items-center space-x-12 mt-2">
          <a
            href="/priser"
            className="text-slate-300 hover:text-white transition-colors text-lg font-bold"
          >
            Priser
          </a>
          <a
            href="/funktioner"
            className="text-slate-300 hover:text-white transition-colors text-lg font-bold"
          >
            Funktioner
          </a>
          <a
            href="/om-oss"
            className="text-slate-300 hover:text-white transition-colors text-lg font-bold"
          >
            Om oss
          </a>
          <a
            href="/kontakt"
            className="text-slate-300 hover:text-white transition-colors text-lg font-bold"
          >
            Kontakt
          </a>
        </nav>

        {/* Auth knappar */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => (window.location.href = "/login")}
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
      </div>
    </header>
  );
}
