"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import type { Förval, UtlaggAnställd } from "../types/types";

interface BokforInitialData {
  favoritFörval: Förval[];
  allaFörval: Förval[];
  bokföringsmetod: string;
  anställda: UtlaggAnställd[];
}

const DEFAULT_BOKFORINGSMETOD = "Kontantmetoden";

export async function hamtaBokforInitialData(): Promise<BokforInitialData> {
  const { userId } = await ensureSession();
  const client = await pool.connect();

  try {
    const [favoriterRes, allaRes, metodRes, anstalldaRes] = await Promise.all([
      client.query<Förval>(
        `
        SELECT f.*
        FROM favoritförval ff
        JOIN förval f ON ff.forval_id = f.id
        WHERE ff.user_id = $1
        ORDER BY ff.antal DESC, ff.senaste DESC
        LIMIT 10
      `,
        [userId]
      ),
      client.query<Förval>(`SELECT * FROM förval ORDER BY namn`),
      client.query<{ bokföringsmetod: string | null }>(
        'SELECT bokföringsmetod FROM "user" WHERE id = $1',
        [userId]
      ),
      client.query<UtlaggAnställd>(
        `
        SELECT id, förnamn, efternamn
        FROM anställda
        WHERE user_id = $1
        ORDER BY förnamn, efternamn
      `,
        [userId]
      ),
    ]);

    const bokföringsmetod = metodRes.rows[0]?.bokföringsmetod || DEFAULT_BOKFORINGSMETOD;

    return {
      favoritFörval: favoriterRes.rows,
      allaFörval: allaRes.rows,
      bokföringsmetod,
      anställda: anstalldaRes.rows,
    };
  } catch (error) {
    console.error("❌ hamtaBokforInitialData error:", error);
    return {
      favoritFörval: [],
      allaFörval: [],
      bokföringsmetod: DEFAULT_BOKFORINGSMETOD,
      anställda: [],
    };
  } finally {
    client.release();
  }
}
