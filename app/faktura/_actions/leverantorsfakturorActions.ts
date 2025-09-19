"use server";

import { pool } from "../../_lib/db";
import { getUserId } from "../../_utils/authUtils";
import { Leverantör } from "../_types/types";

export async function registreraBetalning(leverantörsfakturaId: number, belopp: number) {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "Ej autentiserad" };
  }

  // userId already a number from getUserId()
  const client = await pool.connect();

  try {
    // Kontrollera att fakturan är bokförd och obetald
    const { rows: fakturaRows } = await client.query(
      `SELECT status_bokförd, status_betalning FROM leverantörsfakturor 
       WHERE id = $1 AND "user_id" = $2`,
      [leverantörsfakturaId, userId]
    );

    if (fakturaRows.length === 0) {
      return { success: false, error: "Leverantörsfaktura hittades inte" };
    }

    const faktura = fakturaRows[0];
    if (faktura.status_bokförd !== "Bokförd") {
      return { success: false, error: "Fakturan måste vara bokförd innan den kan betalas" };
    }

    if (faktura.status_betalning === "Betald") {
      return { success: false, error: "Fakturan är redan betald" };
    }

    // Skapa ny transaktion för betalningen
    const { rows: transRows } = await client.query(
      `INSERT INTO transaktioner (
        transaktionsdatum, kontobeskrivning, belopp, kommentar, "user_id"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [
        new Date().toISOString().split("T")[0], // Dagens datum
        "Betalning leverantörsfaktura",
        belopp,
        "Automatisk betalning av leverantörsfaktura",
        userId,
      ]
    );
    const transaktionsId = transRows[0].id;

    // Hämta konto-id för 1930 (Företagskonto) och 2440 (Leverantörsskulder)
    const kontoRes = await client.query(
      `SELECT id, kontonummer FROM konton WHERE kontonummer IN ('1930','2440')`
    );
    const kontoMap = Object.fromEntries(kontoRes.rows.map((r: any) => [r.kontonummer, r.id]));

    if (!kontoMap["1930"] || !kontoMap["2440"]) {
      throw new Error("Konto 1930 eller 2440 saknas");
    }

    // Skapa transaktionsposter för betalningen
    // 1930 Företagskonto - Kredit (pengar ut)
    await client.query(
      `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)`,
      [transaktionsId, kontoMap["1930"], 0, belopp]
    );

    // 2440 Leverantörsskulder - Debet (skuld minskar)
    await client.query(
      `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)`,
      [transaktionsId, kontoMap["2440"], belopp, 0]
    );

    // Uppdatera leverantörsfaktura med betaldatum och status
    console.log("📝 Uppdaterar leverantörsfaktura:", leverantörsfakturaId, "för userId:", userId);
    const updateResult = await client.query(
      `UPDATE leverantörsfakturor 
       SET betaldatum = $1, status_betalning = 'Betald' 
       WHERE id = $2 AND "user_id" = $3`,
      [new Date().toISOString().split("T")[0], leverantörsfakturaId, userId]
    );
    console.log("📝 Update result rowCount:", updateResult.rowCount);

    return { success: true, transaktionsId };
  } catch (error) {
    console.error("Fel vid registrering av betalning:", error);
    return {
      success: false,
      error: "Kunde inte registrera betalning",
    };
  } finally {
    client.release();
  }
}

// Betala och bokför en leverantörsfaktura i ett steg
export async function betalaOchBokförLeverantörsfaktura(
  leverantörsfakturaId: number,
  belopp: number
) {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "Ej autentiserad" };
  }

  const client = await pool.connect();

  try {
    // Kontrollera att fakturan finns och är ej bokförd
    const { rows: fakturaRows } = await client.query(
      `SELECT status_bokförd, status_betalning FROM leverantörsfakturor 
       WHERE id = $1 AND "user_id" = $2`,
      [leverantörsfakturaId, userId]
    );

    if (fakturaRows.length === 0) {
      return { success: false, error: "Leverantörsfaktura hittades inte" };
    }

    const faktura = fakturaRows[0];
    if (faktura.status_bokförd === "Bokförd") {
      return { success: false, error: "Fakturan är redan bokförd" };
    }

    await client.query("BEGIN");

    // Skapa ny transaktion för betalningen
    const { rows: transRows } = await client.query(
      `INSERT INTO transaktioner (
        transaktionsdatum, kontobeskrivning, belopp, kommentar, "user_id"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [
        new Date().toISOString().split("T")[0], // Dagens datum
        "Betalning leverantörsfaktura",
        belopp,
        "Betalning och bokföring av leverantörsfaktura",
        userId,
      ]
    );

    const transaktionsId = transRows[0].id;

    // Hämta konto-id för 1930 (Företagskonto) och 2440 (Leverantörsskulder)
    const kontoRes = await client.query(
      `SELECT id, kontonummer FROM konton WHERE kontonummer IN ('1930','2440')`
    );
    const kontoMap = Object.fromEntries(kontoRes.rows.map((r: any) => [r.kontonummer, r.id]));

    if (!kontoMap["1930"] || !kontoMap["2440"]) {
      throw new Error("Konto 1930 eller 2440 saknas");
    }

    // Skapa transaktionsposter för betalningen
    // 1930 Företagskonto - Kredit (pengar ut)
    await client.query(
      `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)`,
      [transaktionsId, kontoMap["1930"], 0, belopp]
    );

    // 2440 Leverantörsskulder - Debet (skuld minskar)
    await client.query(
      `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)`,
      [transaktionsId, kontoMap["2440"], belopp, 0]
    );

    // Uppdatera leverantörsfaktura med betaldatum och status
    const updateResult = await client.query(
      `UPDATE leverantörsfakturor 
       SET betaldatum = $1, status_betalning = 'Betald', status_bokförd = 'Bokförd' 
       WHERE id = $2 AND "user_id" = $3`,
      [new Date().toISOString().split("T")[0], leverantörsfakturaId, userId]
    );

    await client.query("COMMIT");

    return { success: true, transaktionsId };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fel vid betalning och bokföring:", error);
    return {
      success: false,
      error: "Kunde inte betala och bokföra leverantörsfaktura",
    };
  } finally {
    client.release();
  }
}

