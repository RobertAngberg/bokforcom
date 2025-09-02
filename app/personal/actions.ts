"use server";

import { Pool } from "pg";
import { getUserId } from "../_utils/authUtils";
import { revalidatePath } from "next/cache";
import { validateSessionAttempt } from "../_utils/rateLimit";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// SÄKERHETSVALIDERING: Logga säkerhetshändelser för HR-data
function logPersonalDataEvent(
  eventType: "encrypt" | "decrypt" | "validate" | "access" | "modify" | "delete" | "violation",
  userId?: number,
  details?: string
) {
  const timestamp = new Date().toISOString();
  console.log(`🔒 PERSONAL DATA EVENT [${timestamp}]: ${eventType.toUpperCase()} {`);
  if (userId) console.log(`  userId: ${userId},`);
  if (details) console.log(`  details: '${details}',`);
  console.log(`  timestamp: '${timestamp}'`);
  console.log(`}`);
}

// Types
interface ExtraradData {
  lönespecifikation_id: number;
  typ: string;
  kolumn1?: string | null;
  kolumn2?: string | null;
  kolumn3?: string | null;
  kolumn4?: string | null;
}

interface ExtraradResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface UtläggData {
  id: number;
  beskrivning: string;
  belopp: number;
  kommentar?: string;
  datum: string;
}

// Dedicated funktion för att lägga till utlägg som extrarad
export async function läggTillUtläggSomExtrarad(
  lönespecId: number,
  utlägg: UtläggData
): Promise<ExtraradResult> {
  const extraradData: ExtraradData = {
    lönespecifikation_id: lönespecId,
    typ: "manuellPost", // Behåller samma typ som fungerar
    kolumn1: utlägg.beskrivning || `Utlägg - ${utlägg.datum}`,
    kolumn2: "1", // Antal = 1
    kolumn3: utlägg.belopp.toString(), // Belopp per enhet
    kolumn4: utlägg.kommentar || "",
  };

  return sparaExtrarad(extraradData);
}

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
  const userId = await getUserId();

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
  const userId = await getUserId();

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
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  try {
    const client = await pool.connect();

    // Om anställdId finns - UPPDATERA, annars SKAPA NY
    if (anställdId) {
      // SÄKERHETSVALIDERING: Verifiera ägarskap
      const ownershipCheck = await client.query(
        "SELECT id FROM anställda WHERE id = $1 AND user_id = $2",
        [anställdId, userId]
      );

      if (ownershipCheck.rows.length === 0) {
        client.release();
        logPersonalDataEvent(
          "violation",
          userId,
          `Attempted to update unauthorized employee ${anställdId}`
        );
        return {
          success: false,
          error: "Säkerhetsfel: Otillåten åtkomst till anställd",
        };
      }

      // UPPDATERA befintlig anställd med krypterad data
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
        data.personnummer,
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

      await client.query(updateQuery, values);
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
        data.personnummer,
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
      error: "Kunde inte spara anställd: " + (error instanceof Error ? error.message : "Okänt fel"),
    };
  }
}

export async function taBortAnställd(anställdId: number) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

  // SÄKERHETSVALIDERING: Rate limiting för GDPR-kritisk borttagning
  if (!validateSessionAttempt(`hr-delete-${userId}`)) {
    logPersonalDataEvent(
      "violation",
      userId,
      "Rate limit exceeded for employee deletion operation"
    );
    return {
      success: false,
      error: "För många förfrågningar. Försök igen om 15 minuter.",
    };
  }

  logPersonalDataEvent("delete", userId, `Attempting to delete employee ${anställdId}`);

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
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

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
      SELECT betalda_dagar, sparade_dagar, skuld, komp_dagar, bokförd
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
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

  try {
    const client = await pool.connect();
    // UPDATE
    const updateQuery = `
      UPDATE semester
      SET ${data.kolumn} = $1, bokförd = FALSE, uppdaterad = NOW()
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
          anställd_id, betalda_dagar, sparade_dagar, skuld, komp_dagar, bokförd
        ) VALUES (
          $1, $2, $3, $4, $5, FALSE
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
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

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
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

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
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

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
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

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
      SELECT 
        u.id,
        u.anställd_id,
        u.user_id,
        u.status,
        u.skapad,
        u.uppdaterad,
        u.transaktion_id,
        COALESCE(t.belopp, 0) as belopp,
        COALESCE(t.kontobeskrivning, 'Utlägg') as beskrivning,
        COALESCE(t.transaktionsdatum::text, u.skapad::date::text) as datum,
        COALESCE(t.kommentar, '') as kategori,
        t.fil as kvitto_fil
      FROM utlägg u 
      LEFT JOIN transaktioner t ON u.transaktion_id = t.id
      WHERE u.anställd_id = $1 
      ORDER BY u.skapad DESC
    `;

    const result = await client.query(query, [anställdId]);

    console.log(`🔍 hämtaUtlägg för anställd ${anställdId}:`, result.rows);

    client.release();
    return result.rows;
  } catch (error) {
    console.error("❌ hämtaUtlägg error:", error);
    return [];
  }
}

