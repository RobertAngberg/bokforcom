"use client";

// Better Auth doesn't need a SessionProvider wrapper
// The auth client handles state management automatically via nanostore
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
