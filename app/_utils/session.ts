import { auth } from "../_lib/better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserId } from "../_types/common";

// Better Auth session type
export type BetterAuthSession = {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt?: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};

/**
 * Säkerställer att en giltig session finns. Kastar fel om ingen.
 * Minimal abstraktion för att DRY:a upp actions.
 */
export type EnsureSessionOptions = {
  redirectTo?: string | false;
  message?: string;
};

export async function ensureSession(options: EnsureSessionOptions = {}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    if (options.redirectTo !== false) {
      redirect(typeof options.redirectTo === "string" ? options.redirectTo : "/login");
    }

    const error = new Error(options.message ?? "Ingen giltig session") as Error & { code: string };
    error.code = "NO_SESSION";
    throw error;
  }

  return {
    session: session as BetterAuthSession,
    userId: session.user.id as UserId,
  };
}
