import { pool } from "../../_lib/db";
import { hamtaKontoIdMap } from "./kontoLookup";

export interface TransaktionsPostInput {
  kontonummer: string;
  debet: number;
  kredit: number;
}

export interface SkapaTransaktionInput {
  datum?: string | Date;
  beskrivning: string;
  kommentar?: string | null;
  userId: number | string;
  poster: TransaktionsPostInput[];
  autoBelopp?: boolean; // default true -> summan av debet
  skipBalanceCheck?: boolean; // om sant hoppar vi balansvalidering
}

export async function createTransaktion(data: SkapaTransaktionInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (!data.skipBalanceCheck) {
      const total = data.poster.reduce((s, p) => s + (p.debet || 0) - (p.kredit || 0), 0);
      if (Math.abs(total) > 0.0001) {
        throw new Error("Obalanserad transaktion (debet - kredit != 0)");
      }
    }

    const datumISO =
      data.datum instanceof Date
        ? data.datum.toISOString().split("T")[0]
        : data.datum || new Date().toISOString().split("T")[0];

    const belopp =
      data.autoBelopp === false ? null : data.poster.reduce((s, p) => s + (p.debet || 0), 0);

    const insertTrans = await client.query(
      `INSERT INTO transaktioner (transaktionsdatum, kontobeskrivning, belopp, kommentar, user_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [datumISO, data.beskrivning, belopp, data.kommentar || null, data.userId]
    );
    const transaktionsId = insertTrans.rows[0].id;

    // Hämta konto-id map i batch
    const kontoMap = await hamtaKontoIdMap(data.poster.map((p) => p.kontonummer));

    for (const post of data.poster) {
      const kontoId = kontoMap[post.kontonummer];
      if (!kontoId) throw new Error(`Kontonummer saknas: ${post.kontonummer}`);
      await client.query(
        `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
         VALUES ($1,$2,$3,$4)`,
        [transaktionsId, kontoId, post.debet || 0, post.kredit || 0]
      );
    }

    await client.query("COMMIT");
    return { transaktionsId };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
