import { Pool } from "pg";
import { auth } from "@/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function hamtaTransaktionsposter(transaktionsId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Ingen användare inloggad");

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT tp.*, k.kontonummer, k.beskrivning
       FROM transaktionsposter tp
       JOIN konton k ON tp.konto_id = k.id
       WHERE tp.transaktions_id = $1
       ORDER BY tp.id`,
      [transaktionsId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}
