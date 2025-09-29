"use server";

import { pool } from "../../_lib/db";
import { getUserId } from "../../_utils/authUtils";
import { revalidatePath } from "next/cache";
import type { Lönekörning, LönespecData } from "../types/types";

export async function skapaLönekörning(period: string): Promise<{
  success: boolean;
  data?: Lönekörning;
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    // Kolla om det redan finns en aktiv lönekörning för perioden
    const befintligQuery = `
      SELECT id FROM lönekörningar 
      WHERE period = $1 AND status IN ('pågående', 'pausad')
      ORDER BY id DESC LIMIT 1
    `;
    const befintligResult = await pool.query(befintligQuery, [period]);

    if (befintligResult.rows.length > 0) {
      return {
        success: false,
        error: `Det finns redan en aktiv lönekörning för period ${period}`,
      };
    }

    // Skapa ny lönekörning
    const query = `
      INSERT INTO lönekörningar (
        period, 
        status, 
        startad_av,
        startad_datum,
        skapad,
        uppdaterad
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await pool.query(query, [period, "pågående", userId]);
    const lönekörning = result.rows[0];

    return {
      success: true,
      data: {
        ...lönekörning,
        startad_datum: new Date(lönekörning.startad_datum),
        skapad: new Date(lönekörning.skapad),
        uppdaterad: new Date(lönekörning.uppdaterad),
      },
    };
  } catch (error) {
    console.error("❌ Fel vid skapande av lönekörning:", error);
    return { success: false, error: "Kunde inte skapa lönekörning" };
  }
}

export async function hämtaAktivLönekörning(period: string): Promise<{
  success: boolean;
  data?: Lönekörning;
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    const query = `
      SELECT * FROM lönekörningar 
      WHERE period = $1 AND status IN ('pågående', 'pausad')
      ORDER BY id DESC LIMIT 1
    `;

    const result = await pool.query(query, [period]);

    if (result.rows.length === 0) {
      return { success: false, error: "Ingen aktiv lönekörning hittad" };
    }

    const lönekörning = result.rows[0];

    return {
      success: true,
      data: {
        ...lönekörning,
        startad_datum: new Date(lönekörning.startad_datum),
        avslutad_datum: lönekörning.avslutad_datum
          ? new Date(lönekörning.avslutad_datum)
          : undefined,
        bankgiro_exporterad_datum: lönekörning.bankgiro_exporterad_datum
          ? new Date(lönekörning.bankgiro_exporterad_datum)
          : undefined,
        mailade_datum: lönekörning.mailade_datum ? new Date(lönekörning.mailade_datum) : undefined,
        bokford_datum: lönekörning.bokford_datum ? new Date(lönekörning.bokford_datum) : undefined,
        agi_genererad_datum: lönekörning.agi_genererad_datum
          ? new Date(lönekörning.agi_genererad_datum)
          : undefined,
        skatter_bokforda_datum: lönekörning.skatter_bokforda_datum
          ? new Date(lönekörning.skatter_bokforda_datum)
          : undefined,
        skapad: new Date(lönekörning.skapad),
        uppdaterad: new Date(lönekörning.uppdaterad),
      },
    };
  } catch (error) {
    console.error("❌ Fel vid hämtning av lönekörning:", error);
    return { success: false, error: "Kunde inte hämta lönekörning" };
  }
}

export async function uppdateraLönekörningStatus(
  lönekörningId: number,
  statusTyp: "bankgiro_exporterad" | "mailade" | "bokford" | "agi_genererad" | "skatter_bokforda",
  avslutad: boolean = false
): Promise<{
  success: boolean;
  data?: Lönekörning;
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    let query = `
      UPDATE lönekörningar 
      SET ${statusTyp}_datum = CURRENT_TIMESTAMP,
          uppdaterad = CURRENT_TIMESTAMP
    `;

    if (avslutad) {
      query += `, status = 'avslutad', avslutad_datum = CURRENT_TIMESTAMP`;
    }

    query += ` WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [lönekörningId]);

    if (result.rows.length === 0) {
      return { success: false, error: "Lönekörning hittades inte" };
    }

    const lönekörning = result.rows[0];

    return {
      success: true,
      data: {
        ...lönekörning,
        startad_datum: new Date(lönekörning.startad_datum),
        avslutad_datum: lönekörning.avslutad_datum
          ? new Date(lönekörning.avslutad_datum)
          : undefined,
        bankgiro_exporterad_datum: lönekörning.bankgiro_exporterad_datum
          ? new Date(lönekörning.bankgiro_exporterad_datum)
          : undefined,
        mailade_datum: lönekörning.mailade_datum ? new Date(lönekörning.mailade_datum) : undefined,
        bokford_datum: lönekörning.bokford_datum ? new Date(lönekörning.bokford_datum) : undefined,
        agi_genererad_datum: lönekörning.agi_genererad_datum
          ? new Date(lönekörning.agi_genererad_datum)
          : undefined,
        skatter_bokforda_datum: lönekörning.skatter_bokforda_datum
          ? new Date(lönekörning.skatter_bokforda_datum)
          : undefined,
        skapad: new Date(lönekörning.skapad),
        uppdaterad: new Date(lönekörning.uppdaterad),
      },
    };
  } catch (error) {
    console.error("❌ Fel vid uppdatering av lönekörning:", error);
    return { success: false, error: "Kunde inte uppdatera lönekörning" };
  }
}

