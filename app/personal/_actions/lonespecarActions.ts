"use server";

import { pool } from "../../_lib/db";
import { getUserId } from "../../_utils/authUtils";
import { revalidatePath } from "next/cache";
import type { ExtraradData, ExtraradResult, UtläggData } from "../_types/types";

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
