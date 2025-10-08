"use server";

import { pool } from "../../_lib/db";
import {
  createTransaktion,
  hamtaTransaktionsposter as hamtaTransaktionsposterCore,
} from "../../_utils/transactions";
import { ensureSession } from "../../_utils/session";
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
  const { userId } = await ensureSession();

  const transaktionsdatum = datum || new Date().toISOString();
  const standardKommentar = kommentar || "Automatisk bokföring från lönekörning";

  try {
    if (socialaAvgifter > 0) {
      await createTransaktion({
        datum: transaktionsdatum,
        beskrivning: "Bokföring av sociala avgifter",
        kommentar: standardKommentar,
        userId,
        poster: [
          { kontonummer: "2731", debet: socialaAvgifter, kredit: 0 },
          { kontonummer: "1930", debet: 0, kredit: socialaAvgifter },
        ],
      });
    }

    if (personalskatt > 0) {
      await createTransaktion({
        datum: transaktionsdatum,
        beskrivning: "Bokföring av personalskatt",
        kommentar: standardKommentar,
        userId,
        poster: [
          { kontonummer: "2710", debet: personalskatt, kredit: 0 },
          { kontonummer: "1930", debet: 0, kredit: personalskatt },
        ],
      });
    }

    revalidatePath("/personal");
    revalidatePath("/historik");
    return { success: true, message: "Löneskatter bokförda!" };
  } catch (error) {
    console.error("❌ bokförLöneskatter error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ett fel uppstod" };
  }
}

export async function bokförLöneutbetalning(data: BokförLöneUtbetalningData) {
  const { userId } = await ensureSession();

  const client = await pool.connect();
  try {
    const lönespecQuery = `
      SELECT l.*, a.förnamn, a.efternamn, a.kompensation
      FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `;
    const lönespecResult = await client.query(lönespecQuery, [data.lönespecId, userId]);

    if (lönespecResult.rows.length === 0) {
      throw new Error("Lönespecifikation hittades inte");
    }

    const lönespec = lönespecResult.rows[0];

    if (lönespec.bokförd === true) {
      throw new Error("Lönespecifikation är redan bokförd");
    }

    await client.query(
      `UPDATE lönespecifikationer SET bokförd = false, uppdaterad = CURRENT_TIMESTAMP WHERE id = $1`,
      [data.lönespecId]
    );

    const bokföringsPoster: BokföringsPost[] =
      data.bokföringsPoster && Array.isArray(data.bokföringsPoster)
        ? data.bokföringsPoster
        : genereraBokföringsPoster(
            lönespec,
            data.extrarader,
            data.beräknadeVärden,
            data.anställdNamn
          );

    const totalDebet = bokföringsPoster.reduce((sum, post) => sum + (post.debet || 0), 0);
    const totalKredit = bokföringsPoster.reduce((sum, post) => sum + (post.kredit || 0), 0);

    if (Math.abs(totalDebet - totalKredit) > 0.01) {
      throw new Error(
        `Bokföringen balanserar inte! Debet: ${totalDebet.toFixed(2)}, Kredit: ${totalKredit.toFixed(2)}`
      );
    }

    const poster = bokföringsPoster
      .map((post) => ({
        kontonummer: post.konto,
        debet: Number(post.debet) || 0,
        kredit: Number(post.kredit) || 0,
      }))
      .filter((post) => post.debet !== 0 || post.kredit !== 0);

    if (poster.length === 0) {
      throw new Error("Inga bokföringsposter att bokföra");
    }

    const { transaktionsId: transaktionId } = await createTransaktion({
      datum: new Date(data.utbetalningsdatum),
      beskrivning: `Löneutbetalning ${data.anställdNamn} ${data.period}`,
      kommentar:
        data.kommentar || `Löneutbetalning för ${data.anställdNamn}, period ${data.period}`,
      userId,
      poster,
    });

    await client.query(
      `UPDATE lönespecifikationer SET bokförd = true, bokförd_datum = CURRENT_TIMESTAMP, uppdaterad = CURRENT_TIMESTAMP WHERE id = $1`,
      [data.lönespecId]
    );

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
  } finally {
    client.release();
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
