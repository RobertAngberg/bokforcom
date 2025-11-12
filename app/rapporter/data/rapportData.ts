import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { validatePeriod } from "../../_utils/validationUtils";
import type { TransaktionsPost } from "../types/types";

/**
 * Hämtar ALL transaktionsdata för ett år/period EN gång
 * Detta är den ENDA query som behöver köras för alla rapporter
 * Används direkt från Server Components - ingen "use server" behövs
 */
export async function getAllTransaktionsdata(year: string): Promise<TransaktionsPost[]> {
  const { userId } = await ensureSession();

  if (!validatePeriod(year)) {
    throw new Error("Ogiltigt år-format");
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        tp.id,
        tp.transaktions_id,
        tp.konto_id,
        k.kontonummer,
        k.beskrivning as kontobeskrivning,
        COALESCE(tp.debet, 0) as debet,
        COALESCE(tp.kredit, 0) as kredit,
        t.transaktionsdatum,
        t.kontobeskrivning as kontobeskrivning_transaktion,
        (t.kontobeskrivning = 'Ingående balanser') as ar_oppningsbalans
      FROM transaktionsposter tp
      JOIN konton k ON k.id = tp.konto_id
      JOIN transaktioner t ON t.id = tp.transaktions_id
      WHERE t."user_id" = $1
        AND EXTRACT(YEAR FROM t.transaktionsdatum) = $2
      ORDER BY t.transaktionsdatum, tp.id
      `,
      [userId, parseInt(year)]
    );

    return result.rows;
  } catch (error) {
    console.error("❌ getAllTransaktionsdata error:", error);
    throw new Error("Kunde inte hämta transaktionsdata");
  }
}
