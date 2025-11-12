import type { MomskontosaldoRow, BokforingsPost } from "../types/types";

/**
 * Beräknar bokföringsposter för momsavstämning baserat på momskontosaldon
 * Nollställer alla momskonton och balanserar mot 2650
 *
 * INGEN databasfetching - bara beräkningar
 */
export function calculateMomsBokforingPoster(rows: MomskontosaldoRow[]): BokforingsPost[] {
  const poster: BokforingsPost[] = [];

  console.log("=== BERÄKNING AV BOKFÖRINGSPOSTER ===");
  console.log("Antal konton att processa:", rows.length);

  for (const row of rows) {
    const totalKredit = parseFloat(row.total_kredit);
    const totalDebet = parseFloat(row.total_debet);
    const kontonummer = row.kontonummer;

    // Debug-logg för varje konto
    const saldo = row.kontonummer.startsWith("264")
      ? totalDebet - totalKredit
      : totalKredit - totalDebet;
    console.log(
      `📌 ${row.kontonummer} ${row.beskrivning}: K=${totalKredit} D=${totalDebet} → Saldo=${saldo.toFixed(2)}`
    );

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
    return poster;
  }

  // Balansera mot 2650 Redovisningskonto för moms
  const totalDebet = poster.reduce((sum, p) => sum + p.debet, 0);
  const totalKredit = poster.reduce((sum, p) => sum + p.kredit, 0);
  const netto = totalDebet - totalKredit;

  console.log("📊 Totaler före balansering:");
  console.log(`  Debet: ${totalDebet.toFixed(2)}`);
  console.log(`  Kredit: ${totalKredit.toFixed(2)}`);
  console.log(`  Netto: ${netto.toFixed(2)}`);

  if (Math.abs(netto) > 0.01) {
    if (netto > 0) {
      // Vi har mer utgående än ingående = skuld, kredit 2650
      poster.push({ kontonummer: "2650", debet: 0, kredit: netto });
      console.log(`✅ Balanserar med KREDIT på 2650: ${netto.toFixed(2)}`);
    } else {
      // Vi har mer ingående än utgående = fordran, debet 2650
      poster.push({ kontonummer: "2650", debet: Math.abs(netto), kredit: 0 });
      console.log(`✅ Balanserar med DEBET på 2650: ${Math.abs(netto).toFixed(2)}`);
    }
  }

  console.log("=== SLUTLIGA POSTER ===");
  poster.forEach((p) => {
    console.log(`  ${p.kontonummer}: D=${p.debet.toFixed(2)} K=${p.kredit.toFixed(2)}`);
  });

  return poster;
}

/**
 * Bygger SQL-filter för datumintervall baserat på period
 */
export function buildDateFilter(year: string, period: string): string {
  if (period === "all") {
    return `EXTRACT(YEAR FROM t.transaktionsdatum) = ${year}`;
  } else {
    const monthNum = period.padStart(2, "0");
    return `TO_CHAR(t.transaktionsdatum, 'YYYY-MM') = '${year}-${monthNum}'`;
  }
}
