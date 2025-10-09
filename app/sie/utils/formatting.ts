/**
 * SIE Formatting Utilities
 * Funktioner för att formatera text och data för SIE-filformat
 */

/**
 * Escapar text för säker användning i SIE 4-format
 * @param text - Text att escapea
 * @returns Escapad text
 */
export function sieEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\") // Escape backslashes
    .replace(/"/g, '\\"') // Escape quotes
    .replace(/\n/g, " ") // Replace newlines with spaces
    .replace(/\r/g, " ") // Replace carriage returns with spaces
    .replace(/\t/g, " "); // Replace tabs with spaces
}

/**
 * Formaterar organisationsnummer för SIE-format (utan bindestreck)
 * Hanterar både organisationsnummer (10 siffror) och personnummer (12 siffror)
 * @param orgNr - Organisationsnummer med eller utan bindestreck
 * @returns Formaterat organisationsnummer (10 siffror)
 */
export function formatOrganizationNumber(orgNr: string): string {
  if (!orgNr) {
    return "0000000000";
  }

  // Ta bort alla icke-siffror
  let cleaned = orgNr.replace(/\D/g, "");

  // Om det är ett personnummer (12 siffror), ta bara sista 10 siffrorna
  if (cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }

  return cleaned || "0000000000";
}

/**
 * Konverterar SIE-datum (YYYYMMDD) till HTML-datum format (YYYY-MM-DD)
 * @param datum - Datum i SIE-format (YYYYMMDD) eller redan formaterat (YYYY-MM-DD)
 * @returns Datum i HTML-format (YYYY-MM-DD)
 */
export function formatSieDateToHtml(datum: string): string {
  if (datum.length === 8) {
    return `${datum.slice(0, 4)}-${datum.slice(4, 6)}-${datum.slice(6, 8)}`;
  }
  return datum;
}
