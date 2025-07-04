// balansrapport/actions.ts
"use server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function fetchBalansData(year: string) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  console.log("🟡 Hämtar balansdata för:", { start, end });

  // Tillgångar (1xxx)
  const tillgangarRes = await pool.query(
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
    GROUP BY k.kontonummer, k.beskrivning
    ORDER BY k.kontonummer
    `,
    [start, end]
  );

  // Skulder och eget kapital (2xxx)
  const skulderRes = await pool.query(
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
    GROUP BY k.kontonummer, k.beskrivning
    ORDER BY k.kontonummer
    `,
    [start, end]
  );

  // Resultatkonton (3xxx–8xxx)
  const resultatRes = await pool.query(
    `
    SELECT SUM(COALESCE(tp.kredit, 0) - COALESCE(tp.debet, 0)) AS saldo
    FROM transaktionsposter tp
    JOIN konton k ON k.id = tp.konto_id
    JOIN transaktioner t ON t.id = tp.transaktions_id
    WHERE t.transaktionsdatum BETWEEN $1 AND $2
      AND k.kontonummer ~ '^[3-8]'
    `,
    [start, end]
  );

  const tillgangar = tillgangarRes.rows.map((row) => ({
    kontonummer: row.kontonummer,
    beskrivning: row.beskrivning,
    saldo: parseFloat(row.saldo),
    transaktioner: row.transaktioner || [],
  }));

  const skulderOchEgetKapital = skulderRes.rows.map((row) => ({
    kontonummer: row.kontonummer,
    beskrivning: row.beskrivning,
    saldo: parseFloat(row.saldo),
    transaktioner: row.transaktioner || [],
  }));

  const resultatSaldo = parseFloat(resultatRes.rows[0].saldo ?? 0);

  if (resultatSaldo !== 0) {
    skulderOchEgetKapital.push({
      kontonummer: "9999",
      beskrivning: "Beräknat resultat",
      saldo: resultatSaldo,
      transaktioner: [],
    });
  }

  const sumTillgangar = tillgangar.reduce((sum, k) => sum + k.saldo, 0);
  const sumSkulderEK = skulderOchEgetKapital.reduce((sum, k) => sum + k.saldo, 0);
  const differens = sumTillgangar - sumSkulderEK;

  console.log("🟢 Tillgångar:", tillgangar);
  console.log("🟢 Skulder/EK:", skulderOchEgetKapital);
  console.log("📊 Beräknat resultat:", resultatSaldo);
  console.log("⚖️ Differens:", differens);

  return {
    year,
    tillgangar,
    skulderOchEgetKapital,
    differens,
  };
}

export async function fetchFöretagsprofil(userId: number) {
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
