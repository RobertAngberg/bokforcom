import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const method = request.method;

  // CSRF-skydd för state-changing requests
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
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
  }

  // Lägg till säkra headers på alla responses
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
