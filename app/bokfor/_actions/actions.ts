"use server";

import { pool } from "../../_lib/db";
import { getUserId } from "../../_utils/authUtils";
import { sanitizeFormInput } from "../../_utils/validationUtils";

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

export async function loggaFavoritförval(forvalId: number) {
  const userId = await getUserId();

  try {
    await pool.query(
      `
      INSERT INTO favoritförval (user_id, forval_id, antal, senaste)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (user_id, forval_id)
      DO UPDATE SET antal = favoritförval.antal + 1, senaste = NOW()
      `,
      [userId, forvalId]
    );
  } catch (error) {
    console.error("❌ loggaFavoritförval error:", error);
  }
}

export async function hamtaFavoritforval(): Promise<any[]> {
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
    console.error("❌ hamtaFavoritforval error:", error);
    return [];
  }
}

export async function fetchAllaForval(filters?: { sök?: string; kategori?: string; typ?: string }) {
  let query = "SELECT * FROM förval";
  const values: any[] = [];
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

  if (filters?.kategori) {
    conditions.push(`kategori = $${values.length + 1}`);
    values.push(filters.kategori);
  }

  if (filters?.typ) {
    conditions.push(`typ = $${values.length + 1}`);
    values.push(filters.typ);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(" AND ");
  }

  query += ` ORDER BY namn`;

  const res = await pool.query(query, values);
  return res.rows;
}

export async function fetchFavoritforval() {
  const userId = await getUserId();

  const query = `
    SELECT f.*
    FROM favoritförval ff
    JOIN förval f ON ff.forval_id = f.id
    WHERE ff.user_id = $1
    ORDER BY ff.antal DESC
    LIMIT 5
  `;

  const client = await pool.connect();
  try {
    const res = await client.query(query, [userId]);
    return res.rows;
  } finally {
    client.release();
  }
}

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
