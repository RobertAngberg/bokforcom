"use server";

import { pool } from "../../_lib/db";
import { createTransaktion } from "../../_utils/transactions";
import { ensureSession } from "../../_utils/session";
import { revalidatePath } from "next/cache";

export async function bokforMomsavstamning(year: string, period: string) {
  try {
    const { userId } = await ensureSession();
    const client = await pool.connect();

    try {
      // Kontrollera om momsavstämning redan är bokförd för perioden
      const checkQuery = `
        SELECT COUNT(*) as count
        FROM transaktioner
        WHERE user_id = $1
          AND kontobeskrivning LIKE 'Momsavstämning ${year} ${period === "all" ? "" : period}%'
      `;
      const checkResult = await client.query(checkQuery, [userId]);

      if (parseInt(checkResult.rows[0].count) > 0) {
        return {
          success: false,
          error: "Momsavstämning redan bokförd för denna period. Kontrollera i Historik.",
        };
      }

      // Hämta alla momskonton med deras saldon för perioden
      let dateFilter = "";
      if (period === "all") {
        dateFilter = `EXTRACT(YEAR FROM t.transaktionsdatum) = ${year}`;
      } else {
        const monthNum = period.padStart(2, "0");
        dateFilter = `TO_CHAR(t.transaktionsdatum, 'YYYY-MM') = '${year}-${monthNum}'`;
      }

      const query = `
        SELECT 
          k.kontonummer,
          k.beskrivning,
          SUM(tp.kredit) as total_kredit,
          SUM(tp.debet) as total_debet
        FROM transaktionsposter tp
        JOIN konton k ON tp.konto_id = k.id
        JOIN transaktioner t ON tp.transaktions_id = t.id
        WHERE t.user_id = $1
          AND ${dateFilter}
          AND k.kontonummer IN ('2610', '2611', '2612', '2613', '2614', '2620', '2621', '2622', '2623', '2624', '2630', '2631', '2632', '2633', '2634', '2635', '2615', '2625', '2640', '2641', '2645', '2647', '2648')
        GROUP BY k.kontonummer, k.beskrivning
        HAVING SUM(tp.kredit) != SUM(tp.debet)
        ORDER BY k.kontonummer
      `;

      const result = await client.query(query, [userId]);

      // Debug: Logga alla rader som returneras från databasen
      console.log("=== MOMSAVSTÄMNING BOKFÖRING ===");
      console.log("Antal konton från DB:", result.rows.length);
      result.rows.forEach((row) => {
        const totalKredit = parseFloat(row.total_kredit);
        const totalDebet = parseFloat(row.total_debet);
        const saldo = row.kontonummer.startsWith("264")
          ? totalDebet - totalKredit
          : totalKredit - totalDebet;
        console.log(
          `📌 ${row.kontonummer} ${row.beskrivning}: K=${totalKredit} D=${totalDebet} → Saldo=${saldo.toFixed(2)}`
        );
      });

      // Beräkna bokföringsposter baserat på faktiska saldon
      const poster: { kontonummer: string; debet: number; kredit: number }[] = [];

      for (const row of result.rows) {
        const totalKredit = parseFloat(row.total_kredit);
        const totalDebet = parseFloat(row.total_debet);
        const kontonummer = row.kontonummer;

        // Utgående moms (2610-2635) har normalt KREDIT-saldo, vi debiterar för att nollställa
        if (
          kontonummer.startsWith("261") ||
          kontonummer.startsWith("262") ||
          kontonummer.startsWith("263")
        ) {
          const saldo = totalKredit - totalDebet;
          if (Math.abs(saldo) < 0.01) continue;

          if (saldo > 0) {
            // Kredit-saldo, debitera för att nollställa
            poster.push({ kontonummer, debet: saldo, kredit: 0 });
          } else {
            // Debet-saldo (ovanligt), kreditera för att nollställa
            poster.push({ kontonummer, debet: 0, kredit: Math.abs(saldo) });
          }
        }
        // Ingående moms (2640, 2645 etc) har normalt DEBET-saldo, vi krediterar för att nollställa
        else if (kontonummer.startsWith("264")) {
          const saldo = totalDebet - totalKredit;
          if (Math.abs(saldo) < 0.01) continue;

          if (saldo > 0) {
            // Debet-saldo, kreditera för att nollställa
            poster.push({ kontonummer, debet: 0, kredit: saldo });
          } else {
            // Kredit-saldo (ovanligt), debitera för att nollställa
            poster.push({ kontonummer, debet: Math.abs(saldo), kredit: 0 });
          }
        }
      }

      if (poster.length === 0) {
        return { success: false, error: "Inga momsposter att bokföra för perioden" };
      }

      // Balansera mot 2650 Redovisningskonto för moms
      const totalDebet = poster.reduce((sum, p) => sum + p.debet, 0);
      const totalKredit = poster.reduce((sum, p) => sum + p.kredit, 0);
      const netto = totalDebet - totalKredit;

      if (Math.abs(netto) > 0.01) {
        if (netto > 0) {
          // Vi har mer utgående än ingående = skuld, kredit 2650
          poster.push({ kontonummer: "2650", debet: 0, kredit: netto });
        } else {
          // Vi har mer ingående än utgående = fordran, debet 2650
          poster.push({ kontonummer: "2650", debet: Math.abs(netto), kredit: 0 });
        }
      }

      // Skapa transaktion
      const { transaktionsId } = await createTransaktion({
        datum: new Date(),
        beskrivning: `Momsavstämning ${year} ${period === "all" ? "" : period}`,
        kommentar: `Avstämning av moms för period ${period === "all" ? "Hela året" : period} ${year}`,
        userId,
        poster,
      });

      revalidatePath("/rapporter");

      return { success: true, transaktionsId };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Fel vid bokföring av momsavstämning:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Okänt fel",
    };
  }
}
