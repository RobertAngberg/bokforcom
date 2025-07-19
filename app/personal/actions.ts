"use server";

export async function hämtaAllaLönespecarFörUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }
  const userId = parseInt(session.user.id, 10);
  try {
    const client = await pool.connect();
    const query = `
      SELECT l.*
      FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      WHERE a.user_id = $1
      ORDER BY l.utbetalningsdatum DESC, l.skapad DESC
    `;
    const result = await client.query(query, [userId]);
    client.release();
    return result.rows;
  } catch (error) {
    console.error("❌ hämtaAllaLönespecarFörUser error:", error);
    return [];
  }
}

export async function hämtaUtbetalningsdatumLista() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }
  const userId = parseInt(session.user.id, 10);
  try {
    const client = await pool.connect();
    const query = `
      SELECT DISTINCT l.utbetalningsdatum
      FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      WHERE a.user_id = $1
      ORDER BY l.utbetalningsdatum DESC
    `;
    const result = await client.query(query, [userId]);
    client.release();
    // Returnera som array av datumsträngar
    return result.rows.map((row) => row.utbetalningsdatum);
  } catch (error) {
    console.error("❌ hämtaUtbetalningsdatumLista error:", error);
    return [];
  }
}
//#region

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
          skattetabell = $22, skattekolumn = $23,
          uppdaterad = NOW()
        WHERE id = $24 AND user_id = $25
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
          skattetabell, skattekolumn,
          user_id
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19,
          $20, $21,
          $22, $23, $24
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
        userId,
      ];

      console.log("➕ Skapar ny anställd");
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
    console.log("✅ Anställd borttagen:", result.rowCount);

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

