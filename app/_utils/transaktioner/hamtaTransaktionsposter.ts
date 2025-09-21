import { pool } from "../../_lib/db";
import { getUserId } from "../authUtils";

export interface TransaktionspostStandard {
  id: number;
  kontonummer: string;
  kontobeskrivning: string;
  debet: number;
  kredit: number;
}

export interface TransaktionspostMedMeta extends TransaktionspostStandard {
  transaktionsdatum: string;
  transaktionskommentar: string | null;
  transaktionId: number;
}

interface Options {
  meta?: boolean; // meta = true ger även datum, kommentar, transaktionId
}

export async function hamtaTransaktionsposter(
  transaktionsId: number,
  opts: Options = {}
): Promise<TransaktionspostStandard[] | TransaktionspostMedMeta[]> {
  const userId = await getUserId();
  if (!userId) throw new Error("Ej autentiserad");

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT 
        tp.id,
        tp.debet,
        tp.kredit,
        tp.transaktions_id,
        k.kontonummer,
        k.beskrivning AS kontobeskrivning,
        t.transaktionsdatum,
        t.kommentar AS transaktionskommentar
       FROM transaktionsposter tp
       JOIN konton k ON tp.konto_id = k.id
       JOIN transaktioner t ON tp.transaktions_id = t.id
       WHERE tp.transaktions_id = $1 AND t.user_id = $2
       ORDER BY tp.id`,
      [transaktionsId, userId]
    );

    if (opts.meta) {
      return rows.map((r) => ({
        id: r.id,
        kontonummer: r.kontonummer,
        kontobeskrivning: r.kontobeskrivning,
        debet: parseFloat(r.debet) || 0,
        kredit: parseFloat(r.kredit) || 0,
        transaktionsdatum: r.transaktionsdatum,
        transaktionskommentar: r.transaktionskommentar,
        transaktionId: r.transaktions_id,
      }));
    }

    return rows.map((r) => ({
      id: r.id,
      kontonummer: r.kontonummer,
      kontobeskrivning: r.kontobeskrivning,
      debet: parseFloat(r.debet) || 0,
      kredit: parseFloat(r.kredit) || 0,
    }));
  } finally {
    client.release();
  }
}
