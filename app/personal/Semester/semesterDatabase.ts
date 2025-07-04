/**
 * Semesterberäkningar anpassade för befintlig semester-tabell
 * Använder din befintliga databasstruktur
 */

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface SemesterRecord {
  id?: number;
  anställd_id: number;
  datum: string;
  typ: "Förskott" | "Sparade" | "Obetald" | "Betalda" | "Intjänat";
  antal: number;
  från_datum?: string;
  till_datum?: string;
  beskrivning?: string;
  lönespecifikation_id?: number;
  bokfört: boolean;
  skapad_av: number;
}

export interface SemesterSummary {
  intjänat: number;
  betalda: number;
  sparade: number;
  förskott: number;
  kvarvarande: number;
  tillgängligt: number;
}

/**
 * Hämtar semestersammanställning för en anställd
 */
export async function hämtaSemesterSammanställning(anställdId: number): Promise<SemesterSummary> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT 
        typ,
        SUM(antal) as total_antal
      FROM semester 
      WHERE anställd_id = $1
      GROUP BY typ
    `,
      [anställdId]
    );

    const summary = {
      intjänat: 0,
      betalda: 0,
      sparade: 0,
      förskott: 0,
      kvarvarande: 0,
      tillgängligt: 0,
    };

    result.rows.forEach((row) => {
      switch (row.typ) {
        case "Intjänat":
          summary.intjänat = parseFloat(row.total_antal);
          break;
        case "Betalda":
          summary.betalda = parseFloat(row.total_antal);
          break;
        case "Sparade":
          summary.sparade = parseFloat(row.total_antal);
          break;
        case "Förskott":
          summary.förskott = parseFloat(row.total_antal);
          break;
      }
    });

    // Beräkna kvarvarande och tillgängligt
    summary.kvarvarande = summary.intjänat - summary.betalda;
    summary.tillgängligt = summary.kvarvarande + summary.sparade;

    return summary;
  } finally {
    client.release();
  }
}

/**
 * Registrerar semesterintjäning (automatisk månadsvis)
 */
export async function registreraSemesterintjäning(
  anställdId: number,
  månad: string, // "2025-07"
  månadslön: number,
  tjänstegrad: number = 100,
  skapadAv: number
): Promise<void> {
  const client = await pool.connect();

  try {
    const DAGAR_PER_MÅNAD = 25 / 12; // 2,08 dagar
    const intjänadeDagar = DAGAR_PER_MÅNAD * (tjänstegrad / 100);

    // Kontrollera om redan registrerat för denna månad
    const existing = await client.query(
      `
      SELECT id FROM semester 
      WHERE anställd_id = $1 AND typ = 'Intjänat' 
      AND datum::text LIKE $2
    `,
      [anställdId, `${månad}%`]
    );

    if (existing.rows.length === 0) {
      await client.query(
        `
        INSERT INTO semester (
          anställd_id, datum, typ, antal, beskrivning, bokfört, skapad_av
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        [
          anställdId,
          `${månad}-01`,
          "Intjänat",
          intjänadeDagar,
          `Semesterintjäning ${månad} (${tjänstegrad}%)`,
          false,
          skapadAv,
        ]
      );
    }
  } finally {
    client.release();
  }
}

/**
 * Registrerar semesteruttag
 */
export async function registreraSemesteruttag(
  anställdId: number,
  startDatum: string,
  slutDatum: string,
  antal: number,
  beskrivning: string,
  lönespecId: number | null,
  skapadAv: number
): Promise<{ success: boolean; message: string; id?: number }> {
  const client = await pool.connect();

  try {
    // Kontrollera tillgängliga dagar
    const summary = await hämtaSemesterSammanställning(anställdId);

    if (antal > summary.tillgängligt) {
      const förskottsBehov = antal - summary.tillgängligt;

      // Registrera som förskott om det går över tillgängligt
      const result = await client.query(
        `
        INSERT INTO semester (
          anställd_id, datum, typ, antal, från_datum, till_datum, 
          beskrivning, lönespecifikation_id, bokfört, skapad_av
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
        [
          anställdId,
          startDatum,
          "Förskott",
          förskottsBehov,
          startDatum,
          slutDatum,
          `${beskrivning} (Förskott: ${förskottsBehov} dagar)`,
          lönespecId,
          false,
          skapadAv,
        ]
      );

      // Registrera resten som vanligt uttag om det finns tillgängligt
      if (summary.tillgängligt > 0) {
        await client.query(
          `
          INSERT INTO semester (
            anställd_id, datum, typ, antal, från_datum, till_datum, 
            beskrivning, lönespecifikation_id, bokfört, skapad_av
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `,
          [
            anställdId,
            startDatum,
            "Betalda",
            summary.tillgängligt,
            startDatum,
            slutDatum,
            `${beskrivning} (Vanligt uttag: ${summary.tillgängligt} dagar)`,
            lönespecId,
            false,
            skapadAv,
          ]
        );
      }

      return {
        success: true,
        message: `Semesteruttag registrerat med ${förskottsBehov} förskottsdagar`,
        id: result.rows[0].id,
      };
    } else {
      // Vanligt semesteruttag
      const result = await client.query(
        `
        INSERT INTO semester (
          anställd_id, datum, typ, antal, från_datum, till_datum, 
          beskrivning, lönespecifikation_id, bokfört, skapad_av
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
        [
          anställdId,
          startDatum,
          "Betalda",
          antal,
          startDatum,
          slutDatum,
          beskrivning,
          lönespecId,
          false,
          skapadAv,
        ]
      );

      return {
        success: true,
        message: "Semesteruttag registrerat",
        id: result.rows[0].id,
      };
    }
  } finally {
    client.release();
  }
}

/**
 * Hämtar semesterhistorik för en anställd
 */
export async function hämtaSemesterHistorik(anställdId: number): Promise<SemesterRecord[]> {
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT 
        s.*,
        u.name as skapad_av_namn,
        l.månad, l.år
      FROM semester s
      LEFT JOIN users u ON s.skapad_av = u.id
      LEFT JOIN lönespecifikationer l ON s.lönespecifikation_id = l.id
      WHERE s.anställd_id = $1
      ORDER BY s.datum DESC, s.id DESC
    `,
      [anställdId]
    );

    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Beräknar semesterpenning för ett uttag
 */
export function beräknaSemesterpenning(
  månadslön: number,
  dagar: number
): {
  semesterlön: number;
  semesterersättning: number;
  totalt: number;
} {
  const semesterlön = månadslön * 0.0043 * dagar;
  const semesterersättning = semesterlön * 0.12;

  return {
    semesterlön,
    semesterersättning,
    totalt: semesterlön + semesterersättning,
  };
}

/**
 * Markerar semesterpost som bokförd
 */
export async function markeraSomBokförd(semesterId: number): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query(
      `
      UPDATE semester 
      SET bokfört = true, uppdaterad = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [semesterId]
    );
  } finally {
    client.release();
  }
}
