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

// Nya typer för lönekörningar
export interface Lönekörning {
  id: number;
  period: string; // "2024-08"
  status: "pågående" | "avslutad" | "pausad" | "avbruten";
  startad_av: number;
  startad_datum: Date;
  avslutad_datum?: Date;
  bankgiro_exporterad_datum?: Date;
  mailade_datum?: Date;
  bokford_datum?: Date;
  agi_genererad_datum?: Date;
  skatter_bokforda_datum?: Date;
  antal_anstallda?: number;
  total_bruttolön?: number;
  total_skatt?: number;
  total_sociala_avgifter?: number;
  total_nettolön?: number;
  kommentar?: string;
  skapad: Date;
  uppdaterad: Date;
  aktuellt_steg: number; // 1=maila, 2=bokför, 3=agi, 4=skatter, 5=komplett
}

// Uppdaterad lönespec-typ med lönekörning
export interface LönespecifikationMedLönekörning {
  id: number;
  anställd_id: number;
  grundlön: number;
  bruttolön: number;
  skatt: number;
  sociala_avgifter: number;
  nettolön: number;
  skapad: Date;
  uppdaterad: Date;
  skapad_av: number;
  utbetalningsdatum: Date;
  status: string;
  bankgiro_exporterad: boolean;
  bankgiro_exporterad_datum?: Date;
  mailad: boolean;
  mailad_datum?: Date;
  bokförd: boolean;
  bokförd_datum?: Date;
  agi_genererad: boolean;
  agi_genererad_datum?: Date;
  skatter_bokförda: boolean;
  skatter_bokförda_datum?: Date;
  lönekorning_id?: number; // Ny koppling till lönekörning
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
        t.fil as kvitto_fil,
        t.blob_url as kvitto_url
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
        t.transaktionsdatum as datum,
        t.fil as kvitto_fil,
        t.blob_url as kvitto_url
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

export async function uppdateraLönespec(data: {
  lönespecId: number;
  bruttolön?: number;
  skatt?: number;
  socialaAvgifter?: number;
  nettolön?: number;
  lönekostnad?: number;
}) {
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Ingen inloggad användare");
  }

  // SÄKERHETSVALIDERING: Rate limiting för känslig lönedata
  if (!validateSessionAttempt(`hr-salary-update-${userId}`)) {
    logPersonalDataEvent(
      "violation",
      userId,
      "Rate limit exceeded for salary specification update"
    );
    return {
      success: false,
      error: "För många förfrågningar. Försök igen om 15 minuter.",
    };
  }

  logPersonalDataEvent("modify", userId, `Updating salary specification ${data.lönespecId}`);

  try {
    const client = await pool.connect();

    // Kontrollera att lönespec tillhör användarens anställd
    const checkQuery = `
      SELECT l.id FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [data.lönespecId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      throw new Error("Lönespec inte hittad eller tillhör inte användaren");
    }

    // Bygg update query dynamiskt baserat på vilka fält som skickats
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.bruttolön !== undefined) {
      updateFields.push(`bruttolön = $${paramIndex++}`);
      values.push(data.bruttolön);
    }
    if (data.skatt !== undefined) {
      updateFields.push(`skatt = $${paramIndex++}`);
      values.push(data.skatt);
    }
    if (data.socialaAvgifter !== undefined) {
      updateFields.push(`sociala_avgifter = $${paramIndex++}`);
      values.push(data.socialaAvgifter);
    }
    if (data.nettolön !== undefined) {
      updateFields.push(`nettolön = $${paramIndex++}`);
      values.push(data.nettolön);
    }

    if (updateFields.length === 0) {
      client.release();
      return { success: false, error: "Inga fält att uppdatera" };
    }

    // Lägg till lönespec ID som sista parameter
    values.push(data.lönespecId);

    const updateQuery = `
      UPDATE lönespecifikationer 
      SET ${updateFields.join(", ")}, uppdaterad = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await client.query(updateQuery, values);

    client.release();
    revalidatePath("/personal");

    return {
      success: true,
      message: "Lönespec uppdaterad!",
      lönespec: result.rows[0],
    };
  } catch (error) {
    console.error("❌ uppdateraLönespec error:", error);
    throw error;
  }
}

