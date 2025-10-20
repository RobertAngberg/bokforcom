//#region Huvud
"use client";

import Link from "next/link";
import { useSession } from "../_lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
//#endregion

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { href: "/", label: "Hem" },
    { href: "/bokfor", label: "Bokför" },
    { href: "/historik", label: "Historik" },
    { href: "/faktura", label: "Fakturor" },
    { href: "/rapporter", label: "Rapporter" },
    { href: "/bokslut", label: "Bokslut" },
    { href: "/personal", label: "Personal" },
    ...(session?.user ? [{ href: "/installningar", label: "Inställningar" }] : []),
  ];

  // Länkar för icke-inloggade användare
  const guestLinks = [
    { href: "/", label: "Hem" },
    { href: "/login", label: "Logga in" },
  ];

  const currentLinks = session?.user ? navLinks : guestLinks;

  // Hanterar aktiv path + marker (måste köras innan return null)
  const { markerStyle, linksRef, handleClick } = useActivePathMarker(
    currentLinks,
    pathname,
    router
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Dölj navbar på login-sidan (efter alla hooks)
  if (pathname === "/login") {
    return null;
  }

  // Dölj navbar på framsidan för icke-inloggade användare (efter alla hooks)
  if (pathname === "/" && !session?.user) {
    return null;
  }

  // Dölj navbar på alla publika marknadsföringssidor
  const publicRoutes = ["/priser", "/funktioner", "/om-oss", "/kontakt"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-cyan-950">
        <div className="relative mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 md:justify-center">
          <Link href="/" className="text-lg font-semibold text-white md:hidden">
            BokförCom
          </Link>

          <nav className="relative hidden gap-3 md:flex">
            <div
              className="absolute h-10 rounded-full bg-cyan-800/60 transition-all duration-300 ease-out"
              style={{
                left: markerStyle.left,
                width: markerStyle.width,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />

            {currentLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                ref={(el) => {
                  linksRef.current[href] = el;
                }}
                onClick={() => handleClick(href)}
                className="relative z-10 px-4 py-2 text-white font-semibold md:text-lg transition-colors duration-150 hover:text-cyan-300"
              >
                {label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Stäng meny" : "Öppna meny"}
            aria-expanded={isMobileMenuOpen}
            className="inline-flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-lg border border-cyan-700 text-white transition-colors hover:border-cyan-500 hover:bg-cyan-800 md:hidden"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span className="sr-only">Navigationsmeny</span>
            <span
              className={`block h-0.5 w-6 bg-current transition-transform ${
                isMobileMenuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-current transition-opacity ${
                isMobileMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-6 bg-current transition-transform ${
                isMobileMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-cyan-800/60 bg-slate-950/95 backdrop-blur-sm">
            <nav className="flex flex-col gap-2 px-4 py-4">
              {currentLinks.map(({ href, label }) => (
                <Link
                  key={`${href}-mobile`}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 text-base font-semibold text-slate-100 transition-colors hover:bg-cyan-800/60 hover:text-white ${
                    pathname === href ? "bg-cyan-800/80 text-white" : ""
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span className="sr-only">Stäng meny</span>
        </button>
      )}
    </>
  );
}

function useActivePathMarker(
  currentLinks: { href: string; label: string }[],
  pathname: string,
  router: ReturnType<typeof useRouter>
) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [markerStyle, setMarkerStyle] = useState({ left: 0, width: 0 });
  const linksRef = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const pathToUse =
      (selectedPath && linksRef.current[selectedPath] ? selectedPath : null) ?? pathname;
    const activeEl = linksRef.current[pathToUse];
    if (activeEl) {
      const { offsetLeft, offsetWidth } = activeEl;
      setMarkerStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [selectedPath, pathname, currentLinks.length]);

  useEffect(() => {
    setSelectedPath(null);
  }, [pathname]);

  const handleClick = (path: string) => {
    setSelectedPath(path);

    const activeEl = linksRef.current[path];
    if (activeEl) {
      const { offsetLeft, offsetWidth } = activeEl;
      setMarkerStyle({ left: offsetLeft, width: offsetWidth });
    }

    if (path === pathname) {
      router.push(path);
    }
  };

  return { markerStyle, linksRef, handleClick };
}
