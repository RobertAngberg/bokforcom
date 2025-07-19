"use server";

import { Pool } from "pg";
import { auth } from "../../../auth";
import { revalidatePath } from "next/cache";
import { invalidateBokförCache } from "../../_utils/invalidateBokförCache";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface BokföringsPost {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
  beskrivning: string;
}

interface BokförLöneUtbetalningData {
  lönespecId: number;
  extrarader: any[];
  beräknadeVärden: any;
  anställdNamn: string;
  period: string;
  utbetalningsdatum: string;
  kommentar?: string;
  bokföringsPoster?: BokföringsPost[];
}

/**
 * Bokför en löneutbetalning genom att skapa en transaktion med tillhörande transaktionsposter
 * Använder samma logik som BokforLoner.tsx men sparar i databasen
 */
export async function bokforLoneUtbetalning(data: BokförLöneUtbetalningData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

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
    if (lönespec.status === "Utbetald") {
      client.release();
      throw new Error("Lönespecifikation är redan bokförd");
    }

    // Sätt alltid status till 'Skapad' innan bokföring
    const updateLönespecQueryReset = `
      UPDATE lönespecifikationer 
      SET status = 'Skapad', uppdaterad = CURRENT_TIMESTAMP
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

    // LOGGA: Visa alla bokföringsposter innan de sparas
    console.log("[bokforLoneUtbetalning] bokföringsPoster:", bokföringsPoster);
    bokföringsPoster.forEach((post, i) => {
      if (isNaN(post.debet) || isNaN(post.kredit)) {
        console.warn(`[bokforLoneUtbetalning] NaN-belopp på rad ${i}:`, post);
      }
    });

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
        transaktionsdatum, kontobeskrivning, belopp, kommentar, "userId"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const nettolön = data.beräknadeVärden.nettolön || lönespec.nettolön;
    const transaktionResult = await client.query(transaktionQuery, [
      new Date(data.utbetalningsdatum),
      `Löneutbetalning ${data.anställdNamn} ${data.period}`,
      nettolön, // Huvudbelopp = nettolön (utbetalat belopp)
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
        console.log("Skippar post med 0 debet och 0 kredit:", post);
        continue;
      }
      // Hämta konto-ID från kontonummer
      const kontoQuery = `SELECT id FROM konton WHERE kontonummer = $1`;
      const kontoResult = await client.query(kontoQuery, [post.konto]);
      if (kontoResult.rows.length === 0) {
        client.release();
        throw new Error(`Konto ${post.konto} (${post.kontoNamn}) hittades inte i databasen`);
      }
      const kontoId = kontoResult.rows[0].id;
      // LOGGA: Visa varje post som sparas
      console.log("[bokforLoneUtbetalning] Sparar post:", post);
      await client.query(transaktionspostQuery, [transaktionId, kontoId, post.debet, post.kredit]);
    }

    // Markera lönespecifikation som utbetald
    const updateLönespecQuery = `
      UPDATE lönespecifikationer 
      SET status = 'Utbetald', uppdaterad = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await client.query(updateLönespecQuery, [data.lönespecId]);

    client.release();

    // Invalidera cache och revalidera sidor
    await invalidateBokförCache();
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
    console.error("❌ bokforLoneUtbetalning error:", error);
    throw error;
  }
}

/**
 * Genererar bokföringsposter enligt samma logik som BokforLoner.tsx
 */
