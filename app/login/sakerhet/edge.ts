// app/login/sakerhet/edge.ts
import type { NextRequest } from "next/server";
import { auth } from "../../_lib/better-auth";
import { headers } from "next/headers";

// SÄKERHETSVALIDERING: Better Auth session handling
export async function authEdge(req: NextRequest) {
  try {
    // SÄKERHET: Miljö-specifik cookie-säkerhet
    const isProduction = process.env.NODE_ENV === "production";
    const isSecure = req.url.startsWith("https://") || isProduction;

    console.log(
      `🔒 Better Auth request: ${isProduction ? "PROD" : "DEV"} mode, secure: ${isSecure}`
    );

    // Hämta session från Better Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user) {
      console.log(`✅ Better Auth success for user: ${session.user.id}`);
      return {
        sub: session.user.id,
        ...session.user,
      };
    } else {
      console.log(`❌ Better Auth failed: No valid session`);
    }

    return null;
  } catch (error) {
    console.error(`🚨 Better Auth error:`, error);
    return null;
  }
}
