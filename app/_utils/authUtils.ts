import type { UserId } from "../_types/common";
import { ensureSession, type BetterAuthSession } from "./session";

// Better Auth använder string IDs direkt
/**
 * Hämtar användar-ID för inloggad användare.
 * Redirectar automatiskt till /login om användaren inte är inloggad.
 * @throws Redirectar till /login vid oautentiserad åtkomst
 * @returns Användarens UUID
 */
export async function getAuthenticatedUserId(): Promise<UserId> {
  const { userId } = await ensureSession();
  return userId;
}

/**
 * @deprecated Använd getAuthenticatedUserId() istället för tydligare semantik
 */
export async function getUserId(): Promise<UserId> {
  return getAuthenticatedUserId();
}

// Hämtar session och validerar att användaren är inloggad
export async function getValidSession(): Promise<BetterAuthSession> {
  const { session } = await ensureSession();
  return session;
}

// Hämtar användarens email för filorganisation
export async function getUserEmail(): Promise<string> {
  const { session } = await ensureSession();

  if (!session.user.email) {
    throw new Error("Saknar e-postadress på inloggad användare");
  }

  // Sanitera email för filsystem - ersätt @ med _at_ och ta bort specialtecken
  return session.user.email.replace("@", "_at_").replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Kombinerar session + userId för vanliga use cases
// DEPRECATED: Använd getUserId() direkt istället då Better Auth använder string UUIDs
export async function getSessionAndUserId(): Promise<{
  session: BetterAuthSession;
  userId: UserId;
}> {
  return ensureSession();
}

// Validerar ägarskap av en resurs baserat på user_id fält
export async function requireOwnership(resourceUserId: UserId): Promise<UserId> {
  const { userId } = await ensureSession();

  if (userId !== resourceUserId) {
    throw new Error("Otillåten åtkomst: Du äger inte denna resurs");
  }

  return userId;
}

// Helper för att validera att en databas-post tillhör den inloggade användaren
export async function validateUserOwnership<T extends { user_id: UserId }>(
  resource: T | null,
  resourceName: string = "resurs"
): Promise<T> {
  if (!resource) {
    throw new Error(`${resourceName} hittades inte`);
  }

  await requireOwnership(resource.user_id);
  return resource;
}

// Kombinerat mönster: hämta auth + validera database query resultat
export async function getAuthenticatedUser() {
  const { session, userId } = await ensureSession();

  return {
    session,
    userId,
    userEmail: session.user.email,
    userName: session.user.name,
  };
}

// För server actions som behöver både validering och error handling
// DEPRECATED: Bör uppdateras för att använda Better Auth sessions
export async function withAuth<T>(
  action: (userId: UserId, session: BetterAuthSession) => Promise<T>
): Promise<T> {
  try {
    const { session, userId } = await ensureSession();
    return await action(userId, session);
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
}

// Type guard för att säkerställa session finns
export function isAuthenticated(session: BetterAuthSession | null): session is BetterAuthSession {
  return !!session?.user?.id;
}