function genereraBokföringsPoster(
  lönespec: any,
  extrarader: any[],
  beräknadeVärden: any,
  anställdNamn: string
): BokföringsPost[] {
  const poster: BokföringsPost[] = [];

  // Extrahera värden från beräknadeVärden eller lönespec
  const kontantlön = Number(beräknadeVärden.kontantlön || lönespec.grundlön);
  const skatt = Number(beräknadeVärden.skatt || lönespec.skatt);
  const nettolön = Number(beräknadeVärden.nettolön || lönespec.nettolön);
  const socialaAvgifter = Number(beräknadeVärden.socialaAvgifter || lönespec.sociala_avgifter);

  // Mapping från extrarad-typ till bokföringskonto (samma som BokforLoner.tsx)
  const EXTRARAD_TILL_KONTO: Record<string, { konto: string; kontoNamn: string }> = {
    // Skattepliktiga förmåner
    boende: { konto: "7381", kontoNamn: "Kostnader för fri bostad" },
    gratisFrukost: {
      konto: "7382",
      kontoNamn: "Kostnader för fria eller subventionerade måltider",
    },
    gratisLunchMiddag: {
      konto: "7382",
      kontoNamn: "Kostnader för fria eller subventionerade måltider",
    },
    gratisMat: { konto: "7382", kontoNamn: "Kostnader för fria eller subventionerade måltider" },
    ranteforman: { konto: "7386", kontoNamn: "Subventionerad ränta" },
    forsakring: { konto: "7389", kontoNamn: "Övriga kostnader för förmåner" },
    parkering: { konto: "7389", kontoNamn: "Övriga kostnader för förmåner" },
    annanForman: { konto: "7389", kontoNamn: "Övriga kostnader för förmåner" },

    // Skattefria traktamenten
    resersattning: { konto: "7321", kontoNamn: "Skattefria traktamenten, Sverige" },
    logi: { konto: "7321", kontoNamn: "Skattefria traktamenten, Sverige" },
    uppehalleInrikes: { konto: "7321", kontoNamn: "Skattefria traktamenten, Sverige" },
    uppehalleUtrikes: { konto: "7321", kontoNamn: "Skattefria traktamenten, Sverige" },
    annanKompensation: { konto: "7321", kontoNamn: "Skattefria traktamenten, Sverige" },

    // Bilersättningar
    privatBil: { konto: "7331", kontoNamn: "Skattefria bilersättningar" },
    foretagsbilBensinDiesel: { konto: "7331", kontoNamn: "Skattefria bilersättningar" },
    foretagsbilEl: { konto: "7331", kontoNamn: "Skattefria bilersättningar" },
  };

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

  // 2. Extrarader (förmåner, traktamenten, etc.)
  let skattepliktiga = 0;
  let skattefria = 0;
  let förmåner7512 = 0;
  let förmåner7515 = 0;

  extrarader.forEach((rad) => {
    if (rad.summa === 0) return;

    const kontoMapping = EXTRARAD_TILL_KONTO[rad.typ];
    if (!kontoMapping) {
      console.warn(`⚠️ Inget konto definierat för extrarad-typ: ${rad.typ}`);
      return;
    }

    const belopp = Math.abs(Number(rad.summa));

    if (Number(rad.summa) > 0) {
      // Positiv extrarad
      poster.push({
        konto: kontoMapping.konto,
        kontoNamn: kontoMapping.kontoNamn,
        debet: belopp,
        kredit: 0,
        beskrivning: `${rad.label} ${anställdNamn}`,
      });

      // Räkna för sociala avgifter
      if (
        [
          "boende",
          "gratisFrukost",
          "gratisLunchMiddag",
          "gratisMat",
          "ranteforman",
          "forsakring",
          "parkering",
          "annanForman",
          "foretagsbilExtra",
        ].includes(rad.typ)
      ) {
        skattepliktiga += belopp;

        // Specifika förmåner för 7512
        if (
          [
            "boende",
            "gratisFrukost",
            "gratisLunchMiddag",
            "gratisMat",
            "foretagsbilExtra",
          ].includes(rad.typ)
        ) {
          förmåner7512 += belopp;
        } else {
          förmåner7515 += belopp;
        }
      } else {
        skattefria += belopp;
      }
    } else {
      // Negativ extrarad (avdrag)
      poster.push({
        konto: kontoMapping.konto,
        kontoNamn: kontoMapping.kontoNamn,
        debet: 0,
        kredit: belopp,
        beskrivning: `${rad.label} avdrag ${anställdNamn}`,
      });
    }
  });

  // 3. Motkonto för skattepliktiga förmåner (7399)
  if (skattepliktiga > 0) {
    poster.push({
      konto: "7399",
      kontoNamn: "Motkonto skattepliktiga förmåner",
      debet: 0,
      kredit: skattepliktiga,
      beskrivning: `Motkonto förmåner ${anställdNamn}`,
    });
  }

  // 4. Sociala avgifter
  const socialaAvgifter7510 = Math.round(kontantlön * 0.3142);
  const socialaAvgifter7512 = Math.round(förmåner7512 * 0.3142);
  const socialaAvgifter7515 = Math.round(förmåner7515 * 0.3142);

  if (socialaAvgifter7510 > 0) {
    poster.push({
      konto: "7510",
      kontoNamn: "Lagstadgade sociala avgifter",
      debet: socialaAvgifter7510,
      kredit: 0,
      beskrivning: `Sociala avgifter kontantlön ${anställdNamn}`,
    });
  }

  if (socialaAvgifter7512 > 0) {
    poster.push({
      konto: "7512",
      kontoNamn: "Lagstadgade sociala avgifter förmåner",
      debet: socialaAvgifter7512,
      kredit: 0,
      beskrivning: `Sociala avgifter förmåner ${anställdNamn}`,
    });
  }

  if (socialaAvgifter7515 > 0) {
    poster.push({
      konto: "7515",
      kontoNamn: "Sociala avgifter på skattepliktiga kostnadsersättningar",
      debet: socialaAvgifter7515,
      kredit: 0,
      beskrivning: `Sociala avgifter ersättningar ${anställdNamn}`,
    });
  }

  // 5. Skuld sociala avgifter (2731)
  const totalaSocialaAvgifter = socialaAvgifter7510 + socialaAvgifter7512 + socialaAvgifter7515;
  if (totalaSocialaAvgifter > 0) {
    poster.push({
      konto: "2731",
      kontoNamn: "Skuld för sociala avgifter",
      debet: 0,
      kredit: totalaSocialaAvgifter,
      beskrivning: `Skuld sociala avgifter ${anställdNamn}`,
    });
  }

  // 6. Preliminär skatt (2710)
  if (skatt > 0) {
    poster.push({
      konto: "2710",
      kontoNamn: "Personalskatt",
      debet: 0,
      kredit: skatt,
      beskrivning: `Preliminär skatt ${anställdNamn}`,
    });
  }

  // 7. Nettolön till utbetalning (1930)
  // Beräkna nettolön som balansering för att säkerställa att bokföringen stämmer
  const totalDebet = poster.reduce((sum, post) => sum + post.debet, 0);
  const totalKredit = poster.reduce((sum, post) => sum + post.kredit, 0);
  const beräknadNettolön = totalDebet - totalKredit;

  if (beräknadNettolön > 0) {
    poster.push({
      konto: "1930",
      kontoNamn: "Företagskonto/Bank",
      debet: 0,
      kredit: beräknadNettolön,
      beskrivning: `Nettolön utbetalning ${anställdNamn}`,
    });
  }

  // Logga ut poster och summeringar för felsökning
  console.log("Bokföringsposter för", anställdNamn, poster);
  console.log(
    "Debet:",
    poster.reduce((sum, p) => sum + p.debet, 0)
  );
  console.log(
    "Kredit:",
    poster.reduce((sum, p) => sum + p.kredit, 0)
  );

  return poster;
}

