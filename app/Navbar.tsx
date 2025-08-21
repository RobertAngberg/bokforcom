//#region Huvud
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "./start/LogoutKnapp";
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
    ...(session?.user ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  // Länkar för icke-inloggade användare
  const guestLinks = [
    { href: "/", label: "Hem" },
    { href: "/login", label: "Logga in med Google" },
  ];

  const currentLinks = session?.user ? navLinks : guestLinks;

  // Hanterar aktiv path + marker
  const { markerStyle, linksRef, handleClick } = useActivePathMarker(
    currentLinks,
    pathname,
    router
  );

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center w-full h-20 px-4 bg-cyan-950">
      <nav className="relative flex gap-3">
        <div
          className="absolute h-10 bg-cyan-800/60 rounded-full transition-all duration-300 ease-out"
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

        {session?.user && (
          <div className="ml-4 hidden md:block">
            <LogoutButton />
          </div>
        )}
      </nav>
    </div>
  );
}

function useActivePathMarker(
  currentLinks: { href: string; label: string }[],
  pathname: string,
  router: any
) {
  const [selectedPath, setSelectedPath] = useState(pathname);
  const [markerStyle, setMarkerStyle] = useState({ left: 0, width: 0 });
  const linksRef = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    setSelectedPath(pathname);
  }, [pathname]);

  useEffect(() => {
    const activeEl = linksRef.current[selectedPath];
    if (activeEl) {
      const { offsetLeft, offsetWidth } = activeEl;
      setMarkerStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [selectedPath, currentLinks.length]);

  const handleClick = (path: string) => {
    setSelectedPath(path);

    // Om användaren klickar på samma sida som de redan är på, gör en "mjuk refresh"
    if (path === pathname) {
      router.push(path);
      // Alternativt: window.location.reload() för en hårdare refresh
    }
  };

  return { markerStyle, linksRef, handleClick };
}
