"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function UtloggadNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Dölj navbar på framsidan för icke-inloggade användare
  if (pathname === "/" && !session?.user) {
    return null;
  }

  return <Navbar />;
}