/**
 * Hämtar bokförda löneutbetalningar för en anställd
 */
export async function hämtaBokföraLöner(anställdId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    const query = `
      SELECT 
        l.id, l.månad, l.år, l.grundlön, l.bruttolön, l.nettolön, l.skatt, l.sociala_avgifter,
        l.bokfört, l.bokfört_datum, l.bokfört_transaktion_id,
        t.transaktionsdatum, t.kontobeskrivning
      FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      LEFT JOIN transaktioner t ON l.bokfört_transaktion_id = t.id
      WHERE a.id = $1 AND a.user_id = $2
      ORDER BY l.år DESC, l.månad DESC
    `;

    const result = await client.query(query, [anställdId, userId]);
    client.release();

    return result.rows;
  } catch (error) {
    console.error("❌ hämtaBokföraLöner error:", error);
    throw error;
  }
}

/**
 * Återför en bokförd löneutbetalning
 */
export async function återförLöneUtbetalning(lönespecId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    // Hämta lönespecifikation
    const lönespecQuery = `
      SELECT l.*, a.förnamn, a.efternamn
      FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      WHERE l.id = $1 AND a.user_id = $2 AND l.bokfört = true
    `;
    const lönespecResult = await client.query(lönespecQuery, [lönespecId, userId]);

    if (lönespecResult.rows.length === 0) {
      client.release();
      throw new Error("Bokförd lönespecifikation hittades inte");
    }

    const lönespec = lönespecResult.rows[0];
    const transaktionId = lönespec.bokfört_transaktion_id;

    if (!transaktionId) {
      client.release();
      throw new Error("Ingen transaktion kopplad till lönespecifikation");
    }

    // Ta bort transaktionsposter
    await client.query(`DELETE FROM transaktionsposter WHERE transaktions_id = $1`, [
      transaktionId,
    ]);

    // Ta bort huvudtransaktion
    await client.query(`DELETE FROM transaktioner WHERE id = $1`, [transaktionId]);

    // Återställ lönespecifikation
    await client.query(
      `UPDATE lönespecifikationer 
       SET bokfört = false, bokfört_datum = null, bokfört_transaktion_id = null
       WHERE id = $1`,
      [lönespecId]
    );

    client.release();

    // Invalidera cache
    await invalidateBokförCache();
    revalidatePath("/personal");
    revalidatePath("/historik");
    revalidatePath("/rapporter");

    return {
      success: true,
      message: `Löneutbetalning återförd för ${lönespec.förnamn} ${lönespec.efternamn}`,
    };
  } catch (error) {
    console.error("❌ återförLöneUtbetalning error:", error);
    throw error;
  }
}
