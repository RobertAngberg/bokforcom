"use server";

import { pool } from "../../_lib/db";
import { getUserId } from "../../_utils/authUtils";
import { revalidatePath } from "next/cache";

export async function hämtaSemesterTransaktioner(anställdId: number) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

  try {
    const client = await pool.connect();

    // Kontrollera att anställd tillhör användaren
    const checkQuery = `
      SELECT id FROM anställda 
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [anställdId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      return [];
    }

    const query = `
      SELECT betalda_dagar, sparade_dagar, skuld, komp_dagar, bokförd
      FROM semester
      WHERE anställd_id = $1
    `;
    const result = await client.query(query, [anställdId]);
    client.release();
    return result.rows;
  } catch (error) {
    console.error("❌ hämtaSemesterTransaktioner error:", error);
    return [];
  }
}

export async function sparaSemesterTransaktion(data: {
  anställdId: number;
  nyttVärde: number;
  kolumn: "betalda_dagar" | "sparade_dagar" | "skuld" | "komp_dagar";
}) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

  try {
    const client = await pool.connect();
    // UPDATE
    const updateQuery = `
      UPDATE semester
      SET ${data.kolumn} = $1, bokförd = FALSE, uppdaterad = NOW()
      WHERE anställd_id = $2
      RETURNING id
    `;
    const updateResult = await client.query(updateQuery, [data.nyttVärde, data.anställdId]);
    console.log("sparaSemesterTransaktion: updateResult", updateResult.rows);
    let id = updateResult.rows[0]?.id;
    if (!id) {
      // Ingen rad uppdaterad, skapa en ny rad med rätt värde
      let betalda_dagar = 0,
        sparade_dagar = 0,
        skuld = 0,
        komp_dagar = 0;
      switch (data.kolumn) {
        case "betalda_dagar":
          betalda_dagar = data.nyttVärde;
          break;
        case "sparade_dagar":
          sparade_dagar = data.nyttVärde;
          break;
        case "skuld":
          skuld = data.nyttVärde;
          break;
        case "komp_dagar":
          komp_dagar = data.nyttVärde;
          break;
      }
      const insertQuery = `
        INSERT INTO semester (
          anställd_id, betalda_dagar, sparade_dagar, skuld, komp_dagar, bokförd
        ) VALUES (
          $1, $2, $3, $4, $5, FALSE
        ) RETURNING id
      `;
      const insertResult = await client.query(insertQuery, [
        data.anställdId,
        betalda_dagar,
        sparade_dagar,
        skuld,
        komp_dagar,
      ]);
      id = insertResult.rows[0]?.id;
      console.log("sparaSemesterTransaktion: insertResult", insertResult.rows);
    }
    client.release();
    revalidatePath("/personal");
    return {
      success: true,
      id,
      message: "Semesterfält uppdaterat!",
    };
  } catch (error) {
    console.error("❌ sparaSemesterTransaktion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod vid sparande",
    };
  }
}

export async function raderaSemesterTransaktion(transaktionId: number) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

  try {
    const client = await pool.connect();

    // Kontrollera att transaktionen tillhör användarens anställd
    const checkQuery = `
      SELECT s.id FROM semester s
      JOIN anställda a ON s.anställd_id = a.id
      WHERE s.id = $1 AND a.user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [transaktionId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      return { success: false, error: "Transaktion inte hittad" };
    }

    const deleteQuery = `DELETE FROM semester WHERE id = $1`;
    await client.query(deleteQuery, [transaktionId]);

    client.release();
    revalidatePath("/personal");

    return {
      success: true,
      message: "Semestertransaktion borttagen!",
    };
  } catch (error) {
    console.error("❌ raderaSemesterTransaktion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod",
    };
  }
}

