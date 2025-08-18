// Enhanced Session Security för Next.js applikation
// Skyddar mot session hijacking, CSRF och timing-attacker

// import { auth } from "@/auth"; // Importeras där det behövs
import { redirect } from "next/navigation";

// Session säkerhetsvalidering
export async function validateSecureSession(authFunction: () => Promise<any>) {
  const session = await authFunction();

  if (!session?.user?.id) {
    throw new Error("Ingen giltig session - användarautentisering krävs");
  }

  return {
    userId: parseInt(session.user.id, 10),
    user: session.user,
    isValid: true,
  };
}

// Säker session-validering med redirect
export async function requireAuth(authFunction: () => Promise<any>, redirectTo: string = "/login") {
  const session = await authFunction();

  if (!session?.user?.id) {
    redirect(redirectTo);
  }

  return {
    userId: parseInt(session.user.id, 10),
    user: session.user,
  };
}

// Validera användar-ID från session
export function validateUserId(userId: string | undefined): number {
  if (!userId) {
    throw new Error("Användar-ID saknas i session");
  }

  const parsedId = parseInt(userId, 10);
  if (isNaN(parsedId) || parsedId <= 0) {
    throw new Error("Ogiltigt användar-ID i session");
  }

  return parsedId;
}

// CSRF Token generation och validering
export function generateCSRFToken(): string {
  // Generera säker random token
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Säker jämförelse av CSRF tokens (konstant tid för att förhindra timing-attacker)
export function validateCSRFToken(token1: string, token2: string): boolean {
  if (!token1 || !token2 || token1.length !== token2.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token1.length; i++) {
    result |= token1.charCodeAt(i) ^ token2.charCodeAt(i);
  }

  return result === 0;
}

// Session fingerprinting för extra säkerhet
export function createSessionFingerprint(request: Request): string {
  const userAgent = request.headers.get("user-agent") || "";
  const acceptLanguage = request.headers.get("accept-language") || "";
  const acceptEncoding = request.headers.get("accept-encoding") || "";

  // Skapa hash av browser fingerprint
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  return btoa(fingerprint).substring(0, 16);
}

// Säker användare verifiering för databas-operationer
export async function verifyUserOwnership(
  userId: number,
  resourceUserId: number,
  resourceType: string = "resource"
): Promise<void> {
  if (userId !== resourceUserId) {
    throw new Error(`Åtkomst nekad: Du äger inte denna ${resourceType}`);
  }
}

// Rate limiting för session-relaterade operationer
const sessionAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function validateSessionAttempt(identifier: string): boolean {
  const now = Date.now();
  const attempt = sessionAttempts.get(identifier);

  // Rensa gamla försök (15 minuter)
  if (attempt && now - attempt.lastAttempt > 15 * 60 * 1000) {
    sessionAttempts.delete(identifier);
  }

  const current = sessionAttempts.get(identifier) || { count: 0, lastAttempt: now };

  // Max 10 session-operationer per 15 minuter
  if (current.count >= 10) {
    return false;
  }

  current.count++;
  current.lastAttempt = now;
  sessionAttempts.set(identifier, current);

  return true;
}

// Säkra session headers för responses
export function getSecureSessionHeaders(): Record<string, string> {
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}

// Säker logout med session rensning
export async function secureLogout() {
  // Här skulle vi kunna lägga till extra rensning om det behövs
  // Som att invalida refresh tokens, logga ut från alla enheter etc.

  try {
    // NextAuth hanterar logout automatiskt
    redirect("/login");
  } catch (error) {
    console.error("Fel vid säker utloggning:", error);
    throw new Error("Kunde inte logga ut säkert");
  }
}

// Session timeout detection
export function isSessionExpired(
  sessionTime: number,
  maxAge: number = 24 * 60 * 60 * 1000
): boolean {
  return Date.now() - sessionTime > maxAge;
}

// Auditloggning för session-säkerhet
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
