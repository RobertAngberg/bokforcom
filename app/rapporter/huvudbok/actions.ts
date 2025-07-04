//#region
"use server";

import { Pool } from "pg";
import { auth } from "@/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
//#endregion

export async function fetchHuvudbok() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = session.user.id;

  try {
    const client = await pool.connect();
    const query = `
      SELECT 
        k.kontonummer,
        k.beskrivning as kontobeskrivning_konto,
        t.kontobeskrivning,
        t.transaktionsdatum,
        t.fil,
        t.id as transaktion_id,
        tp.debet,
        tp.kredit,
        CONCAT('V', t.id) as verifikatNummer
      FROM transaktioner t
      JOIN transaktionsposter tp ON tp.transaktions_id = t.id
      JOIN konton k ON k.id = tp.konto_id
      WHERE t."userId" = $1
      ORDER BY k.kontonummer::int, t.transaktionsdatum DESC
    `;
    const res = await client.query(query, [userId]);
    client.release();
    return res.rows;
  } catch (error) {
    console.error("❌ fetchHuvudbok error:", error);
    return [];
  }
}

export async function fetchFöretagsprofil(userId: number) {
  try {
    const client = await pool.connect();
    const query = `
      SELECT företagsnamn, organisationsnummer
      FROM företagsprofil
      WHERE id = $1
      LIMIT 1
    `;
    const res = await client.query(query, [userId]);
    client.release();
    return res.rows[0] || null;
  } catch (error) {
    console.error("❌ fetchFöretagsprofil error:", error);
    return null;
  }
}

export async function fetchTransactionDetails(transaktionsId: number) {
  const result = await pool.query(
    `
    SELECT
      tp.id AS transaktionspost_id,
      tp.debet,
      tp.kredit,
      k.kontonummer,
      k.beskrivning,
      t.kommentar,
      t.fil
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE tp.transaktions_id = $1
    ORDER BY tp.id
    `,
    [transaktionsId]
  );
  return result.rows;
}
