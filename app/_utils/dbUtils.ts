import { pool } from "./dbPool";

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

/**
 * CENTRALISERADE DATABAS OPERATIONS
 * Minskar kod-duplicering mellan user och admin operationer
 */

/**
 * Uppdaterar fakturanummer för en specifik faktura
 * Core database operation utan auth - ska wrappers med säkerhet
 */
export async function updateFakturanummerCore(
  id: number,
  nyttNummer: string,
  userId: number
): Promise<{ rowCount: number }> {
  return withDatabase(async (client) => {
    const res = await client.query(
      `UPDATE fakturor SET fakturanummer = $1 WHERE id = $2 AND user_id = $3`,
      [nyttNummer, id, userId]
    );
    if (res.rowCount === 0) {
      throw new Error("Faktura hittades inte eller otillåten åtkomst");
    }
    return { rowCount: res.rowCount };
  });
}

/**
 * Uppdaterar ett specifikt fält i förval-tabellen
 * Core database operation utan auth - ska wrappas med säkerhet
 */
export async function updateFörvalCore(
  id: number,
  kolumn: string,
  nyttVärde: string,
  userId?: number // Optional för admin operations
): Promise<{ rowCount: number }> {
  // Säkra kolumnnamn mot SQL injection
  const tillåtnaKolumner = [
    "namn",
    "beskrivning",
    "typ",
    "kategori",
    "momssats",
    "specialtyp",
    "konton",
    "sökord",
  ];

  if (!tillåtnaKolumner.includes(kolumn)) {
    throw new Error(`Ogiltig kolumn: ${kolumn}`);
  }

  return await withDatabase(async (client) => {
    let query = "";
    let params: any[] = [];

    if (kolumn === "konton" || kolumn === "sökord") {
      // JSON-hantering
      try {
        JSON.parse(nyttVärde);
      } catch {
        throw new Error("Ogiltigt JSON-format");
      }

      if (userId) {
        query = `UPDATE förval SET "${kolumn}" = $1::jsonb WHERE id = $2 AND "user_id" = $3`;
        params = [nyttVärde, id, userId];
      } else {
        query = `UPDATE förval SET "${kolumn}" = $1::jsonb WHERE id = $2`;
        params = [nyttVärde, id];
      }
    } else if (kolumn === "momssats") {
      // Numerisk hantering
      if (isNaN(parseFloat(nyttVärde))) {
        throw new Error("Ogiltigt momssats-värde");
      }

      if (userId) {
        query = `UPDATE förval SET "${kolumn}" = $1::real WHERE id = $2 AND "user_id" = $3`;
        params = [nyttVärde, id, userId];
      } else {
        query = `UPDATE förval SET "${kolumn}" = $1::real WHERE id = $2`;
        params = [nyttVärde, id];
      }
    } else {
      // Vanlig text
      if (userId) {
        query = `UPDATE förval SET "${kolumn}" = $1 WHERE id = $2 AND "user_id" = $3`;
        params = [nyttVärde, id, userId];
      } else {
        query = `UPDATE förval SET "${kolumn}" = $1 WHERE id = $2`;
        params = [nyttVärde, id];
      }
    }

    return await client.query(query, params);
  });
}

export { pool };
