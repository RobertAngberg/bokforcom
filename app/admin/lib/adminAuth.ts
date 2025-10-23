"use server";

import { auth } from "../../_lib/better-auth";
import { headers } from "next/headers";

// Centralized admin configuration
const ADMIN_EMAILS: string[] = [
  "robertangberg@gmail.com",
  // Lägg till fler admin emails här om behövs
];

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return false;
    }

    return ADMIN_EMAILS.includes(session.user.email);
  } catch (error) {
    console.error("Admin check error:", error);
    return false;
  }
}

/**
 * Ensure current user is admin, throw if not
 */
export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  if (!session.user.email || !ADMIN_EMAILS.includes(session.user.email)) {
    throw new Error("Access denied - admin only");
  }

  return session;
}

/**
 * Get admin emails (for display purposes)
 */
export async function getAdminEmails(): Promise<string[]> {
  return [...ADMIN_EMAILS];
}
