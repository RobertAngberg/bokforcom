"use server";

import { Pool } from "pg";
import { getSessionAndUserId } from "../../_utils/authUtils";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ============================================================================
// Transaktionsposter
// ============================================================================

export async function hamtaTransaktionsposter(transaktionsId: number) {
  try {
    const { session } = await getSessionAndUserId();
    if (!session?.user?.email) {
      throw new Error("Ingen session hittad");
    }

    if (!transaktionsId || isNaN(transaktionsId) || transaktionsId <= 0) {
      throw new Error("Ogiltigt transaktions-ID");
    }

    const result = await pool.query(
      `
      SELECT 
        k.kontonummer, 
        k.beskrivning AS kontobeskrivning, 
        tp.debet, 
        tp.kredit
      FROM transaktionsposter tp
      LEFT JOIN konton k ON k.id = tp.konto_id
      WHERE tp.transaktions_id = $1
    `,
      [transaktionsId]
    );

    return result.rows;
  } catch (error) {
    console.error("❌ hamtaTransaktionsposter error:", error);
    return [];
  }
}

// ============================================================================
// Förval
// ============================================================================

export async function fetchAllaForval(filters?: { sok?: string; kategori?: string; typ?: string }) {
  try {
    const { session } = await getSessionAndUserId();
    if (!session?.user?.email) {
      throw new Error("Ingen session hittad");
    }

    let query = "SELECT * FROM forval";
    const values: any[] = [];
    const conditions: string[] = [];

    if (filters?.sok) {
      conditions.push(
        `(LOWER(namn) LIKE $${values.length + 1} OR LOWER(beskrivning) LIKE $${values.length + 1})`
      );
      values.push(`%${filters.sok.toLowerCase()}%`);
    }

    if (filters?.kategori) {
      conditions.push(`kategori = $${values.length + 1}`);
      values.push(filters.kategori);
    }

    if (filters?.typ) {
      conditions.push(`typ = $${values.length + 1}`);
      values.push(filters.typ);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY namn ASC";

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("❌ fetchAllaForval error:", error);
    return [];
  }
}

// ============================================================================
// Fakturanummer
// ============================================================================

export async function uppdateraFakturanummer(id: number, nyttNummer: string) {
  try {
    const { session } = await getSessionAndUserId();
    if (!session?.user?.email) {
      throw new Error("Ingen session hittad");
    }

    const result = await pool.query(
      "UPDATE fakturamallar SET fakturanummer = $1 WHERE id = $2 RETURNING *",
      [nyttNummer, id]
    );

    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error("❌ uppdateraFakturanummer error:", error);
    throw error;
  }
}
