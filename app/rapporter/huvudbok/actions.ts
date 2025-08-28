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
      WHERE t."user_id" = $1
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
      WHERE t."user_id" = $1
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
      WHERE t."user_id" = $1
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
      t.fil,
      t.transaktionsdatum,
      t.kontobeskrivning as verifikat_beskrivning,
      CONCAT('V', t.id) as verifikatNummer
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE tp.transaktions_id = $1
      AND t."user_id" = $2
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

export async function fetchKontoTransaktioner(kontonummer: string) {
  const userId = await getUserId();

  // SÄKERHETSVALIDERING: Rate limiting
  if (!validateSessionAttempt(`konto-transactions-${userId}`)) {
    logLedgerDataEvent("violation", userId, "Rate limit exceeded for account transactions");
    throw new Error("För många förfrågningar. Försök igen om 15 minuter.");
  }

  logLedgerDataEvent("access", userId, `Accessing transactions for account ${kontonummer}`);

  try {
    const result = await pool.query(
      `
      WITH konto_transaktioner AS (
        SELECT
          t.id as transaktion_id,
          t.transaktionsdatum as datum,
          t.kontobeskrivning as beskrivning,
          tp.debet,
          tp.kredit,
          CONCAT('V', t.id) as verifikatNummer,
          (tp.debet - tp.kredit) as belopp,
          ROW_NUMBER() OVER (ORDER BY t.transaktionsdatum, t.id) as rad_nr
        FROM transaktioner t
        JOIN transaktionsposter tp ON tp.transaktions_id = t.id
        JOIN konton k ON k.id = tp.konto_id
        WHERE k.kontonummer = $1 
          AND t."user_id" = $2
      )
      SELECT 
        *,
        SUM(belopp) OVER (ORDER BY datum, transaktion_id) as lopande_saldo
      FROM konto_transaktioner
      ORDER BY datum, transaktion_id
      `,
      [kontonummer, userId]
    );
    return result.rows;
  } catch (error) {
    console.error("❌ fetchKontoTransaktioner error:", error);
    logLedgerDataEvent(
      "error",
      userId,
      `Error fetching account transactions: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    throw new Error("Ett fel uppstod vid hämtning av kontotransaktioner");
  }
}

export async function fetchHuvudbokMedAllaTransaktioner() {
  const userId = await getUserId();

  // SÄKERHETSVALIDERING: Rate limiting för huvudbok med alla transaktioner
  if (!validateSessionAttempt(`finance-full-ledger-${userId}`)) {
    logLedgerDataEvent("violation", userId, "Rate limit exceeded for full ledger access");
    throw new Error("För många förfrågningar. Försök igen om 15 minuter.");
  }

  logLedgerDataEvent("access", userId, "Accessing full ledger with all transactions");

  try {
    const client = await pool.connect();

    // Hämta alla transaktioner grupperade per konto, inklusive ingående balans
    const fullQuery = `
      WITH konto_transaktioner AS (
        SELECT 
          k.kontonummer,
          k.beskrivning as konto_beskrivning,
          t.id as transaktion_id,
          t.transaktionsdatum as datum,
          t.kontobeskrivning as beskrivning,
          tp.debet,
          tp.kredit,
          CASE 
            WHEN t.kontobeskrivning = 'Ingående balanser' AND t.kommentar = 'SIE Import - Ingående balanser' 
            THEN 'Ingående balans'
            ELSE CONCAT('V', t.id)
          END as verifikatNummer,
          (tp.debet - tp.kredit) as belopp,
          CASE 
            WHEN t.kontobeskrivning = 'Ingående balanser' AND t.kommentar = 'SIE Import - Ingående balanser' 
            THEN 1
            ELSE 2
          END as sort_priority
        FROM transaktioner t
        JOIN transaktionsposter tp ON tp.transaktions_id = t.id
        JOIN konton k ON k.id = tp.konto_id
        WHERE t."user_id" = $1
        ORDER BY k.kontonummer::int, sort_priority, t.transaktionsdatum, t.id
      ),
      konto_summary AS (
        SELECT 
          kontonummer,
          konto_beskrivning,
          SUM(CASE WHEN sort_priority = 1 THEN belopp ELSE 0 END) as ingaende_balans,
          SUM(belopp) as utgaende_balans,
          json_agg(
            json_build_object(
              'transaktion_id', transaktion_id,
              'datum', datum,
              'beskrivning', beskrivning,
              'debet', debet,
              'kredit', kredit,
              'verifikatNummer', verifikatNummer,
              'belopp', belopp,
              'sort_priority', sort_priority
            ) ORDER BY sort_priority, datum, transaktion_id
          ) as transaktioner
        FROM konto_transaktioner
        GROUP BY kontonummer, konto_beskrivning
      )
      SELECT 
        kontonummer,
        konto_beskrivning as beskrivning,
        ingaende_balans as "ingaendeBalans",
        utgaende_balans as "utgaendeBalans",
        transaktioner
      FROM konto_summary
      ORDER BY kontonummer::int
    `;

    const result = await client.query(fullQuery, [userId]);
    client.release();

    // Bearbeta resultatet för att beräkna löpande saldon
    const huvudboksdata = result.rows.map((row) => {
      let lopandeSaldo = 0;
      const transaktionerMedSaldo = row.transaktioner.map((trans: any) => {
        lopandeSaldo += trans.belopp;
        return {
          ...trans,
          lopande_saldo: lopandeSaldo,
        };
      });

      return {
        kontonummer: row.kontonummer,
        beskrivning: row.beskrivning,
        ingaendeBalans: parseFloat(row.ingaendeBalans),
        utgaendeBalans: parseFloat(row.utgaendeBalans),
        transaktioner: transaktionerMedSaldo,
      };
    });

    return huvudboksdata;
  } catch (error) {
    console.error("❌ fetchHuvudbokMedAllaTransaktioner error:", error);
    logLedgerDataEvent(
      "error",
      userId,
      `Error fetching full ledger: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    throw new Error("Ett fel uppstod vid hämtning av huvudbok med transaktioner");
  }
}
