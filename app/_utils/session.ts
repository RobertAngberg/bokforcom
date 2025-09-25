import { Session } from "next-auth";
import { getSessionAndUserId } from "./authUtils";
import { logError } from "./errorUtils";

/**
 * Säkerställer att en giltig session finns. Kastar fel om ingen.
 * Minimal abstraktion för att DRY:a upp actions.
 */
export async function ensureSession() {
  const { session, userId } = await getSessionAndUserId();
  if (!session?.user?.email) {
    const error = new Error("NO_SESSION") as Error & { code: string };
    error.code = "NO_SESSION";
    throw error;
  }
  return { session, userId };
}

/**
 * Wrapper som returnerar null istället för att kasta, om session saknas.
 */
export async function tryGetSession(): Promise<{ session: Session; userId: number } | null> {
  try {
    return await ensureSession();
  } catch (e: unknown) {
    if (e instanceof Error && (e as Error & { code?: string }).code !== "NO_SESSION") {
      logError(e, "tryGetSession");
    }
    return null;
  }
}