// Markera åtgärder som genomförda för lönespec
export async function markeraBankgiroExporterad(lönespecId: number) {
  const userId = await getUserId();
  if (!userId) throw new Error("Ingen inloggad användare");

  try {
    const client = await pool.connect();

    // Kontrollera att lönespec tillhör användaren och hämta lönekörning
    const checkQuery = `
      SELECT l.id, l.lönekorning_id FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [lönespecId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      throw new Error("Lönespec inte hittad");
    }

    const { lönekorning_id } = checkResult.rows[0];

    const updateQuery = `
      UPDATE lönespecifikationer 
      SET bankgiro_exporterad = true, bankgiro_exporterad_datum = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await client.query(updateQuery, [lönespecId]);
    client.release();

    // Uppdatera lönekörning om den finns
    if (lönekorning_id) {
      // Kolla om alla lönespecar i lönekörningen är exporterade
      const allaBankgiroQuery = `
        SELECT COUNT(*) as total, 
               COUNT(*) FILTER (WHERE bankgiro_exporterad = true) as exporterade
        FROM lönespecifikationer 
        WHERE lönekorning_id = $1
      `;
      const allaResult = await pool.query(allaBankgiroQuery, [lönekorning_id]);
      const { total, exporterade } = allaResult.rows[0];

      if (parseInt(total) === parseInt(exporterade)) {
        await uppdateraLönekörningStatus(lönekorning_id, "bankgiro_exporterad");
      }
    }

    revalidatePath("/personal");
    return { success: true, lönespec: result.rows[0] };
  } catch (error) {
    console.error("❌ markeraBankgiroExporterad error:", error);
    throw error;
  }
}

export async function markeraMailad(lönespecId: number) {
  const userId = await getUserId();
  if (!userId) throw new Error("Ingen inloggad användare");

  try {
    const client = await pool.connect();

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

    const updateQuery = `
      UPDATE lönespecifikationer 
      SET mailad = true, mailad_datum = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await client.query(updateQuery, [lönespecId]);
    client.release();
    revalidatePath("/personal");

    return { success: true, lönespec: result.rows[0] };
  } catch (error) {
    console.error("❌ markeraMailad error:", error);
    throw error;
  }
}

export async function markeraBokförd(lönespecId: number) {
  const userId = await getUserId();
  if (!userId) throw new Error("Ingen inloggad användare");

  try {
    const client = await pool.connect();

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

    const updateQuery = `
      UPDATE lönespecifikationer 
      SET bokförd = true, bokförd_datum = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await client.query(updateQuery, [lönespecId]);
    client.release();
    revalidatePath("/personal");

    return { success: true, lönespec: result.rows[0] };
  } catch (error) {
    console.error("❌ markeraBokförd error:", error);
    throw error;
  }
}

