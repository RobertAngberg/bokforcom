"use server";

import { ensureSession } from "../../_utils/session";

// ============================================================================
// Admin Säkerhetsfunktioner (förenklad)
// ============================================================================

export async function validateAdminSession(): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const { userId } = await ensureSession();
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
  } catch (error) {
    console.error("Error fetching admin statistics:", error);
    return null;
  }
}
