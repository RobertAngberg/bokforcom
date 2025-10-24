import { NextRequest, NextResponse } from "next/server";

// Publika routes som INTE behöver autentisering
const publicRoutes = [
  "/", // Startsidan (Startsidan.tsx)
  "/login", // Login sida
  "/api/auth", // better-auth endpoints
  "/api/feedback", // Feedback API (om det ska vara publikt)
  "/api/kontakt", // Kontaktformulär
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => {
    if (route.endsWith("/")) {
      return pathname.startsWith(route);
    }
    return pathname === route || pathname.startsWith(route + "/");
  });
}

function hasValidSession(request: NextRequest): boolean {
  // Kolla efter better-auth session cookie
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  // Om det finns en session cookie, anta att användaren är inloggad
  // better-auth hanterar validering av JWT själv i komponenter
  return !!sessionToken;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Debug logging för auth-problem
  if (pathname.startsWith("/api/auth")) {
    console.log("🔍 AUTH REQUEST:", {
      method,
      pathname,
      origin: request.headers.get("origin"),
      host: request.headers.get("host"),
    });
  }

  // 🔒 AUTH SKYDD: Kräv inloggning för alla routes utom publika
  if (!isPublicRoute(pathname)) {
    if (!hasValidSession(request)) {
      console.log(`🔒 Auth redirect: ${pathname} → /login`);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 🛡️ CSRF SKYDD: För state-changing requests (men inte för auth)
  const isAuthRoute =
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/start" ||
    pathname === "/api/kontakt";

  if (["POST", "PUT", "DELETE", "PATCH"].includes(method) && !isAuthRoute) {
    // Kontrollera Origin header
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    // CSRF skydd via Origin/Referer validering
    if (origin) {
      const originUrl = new URL(origin);
      const allowedHosts = [host, "bokför.com", "xn--bokfr-mua.com", "www.xn--bokfr-mua.com"];
      if (!allowedHosts.includes(originUrl.host)) {
        console.warn("🚨 CSRF ATTACK DETECTED: Origin mismatch", {
          origin,
          host,
          originHost: originUrl.host,
        });
        return NextResponse.json({ error: "CSRF: Origin mismatch detected" }, { status: 403 });
      }
    } else if (referer) {
      const refererUrl = new URL(referer);
      const allowedHosts = [host, "bokför.com", "xn--bokfr-mua.com", "www.xn--bokfr-mua.com"];
      if (!allowedHosts.includes(refererUrl.host)) {
        console.warn("🚨 CSRF ATTACK DETECTED: Referer mismatch", {
          referer,
          host,
          refererHost: refererUrl.host,
        });
        return NextResponse.json({ error: "CSRF: Referer mismatch detected" }, { status: 403 });
      }
    } else {
      // Ingen Origin eller Referer header - potentiell CSRF
      console.warn("🚨 SUSPICIOUS REQUEST: No Origin/Referer header", { method, url: request.url });
      return NextResponse.json({ error: "CSRF: Missing Origin/Referer header" }, { status: 403 });
    }
  }

  // 🔐 SÄKERHETSHEADERS: Lägg till säkra headers på alla responses
  const response = NextResponse.next();

  // Säkra headers för XSS, clickjacking och andra skydd
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return response;
}
export const config = {
  matcher: [
    /*
     * Matcha alla request paths utom för följande:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
