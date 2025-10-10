"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import type { TransaktionData } from "../types/types";

export async function fetchHuvudbok() {
  const { userId } = await ensureSession();

  try {
    const client = await pool.connect();

    // Hämta ingående balanser (från SIE-import)
    const ingaendeBalanserQuery = `
      SELECT 
        k.kontonummer,
        k.beskrivning,
        SUM(tp.debet - tp.kredit) as ingaende_balans
      FROM transaktioner t
      JOIN transaktionsposter tp ON tp.transaktions_id = t.id
      JOIN konton k ON k.id = tp.konto_id
      WHERE t."user_id" = $1
        AND t.kontobeskrivning = 'Ingående balanser'
        AND t.kommentar = 'SIE Import - Ingående balanser'
      GROUP BY k.kontonummer, k.beskrivning
    `;

    // Hämta alla transaktioner för periodens saldo (exklusive ingående balanser)
    const periodsTransaktionerQuery = `
      SELECT 
        k.kontonummer,
        k.beskrivning,
        SUM(tp.debet - tp.kredit) as periods_saldo
      FROM transaktioner t
      JOIN transaktionsposter tp ON tp.transaktions_id = t.id
      JOIN konton k ON k.id = tp.konto_id
      WHERE t."user_id" = $1
        AND NOT (t.kontobeskrivning = 'Ingående balanser' AND t.kommentar = 'SIE Import - Ingående balanser')
      GROUP BY k.kontonummer, k.beskrivning
    `;

    // Hämta alla konton som använts
    const allaKontonQuery = `
      SELECT 
        k.kontonummer,
        k.beskrivning,
        k.kontonummer::int as sort_order
      FROM konton k
      JOIN transaktionsposter tp ON k.id = tp.konto_id
      JOIN transaktioner t ON tp.transaktions_id = t.id
      WHERE t."user_id" = $1
      GROUP BY k.kontonummer, k.beskrivning
      ORDER BY k.kontonummer::int
    `;

    const [ingaendeRes, periodsRes, kontonRes] = await Promise.all([
      client.query(ingaendeBalanserQuery, [userId]),
      client.query(periodsTransaktionerQuery, [userId]),
      client.query(allaKontonQuery, [userId]),
    ]);

    client.release();

    // Skapa lookup-objekt
    const ingaendeBalanser = ingaendeRes.rows.reduce(
      (acc, row) => {
        acc[row.kontonummer] = parseFloat(row.ingaende_balans);
        return acc;
      },
      {} as Record<string, number>
    );

    const periodsSaldon = periodsRes.rows.reduce(
      (acc, row) => {
        acc[row.kontonummer] = parseFloat(row.periods_saldo);
        return acc;
      },
      {} as Record<string, number>
    );

    // Bygg huvudboksdata för alla konton
    const huvudboksdata = kontonRes.rows.map((row) => {
      const ingaendeBalans = ingaendeBalanser[row.kontonummer] || 0;
      const periodsSaldo = periodsSaldon[row.kontonummer] || 0;
      const utgaendeBalans = ingaendeBalans + periodsSaldo;

      return {
        kontonummer: row.kontonummer,
        beskrivning: row.beskrivning,
        ingaendeBalans,
        utgaendeBalans,
      };
    });

    return huvudboksdata;
  } catch (error) {
    console.error("❌ fetchHuvudbok error:", error);
    return [];
  }
}

export async function fetchForetagsprofil(userId?: string) {
  const { userId: sessionUserId } = await ensureSession();

  // Använd sessionUserId om inget userId skickades
  const targetUserId = userId || sessionUserId;

  if (targetUserId !== sessionUserId) {
    throw new Error("Otillåten åtkomst: Du äger inte denna resurs");
  }

  try {
    const client = await pool.connect();
    const query = `
      SELECT företagsnamn, organisationsnummer
      FROM företagsprofil
      WHERE id = $1
      LIMIT 1
    `;
    const res = await client.query(query, [targetUserId]);
    client.release();
    return res.rows[0] || null;
  } catch (error) {
    console.error("❌ fetchForetagsprofil error:", error);
    return null;
  }
}

export async function fetchTransactionDetails(transaktionsId: number) {
  const { userId } = await ensureSession();

  if (!transaktionsId || isNaN(transaktionsId) || transaktionsId <= 0) {
    throw new Error("Ogiltigt transaktions-ID");
  }

  try {
    const result = await pool.query(
      `
    SELECT
      tp.id AS transaktionspost_id,
      tp.debet,
      tp.kredit,
      k.kontonummer,
      k.beskrivning,
      t.kommentar,
      t.fil,
      t.blob_url,
      t.transaktionsdatum,
      t.kontobeskrivning as verifikat_beskrivning,
      CONCAT('V', t.id) as verifikatNummer
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE tp.transaktions_id = $1
      AND t."user_id" = $2
    ORDER BY tp.id
    `,
      [transaktionsId, userId]
    );
    return result.rows;
  } catch (error) {
    console.error("❌ fetchTransactionDetails error:", error);
    throw new Error("Ett fel uppstod vid hämtning av transaktionsdetaljer");
  }
}

