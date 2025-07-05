//#region
"use server";

import { Pool } from "pg";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

type AnställdData = {
  förnamn: string;
  efternamn: string;
  personnummer: string;
  jobbtitel: string;
  mail: string;
  clearingnummer: string;
  bankkonto: string;
  adress: string;
  postnummer: string;
  ort: string;
  startdatum: string;
  slutdatum: string;
  anställningstyp: string;
  löneperiod: string;
  ersättningPer: string;
  kompensation: string;
  arbetsvecka: string;
  arbetsbelastning: string;
  deltidProcent: string;
  tjänsteställeAdress: string;
  tjänsteställeOrt: string;
  skattetabell: string;
  skattekolumn: string;
  växaStöd: boolean;
};
//#endregion

export async function hämtaAllaAnställda() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    const query = `
      SELECT * FROM anställda 
      WHERE user_id = $1 
      ORDER BY skapad DESC
    `;

    const result = await client.query(query, [userId]);

    client.release();
    return result.rows;
  } catch (error) {
    console.error("❌ hämtaAllaAnställda error:", error);
    return [];
  }
}

export async function hämtaAnställd(anställdId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    const query = `
      SELECT * FROM anställda 
      WHERE id = $1 AND user_id = $2
    `;

    const result = await client.query(query, [anställdId, userId]);
    if (result.rows.length === 0) {
      client.release();
      return null; // Ingen anställd hittades
    }
    client.release();
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ hämtaAnställd error:", error);
    return null;
  }
}

export async function sparaAnställd(data: AnställdData, anställdId?: number | null) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    // Om anställdId finns - UPPDATERA, annars SKAPA NY
    if (anställdId) {
      // UPPDATERA befintlig anställd
      const updateQuery = `
        UPDATE anställda SET
          förnamn = $1, efternamn = $2, personnummer = $3, jobbtitel = $4, mail = $5,
          clearingnummer = $6, bankkonto = $7, adress = $8, postnummer = $9, ort = $10,
          startdatum = $11, slutdatum = $12, anställningstyp = $13, löneperiod = $14, ersättning_per = $15,
          kompensation = $16, arbetsvecka_timmar = $17, arbetsbelastning = $18, deltid_procent = $19,
          tjänsteställe_adress = $20, tjänsteställe_ort = $21,
          skattetabell = $22, skattekolumn = $23, växa_stöd = $24,
          uppdaterad = NOW()
        WHERE id = $25 AND user_id = $26
        RETURNING id
      `;

      const values = [
        data.förnamn || null,
        data.efternamn || null,
        data.personnummer || null,
        data.jobbtitel || null,
        data.mail || null,
        data.clearingnummer || null,
        data.bankkonto || null,
        data.adress || null,
        data.postnummer || null,
        data.ort || null,
        data.startdatum || null,
        data.slutdatum || null,
        data.anställningstyp || null,
        data.löneperiod || null,
        data.ersättningPer || null,
        data.kompensation ? parseFloat(data.kompensation) : null,
        data.arbetsvecka ? parseInt(data.arbetsvecka, 10) : null,
        data.arbetsbelastning || null,
        data.deltidProcent ? parseInt(data.deltidProcent, 10) : null,
        data.tjänsteställeAdress || null,
        data.tjänsteställeOrt || null,
        data.skattetabell ? parseInt(data.skattetabell, 10) : null,
        data.skattekolumn ? parseInt(data.skattekolumn, 10) : null,
        data.växaStöd,
        anställdId,
        userId,
      ];

      const result = await client.query(updateQuery, values);

      client.release();
      revalidatePath("/personal");

      return {
        success: true,
        id: anställdId,
        message: "Anställd uppdaterad!",
      };
    } else {
      // SKAPA NY anställd
      const insertQuery = `
        INSERT INTO anställda (
          förnamn, efternamn, personnummer, jobbtitel, mail,
          clearingnummer, bankkonto, adress, postnummer, ort,
          startdatum, slutdatum, anställningstyp, löneperiod, ersättning_per,
          kompensation, arbetsvecka_timmar, arbetsbelastning, deltid_procent,
          tjänsteställe_adress, tjänsteställe_ort,
          skattetabell, skattekolumn, växa_stöd,
          user_id
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19,
          $20, $21,
          $22, $23, $24,
          $25
        ) RETURNING id
      `;

      const values = [
        data.förnamn || null,
        data.efternamn || null,
        data.personnummer || null,
        data.jobbtitel || null,
        data.mail || null,
        data.clearingnummer || null,
        data.bankkonto || null,
        data.adress || null,
        data.postnummer || null,
        data.ort || null,
        data.startdatum || null,
        data.slutdatum || null,
        data.anställningstyp || null,
        data.löneperiod || null,
        data.ersättningPer || null,
        data.kompensation ? parseFloat(data.kompensation) : null,
        data.arbetsvecka ? parseInt(data.arbetsvecka, 10) : null,
        data.arbetsbelastning || null,
        data.deltidProcent ? parseInt(data.deltidProcent, 10) : null,
        data.tjänsteställeAdress || null,
        data.tjänsteställeOrt || null,
        data.skattetabell ? parseInt(data.skattetabell, 10) : null,
        data.skattekolumn ? parseInt(data.skattekolumn, 10) : null,
        data.växaStöd,
        userId,
      ];

      const result = await client.query(insertQuery, values);

      const nyAnställdId = result.rows[0].id;

      client.release();
      revalidatePath("/personal");

      return {
        success: true,
        id: nyAnställdId,
        message: "Anställd sparad!",
      };
    }
  } catch (error) {
    console.error("❌ sparaAnställd error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod vid sparande",
    };
  }
}

