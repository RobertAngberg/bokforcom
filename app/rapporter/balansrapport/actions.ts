// balansrapport/actions.ts
"use server";
import { Pool } from "pg";
import { getUserId, requireOwnership } from "../../_utils/authUtils";
import { validateSessionAttempt } from "../../_utils/rateLimit";
import { validatePeriod } from "../../_utils/validationUtils";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// SÄKERHETSVALIDERING: Logga finansiell dataåtkomst
function logFinancialDataEvent(
  eventType: "access" | "violation" | "error",
  userId?: number,
  details?: string
) {
  const timestamp = new Date().toISOString();
  console.log(`💰 FINANCIAL DATA EVENT [${timestamp}]: ${eventType.toUpperCase()} {`);
  if (userId) console.log(`  userId: ${userId},`);
  if (details) console.log(`  details: '${details}',`);
  console.log(`  timestamp: '${timestamp}'`);
  console.log(`}`);
}

export async function fetchBalansData(year: string) {
  // SÄKERHETSVALIDERING: Kontrollera autentisering
  const userId = await getUserId();

  // SÄKERHETSVALIDERING: Rate limiting för finansiella rapporter
  if (!validateSessionAttempt(`finance-balance-${userId}`)) {
    logFinancialDataEvent("violation", userId, "Rate limit exceeded for balance report access");
    throw new Error("För många förfrågningar. Försök igen om 15 minuter.");
  }

  // SÄKERHETSVALIDERING: Validera år-parameter
  if (!validatePeriod(year)) {
    logFinancialDataEvent("violation", userId, `Invalid year parameter: ${year}`);
    throw new Error("Ogiltigt år-format");
  }

  logFinancialDataEvent("access", userId, `Accessing balance report for year ${year}`);

  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const previousYearEnd = `${parseInt(year) - 1}-12-31`;

  try {
    // Ingående balans - tillgångar (1xxx) från öppningsbalans-transaktioner
    const ingaendeTillgangarRes = await pool.query(
      `
    SELECT
      k.kontonummer,
      k.beskrivning,
      SUM(COALESCE(tp.debet, 0) - COALESCE(tp.kredit, 0)) AS saldo
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE k.kontonummer LIKE '1%'
      AND t.kontobeskrivning = 'Ingående balanser'
      AND t."userId" = $1
    GROUP BY k.kontonummer, k.beskrivning
    ORDER BY k.kontonummer
    `,
      [userId]
    );

    // Årets förändring - tillgångar (1xxx) under året (EXKLUSIVE öppningsbalans)
    const aretsTillgangarRes = await pool.query(
      `
    SELECT
      k.kontonummer,
      k.beskrivning,
      SUM(COALESCE(tp.debet, 0) - COALESCE(tp.kredit, 0)) AS saldo,
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
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE t.transaktionsdatum BETWEEN $1 AND $2
      AND k.kontonummer LIKE '1%'
      AND t.kontobeskrivning != 'Ingående balanser'
      AND t."userId" = $3
    GROUP BY k.kontonummer, k.beskrivning
    ORDER BY k.kontonummer
    `,
      [start, end, userId]
    );

    // Utgående balans - tillgångar (1xxx) fram till och med året
    const utgaendeTillgangarRes = await pool.query(
      `
    SELECT
      k.kontonummer,
      k.beskrivning,
      SUM(COALESCE(tp.debet, 0) - COALESCE(tp.kredit, 0)) AS saldo
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE t.transaktionsdatum <= $1
      AND k.kontonummer LIKE '1%'
      AND t."userId" = $2
    GROUP BY k.kontonummer, k.beskrivning
    ORDER BY k.kontonummer
    `,
      [end, userId]
    );

    // Ingående balans - skulder och eget kapital (2xxx) från öppningsbalans-transaktioner
    const ingaendeSkulderRes = await pool.query(
      `
    SELECT
      k.kontonummer,
      k.beskrivning,
      SUM(COALESCE(tp.kredit, 0) - COALESCE(tp.debet, 0)) AS saldo
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE k.kontonummer LIKE '2%'
      AND t.kontobeskrivning = 'Ingående balanser'
      AND t."userId" = $1
    GROUP BY k.kontonummer, k.beskrivning
    ORDER BY k.kontonummer
    `,
      [userId]
    );

    // Årets förändring - skulder och eget kapital (2xxx) (EXKLUSIVE öppningsbalans)
    const aretsSkulderRes = await pool.query(
      `
    SELECT
      k.kontonummer,
      k.beskrivning,
      SUM(COALESCE(tp.kredit, 0) - COALESCE(tp.debet, 0)) AS saldo,
      json_agg(
        json_build_object(
          'id', CONCAT('ID', t.id),
          'datum', t.transaktionsdatum,
          'belopp', COALESCE(tp.kredit, 0) - COALESCE(tp.debet, 0),
          'beskrivning', t.kontobeskrivning,
          'transaktion_id', t.id,
          'verifikatNummer', CONCAT('V', t.id)
        ) ORDER BY t.transaktionsdatum
      ) AS transaktioner
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE t.transaktionsdatum BETWEEN $1 AND $2
      AND k.kontonummer LIKE '2%'
      AND t.kontobeskrivning != 'Ingående balanser'
      AND t."userId" = $3
    GROUP BY k.kontonummer, k.beskrivning
    ORDER BY k.kontonummer
    `,
      [start, end, userId]
    );

    // Utgående balans - skulder och eget kapital (2xxx)
    const utgaendeSkulderRes = await pool.query(
      `
    SELECT
      k.kontonummer,
      k.beskrivning,
      SUM(COALESCE(tp.kredit, 0) - COALESCE(tp.debet, 0)) AS saldo
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE t.transaktionsdatum <= $1
      AND k.kontonummer LIKE '2%'
      AND t."userId" = $2
    GROUP BY k.kontonummer, k.beskrivning
    ORDER BY k.kontonummer
    `,
      [end, userId]
    );

    // Beräknat resultat - ingående balans (fram till föregående år)
    const ingaendeResultatRes = await pool.query(
      `
    SELECT SUM(COALESCE(tp.kredit, 0) - COALESCE(tp.debet, 0)) AS saldo
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE t.transaktionsdatum <= $1
      AND k.kontonummer ~ '^[3-8]'
      AND t."userId" = $2
    `,
      [previousYearEnd, userId]
    );

    // Årets resultat (bara detta år)
    const aretsResultatRes = await pool.query(
      `
    SELECT SUM(COALESCE(tp.kredit, 0) - COALESCE(tp.debet, 0)) AS saldo
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE t.transaktionsdatum BETWEEN $1 AND $2
      AND k.kontonummer ~ '^[3-8]'
      AND t."userId" = $3
    `,
      [start, end, userId]
    );

    // Beräknat resultat - utgående balans (totalt ackumulerat)
    const utgaendeResultatRes = await pool.query(
      `
    SELECT SUM(COALESCE(tp.kredit, 0) - COALESCE(tp.debet, 0)) AS saldo
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE t.transaktionsdatum <= $1
      AND k.kontonummer ~ '^[3-8]'
      AND t."userId" = $2
    `,
      [end, userId]
    );

    // Skapa datastrukturer för alla konton
    const createKontoMap = (rows: any[]) => {
      const map = new Map();
      rows.forEach((row: any) => {
        map.set(row.kontonummer, {
          kontonummer: row.kontonummer,
          beskrivning: row.beskrivning,
          saldo: parseFloat(row.saldo || 0),
          transaktioner: row.transaktioner || [],
        });
      });
      return map;
    };

    const ingaendeTillgangarMap = createKontoMap(ingaendeTillgangarRes.rows);
    const aretsTillgangarMap = createKontoMap(aretsTillgangarRes.rows);
    const utgaendeTillgangarMap = createKontoMap(utgaendeTillgangarRes.rows);

    const ingaendeSkulderMap = createKontoMap(ingaendeSkulderRes.rows);
    const aretsSkulderMap = createKontoMap(aretsSkulderRes.rows);
    const utgaendeSkulderMap = createKontoMap(utgaendeSkulderRes.rows);

    // Resultatdata
    const ingaendeResultat = parseFloat(ingaendeResultatRes.rows[0]?.saldo ?? 0);
    const aretsResultat = parseFloat(aretsResultatRes.rows[0]?.saldo ?? 0);
    const utgaendeResultat = parseFloat(utgaendeResultatRes.rows[0]?.saldo ?? 0);

    // Samla alla unika kontonummer
    const allaTillgangarKonton = new Set([
      ...ingaendeTillgangarMap.keys(),
      ...aretsTillgangarMap.keys(),
      ...utgaendeTillgangarMap.keys(),
    ]);

    const allaSkulderKonton = new Set([
      ...ingaendeSkulderMap.keys(),
      ...aretsSkulderMap.keys(),
      ...utgaendeSkulderMap.keys(),
    ]);

    // Returnera rå data utan business logic
    const tillgangar = Array.from(allaTillgangarKonton)
      .map((kontonummer) => {
        const ing = ingaendeTillgangarMap.get(kontonummer);
        const aret = aretsTillgangarMap.get(kontonummer);
        const utg = utgaendeTillgangarMap.get(kontonummer);

        return {
          kontonummer,
          beskrivning: utg?.beskrivning || aret?.beskrivning || ing?.beskrivning || "",
          ingaendeSaldo: ing?.saldo || 0,
          aretsResultat: aret?.saldo || 0,
          utgaendeSaldo: utg?.saldo || 0,
          transaktioner: aret?.transaktioner || [],
        };
      })
      .sort((a, b) => a.kontonummer.localeCompare(b.kontonummer));

    // Returnera rå data utan business logic
    const skulderOchEgetKapital = Array.from(allaSkulderKonton)
      .map((kontonummer) => {
        const ing = ingaendeSkulderMap.get(kontonummer);
        const aret = aretsSkulderMap.get(kontonummer);
        const utg = utgaendeSkulderMap.get(kontonummer);

        return {
          kontonummer,
          beskrivning: utg?.beskrivning || aret?.beskrivning || ing?.beskrivning || "",
          ingaendeSaldo: ing?.saldo || 0,
          aretsResultat: aret?.saldo || 0,
          utgaendeSaldo: utg?.saldo || 0,
          transaktioner: aret?.transaktioner || [],
        };
      })
      .sort((a, b) => a.kontonummer.localeCompare(b.kontonummer));

    // Beräkna obalans istället för komplicerad resultat-logik
    const sumTillgangar = tillgangar.reduce((sum, k) => sum + k.utgaendeSaldo, 0);
    const sumSkulderEK = skulderOchEgetKapital.reduce((sum, k) => sum + k.utgaendeSaldo, 0);
    const obalans = sumTillgangar - sumSkulderEK;

    // Lägg till beräknat resultat baserat på obalans (Bokio-stil)
    if (obalans !== 0) {
      // Beräknat resultat i Bokio = tidigare års resultat + årets förändring
      // Hitta årets resultat från konto 2099 för att få rätt fördelning
      const aretsResultatKonto = skulderOchEgetKapital.find((k) => k.kontonummer === "2099");
      const aretsResultatVarde = aretsResultat; // Från query

      skulderOchEgetKapital.push({
        kontonummer: "9999",
        beskrivning: "Beräknat resultat",
        ingaendeSaldo: obalans - aretsResultatVarde, // Tidigare års resultat
        aretsResultat: aretsResultatVarde, // Årets förändring
        utgaendeSaldo: obalans, // Total balansering
        transaktioner: [],
      });
    }

    // Returnera rå data utan beräkningar
    return {
      year,
      tillgangar,
      skulderOchEgetKapital,
      // Ta bort differens-beräkning, det ska göras i frontend
    };
  } catch (error) {
    console.error("❌ fetchBalansData error:", error);
    logFinancialDataEvent(
      "error",
      userId,
      `Error fetching balance data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    throw new Error("Ett fel uppstod vid hämtning av balansdata");
  }
}

export async function fetchFöretagsprofil(userId: number) {
  // SÄKERHETSVALIDERING: Kontrollera autentisering
  // SÄKERHETSVALIDERING: Kontrollera autentisering och ägarskap
  const sessionUserId = await getUserId();
  await requireOwnership(userId);

  logFinancialDataEvent("access", sessionUserId, "Accessing company profile data");

  try {
    const client = await pool.connect();
    const query = `
      SELECT företagsnamn, organisationsnummer
      FROM företagsprofil
      WHERE id = $1
      LIMIT 1
    `;
    const res = await client.query(query, [userId]);
    client.release();
    return res.rows[0] || null;
  } catch (error) {
    console.error("❌ fetchFöretagsprofil error:", error);
    return null;
  }
}
