"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { createTransaktion } from "../../_utils/transactions";
import { dateTillÅÅÅÅMMDD } from "../../_utils/datum";

export async function registreraBetalning(leverantörsfakturaId: number, belopp: number) {
  const { userId } = await ensureSession();

  try {
    if (!Number.isFinite(belopp) || belopp <= 0) {
      return { success: false, error: "Ogiltigt betalningsbelopp" };
    }

    // Kontrollera att fakturan är bokförd och obetald
    const { rows: fakturaRows } = await pool.query(
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

    const todayISO = dateTillÅÅÅÅMMDD(new Date());
    let transaktionsId: number | null = null;

    try {
      const { transaktionsId: createdId } = await createTransaktion({
        datum: todayISO,
        beskrivning: `Betalning leverantörsfaktura ${leverantörsfakturaId}`,
        kommentar: "Automatisk betalning av leverantörsfaktura",
        userId,
        poster: [
          { kontonummer: "2440", debet: belopp, kredit: 0 },
          { kontonummer: "1930", debet: 0, kredit: belopp },
        ],
      });

      transaktionsId = createdId;

      console.log("🆔 Skapad leverantörsbetalning-transaktion:", transaktionsId);
      const updateResult = await pool.query(
        `UPDATE leverantörsfakturor 
         SET betaldatum = $1, status_betalning = 'Betald' 
         WHERE id = $2 AND "user_id" = $3`,
        [todayISO, leverantörsfakturaId, userId]
      );
      console.log("📝 Update result rowCount:", updateResult.rowCount);

      return { success: true, transaktionsId };
    } catch (error) {
      if (transaktionsId) {
        try {
          await pool.query('DELETE FROM transaktioner WHERE id = $1 AND "user_id" = $2', [
            transaktionsId,
            userId,
          ]);
        } catch (cleanupError) {
          console.error("⚠️ Kunde inte rulla tillbaka skapad leverantörsbetalning:", cleanupError);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("Fel vid registrering av betalning:", error);
    return {
      success: false,
      error: "Kunde inte registrera betalning",
    };
  }
}

// Betala och bokför en leverantörsfaktura i ett steg
export async function betalaOchBokförLeverantörsfaktura(
  leverantörsfakturaId: number,
  belopp: number
) {
  const { userId } = await ensureSession();

  try {
    if (!Number.isFinite(belopp) || belopp <= 0) {
      return { success: false, error: "Ogiltigt belopp" };
    }

    // Kontrollera att fakturan finns och är ej bokförd
    const { rows: fakturaRows } = await pool.query(
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

    const todayISO = dateTillÅÅÅÅMMDD(new Date());
    let transaktionsId: number | null = null;

    try {
      const { transaktionsId: createdId } = await createTransaktion({
        datum: todayISO,
        beskrivning: `Betalning och bokföring av leverantörsfaktura ${leverantörsfakturaId}`,
        kommentar: "Betalning och bokföring av leverantörsfaktura",
        userId,
        poster: [
          { kontonummer: "2440", debet: belopp, kredit: 0 },
          { kontonummer: "1930", debet: 0, kredit: belopp },
        ],
      });

      transaktionsId = createdId;

      await pool.query(
        `UPDATE leverantörsfakturor 
         SET betaldatum = $1, status_betalning = 'Betald', status_bokförd = 'Bokförd' 
         WHERE id = $2 AND "user_id" = $3`,
        [todayISO, leverantörsfakturaId, userId]
      );

      return { success: true, transaktionsId };
    } catch (error) {
      if (transaktionsId) {
        try {
          await pool.query('DELETE FROM transaktioner WHERE id = $1 AND "user_id" = $2', [
            transaktionsId,
            userId,
          ]);
        } catch (cleanupError) {
          console.error(
            "⚠️ Kunde inte rulla tillbaka skapad leverantörstransaktion:",
            cleanupError
          );
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("Fel vid betalning och bokföring:", error);
    return {
      success: false,
      error: "Kunde inte betala och bokföra leverantörsfaktura",
    };
  }
}

// ENKEL betalningsregistrering - BARA 1510 ↔ 1930
export async function registreraBetalningEnkel(
  fakturaId: number,
  belopp: number
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await ensureSession();

  try {
    if (!Number.isFinite(belopp) || belopp <= 0) {
      return { success: false, error: "Ogiltigt belopp" };
    }

    const today = new Date();
    const todayISO = dateTillÅÅÅÅMMDD(today);
    let transId: number | null = null;

    try {
      const { transaktionsId } = await createTransaktion({
        datum: today,
        beskrivning: `Betalning faktura ${fakturaId}`,
        userId,
        poster: [
          { kontonummer: "1930", debet: belopp, kredit: 0 },
          { kontonummer: "1510", debet: 0, kredit: belopp },
        ],
      });

      transId = transaktionsId;

      await pool.query("UPDATE fakturor SET status_betalning = $1, betaldatum = $2 WHERE id = $3", [
        "Betald",
        todayISO,
        fakturaId,
      ]);
    } catch (error) {
      if (transId) {
        try {
          await pool.query('DELETE FROM transaktioner WHERE id = $1 AND "user_id" = $2', [
            transId,
            userId,
          ]);
        } catch (cleanupError) {
          console.error("⚠️ Kunde inte rulla tillbaka enkel betalning:", cleanupError);
        }
      }
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Fel:", error);
    return { success: false, error: "Kunde inte registrera betalning" };
  }
}

// Ta bort en leverantörsfaktura
export async function taBortLeverantörsfaktura(leverantörsfakturaId: number) {
  const { userId } = await ensureSession();

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