export async function uppdateraLönekörningSteg(
  lönekörningId: number,
  nyttSteg: number // 1=maila, 2=bokför, 3=agi, 4=skatter, 5=komplett
): Promise<{
  success: boolean;
  data?: Lönekörning;
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    // Bestäm vilken datum-kolumn som ska uppdateras
    let datumKolumn = "";
    switch (nyttSteg) {
      case 2:
        datumKolumn = "mailade_datum";
        break;
      case 3:
        datumKolumn = "bokford_datum";
        break;
      case 4:
        datumKolumn = "agi_genererad_datum";
        break;
      case 5:
        datumKolumn = "skatter_bokforda_datum";
        break;
    }

    let query = `
      UPDATE lönekörningar 
      SET aktuellt_steg = $2,
          uppdaterad = CURRENT_TIMESTAMP
    `;

    // Lägg till datum-uppdatering om vi har en kolumn för detta steg
    if (datumKolumn) {
      query += `, ${datumKolumn} = CURRENT_TIMESTAMP`;
    }

    // Om det är sista steget, markera som avslutad
    if (nyttSteg === 5) {
      query += `, status = 'avslutad', avslutad_datum = CURRENT_TIMESTAMP`;
    }

    query += ` WHERE id = $1 AND startad_av = $3 RETURNING *`;

    const result = await pool.query(query, [lönekörningId, nyttSteg, userId]);

    if (result.rows.length === 0) {
      return { success: false, error: "Lönekörning hittades inte eller du har inte behörighet" };
    }

    const lönekörning = result.rows[0];

    return {
      success: true,
      data: {
        ...lönekörning,
        startad_datum: new Date(lönekörning.startad_datum),
        avslutad_datum: lönekörning.avslutad_datum
          ? new Date(lönekörning.avslutad_datum)
          : undefined,
        bankgiro_exporterad_datum: lönekörning.bankgiro_exporterad_datum
          ? new Date(lönekörning.bankgiro_exporterad_datum)
          : undefined,
        mailade_datum: lönekörning.mailade_datum ? new Date(lönekörning.mailade_datum) : undefined,
        bokford_datum: lönekörning.bokford_datum ? new Date(lönekörning.bokford_datum) : undefined,
        agi_genererad_datum: lönekörning.agi_genererad_datum
          ? new Date(lönekörning.agi_genererad_datum)
          : undefined,
        skatter_bokforda_datum: lönekörning.skatter_bokforda_datum
          ? new Date(lönekörning.skatter_bokforda_datum)
          : undefined,
        skapad: new Date(lönekörning.skapad),
        uppdaterad: new Date(lönekörning.uppdaterad),
      },
    };
  } catch (error) {
    console.error("❌ Fel vid uppdatering av lönekörningssteg:", error);
    return { success: false, error: "Kunde inte uppdatera lönekörningssteg" };
  }
}

