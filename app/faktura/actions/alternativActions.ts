"use server";

import { pool } from "../../_lib/db";
import { getUserId } from "../../_utils/authUtils";
import { withDatabase } from "../../_utils/dbUtils";

// === BETALNINGSMETOD (från alternativActions.ts) ===
export async function hämtaSenasteBetalningsmetod(userId: string) {
  try {
    const result = await pool.query(
      `
      SELECT 
        betalningsmetod, 
        nummer
      FROM fakturor 
      WHERE "user_id" = $1 
        AND betalningsmetod IS NOT NULL 
        AND betalningsmetod != ''
        AND nummer IS NOT NULL
        AND nummer != ''
      ORDER BY id DESC
      LIMIT 1
    `,
      [userId]
    );

    if (result.rows.length === 0) {
      return { betalningsmetod: null, nummer: null };
    }

    const { betalningsmetod, nummer } = result.rows[0];
    return { betalningsmetod, nummer };
  } catch (error) {
    console.error("❌ Fel vid hämtning av senaste betalningsmetod:", error);
    return { betalningsmetod: null, nummer: null };
  }
}

// === BETALNINGAR (från betalningActions.ts) ===
export async function registreraKundfakturaBetalning(
  fakturaId: number,
  betalningsbelopp: number,
  kontoklass: string
): Promise<{ success: boolean; error?: string; transaktionsId?: number }> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "Inte inloggad" };
  }

  // userId already a number from getUserId()
  const client = await pool.connect();
  try {
    // Hämta fakturauppgifter och artiklar
    const fakturaResult = await client.query(
      'SELECT * FROM fakturor WHERE id = $1 AND "user_id" = $2',
      [fakturaId, userId]
    );

    if (fakturaResult.rows.length === 0) {
      return { success: false, error: "Faktura hittades inte" };
    }

    const faktura = fakturaResult.rows[0];

    // Kontrollera att fakturan är en kundfaktura och inte redan betald
    if (faktura.typ !== "kund" || faktura.status_betalning === "betald") {
      return { success: false, error: "Fakturan kan inte betalas" };
    }

    // Kolla om fakturan har ROT/RUT-artiklar
    const artiklarResult = await client.query(
      "SELECT rot_rut_typ FROM faktura_artiklar WHERE faktura_id = $1",
      [fakturaId]
    );

    const harRotRut = artiklarResult.rows.some((row) => row.rot_rut_typ);

    await client.query("BEGIN");

    // Skapa ny transaktion för betalningen
    const transaktionResult = await client.query(
      "INSERT INTO transaktioner (user_id, datum, beskrivning, typ) VALUES ($1, $2, $3, $4) RETURNING id",
      [
        userId,
        new Date().toISOString().split("T")[0],
        `Betalning kundfaktura ${faktura.fakturanummer}`,
        "kundfaktura_betalning",
      ]
    );

    const transaktionsId = transaktionResult.rows[0].id;

    // Debitera bank/kassa konto
    const bankKonto = kontoklass === "1930" ? "1930" : "1910";
    await client.query(
      "INSERT INTO transaktionsposter (transaktion_id, konto, debet, kredit, beskrivning) VALUES ($1, $2, $3, $4, $5)",
      [
        transaktionsId,
        bankKonto,
        betalningsbelopp,
        0,
        `Betalning kundfaktura ${faktura.fakturanummer}`,
      ]
    );

    // Kreditera kundfordringar (bara 1510 för vanliga fakturor, även för ROT/RUT)
    // För ROT/RUT: betalningsbelopp ska vara kundens del (50%), 1513 förblir orörd
    await client.query(
      "INSERT INTO transaktionsposter (transaktion_id, konto, debet, kredit, beskrivning) VALUES ($1, $2, $3, $4, $5)",
      [
        transaktionsId,
        "1510",
        0,
        betalningsbelopp,
        `Betalning kundfaktura ${faktura.fakturanummer}${harRotRut ? " (kundens del)" : ""}`,
      ]
    );

    // Uppdatera fakturastatus
    await client.query(
      "UPDATE fakturor SET status_betalning = $1, betaldatum = $2, transaktions_id = $3 WHERE id = $4",
      ["betald", new Date().toISOString().split("T")[0], transaktionsId, fakturaId]
    );

    await client.query("COMMIT");

    return {
      success: true,
      transaktionsId: transaktionsId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fel vid registrering av kundfakturabetalning:", error);
    return {
      success: false,
      error: "Kunde inte registrera betalning",
    };
  } finally {
    client.release();
  }
}

