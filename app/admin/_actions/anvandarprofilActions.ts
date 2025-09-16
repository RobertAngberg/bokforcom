"use server";

import { getUserId } from "../../_utils/authUtils";
import type { AnvandarInfo, AktionsResultat, UppdateraAnvandarPayload } from "../_types/types";
import { revalidatePath } from "next/cache";
import { queryOne } from "../../_utils/dbUtils";
import { sanitizeFormInput, requireValid } from "../../_utils/validationUtils";
import { logError } from "../../_utils/errorUtils";

export async function uppdateraAnvändarInfo(
  payload: UppdateraAnvandarPayload
): Promise<AktionsResultat<AnvandarInfo>> {
  try {
    const userId = await getUserId();

    const name = sanitizeFormInput(payload.name || "").trim();
    const email = sanitizeFormInput(payload.email || "").trim();

    if (!name || !email) {
      return { success: false, error: "Namn och email ar obligatoriska" };
    }

    try {
      requireValid(email, (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Ogiltig email-format");
    } catch (e) {
      return { success: false, error: "Ogiltig email-format" };
    }

    const updated = await queryOne<AnvandarInfo>(
      "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, email, name, created_at as skapad",
      [name, email, userId]
    );

    if (!updated) {
      return { success: false, error: "Anvandare kunde inte uppdateras" };
    }

    revalidatePath("/admin");
    return { success: true, user: updated, data: updated };
  } catch (error) {
    logError(error as Error, "uppdateraAnvändarInfo");
    return { success: false, error: error instanceof Error ? error.message : "Ett fel uppstod" };
  }
}
