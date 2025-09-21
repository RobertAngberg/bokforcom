// balansrapport/actions.ts
"use server";
import { pool } from "../../_lib/db";
import { getUserId, requireOwnership } from "../../_utils/authUtils";
import { validateSessionAttempt } from "../../_utils/rateLimit";
import { validatePeriod } from "../../_utils/validationUtils";

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

export async function fetchBalansData(year: string, month?: string) {
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

  logFinancialDataEvent(
    "access",
    userId,
    `Accessing balance report for year ${year}${month && month !== "all" ? `, month ${month}` : ""}`
  );

  const start = `${year}-01-01`;
  // Om månad är specificerad och inte "all", använd den månaden, annars hela året
  const end =
    month && month !== "all"
      ? `${year}-${month.padStart(2, "0")}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`
      : `${year}-12-31`;
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
      AND t."user_id" = $1
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
      AND t."user_id" = $3
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
      AND t."user_id" = $2
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
      AND t."user_id" = $1
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
      AND t."user_id" = $3
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
      AND t."user_id" = $2
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
      AND t."user_id" = $2
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
      AND t."user_id" = $3
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
      AND t."user_id" = $2
    `,
      [end, userId]
    );

    // Returnera rå databasresultat utan business logic
    return {
      year,
      ingaendeTillgangar: ingaendeTillgangarRes.rows,
      aretsTillgangar: aretsTillgangarRes.rows,
      utgaendeTillgangar: utgaendeTillgangarRes.rows,
      ingaendeSkulder: ingaendeSkulderRes.rows,
      aretsSkulder: aretsSkulderRes.rows,
      utgaendeSkulder: utgaendeSkulderRes.rows,
      ingaendeResultat: parseFloat(ingaendeResultatRes.rows[0]?.saldo ?? 0),
      aretsResultat: parseFloat(aretsResultatRes.rows[0]?.saldo ?? 0),
      utgaendeResultat: parseFloat(utgaendeResultatRes.rows[0]?.saldo ?? 0),
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

export async function fetchFöretagsprofil(userId?: number) {
  // SÄKERHETSVALIDERING: Kontrollera autentisering
  const sessionUserId = await getUserId();

  // Använd sessionUserId om inget userId skickades
  const targetUserId = userId || sessionUserId;

  await requireOwnership(targetUserId);

  logFinancialDataEvent("access", sessionUserId, "Accessing company profile data");

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

  logFinancialDataEvent("access", userId, `Fetching transaction details for ID: ${transaktionsId}`);

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
    logFinancialDataEvent(
      "error",
      userId,
      `Error fetching transaction details: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return null;
  }
}
