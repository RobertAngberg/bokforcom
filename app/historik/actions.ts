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

interface UnbalancedVerification {
  transaktions_id: number;
  transaktionsdatum: string;
  kontobeskrivning: string;
  kommentar?: string;
  totalDebet: number;
  totalKredit: number;
  skillnad: number;
}

// 🚀 OPTIMERAD FUNKTION: Hitta obalanserade direkt i databasen
export async function findUnbalancedVerifications(): Promise<{
  success: boolean;
  unbalanced?: UnbalancedVerification[];
  error?: string;
}> {
  let userId: number;
  try {
    userId = await getUserId();
  } catch (error) {
    return { success: false, error: "Säkerhetsfel: Ingen giltig session" };
  }

  try {
    const client = await pool.connect();

    const result = await client.query(
      `
      WITH verification_totals AS (
        SELECT 
          t.id as transaktions_id,
          t.transaktionsdatum::text as transaktionsdatum,
          t.kontobeskrivning,
          t.kommentar,
          COALESCE(SUM(tp.debet), 0) as total_debet,
          COALESCE(SUM(tp.kredit), 0) as total_kredit
        FROM transaktioner t
        LEFT JOIN transaktionsposter tp ON t.id = tp.transaktions_id
        WHERE t.user_id = $1
        GROUP BY t.id, t.transaktionsdatum, t.kontobeskrivning, t.kommentar
      )
      SELECT 
        transaktions_id,
        transaktionsdatum,
        kontobeskrivning,
        kommentar,
        total_debet,
        total_kredit,
        ABS(total_debet - total_kredit) as skillnad
      FROM verification_totals
      WHERE ABS(total_debet - total_kredit) > 0.01
      ORDER BY transaktionsdatum DESC, transaktions_id DESC
    `,
      [userId]
    );

    client.release();

    const unbalanced: UnbalancedVerification[] = result.rows.map((row) => ({
      transaktions_id: row.transaktions_id,
      transaktionsdatum: row.transaktionsdatum,
      kontobeskrivning: row.kontobeskrivning,
      kommentar: row.kommentar,
      totalDebet: parseFloat(row.total_debet),
      totalKredit: parseFloat(row.total_kredit),
      skillnad: parseFloat(row.skillnad),
    }));

    return { success: true, unbalanced };
  } catch (error) {
    return { success: false, error: "Databasfel" };
  }
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
    return { success: true, data: result.rows };
  } catch (error: any) {
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

    return result.rows;
  } catch (error) {
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
    return resultat;
  } catch (err: any) {
    return [];
  }
}

// DELETE TRANSACTION FUNCTION
async function deleteTransactionInternal(transactionId: number): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  let userId: number;
  try {
    userId = await getUserId();
  } catch (error) {
    return { success: false, error: "Säkerhetsfel: Ingen giltig session" };
  }

  if (!transactionId || transactionId <= 0) {
    return { success: false, error: "Ogiltigt transaktions-ID" };
  }

  try {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Kolla att transaktionen tillhör användaren
      const ownerCheck = await client.query(
        "SELECT id, kommentar FROM transaktioner WHERE id = $1 AND user_id = $2",
        [transactionId, userId]
      );

      if (ownerCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return { success: false, error: "Transaktion hittades inte eller tillhör inte dig" };
      }

      // Kolla om det är en faktura-transaktion
      const kommentar = ownerCheck.rows[0].kommentar || "";
      if (kommentar.includes("Bokföring av faktura")) {
        await client.query("ROLLBACK");
        return {
          success: false,
          error:
            "Fakturatransaktioner kan inte tas bort härifrån. Gå till Faktura-sektionen för att hantera fakturor.",
        };
      }

      // Ta bort transaktionsposter först (på grund av foreign key)
      await client.query("DELETE FROM transaktionsposter WHERE transaktions_id = $1", [
        transactionId,
      ]);

      // Ta bort transaktionen
      const deleteResult = await client.query(
        "DELETE FROM transaktioner WHERE id = $1 AND user_id = $2",
        [transactionId, userId]
      );

      await client.query("COMMIT");

      logSecurityEvent("invalid_access", userId, `Transaction ${transactionId} deleted`);

      return {
        success: true,
        message: `Transaktion ${transactionId} har tagits bort`,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      success: false,
      error: "Kunde inte ta bort transaktion. Försök igen.",
    };
  }
}

// SÄKRA EXPORTS MED RATE LIMITING
export const fetchTransaktioner = withFormRateLimit(fetchTransaktionerInternal);
export const exporteraTransaktionerMedPoster = withFormRateLimit(
  exporteraTransaktionerMedPosterInternal
);
export const deleteTransaction = withFormRateLimit(deleteTransactionInternal);