export async function taBortAnställd(anställdId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    const query = `
      DELETE FROM anställda 
      WHERE id = $1 AND user_id = $2
    `;

    const result = await client.query(query, [anställdId, userId]);

    client.release();
    revalidatePath("/personal");

    return {
      success: true,
      message: "Anställd borttagen!",
    };
  } catch (error) {
    console.error("❌ taBortAnställd error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod",
    };
  }
}

export async function hämtaFöretagsprofil(userId: string): Promise<any | null> {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        företagsnamn,
        adress,
        postnummer,
        stad,
        organisationsnummer,
        momsregistreringsnummer,
        telefonnummer,
        epost,
        webbplats
      FROM företagsprofil
      WHERE id = $1
      LIMIT 1
      `,
      [userId]
    );

    return rows[0] || null;
  } catch (error) {
    console.error("Fel vid hämtning av företagsprofil:", error);
    return null;
  }
}

export async function hämtaSemesterTransaktioner(
  anställdId: number,
  startDatum?: string,
  slutDatum?: string,
  typ?: string,
  bokfört?: boolean
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    // Kontrollera att anställd tillhör användaren
    const checkQuery = `
      SELECT id FROM anställda 
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [anställdId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      return [];
    }

    let query = `
      SELECT 
        s.*,
        l.månad as lönespec_månad,
        l.år as lönespec_år
      FROM semester s
      LEFT JOIN lönespecifikationer l ON s.lönespecifikation_id = l.id
      WHERE s.anställd_id = $1
    `;

    const queryParams: any[] = [anställdId];
    let paramIndex = 2;

    // Lägg till filter
    if (startDatum) {
      query += ` AND s.datum >= $${paramIndex}`;
      queryParams.push(startDatum);
      paramIndex++;
    }

    if (slutDatum) {
      query += ` AND s.datum <= $${paramIndex}`;
      queryParams.push(slutDatum);
      paramIndex++;
    }

    if (typ && typ !== "Alla") {
      query += ` AND s.typ = $${paramIndex}`;
      queryParams.push(typ);
      paramIndex++;
    }

    if (bokfört !== undefined) {
      query += ` AND s.bokfört = $${paramIndex}`;
      queryParams.push(bokfört);
      paramIndex++;
    }

    query += ` ORDER BY s.datum DESC, s.skapad DESC`;

    const result = await client.query(query, queryParams);

    client.release();
    return result.rows;
  } catch (error) {
    console.error("❌ hämtaSemesterTransaktioner error:", error);
    return [];
  }
}

