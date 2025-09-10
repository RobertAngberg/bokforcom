"use client";

import { useSession } from "next-auth/react";
import StartPage from "./start/page";
import Startsidan from "./Startsidan";

export default function Page() {
  const { data: session, status } = useSession();
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-slate-950">
        <div className="text-xl">Laddar...</div>
      </div>
    );
  }

  // Icke-inloggad användare - visa landing page
  if (status === "unauthenticated" || !session) {
    return <Startsidan />;
  }

  // Inloggad användare - visa dashboard
  if (status === "authenticated" && session) {
    return <StartPage />;
  }

  return null;
}
