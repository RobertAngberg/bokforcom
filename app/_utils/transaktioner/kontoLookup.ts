import { pool } from "../dbPool";

/**
 * Hämtar id för en lista av kontonummer i en query.
 * Returnerar en map kontonummer -> konto_id
 */
export async function hamtaKontoIdMap(kontonummerLista: string[]) {
  if (kontonummerLista.length === 0) return {} as Record<string, number>;
  const unika = [...new Set(kontonummerLista)];
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, kontonummer FROM konton WHERE kontonummer = ANY($1)`,
      [unika]
    );
    return Object.fromEntries(rows.map((r) => [r.kontonummer, r.id])) as Record<string, number>;
  } finally {
    client.release();
  }
}