export async function markeraAGIGenererad(lönespecId: number) {
  const userId = await getUserId();
  if (!userId) throw new Error("Ingen inloggad användare");

  try {
    const client = await pool.connect();

    // Hämta lönekörning_id från lönespecifikationen
    const checkQuery = `
      SELECT l.lonekorning_id FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [lönespecId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      throw new Error("Lönespec inte hittad");
    }

    const lönekörningId = checkResult.rows[0].lonekorning_id;

    // Uppdatera lönekörning istället för lönespec
    const updateQuery = `
      UPDATE lönekörningar 
      SET agi_genererad = true, agi_genererad_datum = NOW()
      WHERE id = $1 AND startad_av = $2
      RETURNING *
    `;

    const result = await client.query(updateQuery, [lönekörningId, userId]);
    client.release();
    revalidatePath("/personal");

    return { success: true, lönespec: result.rows[0] };
  } catch (error) {
    console.error("❌ markeraAGIGenererad error:", error);
    throw error;
  }
}

export async function markeraSkatternaBokförda(lönespecId: number) {
  const userId = await getUserId();
  if (!userId) throw new Error("Ingen inloggad användare");

  try {
    const client = await pool.connect();

    // Hämta lönekörning_id från lönespecifikationen
    const checkQuery = `
      SELECT l.lonekorning_id FROM lönespecifikationer l
      JOIN anställda a ON l.anställd_id = a.id
      WHERE l.id = $1 AND a.user_id = $2
    `;
    const checkResult = await client.query(checkQuery, [lönespecId, userId]);

    if (checkResult.rows.length === 0) {
      client.release();
      throw new Error("Lönespec inte hittad");
    }

    const lönekörningId = checkResult.rows[0].lonekorning_id;

    // Uppdatera lönekörning istället för lönespec
    const updateQuery = `
      UPDATE lönekörningar 
      SET skatter_bokförda = true, skatter_bokförda_datum = NOW()
      WHERE id = $1 AND startad_av = $2
      RETURNING *
    `;

    const result = await client.query(updateQuery, [lönekörningId, userId]);
    client.release();
    revalidatePath("/personal");

    return { success: true, lönespec: result.rows[0] };
  } catch (error) {
    console.error("❌ markeraSkatternaBokförda error:", error);
    throw error;
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

// =============================================================================
// LÖNEKÖRNINGAR - Databas-funktioner
// =============================================================================

/**
 * Skapar en ny lönekörning för en period
 */
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

    logPersonalDataEvent("modify", userId, `Skapade lönekörning för period ${period}`);

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

/**
 * Hämtar aktiv lönekörning för en period
 */
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

/**
 * Uppdaterar lönekörnings-status och datum
 */
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

    logPersonalDataEvent(
      "modify",
      userId,
      `Uppdaterade lönekörning ${lönekörningId} - ${statusTyp}`
    );

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

/**
 * Uppdaterar aktuellt steg i lönekörning och sätter rätt datum
 */
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

    logPersonalDataEvent(
      "modify",
      userId,
      `Uppdaterade lönekörning ${lönekörningId} till steg ${nyttSteg}`
    );

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

/**
 * Beräknar och uppdaterar totaler för en lönekörning
 */
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

    logPersonalDataEvent("modify", userId, `Uppdaterade totaler för lönekörning ${lönekörningId}`);

    return { success: true };
  } catch (error) {
    console.error("❌ Fel vid uppdatering av lönekörning-totaler:", error);
    return { success: false, error: "Kunde inte uppdatera totaler" };
  }
}

/**
 * Hämtar alla lönekörningar för användaren
 */
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
      WHERE startad_av = $1
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

/**
 * Hämtar lönespecifikationer för en specifik lönekörning
 */
export async function hämtaLönespecifikationerFörLönekörning(lonekorning_id: number): Promise<{
  success: boolean;
  data?: any[];
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
} /**
 * Kopplar en lönespec till en lönekörning
 */
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

    logPersonalDataEvent(
      "modify",
      userId,
      `Kopplade lönespec ${lönespecId} till lönekörning ${lönekörningId}`
    );

    return { success: true };
  } catch (error) {
    console.error("❌ Fel vid koppling av lönespec till lönekörning:", error);
    return { success: false, error: "Kunde inte koppla lönespec till lönekörning" };
  }
}

/**
 * Generisk funktion för att markera ett steg som genomfört för alla lönespecar i en lönekörning
 */
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

    logPersonalDataEvent("modify", userId, `Markerade ${statusTyp} för lönekörning ${period}`);
    revalidatePath("/personal");

    return { success: true };
  } catch (error) {
    console.error(`❌ Fel vid markering av ${statusTyp}:`, error);
    return { success: false, error: `Kunde inte markera ${statusTyp}` };
  }
}

/**
 * Skapar lönespecifikationer för valda anställda i en lönekörning
 */
export async function skapaLönespecifikationerFörLönekörning(
  lönekörningId: number,
  utbetalningsdatum: Date,
  anställdaIds: number[]
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Användare inte inloggad" };
    }

    const skapadeSpecar: any[] = [];

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

    logPersonalDataEvent(
      "modify",
      userId,
      `Skapade ${skapadeSpecar.length} lönespecifikationer för lönekörning ${lönekörningId}`
    );
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

/**
 * Tar bort en lönekörning och alla tillhörande lönespecifikationer
 */
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

    logPersonalDataEvent("delete", userId, `Tog bort lönekörning ${lönekörningId}`);
    revalidatePath("/personal");

    return { success: true };
  } catch (error) {
    console.error("❌ Fel vid borttagning av lönekörning:", error);
    return { success: false, error: "Kunde inte ta bort lönekörning" };
  }
}
