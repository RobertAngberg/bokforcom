"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import type { AktionsResultat } from "../../_types/common";

export async function raderaForetag(): Promise<AktionsResultat> {
  try {
    const { userId } = await ensureSession();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        "DELETE FROM transaktionsposter WHERE transaktions_id IN (SELECT id FROM transaktioner WHERE anvandare_id = $1)",
        [userId]
      );
      await client.query("DELETE FROM transaktioner WHERE anvandare_id = $1", [userId]);
      await client.query("DELETE FROM fakturor WHERE anvandare_id = $1", [userId]);
      await client.query("DELETE FROM företagsprofil WHERE id = $1", [userId]);
      await client.query('DELETE FROM "user" WHERE id = $1', [userId]);

      await client.query("COMMIT");
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("❌ ROLLBACK misslyckades i raderaForetag:", rollbackError);
      }
      throw error;
    } finally {
      client.release();
    }

    return { success: true };
  } catch (error) {
    console.error("[raderaForetag] Fel vid radering", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod vid radering",
    };
  }
}
