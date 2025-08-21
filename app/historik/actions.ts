"use server";

import { Pool } from "pg";
import { getUserId, logSecurityEvent } from "../_utils/authUtils";
import { withFormRateLimit } from "../_utils/rateLimit";
import { validateYear, sanitizeInput } from "../_utils/validationUtils";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface TransactionDetail {
  transaktionspost_id: number;
  kontonummer: string;
  beskrivning: string;
  debet: number;
  kredit: number;
}

// Intern funktion utan rate limiting (för wrappers)
async function fetchTransaktionerInternal(fromYear?: string) {
  // SÄKERHETSVALIDERING: Säker session-hantering via authUtils
  let userId: number;
  try {
    userId = await getUserId();
    logSecurityEvent("login", userId, "Transaction history access");
  } catch (error) {
    logSecurityEvent(
      "invalid_access",
      undefined,
      "Attempted transaction history access without valid session"
    );
    return { success: false, error: "Säkerhetsfel: Ingen giltig session - måste vara inloggad" };
  }

  // SÄKERHETSVALIDERING: Validera år-parameter om angiven
  if (fromYear && !validateYear(fromYear)) {
    logSecurityEvent("invalid_access", userId, `Invalid year parameter: ${fromYear}`);
    return { success: false, error: "Ogiltigt år-format" };
  }

  try {
    const client = await pool.connect();

    // SÄKERHETSFÖRSTÄRKT QUERY: Endast användarens egna transaktioner
    const result = await client.query(
      `
      SELECT 
        t.id,
        t.transaktionsdatum,
        t.kontobeskrivning,
        COALESCE(SUM(tp.debet), 0) as belopp,
        t.kommentar,
        t.fil,
        t.blob_url
      FROM transaktioner t
      LEFT JOIN transaktionsposter tp ON tp.transaktions_id = t.id
      WHERE t."user_id" = $1
      ${fromYear ? "AND EXTRACT(YEAR FROM t.transaktionsdatum) = $2" : ""}
      GROUP BY t.id, t.transaktionsdatum, t.kontobeskrivning, t.kommentar, t.fil, t.blob_url
      ORDER BY t.transaktionsdatum DESC, t.id DESC
      `,
      fromYear ? [userId, parseInt(fromYear)] : [userId]
    );

    client.release();
    console.log(
      `🔒 Säker historik-åtkomst för user ${userId}, ${result.rows.length} transaktioner`
    );
    return { success: true, data: result.rows };
  } catch (error: any) {
    console.error("❌ fetchTransaktioner error:", error);
    return { success: false, error: "Kunde inte hämta transaktionshistorik säkert" };
  }
}

export async function fetchTransactionDetails(transactionId: number): Promise<TransactionDetail[]> {
  // SÄKERHETSVALIDERING: Säker session-hantering via authUtils
  let userId: number;
  try {
    userId = await getUserId();
  } catch (error) {
    console.error("❌ Säkerhetsvarning: Ogiltig session vid hämtning av transaktionsdetaljer");
    return [];
  }

  // SÄKERHETSVALIDERING: Validera transaktions-ID
  if (isNaN(transactionId) || transactionId <= 0) {
    console.error("❌ Säkerhetsvarning: Ogiltigt transaktions-ID");
    return [];
  }

  const client = await pool.connect();
  try {
    // SÄKERHETSVALIDERING: Verifiera att transaktionen tillhör denna användare
    const verifyRes = await client.query(
      `SELECT id FROM transaktioner WHERE id = $1 AND "user_id" = $2`,
      [transactionId, userId]
    );

    if (verifyRes.rows.length === 0) {
      console.error(
        `❌ Säkerhetsvarning: User ${userId} försökte komma åt transaktion ${transactionId} som de inte äger`
      );
      return [];
    }

    // SÄKER QUERY: Hämta transaktionsdetaljer för validerad transaktion
    const result = await client.query(
      `
      SELECT 
        tp.id AS transaktionspost_id,
        tp.debet,
        tp.kredit,
        k.kontonummer,
        k.beskrivning
      FROM transaktionsposter tp
      JOIN konton k ON tp.konto_id = k.id
      WHERE tp.transaktions_id = $1
      ORDER BY tp.id
      `,
      [transactionId]
    );

    console.log(
      `🔒 Säker transaktionsdetalj-åtkomst för user ${userId}, transaktion ${transactionId}`
    );
    return result.rows;
  } catch (error) {
    console.error("❌ fetchTransactionDetails error:", error);
    return [];
  } finally {
    client.release();
  }
}

// Intern funktion för export utan rate limiting
async function exporteraTransaktionerMedPosterInternal(year: string) {
  // SÄKERHETSVALIDERING: Säker session-hantering via authUtils
  let userId: number;
  try {
    userId = await getUserId();
    logSecurityEvent("login", userId, `Transaction export for year ${year}`);
  } catch (error) {
    logSecurityEvent(
      "invalid_access",
      undefined,
      "Attempted transaction export without valid session"
    );
    return [];
  }

  // SÄKERHETSVALIDERING: Validera år-parameter
  if (!validateYear(year)) {
    logSecurityEvent("invalid_access", userId, `Invalid year for export: ${year}`);
    console.error("❌ Säkerhetsvarning: Ogiltigt år för export");
    return [];
  }

  try {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    // SÄKERHETSFÖRSTÄRKT QUERY: Endast användarens egna transaktioner
    const { rows } = await pool.query(
      `
      SELECT 
        t.id AS transaktions_id,
        t.transaktionsdatum,
        t.kontobeskrivning,
        t.belopp,
        t.kommentar,
        t.fil,
        t.blob_url,
        tp.id AS transaktionspost_id,
        tp.debet,
        tp.kredit,
        k.kontonummer,
        k.beskrivning AS kontobeskrivning
      FROM transaktioner t
      LEFT JOIN transaktionsposter tp ON tp.transaktions_id = t.id
      LEFT JOIN konton k ON tp.konto_id = k.id
      WHERE t."user_id" = $1 
        AND t.transaktionsdatum BETWEEN $2 AND $3
      ORDER BY t.transaktionsdatum DESC, t.id DESC, tp.id ASC
    `,
      [userId, start, end]
    );

    const map = new Map<number, any>();

    for (const row of rows) {
      if (!map.has(row.transaktions_id)) {
        map.set(row.transaktions_id, {
          transaktions_id: row.transaktions_id,
          transaktionsdatum: row.transaktionsdatum,
          kontobeskrivning: row.kontobeskrivning,
          belopp: row.belopp,
          kommentar: row.kommentar,
          fil: row.fil,
          blob_url: row.blob_url,
          transaktionsposter: [],
        });
      }

      if (row.transaktionspost_id) {
        map.get(row.transaktions_id).transaktionsposter.push({
          transaktionspost_id: row.transaktionspost_id,
          kontonummer: row.kontonummer,
          beskrivning: row.kontobeskrivning,
          debet: row.debet,
          kredit: row.kredit,
        });
      }
    }

    const resultat = Array.from(map.values());
    console.log(
      `� Säker export för user ${userId}: ${resultat.length} transaktioner från år ${year}`
    );
    return resultat;
  } catch (err: any) {
    console.error("❌ exporteraTransaktionerMedPoster error:", err);
    return [];
  }
}

// SÄKRA EXPORTS MED RATE LIMITING
export const fetchTransaktioner = withFormRateLimit(fetchTransaktionerInternal);
export const exporteraTransaktionerMedPoster = withFormRateLimit(
  exporteraTransaktionerMedPosterInternal
);