export async function hämtaSemesterTransaktioner(anställdId: number) {
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
      SELECT betalda_dagar, sparade_dagar, skuld, komp_dagar
      FROM semester
      WHERE anställd_id = $1
    `;
    const result = await client.query(query, [anställdId]);
    client.release();
    return result.rows;
  } catch (error) {
    console.error("❌ hämtaSemesterTransaktioner error:", error);
    return [];
  }
}

export async function sparaSemesterTransaktion(data: {
  anställdId: number;
  nyttVärde: number;
  kolumn: "betalda_dagar" | "sparade_dagar" | "skuld" | "komp_dagar";
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen inloggad användare");
  }

  const userId = parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();
    // UPDATE
    const updateQuery = `
      UPDATE semester
      SET ${data.kolumn} = $1, uppdaterad = NOW()
      WHERE anställd_id = $2
      RETURNING id
    `;
    const updateResult = await client.query(updateQuery, [data.nyttVärde, data.anställdId]);
    console.log("sparaSemesterTransaktion: updateResult", updateResult.rows);
    let id = updateResult.rows[0]?.id;
    if (!id) {
      // Ingen rad uppdaterad, skapa en ny rad med rätt värde
      let betalda_dagar = 0,
        sparade_dagar = 0,
        skuld = 0,
        komp_dagar = 0;
      switch (data.kolumn) {
        case "betalda_dagar":
          betalda_dagar = data.nyttVärde;
          break;
        case "sparade_dagar":
          sparade_dagar = data.nyttVärde;
          break;
        case "skuld":
          skuld = data.nyttVärde;
          break;
        case "komp_dagar":
          komp_dagar = data.nyttVärde;
          break;
      }
      const insertQuery = `
        INSERT INTO semester (
          anställd_id, betalda_dagar, sparade_dagar, skuld, komp_dagar
        ) VALUES (
          $1, $2, $3, $4, $5
        ) RETURNING id
      `;
      const insertResult = await client.query(insertQuery, [
        data.anställdId,
        betalda_dagar,
        sparade_dagar,
        skuld,
        komp_dagar,
      ]);
      id = insertResult.rows[0]?.id;
      console.log("sparaSemesterTransaktion: insertResult", insertResult.rows);
    }
    client.release();
    revalidatePath("/personal");
    return {
      success: true,
      id,
      message: "Semesterfält uppdaterat!",
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

    console.log("🎯 FÄRDIGA LÖNESPECAR MED EXTRARADER:", lönespecarMedExtrarader);
    return lönespecarMedExtrarader;
  } catch (error) {
    console.error("❌ hämtaLönespecifikationer error:", error);
    return [];
  }
}

export async function hämtaUtlogg(anställdId: number) {
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
    console.error("❌ hämtaUtlogg error:", error);
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
  utbetalningsdatum: string; // YYYY-MM-DD
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
    const existsQuery = `SELECT id FROM lönespecifikationer WHERE anställd_id = $1 AND utbetalningsdatum = $2`;
    const existsResult = await client.query(existsQuery, [
      data.anställd_id,
      data.utbetalningsdatum,
    ]);

    if (existsResult.rows.length > 0) {
      client.release();
      return {
        success: false,
        error: `Lönespecifikation för ${data.utbetalningsdatum} finns redan`,
      };
    }

    // ✅ ANVÄND KOMPENSATION DIREKT FRÅN ANSTÄLLD - INGA BERÄKNINGAR!
    const grundlön = parseFloat(anställd.kompensation || "0");

    const insertQuery = `
      INSERT INTO lönespecifikationer (
        anställd_id, utbetalningsdatum,
        grundlön, bruttolön, skatt, sociala_avgifter, nettolön,
        skapad_av
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const insertResult = await client.query(insertQuery, [
      data.anställd_id,
      data.utbetalningsdatum,
      grundlön,
      grundlön,
      0,
      0,
      grundlön,
      userId,
    ]);

    client.release();

    return insertResult.rows[0];
  } catch (error) {
    console.error("❌ skapaNyLönespec error:", error);
    throw new Error("Kunde inte skapa lönespecifikation");
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

export async function bokförSemester({
  userId,
  rader,
  kommentar,
  datum,
}: {
  userId: number;
  rader: { kontobeskrivning: string; belopp: number }[];
  kommentar?: string;
  datum?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Ingen inloggad användare");
  const realUserId = userId || parseInt(session.user.id, 10);

  try {
    const client = await pool.connect();
    const transaktionsdatum = datum || new Date().toISOString();

    // Skapa huvudtransaktion
    const huvudBeskrivning = "Semestertransaktion";
    const insertTransaktion = await client.query(
      `INSERT INTO transaktioner ("transaktionsdatum", "kontobeskrivning", "kommentar", "userId")
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [transaktionsdatum, huvudBeskrivning, kommentar || null, realUserId]
    );
    const transaktionsId = insertTransaktion.rows[0].id;

    // Lägg till varje rad i transaktionsposter
    for (const rad of rader) {
      // Extrahera kontonummer ur kontobeskrivning (t.ex. "2920 Upplupna semesterlöner")
      const kontoMatch = rad.kontobeskrivning.match(/^(\d+)/);
      const kontonummer = kontoMatch ? kontoMatch[1] : null;
      if (!kontonummer)
        throw new Error(`Kunde inte extrahera kontonummer ur beskrivning: ${rad.kontobeskrivning}`);
      // Slå upp id i konton-tabellen
      const kontoRes = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
        kontonummer,
      ]);
      if (kontoRes.rows.length === 0)
        throw new Error(`Kontonummer ${kontonummer} finns ej i konton-tabellen!`);
      const konto_id = kontoRes.rows[0].id;
      const debet = rad.belopp > 0 ? rad.belopp : 0;
      const kredit = rad.belopp < 0 ? -rad.belopp : 0;
      await client.query(
        `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
         VALUES ($1, $2, $3, $4)`,
        [transaktionsId, konto_id, debet, kredit]
      );
    }

    client.release();
    revalidatePath("/personal");
    return { success: true, message: "Bokföringsrader sparade!" };
  } catch (error) {
    console.error("❌ bokförSemester error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ett fel uppstod" };
  }
}
