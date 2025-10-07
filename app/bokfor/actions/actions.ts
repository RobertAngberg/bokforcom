"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";

export async function loggaFavoritförval(forvalId: number) {
  const { userId } = await ensureSession();

  try {
    await pool.query(
      `
      INSERT INTO favoritförval (user_id, forval_id, antal, senaste)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (user_id, forval_id)
      DO UPDATE SET antal = favoritförval.antal + 1, senaste = NOW()
      `,
      [userId, forvalId]
    );
  } catch (error) {
    console.error("❌ loggaFavoritförval error:", error);
  }
}
