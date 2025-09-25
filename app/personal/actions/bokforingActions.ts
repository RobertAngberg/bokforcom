"use server";

import { pool } from "../../_lib/db";
import { hamtaTransaktionsposter as hamtaTransaktionsposterCore } from "../../_utils/transaktioner/hamtaTransaktionsposter";
import { getUserId } from "../../_utils/authUtils";
import { revalidatePath } from "next/cache";
import type {
  BokförLöneUtbetalningData,
  BokföringsPost,
  LönespecData,
  ExtraradData,
  BeräknadeVärden,
} from "../types/types";

export async function hamtaTransaktionsposter(transaktionsId: number) {
  return await hamtaTransaktionsposterCore(transaktionsId);
}

export async function bokförLöneskatter({
  socialaAvgifter,
  personalskatt,
  datum,
  kommentar,
}: {
  socialaAvgifter: number;
  personalskatt: number;
  datum?: string;
  kommentar?: string;
}) {
  const userId = await getUserId();
  if (!userId) throw new Error("Ingen inloggad användare");
  const realUserId = userId;

  try {
    const client = await pool.connect();
    const transaktionsdatum = datum || new Date().toISOString();

    // Skapa huvudtransaktion för sociala avgifter
    const socialTransaktion = await client.query(
      `INSERT INTO transaktioner ("transaktionsdatum", "kontobeskrivning", "kommentar", "user_id")
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        transaktionsdatum,
        "Bokföring av sociala avgifter",
        kommentar || "Automatisk bokföring från lönekörning",
        realUserId,
      ]
    );
    const socialTransaktionsId = socialTransaktion.rows[0].id;

    // Sociala avgifter - transaktionsposter
    if (socialaAvgifter > 0) {
      // Hämta konto-id för 1930 och 2731
      const konto1930 = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
        "1930",
      ]);
      const konto2731 = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
        "2731",
      ]);

      if (konto1930.rows.length === 0) throw new Error("Konto 1930 finns inte");
      if (konto2731.rows.length === 0) throw new Error("Konto 2731 finns inte");

      // 1930 Företagskonto (kredit)
      await client.query(
        `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
         VALUES ($1, $2, $3, $4)`,
        [socialTransaktionsId, konto1930.rows[0].id, 0, socialaAvgifter]
      );

      // 2731 Avräkning lagstadgade sociala avgifter (debet)
      await client.query(
        `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
         VALUES ($1, $2, $3, $4)`,
        [socialTransaktionsId, konto2731.rows[0].id, socialaAvgifter, 0]
      );
    }

    // Skapa huvudtransaktion för personalskatt
    const skattTransaktion = await client.query(
      `INSERT INTO transaktioner ("transaktionsdatum", "kontobeskrivning", "kommentar", "user_id")
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        transaktionsdatum,
        "Bokföring av personalskatt",
        kommentar || "Automatisk bokföring från lönekörning",
        realUserId,
      ]
    );
    const skattTransaktionsId = skattTransaktion.rows[0].id;

    // Personalskatt - transaktionsposter
    if (personalskatt > 0) {
      // Hämta konto-id för 1930 och 2710
      const konto1930 = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
        "1930",
      ]);
      const konto2710 = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
        "2710",
      ]);

      if (konto1930.rows.length === 0) throw new Error("Konto 1930 finns inte");
      if (konto2710.rows.length === 0) throw new Error("Konto 2710 finns inte");

      // 1930 Företagskonto (kredit)
      await client.query(
        `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
         VALUES ($1, $2, $3, $4)`,
        [skattTransaktionsId, konto1930.rows[0].id, 0, personalskatt]
      );

      // 2710 Personalskatt (debet)
      await client.query(
        `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
         VALUES ($1, $2, $3, $4)`,
        [skattTransaktionsId, konto2710.rows[0].id, personalskatt, 0]
      );
    }

    client.release();
    revalidatePath("/personal");
    revalidatePath("/historik");
    return { success: true, message: "Löneskatter bokförda!" };
  } catch (error) {
    console.error("❌ bokförLöneskatter error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ett fel uppstod" };
  }
}

