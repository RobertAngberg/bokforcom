"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import type { VerifikatValidation, ValidationResult, TransaktionsPost } from "../types/types";
import { validateTransaction, calculateDateRange } from "../utils/momsValidation";

/**
 * Validerar alla verifikat för en viss period och kontrollerar momsbokföring
 * Detta är en TUNN WRAPPER som endast hanterar auth + DB-queries
 * All validerings-logik finns i utils/momsValidation.ts
 */
export async function validateMomsVerifikat(
  year: number,
  period: string
): Promise<ValidationResult> {
  try {
    const session = await ensureSession();
    const userId = session.userId;

    console.log("Validerar period:", { year, period, userId });

    // Beräkna datumintervall via utility-funktion
    const { startDate, endDate } = calculateDateRange(year, period);

    console.log("Söker transaktioner mellan:", { startDate, endDate });

    // Hämta alla transaktioner för perioden
    const transactionsResult = await pool.query(
      `SELECT id as transaktions_id, transaktionsdatum, kontobeskrivning, kommentar, belopp
       FROM transaktioner
       WHERE user_id = $1
         AND transaktionsdatum >= $2
         AND transaktionsdatum <= $3
       ORDER BY transaktionsdatum ASC`,
      [userId, startDate, endDate]
    );

    const transactions = transactionsResult.rows;

    console.log("Hittade transaktioner:", transactions.length);

    if (!transactions || transactions.length === 0) {
      return {
        success: true,
        totalVerifikat: 0,
        verifikatMedVarningar: 0,
        verifikat: [],
      };
    }

    // Validera varje transaktion med utility-funktion
    const validatedVerifikat: VerifikatValidation[] = [];

    for (const transaction of transactions) {
      // Hämta transaktionsposter från DB
      const posterResult = await pool.query<TransaktionsPost>(
        `SELECT k.kontonummer, tp.debet, tp.kredit
         FROM transaktionsposter tp
         JOIN konton k ON tp.konto_id = k.id
         WHERE tp.transaktions_id = $1`,
        [transaction.transaktions_id]
      );

      const poster = posterResult.rows;

      // Använd utility-funktion för att validera
      const validated = validateTransaction(transaction, poster);
      validatedVerifikat.push(validated);
    }

    const verifikatMedVarningar = validatedVerifikat.filter((v) => v.status !== "ok").length;

    return {
      success: true,
      totalVerifikat: validatedVerifikat.length,
      verifikatMedVarningar,
      verifikat: validatedVerifikat,
    };
  } catch (error) {
    console.error("Fel vid validering av momsverifikat:", error);
    return {
      success: false,
      totalVerifikat: 0,
      verifikatMedVarningar: 0,
      verifikat: [],
      error: error instanceof Error ? error.message : "Okänt fel",
    };
  }
}
