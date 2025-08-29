"use server";
import { Pool } from "pg";
import { getUserId, requireOwnership } from "../../_utils/authUtils";
import { validateSessionAttempt } from "../../_utils/rateLimit";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// SÄKERHETSVALIDERING: Logga resultatrapport-åtkomst
function logResultDataEvent(
  eventType: "access" | "violation" | "error",
  userId?: number,
  details?: string
) {
  const timestamp = new Date().toISOString();
  console.log(`📈 RESULT DATA EVENT [${timestamp}]: ${eventType.toUpperCase()} {`);
  if (userId) console.log(`  userId: ${userId},`);
  if (details) console.log(`  details: '${details}',`);
  console.log(`  timestamp: '${timestamp}'`);
  console.log(`}`);
}

export async function hamtaResultatrapport() {
  const userId = await getUserId();

  // SÄKERHETSVALIDERING: Rate limiting för resultatrapporter
  if (!validateSessionAttempt(`finance-result-${userId}`)) {
    logResultDataEvent("violation", userId, "Rate limit exceeded for result report access");
    throw new Error("För många förfrågningar. Försök igen om 15 minuter.");
  }

  logResultDataEvent("access", userId, "Accessing result report data");

  try {
    const result = await pool.query(
      `
    SELECT
      k.kontonummer,
      k.beskrivning,
      k.kontoklass,
      k.kategori,
      EXTRACT(YEAR FROM t.transaktionsdatum) AS år,
      SUM(COALESCE(tp.debet, 0) - COALESCE(tp.kredit, 0)) AS total_belopp,
      json_agg(
        json_build_object(
          'id', CONCAT('ID', t.id),
          'datum', t.transaktionsdatum,
          'belopp', COALESCE(tp.debet, 0) - COALESCE(tp.kredit, 0),
          'beskrivning', t.kontobeskrivning,
          'transaktion_id', t.id,
          'verifikatNummer', CONCAT('V', t.id)
        ) ORDER BY t.transaktionsdatum
      ) AS transaktioner
    FROM transaktioner t
    JOIN transaktionsposter tp ON tp.transaktions_id = t.id
    JOIN konton k ON k.id = tp.konto_id
    WHERE t."user_id" = $1 
      AND EXTRACT(YEAR FROM t.transaktionsdatum) IN ($2, $3)
    GROUP BY k.kontonummer, k.beskrivning, k.kontoklass, k.kategori, år
    ORDER BY år DESC, k.kontonummer::int
    `,
      [userId, new Date().getFullYear(), new Date().getFullYear() - 1]
    );

    const rows = result.rows;

    const årsSet = new Set<string>();
    const intakterMap = new Map<string, Map<string, any>>();
    const rorelsensMap = new Map<string, Map<string, any>>();
    const finansiellaIntakterMap = new Map<string, Map<string, any>>();
    const finansiellaKostnaderMap = new Map<string, Map<string, any>>();

    for (const row of rows) {
      const år = String(row.år);
      årsSet.add(år);

      const { kontonummer, beskrivning, kontoklass, kategori, total_belopp, transaktioner } = row;

      let målMap: Map<string, Map<string, any>> | null = null;
      let grupp = kategori || "Övrigt"; // Gruppnamn = kategori

      if (/^3/.test(kontonummer)) {
        målMap = intakterMap;
      } else if (/^[4-7]/.test(kontonummer)) {
        målMap = rorelsensMap;
      } else if (/^8[0-3]/.test(kontonummer)) {
        målMap = finansiellaIntakterMap;
      } else if (/^8[4-9]/.test(kontonummer)) {
        målMap = finansiellaKostnaderMap;
      }

      if (!målMap) continue;

      if (!målMap.has(grupp)) målMap.set(grupp, new Map());
      const kontoMap = målMap.get(grupp)!;

      if (!kontoMap.has(kontonummer)) {
        kontoMap.set(kontonummer, {
          kontonummer,
          beskrivning,
          transaktioner, // Lägg till transaktioner array
          [år]: total_belopp,
        });
      } else {
        kontoMap.get(kontonummer)[år] = (kontoMap.get(kontonummer)[år] || 0) + total_belopp;
      }
    }

    const years = Array.from(årsSet)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 2);

    const formatData = (map: Map<string, Map<string, any>>) =>
      Array.from(map.entries()).map(([namn, kontoMap]) => {
        const konton = Array.from(kontoMap.values());
        const summering: { [år: string]: number } = {};
        for (const konto of konton) {
          for (const år of years) {
            summering[år] = (summering[år] || 0) + (konto[år] || 0);
          }
        }
        return { namn, konton, summering };
      });

    return {
      ar: years,
      intakter: formatData(intakterMap),
      rorelsensKostnader: formatData(rorelsensMap),
      finansiellaIntakter: formatData(finansiellaIntakterMap),
      finansiellaKostnader: formatData(finansiellaKostnaderMap),
    };
  } catch (error) {
    console.error("❌ hamtaResultatrapport error:", error);
    logResultDataEvent(
      "error",
      userId,
      `Error fetching result report: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    throw new Error("Ett fel uppstod vid hämtning av resultatrapport");
  }
}

export async function fetchFöretagsprofil(userId?: number) {
  // SÄKERHETSVALIDERING: Kontrollera autentisering
  const sessionUserId = await getUserId();

  // Använd sessionUserId om inget userId skickades
  const targetUserId = userId || sessionUserId;

  await requireOwnership(targetUserId);

  logResultDataEvent("access", sessionUserId, "Accessing company profile data");

  try {
    const client = await pool.connect();
    const query = `
      SELECT företagsnamn, organisationsnummer
      FROM företagsprofil
      WHERE id = $1
      LIMIT 1
    `;
    const res = await client.query(query, [targetUserId]);
    client.release();
    return res.rows[0] || null;
  } catch (error) {
    console.error("❌ fetchFöretagsprofil error:", error);
    return null;
  }
}

export async function fetchTransactionDetails(transaktionsId: number) {
  // SÄKERHETSVALIDERING: Kontrollera autentisering
  const userId = await getUserId();

  logResultDataEvent("access", userId, `Fetching transaction details for ID: ${transaktionsId}`);

  try {
    const client = await pool.connect();
    const query = `
      SELECT 
        t.id,
        t.transaktionsdatum as datum,
        t.kontobeskrivning as beskrivning,
        t.summa_debet,
        t.summa_kredit,
        t.blob_url,
        json_agg(
          json_build_object(
            'konto', k.kontonummer || '',
            'beskrivning', k.beskrivning || '',
            'debet', tp.debet,
            'kredit', tp.kredit
          ) ORDER BY k.kontonummer
        ) as poster
      FROM transaktioner t
      LEFT JOIN transaktionsposter tp ON tp.transaktions_id = t.id
      LEFT JOIN konton k ON k.id = tp.konto_id
      WHERE t.id = $1 AND t.user_id = $2
      GROUP BY t.id, t.transaktionsdatum, t.kontobeskrivning, t.summa_debet, t.summa_kredit, t.blob_url
    `;

    const res = await client.query(query, [transaktionsId, userId]);
    client.release();

    return res.rows[0] || null;
  } catch (error) {
    console.error("❌ fetchTransactionDetails error:", error);
    logResultDataEvent(
      "error",
      userId,
      `Error fetching transaction details: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return null;
  }
}
