/**
 * Verifikationsgruppering för SIE-export
 *
 * Innehåller logik för att gruppera transaktioner till verifikationer
 */

import { isoToSieDate } from "./dateFormatting";
import { dateToYyyyMmDd } from "../../_utils/datum";
import { sieEscape } from "./formatting";
import type { TransactionRowForGrouping, VerificationForExport } from "../types/types";

/**
 * Grupperar transaktioner per verifikation för SIE-export
 *
 * Varje unik transaktion_id blir en verifikation med tillhörande poster.
 * Poster konverteras från debet/kredit till signerat belopp (+ för debet, - för kredit).
 *
 * @param transactions Array av transaktionsrader från databasen
 * @returns Map med transaktion_id som nyckel och Verification-objekt som värde
 *
 * @example
 * const verifikationer = groupTransactionsByVerification(årsTransaktioner);
 * for (const [transId, ver] of verifikationer) {
 *   console.log(`#VER "${ver.nummer}" ${ver.datum} "${ver.beskrivning}"`);
 * }
 */
export function groupTransactionsByVerification(
  transactions: TransactionRowForGrouping[]
): Map<number, VerificationForExport> {
  const verifikationer = new Map<number, VerificationForExport>();
  let verNummer = 1;

  for (const row of transactions) {
    const transId = row.transaktion_id;

    if (!verifikationer.has(transId)) {
      const datum = new Date(row.transaktionsdatum);
      const datumStr = isoToSieDate(dateToYyyyMmDd(datum));
      const beskrivning = sieEscape(row.kommentar || row.kontobeskrivning || "Transaktion");

      verifikationer.set(transId, {
        nummer: verNummer++,
        datum: datumStr,
        beskrivning: beskrivning,
        poster: [],
      });
    }

    const belopp = row.debet > 0 ? row.debet : -row.kredit;
    verifikationer.get(transId)!.poster.push({
      konto: row.kontonummer,
      belopp: belopp,
    });
  }

  return verifikationer;
}
