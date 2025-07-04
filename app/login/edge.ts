// app/login/edge.ts
import { getToken } from "@auth/core/jwt";
import type { NextRequest } from "next/server";

export async function auth(req: NextRequest) {
  return await getToken({
    req,
    secret: process.env.AUTH_SECRET, // 👈 måste sättas manuellt
    secureCookie: false, // false för localhost, true i prod/https
  });
}
