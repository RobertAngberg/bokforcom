"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import type { ForetagsProfil, AktionsResultat } from "../types/types";
import { revalidatePath } from "next/cache";

export async function uppdateraForetagsprofilAdmin(
  payload: ForetagsProfil
): Promise<AktionsResultat<ForetagsProfil>> {
  try {
    const { userId } = await ensureSession();

    const foretagsnamn = (payload.foretagsnamn || "").trim();
    const adress = (payload.adress || "").trim();
    const postnummer = payload.postnummer || "";
    const stad = (payload.stad || "").trim();
    const organisationsnummer = payload.organisationsnummer || "";
    const momsregistreringsnummer = payload.momsregistreringsnummer || "";
    const telefonnummer = (payload.telefonnummer || "").trim();
    const epost = (payload.epost || "").trim();
    const webbplats = (payload.webbplats || "").trim();
    const logo = payload.logo || "";

    const client = await pool.connect();
    let updated: ForetagsProfil | null = null;

    try {
      const result = await client.query<ForetagsProfil>(
        `INSERT INTO företagsprofil 
       (id, företagsnamn, adress, postnummer, stad, organisationsnummer, 
        momsregistreringsnummer, telefonnummer, epost, webbplats, logo_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
         webbplats = EXCLUDED.webbplats,
         logo_url = EXCLUDED.logo_url
       RETURNING företagsnamn as foretagsnamn, adress, postnummer, stad, organisationsnummer, momsregistreringsnummer, telefonnummer, epost, webbplats, logo_url as logo`,
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
          logo || null,
        ]
      );
      updated = (result.rows[0] as ForetagsProfil | undefined) ?? null;
    } finally {
      client.release();
    }

    revalidatePath("/installningar");
    return { success: true, data: updated || undefined };
  } catch (error) {
    console.error("[uppdateraForetagsprofilAdmin] Fel vid uppdatering", error);
    return { success: false, error: error instanceof Error ? error.message : "Ett fel uppstod" };
  }
}