export async function sparaExtrarad(data: ExtraradData): Promise<ExtraradResult> {
  const userId = await getUserId();
  if (!userId) {
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

export async function uppdateraUtläggStatus(utläggId: number, status: string) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  try {
    const client = await pool.connect();

    const updateQuery = `
      UPDATE utlägg SET status = $1, uppdaterad = NOW() 
      WHERE id = $2
    `;

    await client.query(updateQuery, [status, utläggId]);
    client.release();

    return { success: true };
  } catch (error) {
    console.error("❌ uppdateraUtläggStatus error:", error);
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

export async function läggTillUtläggILönespec(lönespecId: number) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  try {
    const client = await pool.connect();

    // Hämta lönespec och anställd info
    const lönespecQuery = `
      SELECT l.*, a.id as anställd_id 
      FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `;
    const lönespecResult = await client.query(lönespecQuery, [lönespecId, userId]);

    if (lönespecResult.rows.length === 0) {
      client.release();
      return { success: false, error: "Lönespec not found" };
    }

    const anställdId = lönespecResult.rows[0].anställd_id;

    // Hämta väntande utlägg för anställd
    const utläggQuery = `
      SELECT 
        u.*, 
        t.belopp,
        t.kontobeskrivning as beskrivning,
        t.transaktionsdatum as datum
      FROM utlägg u 
      LEFT JOIN transaktioner t ON u.transaktion_id = t.id
      WHERE u.anställd_id = $1 AND u.status = 'Väntande'
      ORDER BY u.skapad DESC
    `;

    const utläggResult = await client.query(utläggQuery, [anställdId]);

    // DEBUG: Logga vad vi får från databasen
    // Lägg till varje utlägg som extrarad
    for (const utlägg of utläggResult.rows) {
      const insertQuery = `
        INSERT INTO lönespec_extrarader (
          lönespecifikation_id, typ, kolumn1, kolumn2, kolumn3, kolumn4
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      const values = [
        lönespecId,
        "utlägg",
        utlägg.beskrivning || "Utlägg",
        utlägg.belopp || 0,
        "",
        `Utlägg ID: ${utlägg.id}`,
      ];

      await client.query(insertQuery, values);

      // Uppdatera utlägg status
      const updateUtläggQuery = `
        UPDATE utlägg SET status = 'Inkluderat i lönespec' WHERE id = $1
      `;
      await client.query(updateUtläggQuery, [utlägg.id]);
    }

    client.release();

    return { success: true, count: utläggResult.rows.length };
  } catch (error) {
    console.error("❌ läggTillUtläggILönespec error:", error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function taBortExtrarad(extraradId: number) {
  const userId = await getUserId();
  if (!userId) {
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
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

  // SÄKERHETSVALIDERING: Rate limiting för känslig lönedata
  if (!validateSessionAttempt(`hr-salary-${userId}`)) {
    logPersonalDataEvent(
      "violation",
      userId,
      "Rate limit exceeded for salary specification creation"
    );
    return {
      success: false,
      error: "För många förfrågningar. Försök igen om 15 minuter.",
    };
  }

  logPersonalDataEvent(
    "modify",
    userId,
    `Creating salary specification for employee ${data.anställd_id}`
  );

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
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

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
  const loggedInUserId = await getUserId();
  if (!loggedInUserId) throw new Error("Ingen inloggad användare");
  const realUserId = loggedInUserId; // Alltid inloggad användare

  try {
    const client = await pool.connect();
    const transaktionsdatum = datum || new Date().toISOString();

    // Skapa huvudtransaktion
    const huvudBeskrivning = "Semestertransaktion";
    const insertTransaktion = await client.query(
      `INSERT INTO transaktioner ("transaktionsdatum", "kontobeskrivning", "kommentar", "user_id")
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

// Hämta transaktionsposter för en transaktion (utlägg)
export async function hamtaTransaktionsposter(transaktionsId: number) {
  const userId = await getUserId();
  if (!userId) throw new Error("Ingen användare inloggad");

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT tp.*, k.kontonummer, k.beskrivning
       FROM transaktionsposter tp
       JOIN konton k ON tp.konto_id = k.id
       WHERE tp.transaktions_id = $1
       ORDER BY tp.id`,
      [transaktionsId]
    );
    return result.rows;
  } finally {
    client.release();
  }
}

export async function hämtaAllaLönespecarFörUser() {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }
  // userId already a number from getUserId()
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
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }
  // userId already a number from getUserId()
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

export async function sparaUtlägg({
  belopp,
  datum,
  beskrivning,
  kategori,
  anställd_id,
  kvitto_fil,
  kvitto_filtyp,
}: {
  belopp: number;
  datum: string;
  beskrivning: string;
  kategori?: string;
  anställd_id: number;
  kvitto_fil?: string;
  kvitto_filtyp?: string;
}) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }
  // userId already a number from getUserId()
  try {
    const client = await pool.connect();
    const query = `
      INSERT INTO utlägg (
        belopp, datum, beskrivning, kategori, anställd_id, user_id, kvitto_fil, kvitto_filtyp, skapad, uppdaterad
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      ) RETURNING id
    `;
    const values = [
      belopp,
      datum,
      beskrivning,
      kategori || null,
      anställd_id,
      userId,
      kvitto_fil || null,
      kvitto_filtyp || null,
    ];
    const result = await client.query(query, values);
    client.release();
    revalidatePath("/personal/utlagg");
    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error("❌ sparaUtlägg error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Ett fel uppstod" };
  }
}

export async function taBortUtlägg(utläggId: number) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }
  // userId already a number from getUserId()

  try {
    const client = await pool.connect();

    // Kontrollera att utlägget tillhör användaren
    const checkQuery = `
      SELECT u.id, u.transaktion_id, a.user_id 
      FROM utlägg u 
      JOIN anställda a ON u.anställd_id = a.id 
      WHERE u.id = $1 AND a.user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [utläggId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      throw new Error("Utlägg hittades inte eller tillhör inte dig");
    }

    const utlägg = checkResult.rows[0];

    // Ta bort utlägg-posten
    await client.query("DELETE FROM utlägg WHERE id = $1", [utläggId]);

    // Om det finns en kopplad transaktion, ta bort den också
    if (utlägg.transaktion_id) {
      // Ta bort transaktionsposter först (foreign key constraint)
      await client.query("DELETE FROM transaktionsposter WHERE transaktions_id = $1", [
        utlägg.transaktion_id,
      ]);
      // Ta bort transaktionen
      await client.query("DELETE FROM transaktioner WHERE id = $1", [utlägg.transaktion_id]);
    }

    client.release();
    return { success: true };
  } catch (error) {
    console.error("❌ taBortUtlägg error:", error);
    throw error;
  }
}

export async function hämtaBetaldaSemesterdagar(anställdId: number) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // userId already a number from getUserId()

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
      return 0;
    }

    // Hämta betalda semesterdagar från semester-tabellen
    const query = `
      SELECT betalda_dagar FROM semester 
      WHERE anställd_id = $1 
      ORDER BY skapad DESC 
      LIMIT 1
    `;

    const result = await client.query(query, [anställdId]);
    client.release();

    if (result.rows.length > 0) {
      return parseInt(result.rows[0].betalda_dagar) || 0;
    }

    return 0;
  } catch (error) {
    console.error("❌ hämtaBetaldaSemesterdagar error:", error);
    return 0;
  }
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

// Löneutbetalning bokföring
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
 */
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

    // Markera lönespecifikation som utbetald
    const updateLönespecQuery = `
      UPDATE lönespecifikationer 
      SET status = 'Utbetald', uppdaterad = CURRENT_TIMESTAMP
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