export async function markeraStegFärdigt(lönekörningId: number): Promise<{
  success: boolean;
  data?: Lönekörning;
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    // Hämta nuvarande aktivt_steg
    const hämtaQuery = `
      SELECT aktivt_steg FROM lönekörningar 
      WHERE id = $1 AND startad_av = $2
    `;
    const hämtaResult = await pool.query(hämtaQuery, [lönekörningId, userId]);

    if (hämtaResult.rows.length === 0) {
      return { success: false, error: "Lönekörning hittades inte eller du har inte behörighet" };
    }

    const nuvarandeSteg = parseInt(hämtaResult.rows[0].aktivt_steg) || 1;
    const nyttSteg = Math.min(nuvarandeSteg + 1, 5); // Max 5 (steg 5 = helt färdig)

    // Uppdatera aktivt_steg och status (avsluta om steg 5)
    let uppdateraQuery = `
      UPDATE lönekörningar 
      SET aktivt_steg = $2,
          uppdaterad = CURRENT_TIMESTAMP`;

    if (nyttSteg === 5) {
      uppdateraQuery += `, status = 'avslutad', avslutad_datum = CURRENT_TIMESTAMP`;
    }

    uppdateraQuery += ` WHERE id = $1 AND startad_av = $3 RETURNING *`;

    const result = await pool.query(uppdateraQuery, [lönekörningId, nyttSteg, userId]);

    if (result.rows.length === 0) {
      return { success: false, error: "Kunde inte uppdatera lönekörning" };
    }

    const lönekörning = result.rows[0];

    revalidatePath("/personal");

    return {
      success: true,
      data: {
        ...lönekörning,
        startad_datum: new Date(lönekörning.startad_datum),
        avslutad_datum: lönekörning.avslutad_datum
          ? new Date(lönekörning.avslutad_datum)
          : undefined,
        bankgiro_exporterad_datum: lönekörning.bankgiro_exporterad_datum
          ? new Date(lönekörning.bankgiro_exporterad_datum)
          : undefined,
        mailade_datum: lönekörning.mailade_datum ? new Date(lönekörning.mailade_datum) : undefined,
        bokford_datum: lönekörning.bokford_datum ? new Date(lönekörning.bokford_datum) : undefined,
        agi_genererad_datum: lönekörning.agi_genererad_datum
          ? new Date(lönekörning.agi_genererad_datum)
          : undefined,
        skatter_bokforda_datum: lönekörning.skatter_bokforda_datum
          ? new Date(lönekörning.skatter_bokforda_datum)
          : undefined,
        skapad: new Date(lönekörning.skapad),
        uppdaterad: new Date(lönekörning.uppdaterad),
      },
    };
  } catch (error) {
    console.error("❌ Fel vid markering av steg som färdigt:", error);
    return { success: false, error: "Kunde inte markera steg som färdigt" };
  }
}

