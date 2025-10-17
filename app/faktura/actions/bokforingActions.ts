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

const normalizeStatus = (status: string | null | undefined) => {
  const normalized = (status || "").trim().toLowerCase();
  return normalized === "delvis betald" ? "skickad" : normalized;
};

const mapStatusToLegacy = (status: string | null | undefined) => {
  const normalized = normalizeStatus(status);

  if (normalized === "färdig") {
    return { status_bokförd: "Bokförd", status_betalning: "Betald" } as const;
  }

  if (normalized === "skickad") {
    return { status_bokförd: "Bokförd", status_betalning: "Obetald" } as const;
  }

  return { status_bokförd: "Ej bokförd", status_betalning: "Obetald" } as const;
};

const isStatusSkickad = (status: string | null | undefined) =>
  normalizeStatus(status) === "skickad";

const isStatusFardig = (status: string | null | undefined) => normalizeStatus(status) === "färdig";

export async function hamtaFakturaStatus(fakturaId: number): Promise<{
  status?: string;
  status_betalning?: string;
  status_bokförd?: string;
  betaldatum?: string;
}> {
  const { userId } = await ensureSession();

  try {
    const result = await pool.query(
      'SELECT status, betaldatum FROM fakturor WHERE id = $1 AND "user_id" = $2',
      [fakturaId, userId]
    );
    if (result.rows.length === 0) {
      return {};
    }

    const { status, betaldatum } = result.rows[0];
    const legacy = mapStatusToLegacy(status);

    return {
      status,
      betaldatum,
      ...legacy,
    };
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
      let currentStatus: string | null = null;

      if (data.fakturaId) {
        const fakturaCheck = await pool.query(
          `SELECT id, status FROM fakturor WHERE id = $1 AND "user_id" = $2`,
          [data.fakturaId, userId]
        );

        if (fakturaCheck.rows.length === 0) {
          throw new Error("Fakturan finns inte eller tillhör inte dig");
        }

        currentStatus = fakturaCheck.rows[0]?.status ?? null;
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

      const harBankKonto = data.poster.some(
        (post) => post.konto === "1930" || post.konto === "1910"
      );
      const harKundfordringar = data.poster.some((post) => post.konto === "1510");
      const ärBetalning = harBankKonto && harKundfordringar && data.poster.length === 2;
      const harRotRutUtbetalning = data.poster.some((post) => post.konto === "2731");

      let defaultKommentar = `Faktura ${sanitizedFakturanummer} ${sanitizedKundnamn}`;
      if (ärBetalning) {
        defaultKommentar = `${defaultKommentar}, betalning`;
      } else if (harRotRutUtbetalning) {
        defaultKommentar = `${defaultKommentar}, ROT/RUT-utbetalning`;
      } else if (harKundfordringar) {
        defaultKommentar = `${defaultKommentar}, kundfordran`;
      } else if (harBankKonto) {
        defaultKommentar = `${defaultKommentar}, kontantmetod`;
      }

      const nu = new Date();
      const transaktionsKommentar =
        sanitizedKommentar && !/^bokföring av faktura/i.test(sanitizedKommentar)
          ? sanitizedKommentar
          : defaultKommentar;

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

          const todayISO = dateToYyyyMmDd(new Date());

          if (ärBetalning) {
            const rotRutCheck = await client.query(
              "SELECT COUNT(*) as count FROM faktura_artiklar WHERE faktura_id = $1 AND rot_rut_typ IS NOT NULL",
              [data.fakturaId]
            );

            const harRotRutArtiklar = parseInt(rotRutCheck.rows[0].count) > 0;
            let nextStatus: string;

            if (harRotRutArtiklar) {
              if (isStatusFardig(currentStatus) || isStatusSkickad(currentStatus)) {
                nextStatus = "Färdig";
              } else {
                nextStatus = "Skickad";
              }
            } else {
              nextStatus = "Färdig";
            }

            await client.query(
              'UPDATE fakturor SET status = $1, betaldatum = $2, transaktions_id = $3 WHERE id = $4 AND "user_id" = $5',
              [nextStatus, todayISO, transaktionsId, data.fakturaId, userId]
            );
            console.log(`💰 Uppdaterat faktura ${data.fakturaId} status till ${nextStatus}`);
          } else if (harRotRutUtbetalning) {
            // Skatteverket har betalat ut ROT/RUT-andelen
            await client.query(
              'UPDATE fakturor SET status = $1, betaldatum = $2, transaktions_id = $3 WHERE id = $4 AND "user_id" = $5',
              ["Färdig", todayISO, transaktionsId, data.fakturaId, userId]
            );
            console.log(
              `🏦 Uppdaterat faktura ${data.fakturaId} status till Färdig efter ROT/RUT-utbetalning`
            );
          } else {
            const harBankKontantmetod = data.poster.some((p) => p.konto === "1930");
            const harIngenKundfordringar = !data.poster.some((p) => p.konto === "1510");
            const ärKontantmetod = harBankKontantmetod && harIngenKundfordringar;

            if (ärKontantmetod) {
              await client.query(
                'UPDATE fakturor SET status = $1, betaldatum = $2, transaktions_id = $3 WHERE id = $4 AND "user_id" = $5',
                ["Färdig", todayISO, transaktionsId, data.fakturaId, userId]
              );
              console.log(
                `💰📊 Uppdaterat faktura ${data.fakturaId} status till Färdig (kontantmetod)`
              );
            } else {
              await client.query(
                'UPDATE fakturor SET status = $1, transaktions_id = $2 WHERE id = $3 AND "user_id" = $4',
                ["Skickad", transaktionsId, data.fakturaId, userId]
              );
              console.log(`📊 Uppdaterat faktura ${data.fakturaId} status till Skickad`);
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
