"use server";

import { pool } from "../../_lib/db";
import { sanitizeInput, validateYear } from "../../_utils/validationUtils";
import { ensureSession } from "../../_utils/session";

export async function checkWelcomeStatus(): Promise<boolean> {
  try {
    const { userId } = await ensureSession();
    const client = await pool.connect();

    try {
      const result = await client.query('SELECT welcome_shown FROM "user" WHERE id = $1', [userId]);

      if (result.rows.length === 0) {
        return true;
      }

      return result.rows[0].welcome_shown !== true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error checking welcome status:", error);
    return false;
  }
}

export async function markWelcomeAsShown(): Promise<void> {
  try {
    const { userId } = await ensureSession();
    const result = await pool.query(
      'UPDATE "user" SET welcome_shown = true WHERE id = $1 RETURNING welcome_shown',
      [userId]
    );

    if (result.rowCount === 0) {
      console.warn(`markWelcomeAsShown: no user row updated for id ${userId}`);
    }
  } catch (error) {
    console.error("Error marking welcome as shown:", error);
  }
}

export async function fetchRawYearData(year: string) {
  try {
    const { userId } = await ensureSession();

    const sanitizedYear = sanitizeInput(year);
    const yearNum = parseInt(sanitizedYear);
    if (!validateYear(yearNum)) {
      throw new Error("Ogiltigt år");
    }

    const start = new Date(`${yearNum}-01-01`);
    const end = new Date(`${yearNum + 1}-01-01`);

    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          t.transaktionsdatum,
          tp.debet,
          tp.kredit,
          k.kontoklass,
          k.kontonummer
        FROM transaktioner t
        JOIN transaktionsposter tp ON t.id = tp.transaktions_id
        JOIN konton k ON tp.konto_id = k.id
        WHERE t.transaktionsdatum >= $1 AND t.transaktionsdatum < $2 AND t."user_id" = $3
        ORDER BY t.transaktionsdatum ASC
      `;

      const result = await client.query(query, [start, end, userId]);

      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ fetchRawYearData error:", error);
    return [];
  }
}
