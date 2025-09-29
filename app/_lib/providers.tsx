"use client";

// Better-auth doesn't need a SessionProvider wrapper like NextAuth
// The auth client handles state management automatically via nanostore
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
