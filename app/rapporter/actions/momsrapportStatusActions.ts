"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import type { MomsrapportStatus, MomsrapportStatusData } from "../types/types";

/**
 * Hämta eller skapa momsrapport-status för en period
 */
export async function getMomsrapportStatus(year: number, period: string) {
  try {
    const { userId } = await ensureSession();

    const result = await pool.query(
      `INSERT INTO momsrapporter (user_id, year, period)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, year, period) 
       DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, year, period]
    );

    return { success: true, data: result.rows[0] as MomsrapportStatusData };
  } catch (error) {
    console.error("Fel vid hämtning av momsrapport-status:", error);
    return { success: false, error: "Kunde inte hämta momsrapport-status" };
  }
}

/**
 * Uppdatera status för en momsrapport
 */
export async function updateMomsrapportStatus(
  year: number,
  period: string,
  status: MomsrapportStatus
) {
  try {
    const { userId } = await ensureSession();

    // Sätt rätt datum-kolumn baserat på status
    let datumKolumn = "";
    if (status === "granskad") datumKolumn = ", granskad_datum = CURRENT_TIMESTAMP";
    if (status === "deklarerad") datumKolumn = ", deklarerad_datum = CURRENT_TIMESTAMP";
    if (status === "betald") datumKolumn = ", betald_datum = CURRENT_TIMESTAMP";

    const result = await pool.query(
      `UPDATE momsrapporter 
       SET status = $1, updated_at = CURRENT_TIMESTAMP ${datumKolumn}
       WHERE user_id = $2 AND year = $3 AND period = $4
       RETURNING *`,
      [status, userId, year, period]
    );

    if (result.rows.length === 0) {
      return { success: false, error: "Momsrapport hittades inte" };
    }

    return { success: true, data: result.rows[0] as MomsrapportStatusData };
  } catch (error) {
    console.error("Fel vid uppdatering av momsrapport-status:", error);
    return { success: false, error: "Kunde inte uppdatera status" };
  }
}

/**
 * Markera att XML har genererats
 */
export async function markXMLGenerated(year: number, period: string) {
  try {
    const { userId } = await ensureSession();

    const result = await pool.query(
      `UPDATE momsrapporter 
       SET xml_genererad = true, 
           xml_genererad_datum = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND year = $2 AND period = $3
       RETURNING *`,
      [userId, year, period]
    );

    return { success: true, data: result.rows[0] as MomsrapportStatusData };
  } catch (error) {
    console.error("Fel vid markering av XML-generering:", error);
    return { success: false, error: "Kunde inte markera XML som genererad" };
  }
}

/**
 * Spara betalningsinfo
 */
export async function saveBetalningsinfo(
  year: number,
  period: string,
  data: {
    moms_att_betala: number;
    ocr_nummer?: string;
    betalningsreferens?: string;
  }
) {
  try {
    const { userId } = await ensureSession();

    const result = await pool.query(
      `UPDATE momsrapporter 
       SET moms_att_betala = $1,
           ocr_nummer = $2,
           betalningsreferens = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4 AND year = $5 AND period = $6
       RETURNING *`,
      [
        data.moms_att_betala,
        data.ocr_nummer || null,
        data.betalningsreferens || null,
        userId,
        year,
        period,
      ]
    );

    return { success: true, data: result.rows[0] as MomsrapportStatusData };
  } catch (error) {
    console.error("Fel vid sparande av betalningsinfo:", error);
    return { success: false, error: "Kunde inte spara betalningsinfo" };
  }
}

/**
 * Spara noteringar
 */
export async function saveNoteringar(year: number, period: string, noteringar: string) {
  try {
    const { userId } = await ensureSession();

    const result = await pool.query(
      `UPDATE momsrapporter 
       SET noteringar = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND year = $3 AND period = $4
       RETURNING *`,
      [noteringar, userId, year, period]
    );

    return { success: true, data: result.rows[0] as MomsrapportStatusData };
  } catch (error) {
    console.error("Fel vid sparande av noteringar:", error);
    return { success: false, error: "Kunde inte spara noteringar" };
  }
}

/**
 * Hämta alla momsrapporter för en användare (för historik)
 */
export async function getAllMomsrapporter(year?: number) {
  try {
    const { userId } = await ensureSession();

    let query = `
      SELECT * FROM momsrapporter 
      WHERE user_id = $1
    `;
    const params: (string | number)[] = [userId];

    if (year) {
      query += ` AND year = $2`;
      params.push(year);
    }

    query += ` ORDER BY year DESC, period DESC`;

    const result = await pool.query(query, params);

    return { success: true, data: result.rows as MomsrapportStatusData[] };
  } catch (error) {
    console.error("Fel vid hämtning av momsrapporter:", error);
    return { success: false, error: "Kunde inte hämta momsrapporter" };
  }
}

/**
 * Validera att period matchar användarens momsperiod
 */
export async function validatePeriod(period: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { userId } = await ensureSession();

    const result = await pool.query(`SELECT momsperiod FROM "user" WHERE id = $1`, [userId]);

    if (result.rows.length === 0) {
      return { success: false, error: "Användare hittades inte" };
    }

    const momsperiod = result.rows[0].momsperiod;

    // Validera period mot momsperiod
    if (momsperiod === "Månadsvis" && !period.match(/^\d{2}$/)) {
      return {
        success: false,
        error: "Du har valt månadsredovisning - välj en specifik månad",
      };
    }

    if (momsperiod === "Kvartalsvis" && !period.match(/^Q[1-4]$/)) {
      return {
        success: false,
        error: "Du har valt kvartalsredovisning - välj ett kvartal (Q1-Q4)",
      };
    }

    if (momsperiod === "Årsvis" && period !== "all") {
      return {
        success: false,
        error: "Du har valt årsredovisning - välj helår",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Fel vid validering av period:", error);
    return { success: false, error: "Kunde inte validera period" };
  }
}

/**
 * Kontrollera om en momsperiod är stängd
 */
export async function isPeriodClosed(
  year: number,
  period: string
): Promise<{ closed: boolean; status?: MomsrapportStatus }> {
  try {
    const { userId } = await ensureSession();

    const result = await pool.query(
      `SELECT status FROM momsrapporter 
       WHERE user_id = $1 AND year = $2 AND period = $3`,
      [userId, year, period]
    );

    if (result.rows.length === 0) {
      return { closed: false };
    }

    const status = result.rows[0].status as MomsrapportStatus;
    return {
      closed: status === "stängd",
      status,
    };
  } catch (error) {
    console.error("Fel vid kontroll av stängd period:", error);
    return { closed: false };
  }
}
