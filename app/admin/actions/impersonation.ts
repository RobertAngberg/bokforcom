"use server";

import { requireAdmin } from "../lib/adminAuth";
import { pool } from "../../_lib/db";
import { auth } from "../../_lib/better-auth";
import { headers } from "next/headers";

/**
 * Start impersonating a user (admin only)
 */
export async function impersonateUser(targetUserId: string) {
  try {
    const adminSession = await requireAdmin();

    // Can't impersonate yourself
    if (adminSession.user.id === targetUserId) {
      return { success: false, error: "Cannot impersonate yourself" };
    }

    // Check if target user exists
    const userResult = await pool.query('SELECT id, email, name FROM "user" WHERE id = $1', [
      targetUserId,
    ]);

    if (userResult.rows.length === 0) {
      return { success: false, error: "User not found" };
    }

    const targetUser = userResult.rows[0];

    // End any existing impersonation sessions for this admin
    await pool.query(
      `UPDATE impersonation_sessions 
       SET is_active = false, ended_at = NOW() 
       WHERE admin_user_id = $1 AND is_active = true`,
      [adminSession.user.id]
    );

    // Create new impersonation session
    const insertResult = await pool.query(
      `INSERT INTO impersonation_sessions (admin_user_id, target_user_id, is_active) 
       VALUES ($1, $2, true)
       RETURNING id`,
      [adminSession.user.id, targetUserId]
    );

    console.log(
      `✅ Admin ${adminSession.user.email} started impersonating ${targetUser.email} (session ID: ${insertResult.rows[0].id})`
    );

    return {
      success: true,
      message: `Now impersonating ${targetUser.name || targetUser.email}`,
      redirectUrl: "/start",
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
    };
  } catch (error) {
    console.error("Impersonation error:", error);
    return { success: false, error: "Failed to impersonate user" };
  }
}

/**
 * Stop impersonating and return to admin session
 */
export async function stopImpersonation() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "No session found" };
    }

    // End the active impersonation session
    const result = await pool.query(
      `UPDATE impersonation_sessions 
       SET is_active = false, ended_at = NOW() 
       WHERE admin_user_id = $1 AND is_active = true
       RETURNING admin_user_id`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return { success: false, error: "No active impersonation found" };
    }

    console.log(`✅ Admin ${session.user.email} stopped impersonating`);

    return {
      success: true,
      message: "Impersonation ended",
    };
  } catch (error) {
    console.error("Stop impersonation error:", error);
    return { success: false, error: "Failed to stop impersonation" };
  }
}

/**
 * Check if current session is impersonating someone
 */
export async function getImpersonationStatus() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { isImpersonating: false };
    }

    // Check if there's an active impersonation where current user is the admin
    const result = await pool.query(
      `SELECT 
        i.id as session_id,
        i.target_user_id,
        u.email as target_email,
        u.name as target_name
       FROM impersonation_sessions i
       JOIN "user" u ON i.target_user_id = u.id
       WHERE i.admin_user_id = $1 AND i.is_active = true
       LIMIT 1`,
      [session.user.id]
    );

    if (result.rows.length > 0) {
      console.log(
        `🎭 Impersonation active: Admin ${session.user.email} -> ${result.rows[0].target_email}`
      );
      return {
        isImpersonating: true,
        targetUser: {
          id: result.rows[0].target_user_id,
          email: result.rows[0].target_email,
          name: result.rows[0].target_name,
        },
      };
    }

    return { isImpersonating: false };
  } catch (error) {
    console.error("Get impersonation status error:", error);
    return { isImpersonating: false };
  }
}
