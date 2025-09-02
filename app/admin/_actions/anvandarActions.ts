"use server";

import { Pool } from "pg";
import { getSessionAndUserId } from "../../_utils/authUtils";
import type { UserInfo, ActionResult } from "../_types/types";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * 🔥 Hamta anvandare information
 * Enterprise-grade user fetching
 */
export async function hamtaAnvandarInfo(): Promise<UserInfo | null> {
  try {
    const { session, userId } = await getSessionAndUserId();
    if (!session?.user?.email) {
      throw new Error("Ingen session hittad");
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT id, email, name, created_at as skapad FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
}

/**
 * 🔥 Uppdatera anvandare information
 * Enterprise-grade user updating with validation
 */
export async function uppdateraAnvandarInfo(formData: FormData): Promise<ActionResult<UserInfo>> {
  try {
    const { session, userId } = await getSessionAndUserId();
    if (!session?.user?.email) {
      return { success: false, error: "Ingen session hittad" };
    }

    const name = formData.get("name")?.toString()?.trim();
    const email = formData.get("email")?.toString()?.trim();

    if (!name || !email) {
      return { success: false, error: "Namn och email ar obligatoriska" };
    }

    // Sanity check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Ogiltig email-format" };
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, email, name, created_at as skapad",
        [name, email, userId]
      );

      if (result.rows.length === 0) {
        return { success: false, error: "Anvandare kunde inte uppdateras" };
      }

      return {
        success: true,
        user: result.rows[0],
        data: result.rows[0],
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating user info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod",
    };
  }
}