export async function uppdateraLönekörningTotaler(lönekörningId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    // Beräkna totaler från alla lönespecar för denna lönekörning
    const totalerQuery = `
      SELECT 
        COUNT(*) as antal_anstallda,
        COALESCE(SUM(bruttolön), 0) as total_bruttolön,
        COALESCE(SUM(skatt), 0) as total_skatt,
        COALESCE(SUM(sociala_avgifter), 0) as total_sociala_avgifter,
        COALESCE(SUM(nettolön), 0) as total_nettolön
      FROM lönespecifikationer 
      WHERE lonekorning_id = $1
    `;

    const totalerResult = await pool.query(totalerQuery, [lönekörningId]);
    const totaler = totalerResult.rows[0];

    // Uppdatera lönekörningen med de beräknade totalerna
    const uppdateraQuery = `
      UPDATE lönekörningar 
      SET 
        antal_anstallda = $2,
        total_bruttolön = $3,
        total_skatt = $4,
        total_sociala_avgifter = $5,
        total_nettolön = $6,
        uppdaterad = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await pool.query(uppdateraQuery, [
      lönekörningId,
      totaler.antal_anstallda,
      parseFloat(totaler.total_bruttolön),
      parseFloat(totaler.total_skatt),
      parseFloat(totaler.total_sociala_avgifter),
      parseFloat(totaler.total_nettolön),
    ]);

    return { success: true };
  } catch (error) {
    console.error("❌ Fel vid uppdatering av lönekörning-totaler:", error);
    return { success: false, error: "Kunde inte uppdatera totaler" };
  }
}

export async function hämtaAllaLönekörningar(): Promise<{
  success: boolean;
  data?: Lönekörning[];
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    const query = `
      SELECT * FROM lönekörningar 
      WHERE startad_av = $1 OR startad_av IS NULL
      ORDER BY startad_datum DESC
    `;

    const result = await pool.query(query, [userId]);

    const lönekörningar = result.rows.map((row) => ({
      ...row,
      startad_datum: new Date(row.startad_datum),
      avslutad_datum: row.avslutad_datum ? new Date(row.avslutad_datum) : undefined,
      bankgiro_exporterad_datum: row.bankgiro_exporterad_datum
        ? new Date(row.bankgiro_exporterad_datum)
        : undefined,
      mailade_datum: row.mailade_datum ? new Date(row.mailade_datum) : undefined,
      bokford_datum: row.bokford_datum ? new Date(row.bokford_datum) : undefined,
      agi_genererad_datum: row.agi_genererad_datum ? new Date(row.agi_genererad_datum) : undefined,
      skatter_bokforda_datum: row.skatter_bokforda_datum
        ? new Date(row.skatter_bokforda_datum)
        : undefined,
      skapad: new Date(row.skapad),
      uppdaterad: new Date(row.uppdaterad),
    }));

    return {
      success: true,
      data: lönekörningar,
    };
  } catch (error) {
    console.error("❌ Fel vid hämtning av lönekörningar:", error);
    return { success: false, error: "Kunde inte hämta lönekörningar" };
  }
}

export async function hämtaLönespecifikationerFörLönekörning(lonekorning_id: number): Promise<{
  success: boolean;
  data?: LönespecData[];
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    const query = `
      SELECT l.*, a.förnamn, a.efternamn, a.mail
      FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      WHERE l.lonekorning_id = $1 AND a.user_id = $2
      ORDER BY a.förnamn, a.efternamn
    `;

    const result = await pool.query(query, [lonekorning_id, userId]);

    return {
      success: true,
      data: result.rows,
    };
  } catch (error) {
    console.error("❌ Fel vid hämtning av lönespecifikationer för lönekörning:", error);
    return { success: false, error: "Kunde inte hämta lönespecifikationer" };
  }
}

export async function koppLaLönespecTillLönekörning(
  lönespecId: number,
  lönekörningId: number
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    const query = `
      UPDATE lönespecifikationer 
      SET lönekorning_id = $2, uppdaterad = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await pool.query(query, [lönespecId, lönekörningId]);

    // Uppdatera totaler för lönekörningen
    await uppdateraLönekörningTotaler(lönekörningId);

    return { success: true };
  } catch (error) {
    console.error("❌ Fel vid koppling av lönespec till lönekörning:", error);
    return { success: false, error: "Kunde inte koppla lönespec till lönekörning" };
  }
}

