// CSRF Protection Middleware och utilities
// Skyddar mot Cross-Site Request Forgery attacker

import { NextRequest, NextResponse } from "next/server";
import { generateCSRFToken, validateCSRFToken } from "./sessionSecurity";

// CSRF Token storage (i produktion: använd Redis eller databas)
const csrfTokenStore = new Map<string, { token: string; expires: number }>();

// Rensa gamla tokens varje 30 minuter
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of csrfTokenStore.entries()) {
      if (now > value.expires) {
        csrfTokenStore.delete(key);
      }
    }
  },
  30 * 60 * 1000
);

// Generera och spara CSRF token för session
export function generateSessionCSRFToken(sessionId: string): string {
  const token = generateCSRFToken();
  const expires = Date.now() + 2 * 60 * 60 * 1000; // 2 timmar

  csrfTokenStore.set(sessionId, { token, expires });
  return token;
}

// Validera CSRF token för session
export function validateSessionCSRFToken(sessionId: string, providedToken: string): boolean {
  const stored = csrfTokenStore.get(sessionId);

  if (!stored || Date.now() > stored.expires) {
    return false;
  }

  return validateCSRFToken(stored.token, providedToken);
}

// CSRF Middleware för skydd av POST/PUT/DELETE requests
export function csrfProtection(request: NextRequest): NextResponse | null {
  const method = request.method;

  // Bara skydda state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return null;
  }

  // Kontrollera Origin header
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // CSRF skydd via Origin/Referer validering
  if (origin) {
    const originUrl = new URL(origin);
    if (originUrl.host !== host) {
      console.warn("🚨 CSRF ATTACK DETECTED: Origin mismatch", { origin, host });
      return NextResponse.json({ error: "CSRF: Origin mismatch detected" }, { status: 403 });
    }
  } else if (referer) {
    const refererUrl = new URL(referer);
    if (refererUrl.host !== host) {
      console.warn("🚨 CSRF ATTACK DETECTED: Referer mismatch", { referer, host });
      return NextResponse.json({ error: "CSRF: Referer mismatch detected" }, { status: 403 });
    }
  } else {
    // Ingen Origin eller Referer header - potentiell CSRF
    console.warn("🚨 SUSPICIOUS REQUEST: No Origin/Referer header", { method, url: request.url });
    return NextResponse.json({ error: "CSRF: Missing Origin/Referer header" }, { status: 403 });
  }

  // Request är säker
  return null;
}

// Form-baserat CSRF skydd
export function createCSRFFormField(token: string): string {
  return `<input type="hidden" name="csrf_token" value="${token}" />`;
}

// Validera CSRF token från form data
export function validateFormCSRFToken(formData: FormData, sessionId: string): boolean {
  const token = formData.get("csrf_token")?.toString();
  if (!token) {
    return false;
  }

  return validateSessionCSRFToken(sessionId, token);
}

// Säkra headers för CSRF skydd
export function getCSRFSecurityHeaders(): Record<string, string> {
  return {
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
}

// Double Submit Cookie pattern för CSRF skydd
export function setCSRFCookie(response: NextResponse, token: string): void {
  response.cookies.set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 2 * 60 * 60, // 2 timmar
    path: "/",
  });
}

// Validera CSRF token från cookie och header
export function validateDoubleSubmitCSRF(request: NextRequest): boolean {
  const cookieToken = request.cookies.get("csrf-token")?.value;
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken) {
    return false;
  }

  return validateCSRFToken(cookieToken, headerToken);
}
