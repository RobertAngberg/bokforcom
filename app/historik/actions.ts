"use server";

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface TransactionDetail {
  transaktionspost_id: number;
  kontonummer: string;
  beskrivning: string;
  debet: number;
  kredit: number;
}

export async function fetchTransaktioner(fromYear?: string) {
  try {
    const client = await pool.connect();
    const result = await client.query(
      `
      SELECT 
        t.id,
        t.transaktionsdatum,
        t.kontobeskrivning,
        COALESCE(SUM(tp.debet), 0) as belopp,
        t.kommentar,
        t.fil,
        t.blob_url
      FROM transaktioner t
      LEFT JOIN transaktionsposter tp ON tp.transaktions_id = t.id
      GROUP BY t.id, t.transaktionsdatum, t.kontobeskrivning, t.kommentar, t.fil, t.blob_url
      ORDER BY t.transaktionsdatum DESC, t.id DESC
      `
    );
    client.release();
    return { success: true, data: result.rows };
  } catch (error: any) {
    console.error("❌ fetchTransaktioner error:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchTransactionDetails(transactionId: number): Promise<TransactionDetail[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
      SELECT 
        tp.id AS transaktionspost_id,
        tp.debet,
        tp.kredit,
        k.kontonummer,
        k.beskrivning
      FROM transaktionsposter tp
      JOIN konton k ON tp.konto_id = k.id
      WHERE tp.transaktions_id = $1
      ORDER BY tp.id
      `,
      [transactionId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function exporteraTransaktionerMedPoster(year: string) {
  try {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    const { rows } = await pool.query(
      `
      SELECT 
        t.id AS transaktions_id,
        t.transaktionsdatum,
        t.kontobeskrivning,
        t.belopp,
        t.kommentar,
        t.fil,
        t.blob_url,
        tp.id AS transaktionspost_id,
        tp.debet,
        tp.kredit,
        k.kontonummer,
        k.beskrivning AS kontobeskrivning
      FROM transaktioner t
      LEFT JOIN transaktionsposter tp ON tp.transaktions_id = t.id
      LEFT JOIN konton k ON tp.konto_id = k.id
      WHERE t.transaktionsdatum BETWEEN $1 AND $2
      ORDER BY t.transaktionsdatum DESC, t.id DESC, tp.id ASC
    `,
      [start, end]
    );

    const map = new Map<number, any>();

    for (const row of rows) {
      if (!map.has(row.transaktions_id)) {
        map.set(row.transaktions_id, {
          transaktions_id: row.transaktions_id,
          transaktionsdatum: row.transaktionsdatum,
          kontobeskrivning: row.kontobeskrivning,
          belopp: row.belopp,
          kommentar: row.kommentar,
          fil: row.fil,
          blob_url: row.blob_url,
          transaktionsposter: [],
        });
      }

      if (row.transaktionspost_id) {
        map.get(row.transaktions_id).transaktionsposter.push({
          transaktionspost_id: row.transaktionspost_id,
          kontonummer: row.kontonummer,
          beskrivning: row.kontobeskrivning,
          debet: row.debet,
          kredit: row.kredit,
        });
      }
    }

    const resultat = Array.from(map.values());
    console.log(`📦 Exporterar ${resultat.length} transaktioner med poster`);
    return resultat;
  } catch (err: any) {
    console.error("❌ exporteraTransaktionerMedPoster error:", err);
    return [];
  }
}
