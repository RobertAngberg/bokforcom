"use server";

import { getSessionAndUserId } from "../../_utils/authUtils";

// ============================================================================
// Admin Säkerhetsfunktioner (förenklad)
// ============================================================================

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

    // Om du är inloggad, så är du admin. Klart.
    return { valid: true, userId: userId.toString() };
  } catch (error) {
    console.error("Admin session validation error:", error);
    return { valid: false, error: "Sessionvalidering misslyckades" };
  }
}

export async function hamtaAdminStatistik() {
  try {
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    // Returnera lite grundläggande stats om du verkligen behöver dem
    return {
      users: 0,
      companies: 0,
      transactions: 0,
      securityEventsLast24h: 0,
    };
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return null;
  }
}
