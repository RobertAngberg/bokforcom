"use server";

import { pool } from "../../_lib/db";
import { getUserId } from "../../_utils/authUtils";
import { validateKontonummer, sanitizeInput } from "../../_utils/validationUtils";
import {
  hamtaTransaktionsposter as hamtaTransaktionsposterUtil,
  TransaktionspostMedMeta,
} from "../../_utils/transaktioner/hamtaTransaktionsposter";

interface BokföringsPost {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
  beskrivning: string;
}

interface BokförFakturaData {
  fakturaId?: number;
  fakturanummer: string;
  kundnamn: string;
  totaltBelopp: number;
  poster: BokföringsPost[];
  kommentar?: string;
}

export async function hämtaBokföringsmetod() {
  const userId = await getUserId();
  if (!userId) return "kontantmetoden"; // Default

  try {
    const result = await pool.query("SELECT bokföringsmetod FROM users WHERE id = $1", [userId]);

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
    await pool.query("UPDATE users SET bokföringsmetod = $1, uppdaterad = NOW() WHERE id = $2", [
      metod,
      userId,
    ]);

    return { success: true };
  } catch (error) {
    console.error("Fel vid sparande av bokföringsmetod:", error);
    return { success: false, error: "Databasfel" };
  }
}

export async function bokförFaktura(data: BokförFakturaData) {
  try {
    // SÄKERHETSVALIDERING: Omfattande sessionsvalidering
    const userId = await getUserId();
    if (!userId) {
      console.error("❌ Säkerhetsvarning: Ogiltig session vid bokföring av faktura");
      return { success: false, error: "Säkerhetsvalidering misslyckades" };
    }

    // SÄKERHETSEVENT: Logga bokföringsförsök
    console.log(`🔒 Säker fakturbokföring initierad för user ${userId}, faktura ${data.fakturaId}`);

    // SÄKERHETSVALIDERING: Validera kritiska inputvärden
    if (!data.fakturanummer || data.fakturanummer.trim().length === 0) {
      return { success: false, error: "Fakturanummer krävs" };
    }

    if (!data.kundnamn || data.kundnamn.trim().length === 0) {
      return { success: false, error: "Kundnamn krävs" };
    }

    if (!data.poster || !Array.isArray(data.poster) || data.poster.length === 0) {
      return { success: false, error: "Minst en bokföringspost krävs" };
    }

    if (isNaN(data.totaltBelopp) || data.totaltBelopp <= 0) {
      return { success: false, error: "Ogiltigt totalbelopp" };
    }

    // SÄKERHETSVALIDERING: Sanitera text-inputs
    const sanitizedFakturanummer = sanitizeInput(data.fakturanummer);
    const sanitizedKundnamn = sanitizeInput(data.kundnamn);
    const sanitizedKommentar = data.kommentar ? sanitizeInput(data.kommentar) : "";

    // SÄKERHETSVALIDERING: Validera bokföringsposter
    for (const post of data.poster) {
      if (!validateKontonummer(post.konto.toString())) {
        return { success: false, error: "Ogiltigt kontonummer (måste vara 4 siffror)" };
      }

      if (isNaN(post.debet) || isNaN(post.kredit) || post.debet < 0 || post.kredit < 0) {
        return { success: false, error: "Ogiltiga belopp i bokföringsposter" };
      }

      if (post.debet > 0 && post.kredit > 0) {
        return { success: false, error: "En post kan inte ha både debet och kredit" };
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // SÄKERHETSVALIDERING: Om fakturaId anges, verifiera ägarskap
      if (data.fakturaId) {
        const fakturaCheck = await client.query(
          `SELECT id FROM fakturor WHERE id = $1 AND "user_id" = $2`,
          [data.fakturaId, userId]
        );

        if (fakturaCheck.rows.length === 0) {
          throw new Error("Fakturan finns inte eller tillhör inte dig");
        }
      }

      // Validera att bokföringen balanserar
      const totalDebet = data.poster.reduce((sum, post) => sum + post.debet, 0);
      const totalKredit = data.poster.reduce((sum, post) => sum + post.kredit, 0);

      if (Math.abs(totalDebet - totalKredit) > 0.01) {
        throw new Error(
          `Bokföringen balanserar inte! Debet: ${totalDebet.toFixed(2)}, Kredit: ${totalKredit.toFixed(2)}`
        );
      }

      // Skapa huvudtransaktion
      const transaktionQuery = `
        INSERT INTO transaktioner (
          transaktionsdatum, kontobeskrivning, belopp, kommentar, "user_id"
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;

      const transaktionResult = await client.query(transaktionQuery, [
        new Date(), // Dagens datum
        `Faktura ${sanitizedFakturanummer} - ${sanitizedKundnamn}`,
        data.totaltBelopp,
        sanitizedKommentar ||
          `Bokföring av faktura ${sanitizedFakturanummer} för ${sanitizedKundnamn}`,
        userId,
      ]);

      const transaktionsId = transaktionResult.rows[0].id;
      console.log("🆔 Skapad säker fakturatransaktion:", transaktionsId);

      // Skapa bokföringsposter
      const insertPostQuery = `
        INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
        VALUES ($1, $2, $3, $4)
      `;

      for (const post of data.poster) {
        // SÄKERHETSVALIDERING: Hämta konto_id från konton-tabellen
        const kontoResult = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
          post.konto,
        ]);

        if (kontoResult.rows.length === 0) {
          throw new Error(`Konto ${post.konto} (${post.kontoNamn}) finns inte i databasen`);
        }

        const kontoId = kontoResult.rows[0].id;

        await client.query(insertPostQuery, [transaktionsId, kontoId, post.debet, post.kredit]);

        console.log(`📘 Bokförd post ${post.konto}: D ${post.debet}  K ${post.kredit}`);
      }

      // Uppdatera fakturas status när den bokförs
      if (data.fakturaId) {
        // Kolla om det är en betalningsregistrering (innehåller 1930 och 1510)
        const harBankKonto = data.poster.some((p) => p.konto === "1930" || p.konto === "1910");
        const harKundfordringar = data.poster.some((p) => p.konto === "1510");
        const ärBetalning = harBankKonto && harKundfordringar && data.poster.length === 2;

        if (ärBetalning) {
          // Detta är en betalningsregistrering (Fakturametoden: Bank → Kundfordringar)
          // Kolla om fakturan har ROT/RUT-artiklar för att avgöra om det är delvis betald
          const rotRutCheck = await client.query(
            "SELECT COUNT(*) as count FROM faktura_artiklar WHERE faktura_id = $1 AND rot_rut_typ IS NOT NULL",
            [data.fakturaId]
          );

          let status = "Betald";
          const harRotRutArtiklar = parseInt(rotRutCheck.rows[0].count) > 0;

          if (harRotRutArtiklar) {
            // För ROT/RUT-fakturor: Bara kundens del är betald, väntar på SKV
            status = "Delvis betald";
          }

          await client.query(
            'UPDATE fakturor SET status_betalning = $1, betaldatum = $2, transaktions_id = $3 WHERE id = $4 AND "user_id" = $5',
            [status, new Date().toISOString().split("T")[0], transaktionsId, data.fakturaId, userId]
          );
          console.log(`💰 Uppdaterat faktura ${data.fakturaId} status till ${status}`);
        } else {
          // Kolla om det är kontantmetod (Bank + Försäljning/Moms, men ingen Kundfordringar)
          const harBankKontantmetod = data.poster.some((p) => p.konto === "1930");
          const harIngenKundfordringar = !data.poster.some((p) => p.konto === "1510");
          const ärKontantmetod = harBankKontantmetod && harIngenKundfordringar;

          if (ärKontantmetod) {
            // Kontantmetod: sätt både bokförd OCH betald
            await client.query(
              'UPDATE fakturor SET status_bokförd = $1, status_betalning = $2, betaldatum = $3, transaktions_id = $4 WHERE id = $5 AND "user_id" = $6',
              [
                "Bokförd",
                "Betald",
                new Date().toISOString().split("T")[0],
                transaktionsId,
                data.fakturaId,
                userId,
              ]
            );
            console.log(
              `💰📊 Uppdaterat faktura ${data.fakturaId} status till Bokförd och Betald (kontantmetod)`
            );
          } else {
            // Normal fakturametods-bokföring
            await client.query(
              'UPDATE fakturor SET status_bokförd = $1, transaktions_id = $2 WHERE id = $3 AND "user_id" = $4',
              ["Bokförd", transaktionsId, data.fakturaId, userId]
            );
            console.log(`📊 Uppdaterat faktura ${data.fakturaId} status till Bokförd`);
          }
        }
      }

      await client.query("COMMIT");
      console.log(`✅ Faktura ${sanitizedFakturanummer} bokförd säkert för user ${userId}!`);

      return {
        success: true,
        transaktionsId,
        message: `Faktura ${sanitizedFakturanummer} har bokförts framgångsrikt!`,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("❌ Databasfel vid bokföring av faktura:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Okänt fel vid bokföring",
      };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ Säkerhetsfel vid bokföring av faktura:", err);
    return { success: false, error: "Kunde inte bokföra faktura säkert" };
  }
}

export async function hamtaBokfordaFakturor() {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "Ej autentiserad" };
  }

  // userId already a number from getUserId()
  const client = await pool.connect();

  try {
    // Hämta endast leverantörsfakturor från leverantörsfakturor tabellen
    const { rows } = await client.query(
      `
      SELECT DISTINCT
        t.id as transaktion_id,
        lf.id,
        t.transaktionsdatum as datum,
        t.belopp,
        t.kommentar,
        lf.leverantör_namn as leverantör,
        lf.fakturanummer,
        lf.fakturadatum,
        lf.förfallodatum,
        lf.betaldatum,
        lf.status_betalning,
        lf.status_bokförd
      FROM transaktioner t
      INNER JOIN leverantörsfakturor lf ON lf.transaktions_id = t.id
      WHERE t."user_id" = $1
      ORDER BY t.transaktionsdatum DESC, t.id DESC
      LIMIT 100
    `,
      [userId]
    );

    const fakturor = rows.map((row) => {
      return {
        id: row.id, // Nu leverantörsfaktura.id istället för transaktion.id
        transaktionId: row.transaktion_id, // För verifikat-modal
        datum: row.datum,
        belopp: parseFloat(row.belopp),
        kommentar: row.kommentar || "",
        leverantör: row.leverantör || "",
        fakturanummer: row.fakturanummer || "",
        fakturadatum: row.fakturadatum,
        förfallodatum: row.förfallodatum,
        betaldatum: row.betaldatum,
        status_betalning: row.status_betalning || (row.betaldatum ? "Betald" : "Obetald"),
        status_bokförd: row.status_bokförd || "Bokförd",
      };
    });

    return { success: true, fakturor };
  } catch (error) {
    console.error("Fel vid hämtning av bokförda fakturor:", error);
    return {
      success: false,
      error: "Kunde inte hämta bokförda fakturor",
    };
  } finally {
    client.release();
  }
}

export async function hamtaTransaktionsposter(
  transaktionId: number
): Promise<TransaktionspostMedMeta[]> {
  return (await hamtaTransaktionsposterUtil(transaktionId, {
    meta: true,
  })) as TransaktionspostMedMeta[];
}
