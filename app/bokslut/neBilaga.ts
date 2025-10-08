"use server";

import { pool } from "../_lib/db";
import { ensureSession } from "../_utils/session";
import { validateYear } from "../_utils/validationUtils";

// Hämta användarens session via ensureSession
async function requireAuth() {
  const { userId } = await ensureSession();
  return userId;
}

// Hämta kontosaldo för NE-bilaga (endast databasoperationer)
export async function hamtaKontosaldoForNE(ar: number = 2025) {
  const userId = await requireAuth();

  // Säkerhetsvalidering av årtal
  if (!validateYear(ar)) {
    throw new Error("Ogiltigt årtal för NE-bilaga");
  }

  const client = await pool.connect();

  try {
    // Säker query med parametriserade värden
    const result = await client.query(
      `
      SELECT 
        k.kontonummer,
        k.beskrivning,
        k.kontoklass,
        COALESCE(SUM(tp.debet - tp.kredit), 0) as saldo
      FROM konton k
      LEFT JOIN transaktionsposter tp ON k.id = tp.konto_id
      LEFT JOIN transaktioner t ON tp.transaktions_id = t.id
      WHERE t."user_id" = $1
        AND EXTRACT(YEAR FROM t.transaktionsdatum) = $2
      GROUP BY k.kontonummer, k.beskrivning, k.kontoklass
      HAVING COALESCE(SUM(tp.debet - tp.kredit), 0) != 0
      ORDER BY k.kontonummer
    `,
      [userId, ar]
    );

    return result.rows;
  } catch (error) {
    console.error("Fel vid hämtning av kontosaldo för NE-bilaga:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Legacy-funktion för bakåtkompatibilitet (använder nu frontend-generering)
export async function genereraNEBilaga(ar: number = 2025) {
  console.warn("genereraNEBilaga() är deprecated. Använd frontend-generering istället.");

  // Returnera bara rådata för att inte bryta befintlig kod
  const kontosaldo = await hamtaKontosaldoForNE(ar);

  return {
    ar,
    kontosaldo,
    genererad: new Date().toISOString(),
    deprecated: true,
    message:
      "Business logic har flyttats till frontend. Använd generateNEBilagaFromKontosaldo() istället.",
  };
}
