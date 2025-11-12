"use server";
import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { getPeriodDateRange } from "../utils/periodOptions";
import type { ResultatKonto, ResultatTransaktion } from "../types/types";
export {
  fetchForetagsprofil,
  fetchTransactionDetails,
} from "./sharedActions";

export async function hamtaResultatrapport(year?: string, period?: string) {
  const { userId } = await ensureSession();

  try {
    // Bygg WHERE-klausul för datumfiltrering
    let dateFilter = "";
    const params: (string | number)[] = [userId];

    if (year) {
      if (period && period !== "all") {
        // Specifik period (månad eller kvartal)
        const { from, to } = getPeriodDateRange(year, period);
        dateFilter = `AND t.transaktionsdatum BETWEEN $2 AND $3`;
        params.push(from, to);
      } else {
        // Helt år
        dateFilter = `AND EXTRACT(YEAR FROM t.transaktionsdatum) = $2`;
        params.push(parseInt(year));
      }
    } else {
      // Ingen filtrering - använd nuvarande och föregående år (legacy)
      dateFilter = `AND EXTRACT(YEAR FROM t.transaktionsdatum) IN ($2, $3)`;
      params.push(new Date().getFullYear(), new Date().getFullYear() - 1);
    }

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
      ${dateFilter}
    GROUP BY k.kontonummer, k.beskrivning, k.kontoklass, k.kategori, år
    ORDER BY år DESC, k.kontonummer::int
    `,
      params
    );

    const rows = result.rows;

    const årsSet = new Set<string>();
    const intakterMap = new Map<string, Map<string, ResultatKonto>>();
    const rorelsensMap = new Map<string, Map<string, ResultatKonto>>();
    const finansiellaIntakterMap = new Map<string, Map<string, ResultatKonto>>();
    const finansiellaKostnaderMap = new Map<string, Map<string, ResultatKonto>>();

    for (const row of rows) {
      const år = String(row.år);
      årsSet.add(år);

      const { kontonummer, beskrivning, kategori, total_belopp, transaktioner } = row;
      const parseradeTransaktioner = Array.isArray(transaktioner)
        ? (transaktioner as ResultatTransaktion[])
        : [];

      let målMap: Map<string, Map<string, ResultatKonto>> | null = null;
      const grupp = kategori || "Övrigt"; // Gruppnamn = kategori

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
          transaktioner: parseradeTransaktioner,
          [år]: total_belopp,
        });
      } else {
        const existingKonto = kontoMap.get(kontonummer);
        if (existingKonto) {
          existingKonto[år] = ((existingKonto[år] as number) || 0) + total_belopp;
        }
      }
    }

    const years = Array.from(årsSet)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 2);

    const formatData = (map: Map<string, Map<string, ResultatKonto>>) =>
      Array.from(map.entries()).map(([namn, kontoMap]) => {
        const konton = Array.from(kontoMap.values());
        const summering: { [år: string]: number } = {};
        for (const konto of konton) {
          for (const år of years) {
            const kontoValue = konto[år] as number;
            summering[år] = (summering[år] || 0) + (kontoValue || 0);
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
    throw new Error("Ett fel uppstod vid hämtning av resultatrapport");
  }
}