export async function uppdateraSemesterdata(
  anställdId: number,
  data: {
    semesterdagarPerÅr?: number;
    kvarandeDagar?: number;
    sparadeDagar?: number;
    användaFörskott?: number;
    kvarandeFörskott?: number;
    innestående?: number;
  }
) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

  try {
    const client = await pool.connect();

    const updateQuery = `
      UPDATE anställda SET
        semesterdagar_per_år = $1,
        kvarvarande_dagar = $2,
        sparade_dagar = $3,
        använda_förskott = $4,
        kvarvarande_förskott = $5,
        innestående_ersättning = $6,
        uppdaterad = NOW()
      WHERE id = $7 AND user_id = $8
      RETURNING id
    `;

    const values = [
      data.semesterdagarPerÅr || 0,
      data.kvarandeDagar || 0,
      data.sparadeDagar || 0,
      data.användaFörskott || 0,
      data.kvarandeFörskott || 0,
      data.innestående || 0,
      anställdId,
      userId,
    ];

    const result = await client.query(updateQuery, values);

    if (result.rowCount === 0) {
      client.release();
      return { success: false, error: "Anställd inte hittad" };
    }

    client.release();
    revalidatePath("/personal");

    return {
      success: true,
      message: "Semesterdata uppdaterad!",
    };
  } catch (error) {
    console.error("❌ uppdateraSemesterdata error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod",
    };
  }
}

export async function bokförSemester({
  rader,
  kommentar,
  datum,
}: {
  userId: number;
  rader: { kontobeskrivning: string; belopp: number }[];
  kommentar?: string;
  datum?: string;
}) {
  const loggedInUserId = await getUserId();
  if (!loggedInUserId) throw new Error("Ingen inloggad användare");
  const realUserId = loggedInUserId; // Alltid inloggad användare

  try {
    const client = await pool.connect();
    const transaktionsdatum = datum || new Date().toISOString();

    // Skapa huvudtransaktion
    const huvudBeskrivning = "Semestertransaktion";
    const insertTransaktion = await client.query(
      `INSERT INTO transaktioner ("transaktionsdatum", "kontobeskrivning", "kommentar", "user_id")
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [transaktionsdatum, huvudBeskrivning, kommentar || null, realUserId]
    );
    const transaktionsId = insertTransaktion.rows[0].id;

    // Lägg till varje rad i transaktionsposter
    for (const rad of rader) {
      // Extrahera kontonummer ur kontobeskrivning (t.ex. "2920 Upplupna semesterlöner")
      const kontoMatch = rad.kontobeskrivning.match(/^(\d+)/);
      const kontonummer = kontoMatch ? kontoMatch[1] : null;
      if (!kontonummer)
        throw new Error(`Kunde inte extrahera kontonummer ur beskrivning: ${rad.kontobeskrivning}`);
      // Slå upp id i konton-tabellen
      const kontoRes = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
        kontonummer,
      ]);
      if (kontoRes.rows.length === 0)
        throw new Error(`Kontonummer ${kontonummer} finns ej i konton-tabellen!`);
      const konto_id = kontoRes.rows[0].id;
      const debet = rad.belopp > 0 ? rad.belopp : 0;
      const kredit = rad.belopp < 0 ? -rad.belopp : 0;
      await client.query(
        `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
         VALUES ($1, $2, $3, $4)`,
        [transaktionsId, konto_id, debet, kredit]
      );
    }

    client.release();
    revalidatePath("/personal");
    return { success: true, message: "Bokföringsrader sparade!" };
  } catch (error) {
    console.error("❌ bokförSemester error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ett fel uppstod" };
  }
}

export async function hämtaBetaldaSemesterdagar(anställdId: number) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

  try {
    const client = await pool.connect();

    // Kontrollera att anställd tillhör användaren
    const checkQuery = `
      SELECT id FROM anställda 
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [anställdId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      return 0;
    }

    // Hämta betalda semesterdagar från semester-tabellen
    const query = `
      SELECT betalda_dagar FROM semester 
      WHERE anställd_id = $1 
      ORDER BY skapad DESC 
      LIMIT 1
    `;

    const result = await client.query(query, [anställdId]);
    client.release();

    if (result.rows.length > 0) {
      return parseInt(result.rows[0].betalda_dagar) || 0;
    }

    return 0;
  } catch (error) {
    console.error("❌ hämtaBetaldaSemesterdagar error:", error);
    return 0;
  }
}
