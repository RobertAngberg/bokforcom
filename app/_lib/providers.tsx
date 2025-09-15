"use client";

import { SessionProvider } from "next-auth/react";
import { LönespecProvider } from "../personal/Lonespecar/LonespecContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LönespecProvider>{children}</LönespecProvider>
    </SessionProvider>
  );
}
