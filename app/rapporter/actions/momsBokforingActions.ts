"use server";

import { pool } from "../../_lib/db";
import { createTransaktion } from "../../_utils/transactions";
import { ensureSession } from "../../_utils/session";
import { revalidatePath } from "next/cache";
import { calculateMomsBokforingPoster, buildDateFilter } from "../utils/momsBokforing";

/**
 * Bokför momsavstämning för en period
 * Detta är en TUNN WRAPPER som endast hanterar auth + DB-operations
 * All beräkningslogik finns i utils/momsBokforing.ts
 */
export async function bokforMomsavstamning(year: string, period: string) {
  try {
    const { userId } = await ensureSession();
    const client = await pool.connect();

    try {
      // Kontrollera om momsavstämning redan är bokförd för perioden
      const checkQuery = `
        SELECT COUNT(*) as count
        FROM transaktioner
        WHERE user_id = $1
          AND kontobeskrivning LIKE 'Momsavstämning ${year} ${period === "all" ? "" : period}%'
      `;
      const checkResult = await client.query(checkQuery, [userId]);

      if (parseInt(checkResult.rows[0].count) > 0) {
        return {
          success: false,
          error: "Momsavstämning redan bokförd för denna period. Kontrollera i Historik.",
        };
      }

      // Hämta alla momskonton med deras saldon för perioden
      const dateFilter = buildDateFilter(year, period);

      const query = `
        SELECT 
          k.kontonummer,
          k.beskrivning,
          SUM(tp.kredit) as total_kredit,
          SUM(tp.debet) as total_debet
        FROM transaktionsposter tp
        JOIN konton k ON tp.konto_id = k.id
        JOIN transaktioner t ON tp.transaktions_id = t.id
        WHERE t.user_id = $1
          AND ${dateFilter}
          AND k.kontonummer IN ('2610', '2611', '2612', '2613', '2614', '2620', '2621', '2622', '2623', '2624', '2630', '2631', '2632', '2633', '2634', '2635', '2615', '2625', '2640', '2641', '2645', '2647', '2648')
        GROUP BY k.kontonummer, k.beskrivning
        HAVING SUM(tp.kredit) != SUM(tp.debet)
        ORDER BY k.kontonummer
      `;

      const result = await client.query(query, [userId]);

      // Använd utility-funktion för att beräkna poster
      const poster = calculateMomsBokforingPoster(result.rows);

      if (poster.length === 0) {
        return { success: false, error: "Inga momsposter att bokföra för perioden" };
      }

      // Skapa transaktion (detta är en mutation - OK att göra i Server Action)
      const { transaktionsId } = await createTransaktion({
        datum: new Date(),
        beskrivning: `Momsavstämning ${year} ${period === "all" ? "" : period}`,
        kommentar: `Avstämning av moms för period ${period === "all" ? "Hela året" : period} ${year}`,
        userId,
        poster,
      });

      revalidatePath("/rapporter");

      return { success: true, transaktionsId };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Fel vid bokföring av momsavstämning:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Okänt fel",
    };
  }
}