export async function sparaSemesterTransaktion(data: {
  anställdId: number;
  datum: string;
  typ: string;
  antal: number;
  frånDatum?: string;
  tillDatum?: string;
  beskrivning?: string;
  lönespecifikationId?: number;
  bokfört?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    // Kontrollera att anställd tillhör användaren
    const checkQuery = `
      SELECT id FROM anställda 
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [data.anställdId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      return { success: false, error: "Anställd inte hittad" };
    }

    const insertQuery = `
      INSERT INTO semester (
        anställd_id, datum, typ, antal, från_datum, till_datum, 
        beskrivning, lönespecifikation_id, bokfört, skapad_av
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING id
    `;

    const values = [
      data.anställdId,
      data.datum,
      data.typ,
      data.antal,
      data.frånDatum || null,
      data.tillDatum || null,
      data.beskrivning || null,
      data.lönespecifikationId || null,
      data.bokfört || false,
      userId,
    ];

    const result = await client.query(insertQuery, values);
    const nyTransaktionId = result.rows[0].id;

    client.release();
    revalidatePath("/personal");

    return {
      success: true,
      id: nyTransaktionId,
      message: "Semestertransaktion sparad!",
    };
  } catch (error) {
    console.error("❌ sparaSemesterTransaktion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod vid sparande",
    };
  }
}

export async function raderaSemesterTransaktion(transaktionId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    // Kontrollera att transaktionen tillhör användarens anställd
    const checkQuery = `
      SELECT s.id FROM semester s
      JOIN anställda a ON s.anställd_id = a.id
      WHERE s.id = $1 AND a.user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [transaktionId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      return { success: false, error: "Transaktion inte hittad" };
    }

    const deleteQuery = `DELETE FROM semester WHERE id = $1`;
    await client.query(deleteQuery, [transaktionId]);

    client.release();
    revalidatePath("/personal");

    return {
      success: true,
      message: "Semestertransaktion borttagen!",
    };
  } catch (error) {
    console.error("❌ raderaSemesterTransaktion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod",
    };
  }
}

export async function uppdateraSemesterdata(
  anställdId: number,
  data: {
    semesterdagarPerÅr?: number;
    kvarandeDagar?: number;
    sparadeDagar?: number;
    användaFörskott?: number;
    kvarandeFörskott?: number;
    innestående?: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    const updateQuery = `
      UPDATE anställda SET
        semesterdagar_per_år = $1,
        kvarvarande_dagar = $2,
        sparade_dagar = $3,
        använda_förskott = $4,
        kvarvarande_förskott = $5,
        innestående_ersättning = $6,
        uppdaterad = NOW()
      WHERE id = $7 AND user_id = $8
      RETURNING id
    `;

    const values = [
      data.semesterdagarPerÅr || 0,
      data.kvarandeDagar || 0,
      data.sparadeDagar || 0,
      data.användaFörskott || 0,
      data.kvarandeFörskott || 0,
      data.innestående || 0,
      anställdId,
      userId,
    ];

    const result = await client.query(updateQuery, values);

    if (result.rowCount === 0) {
      client.release();
      return { success: false, error: "Anställd inte hittad" };
    }

    client.release();
    revalidatePath("/personal");

    return {
      success: true,
      message: "Semesterdata uppdaterad!",
    };
  } catch (error) {
    console.error("❌ uppdateraSemesterdata error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod",
    };
  }
}

export async function hämtaLönespecifikationer(anställdId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    // Kontrollera att anställd tillhör användaren
    const checkQuery = `
      SELECT id FROM anställda 
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [anställdId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      return [];
    }

    // Hämta lönespecifikationer
    const lönespecQuery = `
      SELECT * FROM lönespecifikationer 
      WHERE anställd_id = $1 
      ORDER BY skapad DESC
    `;
    const lönespecResult = await client.query(lönespecQuery, [anställdId]);

    // ✅ LADDA EXTRARADER FÖR VARJE LÖNESPEC
    const lönespecarMedExtrarader = await Promise.all(
      lönespecResult.rows.map(async (lönespec) => {
        try {
          const extraradQuery = `
            SELECT * FROM lönespec_extrarader 
            WHERE lönespecifikation_id = $1 
            ORDER BY id
          `;
          const extraradResult = await client.query(extraradQuery, [lönespec.id]);

          return {
            ...lönespec,
            extrarader: extraradResult.rows,
          };
        } catch (error) {
          console.error("❌ Fel vid laddning av extrarader för lönespec", lönespec.id, error);
          return {
            ...lönespec,
            extrarader: [],
          };
        }
      })
    );

    client.release();

    return lönespecarMedExtrarader;
  } catch (error) {
    console.error("❌ hämtaLönespecifikationer error:", error);
    return [];
  }
}

export async function hämtaUtlägg(anställdId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    // Kontrollera att anställd tillhör användaren
    const checkQuery = `
      SELECT id FROM anställda 
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [anställdId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      return [];
    }

    const query = `
      SELECT * FROM utlägg 
      WHERE anställd_id = $1 
      ORDER BY datum DESC, skapad DESC
    `;

    const result = await client.query(query, [anställdId]);

    client.release();
    return result.rows;
  } catch (error) {
    console.error("❌ hämtaUtlägg error:", error);
    return [];
  }
}

