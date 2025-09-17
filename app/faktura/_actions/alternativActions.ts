"use server";

import { pool } from "../../_lib/db";

export async function hämtaSenasteBetalningsmetod(userId: string) {
  try {
    const result = await pool.query(
      `
      SELECT 
        betalningsmetod, 
        nummer
      FROM fakturor 
      WHERE "user_id" = $1 
        AND betalningsmetod IS NOT NULL 
        AND betalningsmetod != ''
        AND nummer IS NOT NULL
        AND nummer != ''
      ORDER BY id DESC
      LIMIT 1
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return { betalningsmetod: null, nummer: null };
    }

    const { betalningsmetod, nummer } = result.rows[0];
    return { betalningsmetod, nummer };
  } catch (error) {
    console.error("❌ Fel vid hämtning av senaste betalningsmetod:", error);
    return { betalningsmetod: null, nummer: null };
  }
}