export async function uppdateraRotRutStatus(
  fakturaId: number,
  status: "ej_inskickad" | "väntar" | "godkänd"
) {
  const userId = await getUserId();
  if (!userId) return { success: false };
  // userId already a number from getUserId()
  const client = await pool.connect();

  try {
    const result = await client.query(
      `UPDATE fakturor SET rot_rut_status = $1 WHERE id = $2 AND "user_id" = $3`,
      [status, fakturaId, userId]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Faktura hittades inte" };
    }

    return { success: true };
  } catch (error) {
    console.error("Fel vid uppdatering av ROT/RUT status:", error);
    return { success: false, error: "Kunde inte uppdatera status" };
  } finally {
    client.release();
  }
}

export async function registreraRotRutBetalning(
  fakturaId: number
): Promise<{ success: boolean; error?: string }> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "Inte inloggad" };
  }

  // userId already a number from getUserId()
  const client = await pool.connect();

  try {
    // Hämta faktura för att kolla ROT/RUT-belopp
    const fakturaResult = await client.query(
      'SELECT * FROM fakturor WHERE id = $1 AND "user_id" = $2',
      [fakturaId, userId]
    );

    if (fakturaResult.rows.length === 0) {
      return { success: false, error: "Faktura hittades inte" };
    }

    const faktura = fakturaResult.rows[0];

    // Kolla om fakturan har ROT/RUT-artiklar
    const artiklarResult = await client.query(
      "SELECT * FROM faktura_artiklar WHERE faktura_id = $1 AND rot_rut_typ IS NOT NULL",
      [fakturaId]
    );

    if (artiklarResult.rows.length === 0) {
      return { success: false, error: "Inga ROT/RUT-artiklar hittades" };
    }

    // Beräkna totalt ROT/RUT-belopp (50% av fakturasumman)
    const totalArtiklarResult = await client.query(
      "SELECT SUM(antal * pris_per_enhet * (1 + moms/100)) as total FROM faktura_artiklar WHERE faktura_id = $1",
      [fakturaId]
    );

    const totalBelopp = totalArtiklarResult.rows[0].total || 0;
    const rotRutBelopp = Math.round(totalBelopp * 0.5 * 100) / 100; // 50% avrundad

    await client.query("BEGIN");

    // Skapa transaktion för ROT/RUT-betalning
    const transaktionResult = await client.query(
      `INSERT INTO transaktioner (
        transaktionsdatum, kontobeskrivning, belopp, kommentar, "user_id"
      ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        new Date(),
        `ROT/RUT-betalning faktura ${faktura.fakturanummer}`,
        rotRutBelopp,
        `ROT/RUT-utbetalning från Skatteverket för faktura ${faktura.fakturanummer}`,
        userId,
      ]
    );

    const transaktionsId = transaktionResult.rows[0].id;

    // Hämta konto_id för 1930 (Bank/Kassa)
    const konto1930Result = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
      "1930",
    ]);
    if (konto1930Result.rows.length === 0) {
      throw new Error("Konto 1930 (Bank/Kassa) finns inte i databasen");
    }
    const konto1930Id = konto1930Result.rows[0].id;

    // Hämta konto_id för 1513 (Kundfordringar – delad faktura)
    const konto1513Result = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
      "1513",
    ]);
    if (konto1513Result.rows.length === 0) {
      throw new Error("Konto 1513 (Kundfordringar – delad faktura) finns inte i databasen");
    }
    const konto1513Id = konto1513Result.rows[0].id;

    // Debitera Bank/Kassa (pengarna kommer in)
    await client.query(
      "INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)",
      [transaktionsId, konto1930Id, rotRutBelopp, 0]
    );

    // Kreditera 1513 (nollar SKV-fordran)
    await client.query(
      "INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)",
      [transaktionsId, konto1513Id, 0, rotRutBelopp]
    );

    // Uppdatera fakturas betalningsstatus till "Betald" när SKV har betalat
    await client.query("UPDATE fakturor SET status_betalning = $1 WHERE id = $2", [
      "Betald",
      fakturaId,
    ]);

    await client.query("COMMIT");

    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fel vid registrering av ROT/RUT-betalning:", error);
    return { success: false, error: "Kunde inte registrera ROT/RUT-betalning" };
  } finally {
    client.release();
  }
}

// === BOKFÖRING (från bokforingActions.ts) ===
export async function hämtaBokföringsmetod() {
  const userId = await getUserId();
  if (!userId) return "kontantmetoden"; // Default

  try {
    const result = await pool.query('SELECT bokföringsmetod FROM "user" WHERE id = $1', [userId]);

    return result.rows[0]?.bokföringsmetod || "kontantmetoden";
  } catch (error) {
    console.error("Fel vid hämtning av bokföringsmetod:", error);
    return "kontantmetoden";
  }
}

export async function hämtaFakturaStatus(fakturaId: number): Promise<{
  status_betalning?: string;
  status_bokförd?: string;
  betaldatum?: string;
}> {
  const userId = await getUserId();
  if (!userId) return {};

  try {
    const result = await pool.query(
      'SELECT status_betalning, status_bokförd, betaldatum FROM fakturor WHERE id = $1 AND "user_id" = $2',
      [fakturaId, userId]
    );
    return result.rows[0] || {};
  } catch (error) {
    console.error("Fel vid hämtning av fakturaSTATUS:", error);
    return {};
  }
}

export async function sparaBokföringsmetod(metod: "kontantmetoden" | "fakturametoden") {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Inte inloggad" };

  try {
    await pool.query('UPDATE "user" SET bokföringsmetod = $1 WHERE id = $2', [metod, userId]);

    return { success: true };
  } catch (error) {
    console.error("Fel vid sparande av bokföringsmetod:", error);
    return { success: false, error: "Databasfel" };
  }
}

// Bokföringsfunktioner
import type { BokförFakturaData } from "../types/types";

export async function bokförFaktura(data: BokförFakturaData) {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Ingen användare hittad" };

  return withDatabase(async (client) => {
    try {
      // Uppdatera fakturastatus
      await client.query(
        `UPDATE fakturor 
         SET 
           status_bokförd = 'Bokförd',
           uppdaterad = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2`,
        [data.fakturaId, userId]
      );

      // Spara bokföringsposter om de finns
      if (data.poster && data.poster.length > 0) {
        for (const post of data.poster) {
          await client.query(
            `INSERT INTO bokforing_poster (
              user_id, faktura_id, konto, beskrivning, debet, kredit
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              userId,
              data.fakturaId,
              post.konto,
              post.beskrivning,
              post.debet || 0,
              post.kredit || 0,
            ]
          );
        }
      }

      return {
        success: true,
        message: `Faktura ${data.fakturanummer} har bokförts för ${data.kundnamn}`,
      };
    } catch (error) {
      console.error("Bokföringsfel:", error);
      return { success: false, error: "Databasfel vid bokföring" };
    }
  });
}

export async function hamtaBokfordaFakturor() {
  const userId = await getUserId();
  if (!userId) return { success: false, data: [] };

  return withDatabase(async (client) => {
    const result = await client.query(
      `SELECT * FROM fakturor 
       WHERE user_id = $1 AND status_bokförd = 'Bokförd'
       ORDER BY uppdaterad DESC`,
      [userId]
    );
    return { success: true, data: result.rows };
  });
}

export async function hamtaTransaktionsposter(fakturaId?: number) {
  const userId = await getUserId();
  if (!userId) return { success: false, data: [] };

  return withDatabase(async (client) => {
    let query = `
      SELECT t.*, f.fakturanummer, f.belopp 
      FROM transaktioner t
      LEFT JOIN fakturor f ON t.faktura_id = f.id
      WHERE t.user_id = $1
    `;
    const params = [userId];

    if (fakturaId) {
      query += " AND t.faktura_id = $2";
      params.push(fakturaId);
    }

    query += " ORDER BY t.datum DESC";

    const result = await client.query(query, params);
    return { success: true, data: result.rows };
  });
}
