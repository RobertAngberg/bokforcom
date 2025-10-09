import { pool } from "../_lib/db";
import { ensureSession } from "./session";
import { dateTillÅÅÅÅMMDD } from "./datum";

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
  autoBelopp?: boolean;
  skipBalanceCheck?: boolean;
}

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

interface HamtaPosterOptions {
  meta?: boolean;
}

export interface TransactionWithEntries {
  id: number;
  datum: string;
  beskrivning: string | null;
  summa_debet: number | null;
  summa_kredit: number | null;
  blob_url: string | null;
  poster: Array<{
    konto: string;
    beskrivning: string;
    debet: number | null;
    kredit: number | null;
  }>;
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
        ? dateTillÅÅÅÅMMDD(data.datum)
        : data.datum || dateTillÅÅÅÅMMDD(new Date());

    const belopp =
      data.autoBelopp === false ? null : data.poster.reduce((s, p) => s + (p.debet || 0), 0);

    const insertTrans = await client.query(
      `INSERT INTO transaktioner (transaktionsdatum, kontobeskrivning, belopp, kommentar, user_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [datumISO, data.beskrivning, belopp, data.kommentar || null, data.userId]
    );
    const transaktionsId = insertTrans.rows[0].id;

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

export async function hamtaTransaktionsposter(
  transaktionsId: number,
  opts: HamtaPosterOptions = {}
): Promise<TransaktionspostStandard[] | TransaktionspostMedMeta[]> {
  const { userId } = await ensureSession();

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

async function hamtaKontoIdMap(kontonummerLista: string[]) {
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
