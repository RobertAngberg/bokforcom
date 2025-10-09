/**
 * Bokföringslogik och konverteringar
 *
 * Innehåller hjälpfunktioner för bokföringsregler och konverteringar
 */

/**
 * Konverterar belopp till debet/kredit baserat på SIE-konvention
 *
 * I SIE-format är positiva belopp alltid debet och negativa kredit.
 * Denna funktion konverterar till rätt format för databasen.
 *
 * @param belopp Beloppet från SIE-filen (positivt för debet, negativt för kredit)
 * @returns Objekt med debet och kredit värden
 */
export function convertToDebetKredit(belopp: number): { debet: number; kredit: number } {
  return {
    debet: belopp > 0 ? belopp : 0,
    kredit: belopp < 0 ? Math.abs(belopp) : 0,
  };
}

/**
 * Kontrollerar om en verifikation balanserar (debet = kredit)
 *
 * @param poster Array av transaktionsposter med belopp
 * @param tolerance Tolerans för avrundningsfel (default: 0.01 kr)
 * @returns true om verifikationen balanserar, annars false
 */
export function isVerificationBalanced(
  poster: Array<{ belopp: number }>,
  tolerance: number = 0.01
): boolean {
  const summa = poster.reduce((sum, post) => sum + post.belopp, 0);
  return Math.abs(summa) <= tolerance;
}

/**
 * Bestämmer om ett konto är ett balanskonto eller resultatkonto
 *
 * I BAS-kontoplanen:
 * - 1000-2999: Balanskonton (Tillgångar och Skulder)
 * - 3000-8999: Resultatkonton (Intäkter och Kostnader)
 *
 * @param kontonummer Kontonumret som sträng eller nummer
 * @returns true om kontot är ett balanskonto, false om resultatkonto
 */
export function isBalanceAccount(kontonummer: string | number): boolean {
  const nr = typeof kontonummer === "string" ? parseInt(kontonummer, 10) : kontonummer;
  return nr >= 1000 && nr <= 2999;
}
