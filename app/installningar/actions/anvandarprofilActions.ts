"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import type { AktionsResultat, AnvandarInfo } from "../types/types";
import type { UppdateraAnvandarPayload } from "../types/types";
import { revalidatePath } from "next/cache";
import { requireValid, validateEmail } from "../../_utils/validationUtils";

export async function uppdateraAnvandarInfo(
  payload: UppdateraAnvandarPayload
): Promise<AktionsResultat<AnvandarInfo>> {
  try {
    const { userId } = await ensureSession();

    const name = (payload.name || "").trim();
    const email = (payload.email || "").trim();

    if (!name || !email) {
      return { success: false, error: "Namn och email ar obligatoriska" };
    }

    try {
      requireValid(email, validateEmail, "Ogiltig email-format");
    } catch {
      return { success: false, error: "Ogiltig email-format" };
    }

    const client = await pool.connect();
    let updated: AnvandarInfo | null = null;

    try {
      const result = await client.query<AnvandarInfo>(
        'UPDATE "user" SET name = $1, email = $2 WHERE id = $3 RETURNING id, email, name, "createdAt" as skapad',
        [name, email, userId]
      );
      updated = (result.rows[0] as AnvandarInfo | undefined) ?? null;
    } finally {
      client.release();
    }

    if (!updated) {
      return { success: false, error: "Anvandare kunde inte uppdateras" };
    }

    revalidatePath("/installningar");
    return { success: true, user: updated, data: updated };
  } catch (error) {
    console.error("[uppdateraAnvandarInfo] Fel vid uppdatering", error);
    return { success: false, error: error instanceof Error ? error.message : "Ett fel uppstod" };
  }
}
