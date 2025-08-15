import { auth } from "./auth";

export default auth((req) => {
  // Tillåt åtkomst till /login och /signup för alla
  if (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup") {
    return;
  }

  // För alla andra sidor: redirect till /login om inte inloggad
  if (!req.auth) {
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/auth (authentication routes)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico (favicon file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
