"use server";

import { Pool } from "pg";
import { getSessionAndUserId } from "../../_utils/authUtils";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ============================================================================
// Admin Säkerhetsfunktioner
// ============================================================================

const adminAttempts = new Map<string, { attempts: number; lastAttempt: number }>();

export async function validateAdminSession(): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const { session, userId } = await getSessionAndUserId();
    if (!session?.user?.email) {
      return { valid: false, error: "Ingen session hittad" };
    }

    // 🔒 ADMIN-BEHORIGHET KONTROLL
    // TODO: Implementera admin-roll i databasen
    // For tillfalligt: kontrollera om anvandaren ar super-admin via env
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    const userEmail = session.user.email;

    if (!userEmail || !adminEmails.includes(userEmail)) {
      await logAdminSecurityEvent(
        userId.toString(),
        "unauthorized_admin_access",
        `Unauthorized access attempt from: ${userEmail}`
      );
      return { valid: false, error: "Otillracklig behorighet - endast administratorer" };
    }

    return { valid: true, userId: userId.toString() };
  } catch (error) {
    console.error("Admin session validation error:", error);
    return { valid: false, error: "Sessionvalidering misslyckades" };
  }
}

export async function validateAdminAttempt(userId: string): Promise<boolean> {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minuter
  const maxAttempts = 10; // Striktare for admin-funktioner

  const userAttempts = adminAttempts.get(userId) || { attempts: 0, lastAttempt: 0 };

  if (now - userAttempts.lastAttempt > windowMs) {
    userAttempts.attempts = 0;
  }

  if (userAttempts.attempts >= maxAttempts) {
    await logAdminSecurityEvent(
      userId,
      "admin_rate_limit_exceeded",
      `Admin rate limit exceeded: ${userAttempts.attempts} attempts`
    );
    return false;
  }

  userAttempts.attempts++;
  userAttempts.lastAttempt = now;
  adminAttempts.set(userId, userAttempts);

  return true;
}
export async function logAdminSecurityEvent(
  userId: string,
  eventType: string,
  details: string
): Promise<void> {
  try {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO security_logs (user_id, event_type, details, module, timestamp) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, eventType, details, "admin"]
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Failed to log admin security event:", error);
  }
}

export async function hamtaAdminStatistik() {
  try {
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Atkomst nekad");
    }

    const client = await pool.connect();
    try {
      const [usersCount, companiesCount, transactionsCount, securityEvents] = await Promise.all([
        client.query("SELECT COUNT(*) as count FROM users"),
        client.query("SELECT COUNT(*) as count FROM foretagsprofil"),
        client.query("SELECT COUNT(*) as count FROM transaktioner"),
        client.query(
          "SELECT COUNT(*) as count FROM security_logs WHERE timestamp > NOW() - INTERVAL '24 hours'"
        ),
      ]);

      return {
        users: parseInt(usersCount.rows[0].count),
        companies: parseInt(companiesCount.rows[0].count),
        transactions: parseInt(transactionsCount.rows[0].count),
        securityEventsLast24h: parseInt(securityEvents.rows[0].count),
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return null;
  }
}
