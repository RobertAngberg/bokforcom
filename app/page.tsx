"use client";

import { useSession } from "../app/_lib/auth-client";
import StartPage from "./start/page";
import Startsidan from "./utsidan/Startsidan";

export default function Page() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-slate-950">
        <div className="text-xl">Laddar...</div>
      </div>
    );
  }

  // Icke-inloggad användare - visa landing page
  if (!session) {
    return <Startsidan />;
  }

  // Inloggad användare - visa dashboard
  return <StartPage />;
}
