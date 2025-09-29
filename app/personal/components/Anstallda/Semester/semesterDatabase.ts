/**
 * Semesterberäkningar anpassade för befintlig semester-tabell
 * Använder din befintliga databasstruktur
 */

import { pool } from "../../../../_lib/db";
import { SemesterRecord, SemesterSummary } from "../../../types/types";

/**
 * Hämtar semestersammanställning för en anställd
 */
export async function hämtaSemesterSammanställning(anställdId: number): Promise<SemesterSummary> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `
      SELECT 
        betalda_dagar, 
        sparade_dagar, 
        skuld, 
        komp_dagar
      FROM semester
      WHERE anställd_id = $1
      ORDER BY datum DESC, id DESC
      LIMIT 1
      `,
      [anställdId]
    );
    const row = result.rows[0] || {};
    return {
      betalda_dagar: parseFloat(row.betalda_dagar) || 0,
      sparade_dagar: parseFloat(row.sparade_dagar) || 0,
      skuld: parseFloat(row.skuld) || 0,
      komp_dagar: parseFloat(row.komp_dagar) || 0,
    };
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
    // Business logic: beräkna intjänade dagar direkt här
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
 * TODO: Implementera fullständig logik när semestersystemet utvecklas
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
  // Förhindra oanvända parameter-varningar
  void anställdId;
  void startDatum;
  void slutDatum;
  void antal;
  void beskrivning;
  void lönespecId;
  void skapadAv;
  const client = await pool.connect();
  try {
    // TODO: Implementera fullständig semesteruttag-logik
    // Kontrollera tillgängliga dagar baserat på betalda_dagar, sparade_dagar, skuld, komp_dagar
    // const summary = await hämtaSemesterSammanställning(_anställdId);
    // if (_antal > summary.tillgängligt) { return { success: false, message: "Inte tillräckligt med dagar" }; }
    //
    // Skapa semesterpost:
    // await client.query(
    //   "INSERT INTO semester (anställd_id, datum, typ, antal, från_datum, till_datum, beskrivning, lönespecifikation_id, bokfört, skapad_av) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
    //   [_anställdId, new Date().toISOString().split("T")[0], "Uttag", _antal, _startDatum, _slutDatum, _beskrivning, _lönespecId, false, _skapadAv]
    // );

    return { success: true, message: "Uttag registrerat (logik ej implementerad)", id: undefined };
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
      LEFT JOIN "user" u ON s.skapad_av = u.id
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

/**
 * Uppdaterar ett enskilt fält (betalda, sparade, förskott, ersättning) för en anställd
 */
export async function uppdateraSemesterFalt(
  anstalldId: number,
  fält: "betalda_dagar" | "sparade_dagar" | "skuld" | "komp_dagar",
  nyttVärde: number
): Promise<void> {
  const client = await pool.connect();
  try {
    let kolumn = "";
    switch (fält) {
      case "betalda_dagar":
        kolumn = "betalda_dagar";
        break;
      case "sparade_dagar":
        kolumn = "sparade_dagar";
        break;
      case "skuld":
        kolumn = "skuld";
        break;
      case "komp_dagar":
        kolumn = "komp_dagar";
        break;
      default:
        throw new Error("Otillåtet fält");
    }
    await client.query(`UPDATE semester SET ${kolumn} = $2 WHERE anställd_id = $1`, [
      anstalldId,
      nyttVärde,
    ]);
  } finally {
    client.release();
  }
}
