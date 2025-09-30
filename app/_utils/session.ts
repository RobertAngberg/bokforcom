import { auth } from "../_lib/better-auth";
import { headers } from "next/headers";
import { logError } from "./errorUtils";
import type { UserId } from "../_types/common";

// Better Auth session type
type BetterAuthSession = {
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
export async function ensureSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    const error = new Error("NO_SESSION") as Error & { code: string };
    error.code = "NO_SESSION";
    throw error;
  }

  return {
    session: session as BetterAuthSession,
    userId: session.user.id as UserId,
  };
}

/**
 * Wrapper som returnerar null istället för att kasta, om session saknas.
 */
export async function tryGetSession(): Promise<{
  session: BetterAuthSession;
  userId: UserId;
} | null> {
  try {
    return await ensureSession();
  } catch (e: unknown) {
    if (e instanceof Error && (e as Error & { code?: string }).code !== "NO_SESSION") {
      logError(e, "tryGetSession");
    }
    return null;
  }
}