export async function sparaExtrarad(data: any) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  try {
    const client = await pool.connect();

    const insertQuery = `
      INSERT INTO lönespec_extrarader (
        lönespecifikation_id, typ, kolumn1, kolumn2, kolumn3, kolumn4
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.lönespecifikation_id,
      data.typ || null,
      data.kolumn1 || null,
      data.kolumn2 || null,
      data.kolumn3 || null,
      data.kolumn4 || null,
    ];

    const result = await client.query(insertQuery, values);

    client.release();
    revalidatePath("/personal");

    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error("❌ sparaExtrarad error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ett fel uppstod",
    };
  }
}

export async function hämtaExtrarader(lönespecifikation_id: number) {
  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT * FROM lönespec_extrarader WHERE lönespecifikation_id = $1`,
      [lönespecifikation_id]
    );
    client.release();
    return result.rows;
  } catch (error) {
    console.error("❌ hämtaExtrarader error:", error);
    return [];
  }
}

export async function taBortExtrarad(extraradId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  try {
    const client = await pool.connect();

    const query = `
      DELETE FROM lönespec_extrarader 
      WHERE id = $1
    `;

    const result = await client.query(query, [extraradId]);

    client.release();

    // ✅ LÄGG TILL DENNA RAD FÖR ATT UPPDATERA BOKFÖRINGEN!
    revalidatePath("/personal");

    return { success: true };
  } catch (error) {
    console.error("❌ taBortExtrarad error:", error);
    throw error;
  }
}

export async function skapaNyLönespec(data: {
  anställd_id: number;
  månad: number;
  år: number;
  period_start: string;
  period_slut: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    // Hämta anställd från databas
    const anställdQuery = `SELECT kompensation FROM anställda WHERE id = $1 AND user_id = $2`;
    const anställdResult = await client.query(anställdQuery, [data.anställd_id, userId]);

    if (anställdResult.rows.length === 0) {
      client.release();
      return { success: false, error: "Anställd hittades inte" };
    }

    const anställd = anställdResult.rows[0];

    // Kontrollera duplicat
    const existsQuery = `SELECT id FROM lönespecifikationer WHERE anställd_id = $1 AND månad = $2 AND år = $3`;
    const existsResult = await client.query(existsQuery, [data.anställd_id, data.månad, data.år]);

    if (existsResult.rows.length > 0) {
      client.release();
      return {
        success: false,
        error: `Lönespecifikation för ${data.månad}/${data.år} finns redan`,
      };
    }

    // ✅ ANVÄND KOMPENSATION DIREKT FRÅN ANSTÄLLD - INGA BERÄKNINGAR!
    const grundlön = parseFloat(anställd.kompensation || "0");

    const insertQuery = `
      INSERT INTO lönespecifikationer (
        anställd_id, period_start, period_slut, månad, år,
        grundlön, bruttolön, skatt, sociala_avgifter, nettolön,
        status, skapad_av
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Utkast', $11)
      RETURNING *
    `;

    const insertResult = await client.query(insertQuery, [
      data.anställd_id,
      data.period_start,
      data.period_slut,
      data.månad,
      data.år,
      grundlön, // ✅ 35000 direkt från anställd.kompensation
      grundlön, // ✅ Bruttolön = grundlön initialt
      0, // Skatt beräknas senare
      0, // Sociala avgifter beräknas senare
      grundlön, // ✅ Nettolön = grundlön initialt (innan skatt)
      userId,
    ]);

    const nyLönespec = insertResult.rows[0];

    // 🏖️ AUTOMATISK SEMESTERINTJÄNING
    const semesterResult = await läggTillAutomatiskSemester(
      data.anställd_id,
      nyLönespec.id,
      data.månad,
      data.år
    );

    client.release();

    return {
      success: true,
      lönespec: nyLönespec,
      semesterInfo: semesterResult,
    };
  } catch (error) {
    console.error("❌ skapaNyLönespec error:", error);
    return {
      success: false,
      error: "Kunde inte skapa lönespecifikation",
    };
  }
}

