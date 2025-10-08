"use server";
import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { fetchTransactionWithEntries } from "../../_utils/transactions";

// Typ för kontodata
interface KontoData {
  kontonummer: string;
  beskrivning: string;
  transaktioner: Array<{
    id: string;
    datum: string;
    belopp: number;
    beskrivning: string;
    transaktion_id: number;
    verifikatNummer: string;
  }>;
  [year: string]: unknown; // För år-specifika belopp
}

export async function hamtaResultatrapport() {
  const { userId } = await ensureSession();

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
    const intakterMap = new Map<string, Map<string, KontoData>>();
    const rorelsensMap = new Map<string, Map<string, KontoData>>();
    const finansiellaIntakterMap = new Map<string, Map<string, KontoData>>();
    const finansiellaKostnaderMap = new Map<string, Map<string, KontoData>>();

    for (const row of rows) {
      const år = String(row.år);
      årsSet.add(år);

      const { kontonummer, beskrivning, kategori, total_belopp, transaktioner } = row;

      let målMap: Map<string, Map<string, KontoData>> | null = null;
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
          transaktioner, // Lägg till transaktioner array
          [år]: total_belopp,
        } as KontoData);
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

    const formatData = (map: Map<string, Map<string, KontoData>>) =>
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

export async function fetchFöretagsprofil(userId?: string) {
  // SÄKERHETSVALIDERING: Kontrollera autentisering
  const { userId: sessionUserId } = await ensureSession();

  // Använd sessionUserId om inget userId skickades
  const targetUserId = userId || sessionUserId;

  if (targetUserId !== sessionUserId) {
    throw new Error("Otillåten åtkomst: Du äger inte denna resurs");
  }

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
  const { userId } = await ensureSession();

  try {
    return await fetchTransactionWithEntries(userId, transaktionsId);
  } catch (error) {
    console.error("❌ fetchTransactionDetails error:", error);
    return null;
  }
}
