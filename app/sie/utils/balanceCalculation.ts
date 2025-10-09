/**
 * Balansberäkningar för SIE-export
 *
 * Innehåller logik för att beräkna kontosaldon över flera år
 */

import type { TransactionRow } from "../types/types";

/**
 * Beräknar kontosaldon per år för flera räkenskapsår
 *
 * Funktionen skapar en ackumulerad bild av alla kontosaldon över tid,
 * där varje års transaktioner påverkar det året och alla framtida år.
 *
 * @param transactions Array av transaktioner med datum, konto och belopp
 * @param baseYear Basåret (nuvarande räkenskapsår)
 * @param yearRange Antal år bakåt att beräkna (default: 7, ger år -7 till 0)
 * @returns Map med år som nyckel (-7 till 0) och Map<kontonummer, saldo> som värde
 *
 * @example
 * const balances = calculateYearlyBalances(transactions, 2025, 7);
 * const balanceForYear2024 = balances.get(-1); // Föregående år
 */
export function calculateYearlyBalances(
  transactions: TransactionRow[],
  baseYear: number,
  yearRange: number = 7
): Map<number, Map<string, number>> {
  const kontoSaldonPerÅr = new Map<number, Map<string, number>>();

  // Initiera alla år (från -yearRange till 0)
  for (let i = -yearRange; i <= 0; i++) {
    kontoSaldonPerÅr.set(i, new Map<string, number>());
  }

  // Beräkna ackumulerade saldon per år
  for (const row of transactions) {
    const transYear = new Date(row.transaktionsdatum).getFullYear();
    const konto = row.kontonummer;
    const belopp = row.debet > 0 ? row.debet : -row.kredit;

    // Lägg till belopp för detta år och alla framtida år
    for (let i = -yearRange; i <= 0; i++) {
      const targetYear = baseYear + i;
      if (transYear <= targetYear) {
        const årMap = kontoSaldonPerÅr.get(i)!;
        const currentSaldo = årMap.get(konto) || 0;
        årMap.set(konto, currentSaldo + belopp);
      }
    }
  }

  return kontoSaldonPerÅr;
}