export async function taBortLönespec(lönespecId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    // Kontrollera att lönespec tillhör användarens anställd
    const checkQuery = `
      SELECT l.id FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [lönespecId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      throw new Error("Lönespec inte hittad");
    }

    const deleteQuery = `
      DELETE FROM lönespecifikationer 
      WHERE id = $1
    `;

    const result = await client.query(deleteQuery, [lönespecId]);

    client.release();
    revalidatePath("/personal");

    return { success: true, message: "Lönespec borttagen!" };
  } catch (error) {
    console.error("❌ taBortLönespec error:", error);
    throw error;
  }
}

// #region Semesterhantering

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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

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

    client.release();

    // Bygg sammanställning
    const summary: SemesterSummary = {
      intjänat: 0,
      betalda: 0,
      sparade: 0,
      förskott: 0,
      kvarvarande: 0,
      tillgängligt: 0,
    };

    result.rows.forEach((row) => {
      const antal = parseFloat(row.total_antal) || 0;
      switch (row.typ) {
        case "Intjänat":
          summary.intjänat = antal;
          break;
        case "Betalda":
          summary.betalda = antal;
          break;
        case "Sparade":
          summary.sparade = antal;
          break;
        case "Förskott":
          summary.förskott = antal;
          break;
      }
    });

    // Beräkna kvarvarande och tillgängligt
    summary.kvarvarande = summary.intjänat - summary.betalda;
    summary.tillgängligt = summary.kvarvarande - summary.förskott;

    return summary;
  } catch (error) {
    console.error("❌ hämtaSemesterSammanställning error:", error);
    throw error;
  }
}

/**
 * Registrerar semesteruttag
 */
export async function registreraSemesteruttag(
  anställdId: number,
  uttag: Omit<SemesterRecord, "id" | "skapad_av">
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    const insertQuery = `
      INSERT INTO semester (
        anställd_id, datum, typ, antal, från_datum, till_datum, 
        beskrivning, lönespecifikation_id, bokfört, skapad_av
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const values = [
      anställdId,
      uttag.datum,
      uttag.typ,
      uttag.antal,
      uttag.från_datum,
      uttag.till_datum,
      uttag.beskrivning,
      uttag.lönespecifikation_id,
      uttag.bokfört,
      userId,
    ];

    const result = await client.query(insertQuery, values);
    client.release();

    revalidatePath("/personal");

    return {
      success: true,
      message: "Semesteruttag registrerat!",
    };
  } catch (error) {
    console.error("❌ registreraSemesteruttag error:", error);
    return {
      success: false,
      message: "Kunde inte registrera semesteruttag",
    };
  }
}

/**
 * Hämtar semesterhistorik för en anställd
 */
export async function hämtaSemesterHistorik(anställdId: number): Promise<SemesterRecord[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  try {
    const client = await pool.connect();

    const result = await client.query(
      `
      SELECT * FROM semester 
      WHERE anställd_id = $1
      ORDER BY datum DESC
    `,
      [anställdId]
    );

    client.release();
    return result.rows;
  } catch (error) {
    console.error("❌ hämtaSemesterHistorik error:", error);
    return [];
  }
}

/**
 * Beräknar semesterpenning baserat på lön
 */
export async function beräknaSemesterpenning(
  anställdId: number,
  semesterdagar: number
): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  try {
    const client = await pool.connect();

    // Hämta senaste lönespec för att få aktuell lön
    const result = await client.query(
      `
      SELECT bruttolön FROM lönespecifikationer 
      WHERE anställd_id = $1
      ORDER BY datum DESC
      LIMIT 1
    `,
      [anställdId]
    );

    client.release();

    if (result.rows.length === 0) {
      return 0;
    }

    const månadslön = parseFloat(result.rows[0].bruttolön) || 0;
    const dagslön = månadslön / 21.75; // Genomsnittligt antal arbetsdagar per månad
    const semesterersättning = dagslön * semesterdagar * 1.12; // 12% semesterersättning

    return Math.round(semesterersättning);
  } catch (error) {
    console.error("❌ beräknaSemesterpenning error:", error);
    return 0;
  }
}

