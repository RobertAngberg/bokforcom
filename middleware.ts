// import { auth } from "@/auth"; // ← Din riktiga auth.ts fil!
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export async function middleware(req: NextRequest) {
//   // Tillåt auth routes först
//   if (req.nextUrl.pathname.startsWith("/api/auth")) {
//     return NextResponse.next();
//   }

//   const session = await auth();

//   if (!session?.user?.email) {
//     const signInUrl = new URL("/api/auth/signin", req.url);
//     signInUrl.searchParams.set("callbackUrl", req.url);
//     return NextResponse.redirect(signInUrl);
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
// };

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  console.log("🔍 Middleware körs på:", req.nextUrl.hostname);

  // Tillåt auth routes först
  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    console.log("✅ Auth route - tillåter");
    return NextResponse.next();
  }

  const isLocalhost = req.nextUrl.hostname === "localhost" || req.nextUrl.hostname === "127.0.0.1";

  console.log("🏠 Är localhost?", isLocalhost);

  if (!isLocalhost) {
    console.log("🌐 Production - skippar auth");
    return NextResponse.next();
  }

  console.log("🔐 Localhost - kollar session");

  // Vänta lite om vi kommer från callback
  if (req.headers.get("referer")?.includes("/api/auth/callback")) {
    console.log("⏳ Kommer från callback - väntar...");
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const session = await auth();
  console.log("👤 Session:", !!session?.user?.email);

  if (!session?.user?.email) {
    console.log("❌ Ingen session - redirectar");
    const signInUrl = new URL("/api/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  console.log("✅ Session finns - tillåter");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
