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
      </nav>
    </div>
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
