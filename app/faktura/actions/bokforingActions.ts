"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { validateKontonummer, sanitizeInput } from "../../_utils/validationUtils";
import { dateToYyyyMmDd } from "../../_utils/datum";
import {
  createTransaktion,
  hamtaTransaktionsposter as hamtaTransaktionsposterUtil,
  TransaktionspostMedMeta,
} from "../../_utils/transactions";
import { BokförFakturaData } from "../types/types";

export async function hamtaFakturaStatus(fakturaId: number): Promise<{
  status_betalning?: string;
  status_bokförd?: string;
  betaldatum?: string;
}> {
  const { userId } = await ensureSession();

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

export async function sparaBokforingsmetod(metod: "kontantmetoden" | "fakturametoden") {
  const { userId } = await ensureSession();

  try {
    await pool.query('UPDATE "user" SET bokföringsmetod = $1 WHERE id = $2', [metod, userId]);

    return { success: true };
  } catch (error) {
    console.error("Fel vid sparande av bokföringsmetod:", error);
    return { success: false, error: "Databasfel" };
  }
}

export async function bokforFaktura(data: BokförFakturaData) {
  const { userId } = await ensureSession();

  try {
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

    let transaktionsId: number | null = null;

    try {
      // SÄKERHETSVALIDERING: Om fakturaId anges, verifiera ägarskap
      if (data.fakturaId) {
        const fakturaCheck = await pool.query(
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

      const poster = data.poster.map((post) => ({
        kontonummer: post.konto.toString(),
        debet: Number(post.debet) || 0,
        kredit: Number(post.kredit) || 0,
      }));

      const nu = new Date();
      const transaktionsKommentar =
        sanitizedKommentar ||
        `Bokföring av faktura ${sanitizedFakturanummer} för ${sanitizedKundnamn}`;

      const { transaktionsId: createdId } = await createTransaktion({
        datum: nu,
        beskrivning: `Faktura ${sanitizedFakturanummer} - ${sanitizedKundnamn}`,
        kommentar: transaktionsKommentar,
        userId,
        poster,
      });

      transaktionsId = createdId;
      console.log("🆔 Skapad säker fakturatransaktion:", createdId);

      if (data.fakturaId) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const harBankKonto = data.poster.some((p) => p.konto === "1930" || p.konto === "1910");
          const harKundfordringar = data.poster.some((p) => p.konto === "1510");
          const ärBetalning = harBankKonto && harKundfordringar && data.poster.length === 2;
          const todayISO = dateToYyyyMmDd(new Date());

          if (ärBetalning) {
            const rotRutCheck = await client.query(
              "SELECT COUNT(*) as count FROM faktura_artiklar WHERE faktura_id = $1 AND rot_rut_typ IS NOT NULL",
              [data.fakturaId]
            );

            let status = "Betald";
            const harRotRutArtiklar = parseInt(rotRutCheck.rows[0].count) > 0;

            if (harRotRutArtiklar) {
              status = "Delvis betald";
            }

            await client.query(
              'UPDATE fakturor SET status_betalning = $1, betaldatum = $2, transaktions_id = $3 WHERE id = $4 AND "user_id" = $5',
              [status, todayISO, transaktionsId, data.fakturaId, userId]
            );
            console.log(`💰 Uppdaterat faktura ${data.fakturaId} status till ${status}`);
          } else {
            const harBankKontantmetod = data.poster.some((p) => p.konto === "1930");
            const harIngenKundfordringar = !data.poster.some((p) => p.konto === "1510");
            const ärKontantmetod = harBankKontantmetod && harIngenKundfordringar;

            if (ärKontantmetod) {
              await client.query(
                'UPDATE fakturor SET status_bokförd = $1, status_betalning = $2, betaldatum = $3, transaktions_id = $4 WHERE id = $5 AND "user_id" = $6',
                ["Bokförd", "Betald", todayISO, transaktionsId, data.fakturaId, userId]
              );
              console.log(
                `💰📊 Uppdaterat faktura ${data.fakturaId} status till Bokförd och Betald (kontantmetod)`
              );
            } else {
              await client.query(
                'UPDATE fakturor SET status_bokförd = $1, transaktions_id = $2 WHERE id = $3 AND "user_id" = $4',
                ["Bokförd", transaktionsId, data.fakturaId, userId]
              );
              console.log(`📊 Uppdaterat faktura ${data.fakturaId} status till Bokförd`);
            }
          }

          await client.query("COMMIT");
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        } finally {
          client.release();
        }
      }

      console.log(`✅ Faktura ${sanitizedFakturanummer} bokförd säkert för user ${userId}!`);

      return {
        success: true,
        transaktionsId,
        message: `Faktura ${sanitizedFakturanummer} har bokförts framgångsrikt!`,
      };
    } catch (error) {
      if (transaktionsId) {
        try {
          await pool.query('DELETE FROM transaktioner WHERE id = $1 AND "user_id" = $2', [
            transaktionsId,
            userId,
          ]);
        } catch (cleanupError) {
          console.error("⚠️ Kunde inte rulla tillbaka skapad transaktion:", cleanupError);
        }
      }

      console.error("❌ Databasfel vid bokföring av faktura:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Okänt fel vid bokföring",
      };
    }
  } catch (err) {
    console.error("❌ Säkerhetsfel vid bokföring av faktura:", err);
    return { success: false, error: "Kunde inte bokföra faktura säkert" };
  }
}

export async function hamtaBokfordaFakturor() {
  const { userId } = await ensureSession();
  const client = await pool.connect();

  try {
    // Hämta endast leverantörsfakturor från leverantörsfakturor tabellen
    const { rows } = await client.query(
      `
      SELECT DISTINCT
        t.id as transaktion_id,
        lf.id,
        lf.leverantor_id,
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
        leverantor_id: row.leverantor_id ? Number(row.leverantor_id) : undefined,
        leverantorId: row.leverantor_id ? Number(row.leverantor_id) : undefined,
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
