// app/login/edge.ts
import { getToken } from "@auth/core/jwt";
import type { NextRequest } from "next/server";

// SÄKERHETSVALIDERING: Secure JWT token handling
export async function auth(req: NextRequest) {
  try {
    // SÄKERHET: Miljö-specifik cookie-säkerhet
    const isProduction = process.env.NODE_ENV === "production";
    const isSecure = req.url.startsWith("https://") || isProduction;

    console.log(`🔒 JWT Auth request: ${isProduction ? "PROD" : "DEV"} mode, secure: ${isSecure}`);

    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET,
      secureCookie: isSecure, // SÄKERHET: Säkra cookies i produktion
      cookieName: isProduction ? "__Secure-next-auth.session-token" : "next-auth.session-token",
    });

    if (token) {
      console.log(`✅ JWT Auth success for user: ${token.sub}`);
    } else {
      console.log(`❌ JWT Auth failed: No valid token`);
    }

    return token;
  } catch (error) {
    console.error(`🚨 JWT Auth error:`, error);
    return null;
  }
}
