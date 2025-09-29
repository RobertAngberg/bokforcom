import { auth } from "../_lib/better-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// Vanligt förekommande auth-mönster: parseInt(session.user.id, 10)
export async function getUserId(): Promise<number> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  return parseInt(session.user.id, 10);
}

// Hämtar session och validerar att användaren är inloggad
export async function getValidSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}

// Hämtar användarens email för filorganisation
export async function getUserEmail(): Promise<string> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Sanitera email för filsystem - ersätt @ med _at_ och ta bort specialtecken
  return session.user.email.replace("@", "_at_").replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Kombinerar session + userId för vanliga use cases
export async function getSessionAndUserId(): Promise<{ session: any; userId: number }> {
  // eslint-disable-line @typescript-eslint/no-explicit-any
  const session = await getValidSession();
  const userId = parseInt(session.user!.id!, 10);

  return { session, userId };
}

// Validerar ägarskap av en resurs baserat på user_id fält
export async function requireOwnership(resourceUserId: number | string): Promise<number> {
  const userId = await getUserId();
  const resourceId =
    typeof resourceUserId === "string" ? parseInt(resourceUserId, 10) : resourceUserId;

  if (userId !== resourceId) {
    throw new Error("Otillåten åtkomst: Du äger inte denna resurs");
  }

  return userId;
}

// Helper för att validera att en databas-post tillhör den inloggade användaren
export async function validateUserOwnership<T extends { user_id: number }>(
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  return {
    session,
    userId: parseInt(session.user.id, 10),
    userEmail: session.user.email,
    userName: session.user.name,
  };
}

// För server actions som behöver både validering och error handling
export async function withAuth<T>(
  action: (userId: number, session: any) => Promise<T>
): Promise<T> {
  try {
    const { session, userId } = await getSessionAndUserId();
    return await action(userId, session);
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
}

// Type guard för att säkerställa session finns
export function isAuthenticated(
  session: any
): session is { user: { id: string; email: string; name: string } } {
  return !!session?.user?.id;
}

// Auditloggning för säkerhetshändelser
export function logSecurityEvent(
  event: "login" | "logout" | "session_hijack" | "csrf_attack" | "invalid_access",
  userId?: number,
  details?: string
) {
  const timestamp = new Date().toISOString();
  console.warn(`🔒 SECURITY EVENT [${timestamp}]: ${event.toUpperCase()}`, {
    userId,
    details,
    timestamp,
  });

  // I produktion: skicka till säkerhetsloggning system
  // Som Sentry, CloudWatch, eller egen audit log
}