// ENKEL betalningsregistrering - BARA 1510 ↔ 1930
export async function registreraBetalningEnkel(
  fakturaId: number,
  belopp: number
): Promise<{ success: boolean; error?: string }> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Inte inloggad" };

  // userId already a number from getUserId()
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Skapa transaktion
    const transResult = await client.query(
      'INSERT INTO transaktioner (transaktionsdatum, kontobeskrivning, belopp, "user_id") VALUES ($1, $2, $3, $4) RETURNING id',
      [new Date(), `Betalning faktura ${fakturaId}`, belopp, userId]
    );
    const transId = transResult.rows[0].id;

    // Hämta konto-IDn
    const bankResult = await client.query("SELECT id FROM konton WHERE kontonummer = '1930'");
    const kundResult = await client.query("SELECT id FROM konton WHERE kontonummer = '1510'");

    // 1930 Bank - DEBET
    await client.query(
      "INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)",
      [transId, bankResult.rows[0].id, belopp, 0]
    );

    // 1510 Kundfordringar - KREDIT
    await client.query(
      "INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)",
      [transId, kundResult.rows[0].id, 0, belopp]
    );

    // Uppdatera fakturaSTATUS
    await client.query("UPDATE fakturor SET status_betalning = $1, betaldatum = $2 WHERE id = $3", [
      "Betald",
      new Date().toISOString().split("T")[0],
      fakturaId,
    ]);

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fel:", error);
    return { success: false, error: "Kunde inte registrera betalning" };
  } finally {
    client.release();
  }
}

// Ta bort en leverantörsfaktura
export async function taBortLeverantörsfaktura(leverantörsfakturaId: number) {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "Ej autentiserad" };
  }

  const client = await pool.connect();

  try {
    // Först, kolla om leverantörsfakturan tillhör användaren
    const { rows: checkRows } = await client.query(
      `
      SELECT lf.id, t.user_id 
      FROM leverantörsfakturor lf
      JOIN transaktioner t ON lf.transaktions_id = t.id
      WHERE lf.id = $1
      `,
      [leverantörsfakturaId]
    );

    if (checkRows.length === 0) {
      return { success: false, error: "Leverantörsfaktura hittades inte" };
    }

    if (checkRows[0].user_id !== userId) {
      return { success: false, error: "Ej behörig att ta bort denna leverantörsfaktura" };
    }

    const transaktionsId = await client.query(
      `SELECT transaktions_id FROM leverantörsfakturor WHERE id = $1`,
      [leverantörsfakturaId]
    );

    if (transaktionsId.rows.length === 0) {
      return { success: false, error: "Transaktions-ID hittades inte" };
    }

    const transId = transaktionsId.rows[0].transaktions_id;

    // Ta bort leverantörsfakturan
    await client.query(`DELETE FROM leverantörsfakturor WHERE id = $1`, [leverantörsfakturaId]);

    // Ta bort relaterade transaktionsposter
    await client.query(`DELETE FROM transaktionsposter WHERE transaktions_id = $1`, [transId]);

    // Ta bort transaktionen
    await client.query(`DELETE FROM transaktioner WHERE id = $1 AND user_id = $2`, [
      transId,
      userId,
    ]);

    return { success: true };
  } catch (error) {
    console.error("Fel vid borttagning av leverantörsfaktura:", error);
    return {
      success: false,
      error: "Kunde inte ta bort leverantörsfaktura",
    };
  } finally {
    client.release();
  }
}
