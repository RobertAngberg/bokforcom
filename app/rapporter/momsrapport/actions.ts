"use server";

import { Pool } from "pg";
import { auth } from "../../../auth";
import { getUserId, requireOwnership } from "../../_utils/authUtils";
import { validateSessionAttempt } from "../../_utils/sessionSecurity";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// SÄKERHETSVALIDERING: Logga momsdata-åtkomst
function logVATDataEvent(
  eventType: "access" | "violation" | "error",
  userId?: number,
  details?: string
) {
  const timestamp = new Date().toISOString();
  console.log(`📊 VAT DATA EVENT [${timestamp}]: ${eventType.toUpperCase()} {`);
  if (userId) console.log(`  userId: ${userId},`);
  if (details) console.log(`  details: '${details}',`);
  console.log(`  timestamp: '${timestamp}'`);
  console.log(`}`);
}

export async function getMomsrapport(year: string, kvartal?: string) {
  // SÄKERHETSVALIDERING: Kontrollera autentisering
  const userId = await getUserId();

  // SÄKERHETSVALIDERING: Rate limiting för momsrapporter
  if (!validateSessionAttempt(`finance-vat-${userId}`)) {
    logVATDataEvent("violation", userId, "Rate limit exceeded for VAT report access");
    throw new Error("För många förfrågningar. Försök igen om 15 minuter.");
  }

  // SÄKERHETSVALIDERING: Validera input-parametrar
  if (!year || !/^\d{4}$/.test(year)) {
    logVATDataEvent("violation", userId, `Invalid year parameter: ${year}`);
    throw new Error("Ogiltigt år-format");
  }

  if (kvartal && !["Q1", "Q2", "Q3", "Q4"].includes(kvartal)) {
    logVATDataEvent("violation", userId, `Invalid quarter parameter: ${kvartal}`);
    throw new Error("Ogiltigt kvartal-format");
  }

  logVATDataEvent(
    "access",
    userId,
    `Accessing VAT report for year ${year}${kvartal ? `, quarter ${kvartal}` : ""}`
  );

  try {
    /* ---- datumintervall ---- */
    let from = `${year}-01-01`;
    let to = `${year}-12-31`;

    if (kvartal === "Q1") {
      from = `${year}-01-01`;
      to = `${year}-03-31`;
    } else if (kvartal === "Q2") {
      from = `${year}-04-01`;
      to = `${year}-06-30`;
    } else if (kvartal === "Q3") {
      from = `${year}-07-01`;
      to = `${year}-09-30`;
    } else if (kvartal === "Q4") {
      from = `${year}-10-01`;
      to = `${year}-12-31`;
    }

    /* ---- hämta transaktioner ---- */
    const { rows } = await pool.query(
      `
    SELECT  t.id                   AS transaktions_id,
            t.transaktionsdatum,
            k.kontonummer,
            k.beskrivning,
            tp.debet,
            tp.kredit
    FROM    transaktioner      t
    JOIN    transaktionsposter tp ON tp.transaktions_id = t.id
    JOIN    konton             k  ON k.id = tp.konto_id
    WHERE   t.transaktionsdatum BETWEEN $1 AND $2
      AND   t."userId" = $3;
    `,
      [from, to, userId]
    );

    /* ---- hjälpstrukturer ---- */
    const fältMap: Record<string, { fält: string; beskrivning: string; belopp: number }> = {};
    const add = (fält: string, beskrivning: string, belopp: number) => {
      if (!fältMap[fält]) fältMap[fält] = { fält, beskrivning, belopp: 0 };
      fältMap[fält].belopp += belopp;
      console.log(`✅  +${belopp} kr till fält ${fält} (${beskrivning})`);
    };

    /* ---- loopa rader ---- */
    for (const r of rows) {
      const { kontonummer, debet, kredit } = r;

      // Debugga alla möjliga ingående moms-konton
      if (
        ["2640", "2641", "2645", "2647", "2648", "2650", "210", "248", "250", "251"].includes(
          kontonummer
        )
      ) {
        console.log(`MOMSDEBUG: ${kontonummer} debet=${debet} kredit=${kredit}`);
      }

      const netto = kredit - debet;

      /* A. Försäljning */
      if (/^30\d\d$/.test(kontonummer) || /^31\d\d$/.test(kontonummer))
        add("05", "Momspliktig försäljning", netto);

      /* B. Utgående moms */
      if (["2610", "2611", "2612", "2613"].includes(kontonummer))
        add("10", "Utgående moms 25%", kredit);
      if (["2620", "2621", "2622", "2623"].includes(kontonummer))
        add("11", "Utgående moms 12%", kredit);
      if (["2630", "2631", "2632", "2633"].includes(kontonummer))
        add("12", "Utgående moms 6%", kredit);

      /* C. Inköp med omvänd moms (varor/tjänster) */
      if (["4515", "4516", "4517"].includes(kontonummer)) add("20", "Inköp varor från EU", debet);
      if (["4535", "4536", "4537"].includes(kontonummer))
        add("21", "Inköp tjänster från EU", debet);
      if (["4531", "4532", "4533"].includes(kontonummer))
        add("22", "Inköp tjänster utanför EU", debet);
      if (["4425", "213", "214"].includes(kontonummer))
        add("24", "Inköp tjänster i Sverige (omv. moms)", debet);

      /* D. Utgående moms omvänd */
      if (["2614"].includes(kontonummer)) add("30", "Utgående moms 25% (omv moms)", kredit);
      if (["2624"].includes(kontonummer)) add("31", "Utgående moms 12% (omv moms)", kredit);
      if (["2634"].includes(kontonummer)) add("32", "Utgående moms 6% (omv moms)", kredit);

      /* H + I. Import */
      if (["4545", "4546", "4547"].includes(kontonummer))
        add("50", "Beskattningsunderlag import", debet);
      if (["2615"].includes(kontonummer)) add("60", "Utgående moms 25% (import)", kredit);
      if (["2625"].includes(kontonummer)) add("61", "Utgående moms 12% (import)", kredit);
      if (["2635"].includes(kontonummer)) add("62", "Utgående moms 6% (import)", kredit);

      /* F. Ingående moms */
      if (
        ["2640", "2641", "2645", "2647", "2648", "2650", "210", "248", "250", "251"].includes(
          kontonummer
        )
      ) {
        add("48", "Ingående moms att dra av", debet);
      }

      /* E. Momsfri försäljning */
      if (kontonummer === "3108") add("35", "Varuförsäljning till EU", netto);
      if (kontonummer === "252") add("36", "Export varor utanför EU", netto);
      if (kontonummer === "192") add("39", "Tjänst till EU", netto);
      if (kontonummer === "191") add("40", "Tjänst utanför EU", netto);
      if (["3300", "3305"].includes(kontonummer)) add("41", "Försäljning med omv moms", netto);
    }

    /* ---- summeringar ---- */
    const sumFält = (...fält: string[]) => fält.reduce((s, f) => s + (fältMap[f]?.belopp ?? 0), 0);

    const utgående = sumFält("10", "11", "12", "30", "31", "32", "60", "61", "62");
    const ingående = fältMap["48"]?.belopp ?? 0;

    const moms49 = utgående - ingående;

    console.log(`📊 Utgående moms: ${utgående}`);
    console.log(`📊 Ingående moms: ${ingående}`);
    console.log(`📦 Ruta 49: ${moms49}`);

    fältMap["49"] = {
      fält: "49",
      beskrivning: "Moms att betala eller få tillbaka",
      belopp: moms49,
    };

    /* sorterat resultat (valfritt) */
    return Object.values(fältMap)
      .filter((r) => r.belopp !== 0)
      .sort((a, b) => Number(a.fält) - Number(b.fält));
  } catch (error) {
    console.error("❌ getMomsrapport error:", error);
    logVATDataEvent(
      "error",
      userId,
      `Error fetching VAT report: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    throw new Error("Ett fel uppstod vid hämtning av momsrapport");
  }
}

export async function fetchFöretagsprofil(userId: number) {
  // SÄKERHETSVALIDERING: Kontrollera autentisering och ägarskap
  const sessionUserId = await getUserId();
  await requireOwnership(userId);

  logVATDataEvent("access", sessionUserId, "Accessing company profile data");

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