export async function fetchKontoTransaktioner(kontonummer: string) {
  const { userId } = await ensureSession();

  try {
    const result = await pool.query(
      `
      WITH konto_transaktioner AS (
        SELECT
          t.id as transaktion_id,
          t.transaktionsdatum as datum,
          t.kontobeskrivning as beskrivning,
          tp.debet,
          tp.kredit,
          CONCAT('V', t.id) as verifikatNummer,
          (tp.debet - tp.kredit) as belopp,
          ROW_NUMBER() OVER (ORDER BY t.transaktionsdatum, t.id) as rad_nr
        FROM transaktioner t
        JOIN transaktionsposter tp ON tp.transaktions_id = t.id
        JOIN konton k ON k.id = tp.konto_id
        WHERE k.kontonummer = $1 
          AND t."user_id" = $2
      )
      SELECT 
        *,
        SUM(belopp) OVER (ORDER BY datum, transaktion_id) as lopande_saldo
      FROM konto_transaktioner
      ORDER BY datum, transaktion_id
      `,
      [kontonummer, userId]
    );
    return result.rows;
  } catch (error) {
    console.error("❌ fetchKontoTransaktioner error:", error);
    throw new Error("Ett fel uppstod vid hämtning av kontotransaktioner");
  }
}

export async function fetchHuvudbokMedAllaTransaktioner(year?: string) {
  const { userId } = await ensureSession();

  try {
    const client = await pool.connect();

    // Lägg till WHERE-klausul för år om det är specificerat
    const yearFilter = year ? `AND EXTRACT(YEAR FROM t.transaktionsdatum) = $2` : "";
    const queryParams = year ? [userId, parseInt(year)] : [userId];

    // Hämta alla transaktioner grupperade per konto, inklusive ingående balans
    const fullQuery = `
      WITH konto_transaktioner AS (
        SELECT 
          k.kontonummer,
          k.beskrivning as konto_beskrivning,
          t.id as transaktion_id,
          t.transaktionsdatum as datum,
          t.kontobeskrivning as beskrivning,
          tp.debet,
          tp.kredit,
          CASE 
            WHEN t.kontobeskrivning = 'Ingående balanser' AND t.kommentar = 'SIE Import - Ingående balanser' 
            THEN 'Ingående balans'
            ELSE CONCAT('V', t.id)
          END as verifikatNummer,
          (tp.debet - tp.kredit) as belopp,
          CASE 
            WHEN t.kontobeskrivning = 'Ingående balanser' AND t.kommentar = 'SIE Import - Ingående balanser' 
            THEN 1
            ELSE 2
          END as sort_priority
        FROM transaktioner t
        JOIN transaktionsposter tp ON tp.transaktions_id = t.id
        JOIN konton k ON k.id = tp.konto_id
        WHERE t."user_id" = $1 ${yearFilter}
        ORDER BY k.kontonummer::int, sort_priority, t.transaktionsdatum, t.id
      ),
      konto_summary AS (
        SELECT 
          kontonummer,
          konto_beskrivning,
          SUM(CASE WHEN sort_priority = 1 THEN belopp ELSE 0 END) as ingaende_balans,
          SUM(belopp) as utgaende_balans,
          json_agg(
            json_build_object(
              'transaktion_id', transaktion_id,
              'datum', datum,
              'beskrivning', beskrivning,
              'debet', debet,
              'kredit', kredit,
              'verifikatNummer', verifikatNummer,
              'belopp', belopp,
              'sort_priority', sort_priority
            ) ORDER BY sort_priority, datum, transaktion_id
          ) as transaktioner
        FROM konto_transaktioner
        GROUP BY kontonummer, konto_beskrivning
      )
      SELECT 
        kontonummer,
        konto_beskrivning as beskrivning,
        ingaende_balans as "ingaendeBalans",
        utgaende_balans as "utgaendeBalans",
        transaktioner
      FROM konto_summary
      ORDER BY kontonummer::int
    `;

    const result = await client.query(fullQuery, queryParams);
    client.release();

    // Bearbeta resultatet för att beräkna löpande saldon
    const huvudboksdata = result.rows.map((row) => {
      let lopandeSaldo = 0;
      const transaktionerMedSaldo = row.transaktioner.map((trans: TransaktionData) => {
        lopandeSaldo += trans.belopp;
        return {
          ...trans,
          lopande_saldo: lopandeSaldo,
        };
      });

      return {
        kontonummer: row.kontonummer,
        beskrivning: row.beskrivning,
        ingaendeBalans: parseFloat(row.ingaendeBalans),
        utgaendeBalans: parseFloat(row.utgaendeBalans),
        transaktioner: transaktionerMedSaldo,
      };
    });

    return huvudboksdata;
  } catch (error) {
    console.error("❌ fetchHuvudbokMedAllaTransaktioner error:", error);
    throw new Error("Ett fel uppstod vid hämtning av huvudbok med transaktioner");
  }
}