export async function markeraLönekörningSteg(
  period: string,
  statusTyp: "bankgiro_exporterad" | "mailade" | "bokford" | "agi_genererad" | "skatter_bokforda"
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    // Hitta eller skapa lönekörning för perioden
    let lönekörningResult = await hämtaAktivLönekörning(period);
    if (!lönekörningResult.success) {
      // Skapa ny lönekörning om ingen finns
      lönekörningResult = await skapaLönekörning(period);
      if (!lönekörningResult.success) {
        return lönekörningResult;
      }
    }

    const lönekörning = lönekörningResult.data!;

    // Markera alla lönespecar för denna lönekörning
    // Mappa statusTyp till rätt kolumnnamn
    const kolumnMapping: Record<string, string> = {
      bankgiro_exporterad: "bankgiro_exporterad",
      mailade: "mailad",
      bokford: "bokförd",
      agi_genererad: "agi_genererad",
      skatter_bokforda: "skatter_bokförda",
    };

    const kolumnNamn = kolumnMapping[statusTyp] || statusTyp;
    const datumKolumn = `${kolumnNamn}_datum`;

    const updateQuery = `
      UPDATE lönespecifikationer 
      SET ${kolumnNamn} = true, 
          ${datumKolumn} = CURRENT_TIMESTAMP,
          uppdaterad = CURRENT_TIMESTAMP
      WHERE lönekorning_id = $1
    `;

    await pool.query(updateQuery, [lönekörning.id]);

    // Kolla om alla steg är genomförda för att avsluta lönekörningen
    const statusQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE bankgiro_exporterad = true) as bankgiro_klara,
        COUNT(*) FILTER (WHERE mailad = true) as maila_klara,
        COUNT(*) FILTER (WHERE bokförd = true) as bokfor_klara,
        COUNT(*) FILTER (WHERE agi_genererad = true) as agi_klara,
        COUNT(*) FILTER (WHERE skatter_bokförda = true) as skatter_klara
      FROM lönespecifikationer 
      WHERE lönekorning_id = $1
    `;

    const statusResult = await pool.query(statusQuery, [lönekörning.id]);
    const stats = statusResult.rows[0];
    const total = parseInt(stats.total);

    // Uppdatera lönekörning-status
    const allaKlara =
      parseInt(stats.bankgiro_klara) === total &&
      parseInt(stats.maila_klara) === total &&
      parseInt(stats.bokfor_klara) === total &&
      parseInt(stats.agi_klara) === total &&
      parseInt(stats.skatter_klara) === total;

    await uppdateraLönekörningStatus(lönekörning.id, statusTyp, allaKlara);

    // Uppdatera totaler
    await uppdateraLönekörningTotaler(lönekörning.id);

    revalidatePath("/personal");

    return { success: true };
  } catch (error) {
    console.error(`❌ Fel vid markering av ${statusTyp}:`, error);
    return { success: false, error: `Kunde inte markera ${statusTyp}` };
  }
}

export async function skapaLönespecifikationerFörLönekörning(
  lönekörningId: number,
  utbetalningsdatum: Date,
  anställdaIds: number[]
): Promise<{
  success: boolean;
  data?: LönespecData[];
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    const skapadeSpecar: LönespecData[] = [];

    for (const anställdId of anställdaIds) {
      // Hämta anställd info för att få grundlön/kompensation
      const anställdQuery = `
        SELECT * FROM anställda 
        WHERE id = $1 AND user_id = $2
      `;
      const anställdResult = await pool.query(anställdQuery, [anställdId, userId]);

      if (anställdResult.rows.length === 0) {
        continue; // Skippa om anställd inte finns eller inte tillhör användaren
      }

      const anställd = anställdResult.rows[0];
      const grundlön = anställd.kompensation || 35000; // Default grundlön

      // Skapa lönespecifikation
      const specQuery = `
        INSERT INTO lönespecifikationer (
          anställd_id,
          grundlön,
          bruttolön,
          skatt,
          sociala_avgifter,
          nettolön,
          utbetalningsdatum,
          skapad_av,
          lonekorning_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      // Enkla beräkningar (kan förbättras senare med riktiga beräkningar)
      const bruttolön = grundlön;
      const skatt = bruttolön * 0.3; // 30% skatt
      const socialaAvgifter = bruttolön * 0.3142; // 31.42% sociala avgifter
      const nettolön = bruttolön - skatt;

      const specResult = await pool.query(specQuery, [
        anställdId,
        grundlön,
        bruttolön,
        skatt,
        socialaAvgifter,
        nettolön,
        utbetalningsdatum,
        userId,
        lönekörningId,
      ]);

      skapadeSpecar.push(specResult.rows[0]);
    }

    // Uppdatera totaler för lönekörningen
    await uppdateraLönekörningTotaler(lönekörningId);

    revalidatePath("/personal");

    return {
      success: true,
      data: skapadeSpecar,
    };
  } catch (error) {
    console.error("❌ Fel vid skapande av lönespecifikationer:", error);
    return { success: false, error: "Kunde inte skapa lönespecifikationer" };
  }
}

export async function taBortLönekörning(lönekörningId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    // Kontrollera att användaren äger lönekörningen
    const kontrollQuery = `
      SELECT id FROM lönekörningar 
      WHERE id = $1 AND startad_av = $2
    `;
    const kontrollResult = await pool.query(kontrollQuery, [lönekörningId, userId]);

    if (kontrollResult.rows.length === 0) {
      return {
        success: false,
        error: "Lönekörning hittades inte eller du har inte behörighet",
      };
    }

    // Ta bort lönekörningen (CASCADE tar hand om lönespecifikationer)
    const deleteQuery = `
      DELETE FROM lönekörningar 
      WHERE id = $1 AND startad_av = $2
    `;
    await pool.query(deleteQuery, [lönekörningId, userId]);

    revalidatePath("/personal");

    return { success: true };
  } catch (error) {
    console.error("❌ Fel vid borttagning av lönekörning:", error);
    return { success: false, error: "Kunde inte ta bort lönekörning" };
  }
}
