/**
 * Utility functions för att konvertera mellan SIE-datumformat och ISO-datumformat
 */

/**
 * Konverterar SIE-datum (YYYYMMDD) till ISO-datum (YYYY-MM-DD)
 * @param sieDateString - Datum i SIE-format (t.ex. "20250101")
 * @returns Datum i ISO-format (t.ex. "2025-01-01")
 */
export function sieDateToISO(sieDateString: string): string {
  if (sieDateString.length === 8) {
    return `${sieDateString.slice(0, 4)}-${sieDateString.slice(4, 6)}-${sieDateString.slice(6, 8)}`;
  }
  // Om redan i rätt format eller ogiltigt, returnera som det är
  return sieDateString;
}

/**
 * Konverterar ISO-datum (YYYY-MM-DD) till SIE-datum (YYYYMMDD)
 * @param isoDateString - Datum i ISO-format (t.ex. "2025-01-01")
 * @returns Datum i SIE-format (t.ex. "20250101")
 */
export function isoToSieDate(isoDateString: string): string {
  // Ta bort bindestreck från ISO-datum
  return isoDateString.replace(/-/g, "");
}
