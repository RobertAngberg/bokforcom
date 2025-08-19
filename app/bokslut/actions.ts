"use server";

import { Pool } from "pg";
import { getUserId } from "../_utils/authUtils";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Hämta användarens session - nu via authUtils
async function requireAuth() {
  return await getUserId();
}

// Test-funktion för att kolla databas-anslutning
export async function testDatabaseConnection() {
  console.log("[DEBUG] Testing database connection...");
  const client = await pool.connect();

  try {
    // Först: testa grundläggande anslutning
    const timeResult = await client.query("SELECT NOW() as current_time");
    console.log("[DEBUG] Database time:", timeResult.rows[0]);

    // Hämta riktiga userId från session
    const userId = await requireAuth();
    console.log("[DEBUG] Authenticated userId:", userId);

    // Andra: kolla hur många transaktioner som finns för den inloggade användaren
    const userCount = await client.query('SELECT COUNT(*) FROM transaktioner WHERE "userId" = $1', [
      userId,
    ]);
    console.log(`[DEBUG] Transactions for userId ${userId}:`, userCount.rows[0]);

    // Kolla vilka userId som faktiskt finns
    const allUsers = await client.query(`
      SELECT DISTINCT "userId", COUNT(*) as transaction_count 
      FROM transaktioner 
      GROUP BY "userId" 
      ORDER BY "userId"
    `);
    console.log("[DEBUG] All userIds in database:", allUsers.rows);

    // Tredje: kolla alla år som finns för den inloggade användaren
    const years = await client.query(
      `
      SELECT DISTINCT EXTRACT(YEAR FROM transaktionsdatum) as year, COUNT(*) as count
      FROM transaktioner 
      WHERE "userId" = $1 
      GROUP BY EXTRACT(YEAR FROM transaktionsdatum)
      ORDER BY year DESC
    `,
      [userId]
    );
    console.log(`[DEBUG] Available years for userId ${userId}:`, years.rows);

    return {
      connected: true,
      time: timeResult.rows[0],
      transactionCount: userCount.rows[0],
      availableYears: years.rows,
      allUsers: allUsers.rows,
      authenticatedUserId: userId,
    };
  } catch (error) {
    console.error("[DEBUG] Database test failed:", error);
    return { connected: false, error: (error as Error).message };
  } finally {
    client.release();
  }
}

// Hämta kontosaldo för viktiga bokslutskonton
export async function hamtaKontosaldo(ar: number = 2025) {
  console.log(`[DEBUG] hamtaKontosaldo called for year: ${ar}`);
  const userId = await requireAuth();
  console.log(`[DEBUG] userId: ${userId}`);
  const client = await pool.connect();

  try {
    console.log(`[DEBUG] Executing query for kontosaldo...`);
    const result = await client.query(
      `
      SELECT 
        k.kontonummer,
        k.beskrivning,
        k.kontoklass,
        COALESCE(SUM(tp.debet - tp.kredit), 0) as saldo,
        COUNT(tp.id) as antal_transaktioner
      FROM konton k
      LEFT JOIN transaktionsposter tp ON k.id = tp.konto_id
      LEFT JOIN transaktioner t ON tp.transaktions_id = t.id
      WHERE t."userId" = $1 
        AND EXTRACT(YEAR FROM t.transaktionsdatum) = $2
        AND k.kontonummer IN (
          '1100', '1200', '1220', '1300', '1380', '1930',
          '2078', '2390', '2440', '2610', '2710', '2920',
          '3000', '7210', '7220', '7533', '8300', '8400'
        )
      GROUP BY k.id, k.kontonummer, k.beskrivning, k.kontoklass
      ORDER BY k.kontonummer
    `,
      [userId, ar]
    );

    console.log(`[DEBUG] Query result rows: ${result.rows.length}`);
    console.log(`[DEBUG] Sample data:`, result.rows.slice(0, 2));

    return result.rows.map((row) => ({
      kontonummer: row.kontonummer,
      beskrivning: row.beskrivning,
      kontoklass: row.kontoklass,
      saldo: parseFloat(row.saldo),
      antalTransaktioner: parseInt(row.antal_transaktioner),
    }));
  } catch (error) {
    console.error("Fel vid hämtning av kontosaldo:", error);
    return [];
  } finally {
    client.release();
  }
}

