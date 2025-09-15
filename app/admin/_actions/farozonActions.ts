"use server";

import { auth } from "../../_lib/auth";
import { withTransaction } from "../../_utils/dbUtils";
import { logError } from "../../_utils/errorUtils";
import type { AktionsResultat } from "../_types/types";

export async function raderaForetag(): Promise<AktionsResultat> {
  try {
    const session = await auth();
    const userId = session?.user?.id; // Middleware garanterar att detta finns

    await withTransaction(async (client: any) => {
      await client.query(
        "DELETE FROM transaktionsposter WHERE transaktions_id IN (SELECT id FROM transaktioner WHERE anvandare_id = $1)",
        [userId]
      );
      await client.query("DELETE FROM transaktioner WHERE anvandare_id = $1", [userId]);
      await client.query("DELETE FROM fakturor WHERE anvandare_id = $1", [userId]);
      await client.query("DELETE FROM företagsprofil WHERE id = $1", [userId]);
      await client.query("DELETE FROM users WHERE id = $1", [userId]);
    });

    return { success: true };
  } catch (error) {
    logError(error as Error, "raderaForetag");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod vid radering",
    };
  }
}
