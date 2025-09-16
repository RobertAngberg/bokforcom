"use server";

import { auth } from "../../_lib/auth";
import type { ForetagsProfil, AktionsResultat } from "../_types/types";
import { revalidatePath } from "next/cache";
import { query, queryOne } from "../../_utils/dbUtils";
import { sanitizeFormInput } from "../../_utils/validationUtils";
import { logError } from "../../_utils/errorUtils";

export async function uppdateraForetagsprofilAdmin(
  payload: ForetagsProfil
): Promise<AktionsResultat<ForetagsProfil>> {
  try {
    const session = await auth();
    const userId = session?.user?.id; // Middleware garanterar att detta finns

    const foretagsnamn = sanitizeFormInput(payload.foretagsnamn || "");
    const adress = sanitizeFormInput(payload.adress || "");
    const postnummer = payload.postnummer || "";
    const stad = sanitizeFormInput(payload.stad || "");
    const organisationsnummer = payload.organisationsnummer || "";
    const momsregistreringsnummer = payload.momsregistreringsnummer || "";
    const telefonnummer = sanitizeFormInput(payload.telefonnummer || "");
    const epost = sanitizeFormInput(payload.epost || "");
    const webbplats = sanitizeFormInput(payload.webbplats || "");

    const updated = await queryOne<ForetagsProfil>(
      `INSERT INTO företagsprofil 
       (id, företagsnamn, adress, postnummer, stad, organisationsnummer, 
        momsregistreringsnummer, telefonnummer, epost, webbplats) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) 
       DO UPDATE SET 
         företagsnamn = EXCLUDED.företagsnamn,
         adress = EXCLUDED.adress,
         postnummer = EXCLUDED.postnummer,
         stad = EXCLUDED.stad,
         organisationsnummer = EXCLUDED.organisationsnummer,
         momsregistreringsnummer = EXCLUDED.momsregistreringsnummer,
         telefonnummer = EXCLUDED.telefonnummer,
         epost = EXCLUDED.epost,
         webbplats = EXCLUDED.webbplats
       RETURNING företagsnamn as foretagsnamn, adress, postnummer, stad, organisationsnummer, momsregistreringsnummer, telefonnummer, epost, webbplats`,
      [
        userId,
        foretagsnamn,
        adress,
        postnummer,
        stad,
        organisationsnummer,
        momsregistreringsnummer,
        telefonnummer,
        epost,
        webbplats,
      ]
    );

    revalidatePath("/admin");
    return { success: true, data: updated || undefined };
  } catch (error) {
    logError(error as Error, "uppdateraForetagsprofilAdmin");
    return { success: false, error: error instanceof Error ? error.message : "Ett fel uppstod" };
  }
}