// Hämta senaste transaktioner för granskning
export async function hamtaSenasteTransaktioner(ar: number = 2025, limit: number = 50) {
  const userId = await requireAuth();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `
      SELECT 
        t.id,
        t.transaktionsdatum,
        t.kontobeskrivning,
        t.belopp,
        t.kommentar,
        t.fil,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'kontonummer', k.kontonummer,
            'beskrivning', k.beskrivning,
            'debet', tp.debet,
            'kredit', tp.kredit
          )
        ) as transaktionsposter
      FROM transaktioner t
      LEFT JOIN transaktionsposter tp ON t.id = tp.transaktions_id
      LEFT JOIN konton k ON tp.konto_id = k.id
      WHERE t."userId" = $1 
        AND EXTRACT(YEAR FROM t.transaktionsdatum) = $2
      GROUP BY t.id, t.transaktionsdatum, t.kontobeskrivning, t.belopp, t.kommentar, t.fil
      ORDER BY t.transaktionsdatum DESC, t.id DESC
      LIMIT $3
    `,
      [userId, ar, limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      datum: row.transaktionsdatum,
      beskrivning: row.kontobeskrivning,
      belopp: parseFloat(row.belopp || 0),
      kommentar: row.kommentar,
      fil: row.fil,
      transaktionsposter: row.transaktionsposter || [],
    }));
  } catch (error) {
    console.error("Fel vid hämtning av senaste transaktioner:", error);
    return [];
  } finally {
    client.release();
  }
}

// Skapa bokslutsjustering som vanlig transaktion
export async function skapaBokslutsjustering(data: {
  beskrivning: string;
  datum: string;
  poster: Array<{
    kontonummer: string;
    debet: number;
    kredit: number;
  }>;
  kommentar?: string;
}) {
  const userId = await requireAuth();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Skapa huvudtransaktion med speciell markering för bokslut
    const transaktionResult = await client.query(
      `
      INSERT INTO transaktioner (
        transaktionsdatum, 
        kontobeskrivning, 
        belopp, 
        kommentar, 
        "userId"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
      [
        data.datum,
        `BOKSLUT: ${data.beskrivning}`,
        data.poster.reduce((sum, post) => sum + post.debet, 0),
        data.kommentar || "",
        userId,
      ]
    );

    const transaktionsId = transaktionResult.rows[0].id;

    // Skapa transaktionsposter
    for (const post of data.poster) {
      // Hämta konto_id
      const kontoResult = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
        post.kontonummer,
      ]);

      if (kontoResult.rows.length === 0) {
        throw new Error(`Konto ${post.kontonummer} finns inte`);
      }

      const kontoId = kontoResult.rows[0].id;

      await client.query(
        `
        INSERT INTO transaktionsposter (
          transaktions_id, 
          konto_id, 
          debet, 
          kredit
        ) VALUES ($1, $2, $3, $4)
      `,
        [transaktionsId, kontoId, post.debet, post.kredit]
      );
    }

    await client.query("COMMIT");
    return { success: true, transaktionsId };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fel vid skapande av bokslutsjustering:", error);
    return { success: false, error: (error as Error).message };
  } finally {
    client.release();
  }
}

// Validera period för säkerhet
function validatePeriod(period: string): boolean {
  // Endast år-format accepteras (YYYY)
  const yearPattern = /^\d{4}$/;
  if (!yearPattern.test(period)) return false;

  const year = parseInt(period);
  const currentYear = new Date().getFullYear();

  return year >= 2020 && year <= currentYear + 1;
}
