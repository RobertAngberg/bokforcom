//#region
"use server";

import { Pool } from "pg";
import { getUserId, requireOwnership } from "../../_utils/authUtils";
import { validateSessionAttempt } from "../../_utils/rateLimit";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// SÄKERHETSVALIDERING: Logga huvudbok-åtkomst
function logLedgerDataEvent(
  eventType: "access" | "violation" | "error",
  userId?: number,
  details?: string
) {
  const timestamp = new Date().toISOString();
  console.log(`📚 LEDGER DATA EVENT [${timestamp}]: ${eventType.toUpperCase()} {`);
  if (userId) console.log(`  userId: ${userId},`);
  if (details) console.log(`  details: '${details}',`);
  console.log(`  timestamp: '${timestamp}'`);
  console.log(`}`);
}
//#endregion

export async function fetchHuvudbok() {
  const userId = await getUserId();

  // SÄKERHETSVALIDERING: Rate limiting för huvudbok
  if (!validateSessionAttempt(`finance-ledger-${userId}`)) {
    logLedgerDataEvent("violation", userId, "Rate limit exceeded for ledger access");
    throw new Error("För många förfrågningar. Försök igen om 15 minuter.");
  }

  logLedgerDataEvent("access", userId, "Accessing general ledger data");

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
    logLedgerDataEvent(
      "error",
      userId,
      `Error fetching ledger data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return [];
  }
}

export async function fetchFöretagsprofil(userId: number) {
  // SÄKERHETSVALIDERING: Kontrollera autentisering och ägarskap
  const sessionUserId = await getUserId();
  await requireOwnership(userId);

  logLedgerDataEvent("access", sessionUserId, "Accessing company profile data");

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
  // SÄKERHETSVALIDERING: Kontrollera autentisering
  const userId = await getUserId();

  // SÄKERHETSVALIDERING: Rate limiting för transaktionsdetaljer
  if (!validateSessionAttempt(`finance-transaction-${userId}`)) {
    logLedgerDataEvent("violation", userId, "Rate limit exceeded for transaction details access");
    throw new Error("För många förfrågningar. Försök igen om 15 minuter.");
  }

  // SÄKERHETSVALIDERING: Input validering
  if (!transaktionsId || isNaN(transaktionsId) || transaktionsId <= 0) {
    logLedgerDataEvent("violation", userId, `Invalid transaction ID: ${transaktionsId}`);
    throw new Error("Ogiltigt transaktions-ID");
  }

  logLedgerDataEvent("access", userId, `Accessing transaction details for ID ${transaktionsId}`);

  try {
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
      AND t."userId" = $2
    ORDER BY tp.id
    `,
      [transaktionsId, userId]
    );
    return result.rows;
  } catch (error) {
    console.error("❌ fetchTransactionDetails error:", error);
    logLedgerDataEvent(
      "error",
      userId,
      `Error fetching transaction details: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    throw new Error("Ett fel uppstod vid hämtning av transaktionsdetaljer");
  }
}
