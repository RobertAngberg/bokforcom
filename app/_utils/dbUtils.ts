import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Exekverar en databas-operation med automatisk connection management
 * Eliminerar behovet av manuell client.connect() och client.release()
 */
export async function withDatabase<T>(operation: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();

  try {
    return await operation(client);
  } finally {
    client.release();
  }
}

/**
 * Exekverar en databas-transaktion med automatisk ROLLBACK vid fel
 * Perfekt för operationer med flera queries som måste lyckas tillsammans
 */
export async function withTransaction<T>(operation: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Enkel query med automatisk connection management
 * För enkla SELECT/INSERT/UPDATE operationer
 */
export async function query<T = any>(
  text: string,
  params: any[] = []
): Promise<{ rows: T[]; rowCount?: number }> {
  return withDatabase(async (client) => {
    return await client.query(text, params);
  });
}

/**
 * Hämtar första raden från en query, eller null om ingen hittades
 */
export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

/**
 * Kontrollerar om en post existerar
 */
export async function exists(table: string, conditions: Record<string, any>): Promise<boolean> {
  const keys = Object.keys(conditions);
  const whereClause = keys.map((key, index) => `"${key}" = $${index + 1}`).join(" AND ");
  const values = Object.values(conditions);

  const result = await query(`SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`, values);

  return result.rows.length > 0;
}

export { pool };
