// balansrapport/actions.ts
"use server";
import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { validatePeriod } from "../../_utils/validationUtils";
export {
  fetchForetagsprofil,
  fetchTransactionDetails,
} from "./sharedActions";

export async function fetchBalansData(year: string, month?: string) {
  const { userId } = await ensureSession();

  if (!validatePeriod(year)) {
    throw new Error("Ogiltigt år-format");
  }

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
    throw new Error("Ett fel uppstod vid hämtning av balansdata");
  }
}
