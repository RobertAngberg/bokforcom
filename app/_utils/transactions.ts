import { pool } from "../_lib/db";
import { ensureSession } from "./session";
import { dateToYyyyMmDd } from "./datum";
import { isPeriodClosed } from "../rapporter/actions/momsrapportStatusActions";

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
      // Acceptera om kronorna stämmer (avrunda till heltal)
      if (Math.abs(Math.round(total)) > 0) {
        throw new Error("Obalanserad transaktion (debet - kredit != 0)");
      }
    }

    const datumISO =
      data.datum instanceof Date
        ? dateToYyyyMmDd(data.datum)
        : data.datum || dateToYyyyMmDd(new Date());

    // Kontrollera om momsperioden är stängd
    const transDate = new Date(datumISO);
    const year = transDate.getFullYear();
    const month = String(transDate.getMonth() + 1).padStart(2, "0");

    const periodCheck = await isPeriodClosed(year, month);
    if (periodCheck.closed) {
      throw new Error(
        `Momsperioden ${month}/${year} är stängd. Inga transaktioner kan bokföras för denna period.`
      );
    }

    // Kolla även helårsperiod
    const yearPeriodCheck = await isPeriodClosed(year, "all");
    if (yearPeriodCheck.closed) {
      throw new Error(
        `Momsperioden för hela ${year} är stängd. Inga transaktioner kan bokföras för detta år.`
      );
    }

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

export async function fetchTransactionWithEntries(
  userId: number | string,
  transaktionsId: number
): Promise<TransactionWithEntries | null> {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT 
        t.id,
        t.transaktionsdatum AS datum,
        t.kontobeskrivning AS beskrivning,
        t.belopp AS summa_debet,
        t.belopp AS summa_kredit,
        t.blob_url,
        json_agg(
          json_build_object(
            'konto', k.kontonummer,
            'beskrivning', k.beskrivning,
            'debet', tp.debet,
            'kredit', tp.kredit
          ) ORDER BY tp.id
        ) AS poster
      FROM transaktioner t
      LEFT JOIN transaktionsposter tp ON t.id = tp.transaktions_id
      LEFT JOIN konton k ON tp.konto_id = k.id
      WHERE t.id = $1 AND t.user_id = $2
      GROUP BY t.id, t.transaktionsdatum, t.kontobeskrivning, t.belopp, t.blob_url`,
      [transaktionsId, userId]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      datum: row.datum,
      beskrivning: row.beskrivning,
      summa_debet: row.summa_debet ? parseFloat(row.summa_debet) : null,
      summa_kredit: row.summa_kredit ? parseFloat(row.summa_kredit) : null,
      blob_url: row.blob_url,
      poster: row.poster || [],
    };
  } finally {
    client.release();
  }
}
