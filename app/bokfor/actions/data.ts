import { pool } from "../../_lib/db";
import { getUserId } from "../../_utils/authUtils";
import { sanitizeFormInput } from "../../_utils/validationUtils";

// Bokföringsmetod data
export async function hämtaBokföringsmetod() {
  const userId = await getUserId();

  try {
    const client = await pool.connect();
    const query = "SELECT bokföringsmetod FROM users WHERE id = $1";
    const res = await client.query(query, [userId]);
    client.release();

    if (res.rows.length === 0) {
      console.warn("⛔ Användare inte funnen:", userId);
      return "Kontantmetoden"; // Default fallback
    }

    return res.rows[0].bokföringsmetod || "Kontantmetoden";
  } catch (error) {
    console.error("❌ hämtaBokföringsmetod error:", error);
    return "Kontantmetoden"; // Default fallback
  }
}

// Favoritförval data
export async function hämtaFavoritförval(): Promise<unknown[]> {
  const userId = await getUserId();

  try {
    const result = await pool.query(
      `
      SELECT f.*
      FROM favoritförval ff
      JOIN förval f ON ff.forval_id = f.id
      WHERE ff.user_id = $1
      ORDER BY ff.antal DESC, ff.senaste DESC
      LIMIT 10
      `,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error("❌ hämtaFavoritförval error:", error);
    return [];
  }
}

// Alla förval data
export async function hämtaAllaFörval(filters?: { sök?: string; kategori?: string; typ?: string }) {
  let query = "SELECT * FROM förval";
  const values: (string | number)[] = [];
  const conditions: string[] = [];

  if (filters?.sök) {
    const safeSearch = sanitizeFormInput(filters.sök);
    if (safeSearch) {
      conditions.push(
        `(LOWER(namn) LIKE $${values.length + 1} OR LOWER(beskrivning) LIKE $${values.length + 1})`
      );
      values.push(`%${safeSearch.toLowerCase()}%`);
    }
  }

  if (filters?.kategori && filters.kategori !== "Alla") {
    conditions.push(`kategori = $${values.length + 1}`);
    values.push(filters.kategori);
  }

  if (filters?.typ && filters.typ !== "Alla") {
    conditions.push(`typ = $${values.length + 1}`);
    values.push(filters.typ);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY namn";

  const res = await pool.query(query, values);
  return res.rows;
}

// Anställda data
export async function hämtaAnställda() {
  const userId = await getUserId();

  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT id, förnamn, efternamn FROM anställda WHERE user_id = $1 ORDER BY förnamn, efternamn",
      [userId]
    );

    return result.rows;
  } finally {
    client.release();
  }
}
