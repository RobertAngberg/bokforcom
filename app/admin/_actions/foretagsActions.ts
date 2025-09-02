"use server";

import { Pool } from "pg";
import { getSessionAndUserId } from "../../_utils/authUtils";
import { sanitizeAdminInput } from "../../_utils/validationUtils";
import type { ForetagsProfil, ActionResult } from "../_types/types";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * 🔥 Hamta foretags profil (Admin version)
 * Enterprise-grade company profile fetching
 */
export async function hamtaForetagsprofilAdmin(): Promise<ForetagsProfil | null> {
  try {
    const { session, userId } = await getSessionAndUserId();
    if (!session?.user?.email) {
      throw new Error("Ingen session hittad");
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          företagsnamn, adress, postnummer, stad, 
          organisationsnummer, momsregistreringsnummer, 
          telefonnummer, epost, webbplats 
         FROM företagsprofil WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        // Return empty profile if none exists
        return {
          foretagsnamn: "",
          adress: "",
          postnummer: "",
          stad: "",
          organisationsnummer: "",
          momsregistreringsnummer: "",
          telefonnummer: "",
          epost: "",
          webbplats: "",
        };
      }

      // Map Swedish database columns to English TypeScript properties
      const dbRow = result.rows[0];
      return {
        foretagsnamn: dbRow.företagsnamn || "",
        adress: dbRow.adress || "",
        postnummer: dbRow.postnummer || "",
        stad: dbRow.stad || "",
        organisationsnummer: dbRow.organisationsnummer || "",
        momsregistreringsnummer: dbRow.momsregistreringsnummer || "",
        telefonnummer: dbRow.telefonnummer || "",
        epost: dbRow.epost || "",
        webbplats: dbRow.webbplats || "",
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return null;
  }
}

/**
 * 🔥 Uppdatera foretags profil (Admin version)
 * Enterprise-grade company profile updating
 */
export async function uppdateraForetagsprofilAdmin(
  formData: FormData
): Promise<ActionResult<ForetagsProfil>> {
  try {
    const { session, userId } = await getSessionAndUserId();
    if (!session?.user?.email) {
      return { success: false, error: "Ingen session hittad" };
    }

    const foretagsnamn = sanitizeAdminInput(formData.get("foretagsnamn")?.toString() || "");
    const adress = sanitizeAdminInput(formData.get("adress")?.toString() || "");
    const postnummer = sanitizeAdminInput(formData.get("postnummer")?.toString() || "");
    const stad = sanitizeAdminInput(formData.get("stad")?.toString() || "");
    const organisationsnummer = sanitizeAdminInput(
      formData.get("organisationsnummer")?.toString() || ""
    );
    const momsregistreringsnummer = sanitizeAdminInput(
      formData.get("momsregistreringsnummer")?.toString() || ""
    );
    const telefonnummer = sanitizeAdminInput(formData.get("telefonnummer")?.toString() || "");
    const epost = sanitizeAdminInput(formData.get("epost")?.toString() || "");
    const webbplats = sanitizeAdminInput(formData.get("webbplats")?.toString() || "");

    const client = await pool.connect();
    try {
      // Upsert operation
      const result = await client.query(
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
           webbplats = EXCLUDED.webbplats`,
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

      return {
        success: true,
        data: result.rows[0],
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating company profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod",
    };
  }
}

/**
 * 🔥 Radera foretag (DANGER ZONE)
 * Enterprise-grade company deletion with full cleanup
 */
export async function raderaForetag(): Promise<ActionResult> {
  try {
    const { session, userId } = await getSessionAndUserId();
    if (!session?.user?.email) {
      return { success: false, error: "Ingen session hittad" };
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete in correct order to respect foreign key constraints
      await client.query(
        "DELETE FROM transaktionsposter WHERE transaktions_id IN (SELECT id FROM transaktioner WHERE anvandare_id = $1)",
        [userId]
      );
      await client.query("DELETE FROM transaktioner WHERE anvandare_id = $1", [userId]);
      await client.query("DELETE FROM fakturor WHERE anvandare_id = $1", [userId]);
      await client.query("DELETE FROM företagsprofil WHERE id = $1", [userId]);
      await client.query("DELETE FROM users WHERE id = $1", [userId]);

      await client.query("COMMIT");

      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error deleting company:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod vid radering",
    };
  }
}
