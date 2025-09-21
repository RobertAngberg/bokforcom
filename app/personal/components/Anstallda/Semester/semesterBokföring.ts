import { pool } from "../../../../_lib/db";
import { getUserId } from "../../../../_utils/authUtils";

interface SemesterBokföring {
  anställdId: number;
  anställdNamn: string;
  typ: "uttag" | "avsättning" | "avstämning" | "uppsägning";
  datum: string;
  dagar: number;
  månadslön: number;
  kommentar?: string;
}

/**
 * Bokför semesteruttag
 * Debet: 7210 Löner (semesterlön + semesterersättning)
 * Kredit: 2920 Semesterskuld (minskning)
 * Kredit: 1930 Bank (utbetalning)
 */
export async function bokförSemesteruttag(data: SemesterBokföring) {
  const client = await pool.connect();

  try {
    const userId = await getUserId();
    const semesterlön = data.månadslön * 0.0043 * data.dagar;
    const semesterersättning = semesterlön * 0.12;
    const totaltBelopp = semesterlön + semesterersättning;

    // Skapa huvudtransaktion
    const transaktionQuery = `
      INSERT INTO transaktioner (
        transaktionsdatum, kontobeskrivning, belopp, kommentar, "user_id"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const transaktionResult = await client.query(transaktionQuery, [
      new Date(data.datum),
      `Semesteruttag ${data.anställdNamn}`,
      totaltBelopp,
      data.kommentar || `Semesteruttag ${data.dagar} dagar för ${data.anställdNamn}`,
      userId,
    ]);

    const transaktionId = transaktionResult.rows[0].id;

    // Bokföringsposter
    const poster = [
      {
        konto: "7210",
        kontoNamn: "Löner till tjänstemän",
        debet: totaltBelopp,
        kredit: 0,
        beskrivning: `Semesteruttag ${data.anställdNamn}`,
      },
      {
        konto: "2920",
        kontoNamn: "Semesterskuld",
        debet: 0,
        kredit: totaltBelopp,
        beskrivning: `Minskning semesterskuld ${data.anställdNamn}`,
      },
    ];

    // Skapa transaktionsposter
    for (const post of poster) {
      const kontoResult = await client.query(`SELECT id FROM konton WHERE kontonummer = $1`, [
        post.konto,
      ]);

      if (kontoResult.rows.length === 0) {
        throw new Error(`Konto ${post.konto} finns inte`);
      }

      await client.query(
        `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
         VALUES ($1, $2, $3, $4)`,
        [transaktionId, kontoResult.rows[0].id, post.debet, post.kredit]
      );
    }

    client.release();
    return { success: true, transaktionId };
  } catch (error) {
    client.release();
    throw error;
  }
}

/**
 * Bokför månatlig semesteravsättning
 * Debet: 7533 Semesterersättning
 * Kredit: 2920 Semesterskuld
 */
export async function bokförSemesteravsättning(data: SemesterBokföring) {
  const client = await pool.connect();

  try {
    const userId = await getUserId();
    // Beräkna månatlig avsättning (1/12 av årlig semesterersättning)
    const årligSemesterersättning = data.månadslön * 0.0043 * 25 * 0.12; // 25 dagar × 12%
    const månatligAvsättning = årligSemesterersättning / 12;

    // Skapa huvudtransaktion
    const transaktionQuery = `
      INSERT INTO transaktioner (
        transaktionsdatum, kontobeskrivning, belopp, kommentar, "user_id"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const transaktionResult = await client.query(transaktionQuery, [
      new Date(data.datum),
      `Semesteravsättning ${data.anställdNamn}`,
      månatligAvsättning,
      data.kommentar || `Månatlig semesteravsättning för ${data.anställdNamn}`,
      userId,
    ]);

    const transaktionId = transaktionResult.rows[0].id;

    // Bokföringsposter
    const poster = [
      {
        konto: "7533",
        kontoNamn: "Semesterersättning",
        debet: månatligAvsättning,
        kredit: 0,
        beskrivning: `Semesteravsättning ${data.anställdNamn}`,
      },
      {
        konto: "2920",
        kontoNamn: "Semesterskuld",
        debet: 0,
        kredit: månatligAvsättning,
        beskrivning: `Ökning semesterskuld ${data.anställdNamn}`,
      },
    ];

    // Skapa transaktionsposter
    for (const post of poster) {
      const kontoResult = await client.query(`SELECT id FROM konton WHERE kontonummer = $1`, [
        post.konto,
      ]);

      if (kontoResult.rows.length === 0) {
        throw new Error(`Konto ${post.konto} finns inte`);
      }

      await client.query(
        `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
         VALUES ($1, $2, $3, $4)`,
        [transaktionId, kontoResult.rows[0].id, post.debet, post.kredit]
      );
    }

    client.release();
    return { success: true, transaktionId };
  } catch (error) {
    client.release();
    throw error;
  }
}

/**
 * Bokför semesterskuld vid uppsägning
 * Debet: 7210 Löner (utbetalning av ej uttagen semester)
 * Kredit: 2920 Semesterskuld (minskning)
 * Kredit: 1930 Bank (utbetalning)
 */
export async function bokförSemesteruppsägning(data: SemesterBokföring) {
  const client = await pool.connect();

  try {
    const userId = await getUserId();
    const semesterlön = data.månadslön * 0.0043 * data.dagar;
    const semesterersättning = semesterlön * 0.12;
    const totaltBelopp = semesterlön + semesterersättning;

    // Skapa huvudtransaktion
    const transaktionQuery = `
      INSERT INTO transaktioner (
        transaktionsdatum, kontobeskrivning, belopp, kommentar, "user_id"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const transaktionResult = await client.query(transaktionQuery, [
      new Date(data.datum),
      `Semesterutbetalning uppsägning ${data.anställdNamn}`,
      totaltBelopp,
      data.kommentar || `Utbetalning ej uttagen semester vid uppsägning - ${data.dagar} dagar`,
      userId,
    ]);

    const transaktionId = transaktionResult.rows[0].id;

    // Bokföringsposter
    const poster = [
      {
        konto: "7210",
        kontoNamn: "Löner till tjänstemän",
        debet: totaltBelopp,
        kredit: 0,
        beskrivning: `Semesterutbetalning uppsägning ${data.anställdNamn}`,
      },
      {
        konto: "2920",
        kontoNamn: "Semesterskuld",
        debet: 0,
        kredit: totaltBelopp,
        beskrivning: `Minskning semesterskuld ${data.anställdNamn}`,
      },
    ];

    // Skapa transaktionsposter
    for (const post of poster) {
      const kontoResult = await client.query(`SELECT id FROM konton WHERE kontonummer = $1`, [
        post.konto,
      ]);

      if (kontoResult.rows.length === 0) {
        throw new Error(`Konto ${post.konto} finns inte`);
      }

      await client.query(
        `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
         VALUES ($1, $2, $3, $4)`,
        [transaktionId, kontoResult.rows[0].id, post.debet, post.kredit]
      );
    }

    client.release();
    return { success: true, transaktionId };
  } catch (error) {
    client.release();
    throw error;
  }
}
