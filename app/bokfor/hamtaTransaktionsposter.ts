import { pool } from "../_utils/dbPool";
import { getUserId } from "../_utils/authUtils";

export async function hamtaTransaktionsposter(transaktionsId: number) {
  const userId = await getUserId();
  if (!userId) throw new Error("Ingen användare inloggad");

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT tp.*, k.kontonummer, k.beskrivning
       FROM transaktionsposter tp
       JOIN konton k ON tp.konto_id = k.id
       JOIN transaktioner t ON tp.transaktions_id = t.id
       WHERE tp.transaktions_id = $1 AND t.user_id = $2
       ORDER BY tp.id`,
      [transaktionsId, userId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}
