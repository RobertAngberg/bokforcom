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

    // Hämta ingående balanser (från SIE-import)
    const ingaendeBalanserQuery = `
      SELECT 
        k.kontonummer,
        k.beskrivning,
        SUM(tp.debet - tp.kredit) as ingaende_balans
      FROM transaktioner t
      JOIN transaktionsposter tp ON tp.transaktions_id = t.id
      JOIN konton k ON k.id = tp.konto_id
      WHERE t."userId" = $1
        AND t.kontobeskrivning = 'Ingående balanser'
        AND t.kommentar = 'SIE Import - Ingående balanser'
      GROUP BY k.kontonummer, k.beskrivning
    `;

    // Hämta alla transaktioner för periodens saldo (exklusive ingående balanser)
    const periodsTransaktionerQuery = `
      SELECT 
        k.kontonummer,
        k.beskrivning,
        SUM(tp.debet - tp.kredit) as periods_saldo
      FROM transaktioner t
      JOIN transaktionsposter tp ON tp.transaktions_id = t.id
      JOIN konton k ON k.id = tp.konto_id
      WHERE t."userId" = $1
        AND NOT (t.kontobeskrivning = 'Ingående balanser' AND t.kommentar = 'SIE Import - Ingående balanser')
      GROUP BY k.kontonummer, k.beskrivning
    `;

    // Hämta alla konton som använts
    const allaKontonQuery = `
      SELECT 
        k.kontonummer,
        k.beskrivning,
        k.kontonummer::int as sort_order
      FROM konton k
      JOIN transaktionsposter tp ON k.id = tp.konto_id
      JOIN transaktioner t ON tp.transaktions_id = t.id
      WHERE t."userId" = $1
      GROUP BY k.kontonummer, k.beskrivning
      ORDER BY k.kontonummer::int
    `;

    const [ingaendeRes, periodsRes, kontonRes] = await Promise.all([
      client.query(ingaendeBalanserQuery, [userId]),
      client.query(periodsTransaktionerQuery, [userId]),
      client.query(allaKontonQuery, [userId]),
    ]);

    client.release();

    // Skapa lookup-objekt
    const ingaendeBalanser = ingaendeRes.rows.reduce(
      (acc, row) => {
        acc[row.kontonummer] = parseFloat(row.ingaende_balans);
        return acc;
      },
      {} as Record<string, number>
    );

    const periodsSaldon = periodsRes.rows.reduce(
      (acc, row) => {
        acc[row.kontonummer] = parseFloat(row.periods_saldo);
        return acc;
      },
      {} as Record<string, number>
    );

    // Bygg huvudboksdata för alla konton
    const huvudboksdata = kontonRes.rows.map((row) => {
      const ingaendeBalans = ingaendeBalanser[row.kontonummer] || 0;
      const periodsSaldo = periodsSaldon[row.kontonummer] || 0;
      const utgaendeBalans = ingaendeBalans + periodsSaldo;

      return {
        kontonummer: row.kontonummer,
        beskrivning: row.beskrivning,
        ingaendeBalans,
        utgaendeBalans,
      };
    });

    return huvudboksdata;
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
