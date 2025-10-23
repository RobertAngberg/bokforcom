import { auth } from "../_lib/better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserId } from "../_types/common";
import { pool } from "../_lib/db";

export type BetterAuthSession = {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt?: Date;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};

/**
 * Get the effective user ID, considering impersonation
 * If admin is impersonating, return the target user ID
 */
async function getEffectiveUserId(currentUserId: string): Promise<string> {
  try {
    // Check if current user is impersonating someone
    const result = await pool.query(
      `SELECT target_user_id 
       FROM impersonation_sessions 
       WHERE admin_user_id = $1 AND is_active = true 
       LIMIT 1`,
      [currentUserId]
    );

    if (result.rows.length > 0) {
      // Return the target user's ID (the one being impersonated)
      return result.rows[0].target_user_id;
    }

    // No impersonation, return current user ID
    return currentUserId;
  } catch (error) {
    console.error("Error checking impersonation:", error);
    return currentUserId;
  }
}

export async function ensureSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Get the effective user ID (considering impersonation)
  const effectiveUserId = await getEffectiveUserId(session.user.id);

  return {
    session: session as BetterAuthSession,
    userId: effectiveUserId as UserId,
    isImpersonating: effectiveUserId !== session.user.id,
    actualUserId: session.user.id as UserId, // The real logged-in user (admin)
  };
}