export async function bokförLöneutbetalning(data: BokförLöneUtbetalningData) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

  try {
    const client = await pool.connect();

    // Hämta lönespecifikation för att säkerställa att den tillhör användaren
    const lönespecQuery = `
      SELECT l.*, a.förnamn, a.efternamn, a.kompensation
      FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `;
    const lönespecResult = await client.query(lönespecQuery, [data.lönespecId, userId]);

    if (lönespecResult.rows.length === 0) {
      client.release();
      throw new Error("Lönespecifikation hittades inte");
    }

    const lönespec = lönespecResult.rows[0];

    // Kontrollera att lönespec inte redan är bokförd
    if (lönespec.bokförd === true) {
      client.release();
      throw new Error("Lönespecifikation är redan bokförd");
    }

    // Sätt bokförd till false innan bokföring (reset)
    const updateLönespecQueryReset = `
      UPDATE lönespecifikationer 
      SET bokförd = false, uppdaterad = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await client.query(updateLönespecQueryReset, [data.lönespecId]);

    // Använd bokföringsPoster direkt om den finns, annars generera som tidigare
    const bokföringsPoster =
      data.bokföringsPoster && Array.isArray(data.bokföringsPoster)
        ? data.bokföringsPoster
        : genereraBokföringsPoster(
            lönespec,
            data.extrarader,
            data.beräknadeVärden,
            data.anställdNamn
          );

    // Validera att bokföringen balanserar
    const totalDebet = bokföringsPoster.reduce((sum, post) => sum + post.debet, 0);
    const totalKredit = bokföringsPoster.reduce((sum, post) => sum + post.kredit, 0);

    if (Math.abs(totalDebet - totalKredit) > 0.01) {
      client.release();
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

    const nettolön = data.beräknadeVärden.nettolön || lönespec.nettolön;
    const transaktionResult = await client.query(transaktionQuery, [
      new Date(data.utbetalningsdatum),
      `Löneutbetalning ${data.anställdNamn} ${data.period}`,
      nettolön,
      data.kommentar || `Löneutbetalning för ${data.anställdNamn}, period ${data.period}`,
      userId,
    ]);

    const transaktionId = transaktionResult.rows[0].id;

    // Skapa transaktionsposter för varje bokföringspost
    const transaktionspostQuery = `
      INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
      VALUES ($1, $2, $3, $4)
    `;

    for (const post of bokföringsPoster) {
      post.debet = Number(post.debet) || 0;
      post.kredit = Number(post.kredit) || 0;
      if (post.debet === 0 && post.kredit === 0) {
        continue;
      }

      const kontoQuery = `SELECT id FROM konton WHERE kontonummer = $1`;
      const kontoResult = await client.query(kontoQuery, [post.konto]);
      if (kontoResult.rows.length === 0) {
        client.release();
        throw new Error(`Konto ${post.konto} (${post.kontoNamn}) hittades inte i databasen`);
      }
      const kontoId = kontoResult.rows[0].id;

      await client.query(transaktionspostQuery, [transaktionId, kontoId, post.debet, post.kredit]);
    }

    // Markera lönespecifikation som bokförd
    const updateLönespecQuery = `
      UPDATE lönespecifikationer 
      SET bokförd = true, bokförd_datum = CURRENT_TIMESTAMP, uppdaterad = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await client.query(updateLönespecQuery, [data.lönespecId]);

    client.release();

    revalidatePath("/personal");
    revalidatePath("/historik");
    revalidatePath("/rapporter");

    return {
      success: true,
      transaktionId,
      message: `Löneutbetalning bokförd för ${data.anställdNamn}`,
      bokföringsPoster,
    };
  } catch (error) {
    console.error("❌ bokförLöneutbetalning error:", error);
    throw error;
  }
}

function genereraBokföringsPoster(
  lönespec: LönespecData,
  extrarader: ExtraradData[],
  beräknadeVärden: BeräknadeVärden,
  anställdNamn: string
): BokföringsPost[] {
  const poster: BokföringsPost[] = [];

  const kontantlön = Number(beräknadeVärden.kontantlön || lönespec.grundlön);
  const skatt = Number(beräknadeVärden.skatt || lönespec.skatt);

  // 1. Kontantlön (7210)
  if (kontantlön > 0) {
    poster.push({
      konto: "7210",
      kontoNamn: "Löner till tjänstemän",
      debet: kontantlön,
      kredit: 0,
      beskrivning: `Kontantlön ${anställdNamn}`,
    });
  }

  // 2. Sociala avgifter (7510)
  const socialaAvgifter = Math.round(kontantlön * 0.3142);
  if (socialaAvgifter > 0) {
    poster.push({
      konto: "7510",
      kontoNamn: "Lagstadgade sociala avgifter",
      debet: socialaAvgifter,
      kredit: 0,
      beskrivning: `Sociala avgifter ${anställdNamn}`,
    });
  }

  // 3. Skuld sociala avgifter (2731)
  if (socialaAvgifter > 0) {
    poster.push({
      konto: "2731",
      kontoNamn: "Skuld för sociala avgifter",
      debet: 0,
      kredit: socialaAvgifter,
      beskrivning: `Skuld sociala avgifter ${anställdNamn}`,
    });
  }

  // 4. Preliminär skatt (2710)
  if (skatt > 0) {
    poster.push({
      konto: "2710",
      kontoNamn: "Personalskatt",
      debet: 0,
      kredit: skatt,
      beskrivning: `Preliminär skatt ${anställdNamn}`,
    });
  }

  // 5. Nettolön till utbetalning (1930)
  const nettolön = kontantlön - skatt;
  if (nettolön > 0) {
    poster.push({
      konto: "1930",
      kontoNamn: "Företagskonto/Bank",
      debet: 0,
      kredit: nettolön,
      beskrivning: `Nettolön utbetalning ${anställdNamn}`,
    });
  }

  return poster;
}