/**
 * Beräknar och lägger till automatisk semesterintjäning vid lönespec
 */
export async function läggTillAutomatiskSemester(
  anställdId: number,
  lönespecId: number,
  månad: number,
  år: number
): Promise<{ success: boolean; dagar?: number; message?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();

    // Hämta anställningsdatum
    const anställdQuery = `SELECT startdatum FROM anställda WHERE id = $1`;
    const anställdResult = await client.query(anställdQuery, [anställdId]);

    if (anställdResult.rows.length === 0) {
      client.release();
      return { success: false, message: "Anställd hittades inte" };
    }

    const startdatum = anställdResult.rows[0].startdatum;

    // Hämta senaste semesterpost för att se när vi senast lade till semester
    const senasteSemesterQuery = `
      SELECT datum, typ FROM semester 
      WHERE anställd_id = $1 AND typ = 'Intjänat'
      ORDER BY datum DESC
      LIMIT 1
    `;
    const senasteSemesterResult = await client.query(senasteSemesterQuery, [anställdId]);

    // Beräkna hur många månader som gått sedan senaste intjäning
    let månaderAttLägga = 1; // Default: denna månad

    if (senasteSemesterResult.rows.length > 0) {
      const senasteDatum = new Date(senasteSemesterResult.rows[0].datum);
      const dennaMånad = new Date(år, månad - 1, 1);

      // Beräkna månader mellan senaste intjäning och nu
      const månaderSkillnad =
        (dennaMånad.getFullYear() - senasteDatum.getFullYear()) * 12 +
        (dennaMånad.getMonth() - senasteDatum.getMonth());

      månaderAttLägga = Math.max(0, månaderSkillnad);
    } else if (startdatum) {
      // Om detta är första semesterintjäningen, beräkna från anställningsdatum
      const anställningsDatum = new Date(startdatum);
      const dennaMånad = new Date(år, månad - 1, 1);

      // Beräkna månader sedan anställning (inklusive anställningsmånaden)
      const månaderSedanAnställning =
        (dennaMånad.getFullYear() - anställningsDatum.getFullYear()) * 12 +
        (dennaMånad.getMonth() - anställningsDatum.getMonth()) +
        1;

      månaderAttLägga = Math.max(1, månaderSedanAnställning);
    }

    // Om det inte finns några månader att lägga till, hoppa över
    if (månaderAttLägga === 0) {
      client.release();
      return { success: true, dagar: 0, message: "Ingen semester att lägga till" };
    }

    // Beräkna semesterdagar (25 dagar/år = 2.08 dagar/månad)
    const semesterDagar = Math.round((25 / 12) * månaderAttLägga * 100) / 100; // Avrunda till 2 decimaler

    // Lägg till semesterpost
    const insertSemesterQuery = `
      INSERT INTO semester (
        anställd_id, datum, typ, antal, beskrivning, 
        lönespecifikation_id, bokfört, skapad_av
      ) VALUES ($1, $2, 'Intjänat', $3, $4, $5, true, $6)
      RETURNING id
    `;

    const beskrivning =
      senasteSemesterResult.rows.length === 0
        ? `Semesterintjäning sedan anställning (${månaderAttLägga} mån: ${semesterDagar} dagar)`
        : `Automatisk semesterintjäning (${månaderAttLägga} mån: ${semesterDagar} dagar)`;
    const datum = `${år}-${månad.toString().padStart(2, "0")}-01`;

    await client.query(insertSemesterQuery, [
      anställdId,
      datum,
      semesterDagar,
      beskrivning,
      lönespecId,
      userId,
    ]);

    client.release();

    return {
      success: true,
      dagar: semesterDagar,
      message: `Lade till ${semesterDagar} semesterdagar`,
    };
  } catch (error) {
    console.error("❌ läggTillAutomatiskSemester error:", error);
    return {
      success: false,
      message: "Kunde inte lägga till semester",
    };
  }
}

// #endregion
