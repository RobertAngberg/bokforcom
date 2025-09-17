"use server";

import { pool } from "../../_lib/db";
import { getUserId } from "../../_utils/authUtils";
import { revalidatePath } from "next/cache";
import { validateSessionAttempt } from "../../_utils/rateLimit";

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
    revalidatePath("/personal/Utlagg");
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
