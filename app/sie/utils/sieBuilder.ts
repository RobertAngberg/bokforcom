/**
 * SIE-filbyggare
 *
 * Innehåller funktioner för att bygga SIE-filstrukturer
 */

import { sieEscape, formatOrganizationNumber } from "./formatting";
import { isoToSieDate } from "./dateFormatting";
import { dateTillÅÅÅÅMMDD } from "../../_utils/datum";
import type { CompanyInfo, AccountInfo } from "../types/types";

/**
 * Bygger SIE 4 fil-header med obligatoriska poster
 *
 * Inkluderar:
 * - Flaggor och format
 * - Program- och versionsinformation
 * - Genereringsdatum
 * - Företagsinformation
 * - Räkenskapsår (flera år bakåt)
 * - Kontoplan och #KONTO-poster
 *
 * @param companyInfo Företagsinformation (namn, organisationsnummer)
 * @param accounts Array av konton att inkludera
 * @param baseYear Basåret för räkenskapsår
 * @param yearRange Antal år bakåt att generera (default: 7)
 * @returns SIE-header som sträng
 */
export function buildSieHeader(
  companyInfo: CompanyInfo,
  accounts: AccountInfo[],
  baseYear: number,
  yearRange: number = 7
): string {
  const idag = new Date();
  const datumSträng = isoToSieDate(dateTillÅÅÅÅMMDD(idag));

  let sieContent = "";

  // Obligatoriska SIE 4 huvud-poster
  sieContent += `#FLAGGA 0\n`;
  sieContent += `#PROGRAM "BokforPunkt.com" 1.0\n`;
  sieContent += `#FORMAT PC8\n`;
  sieContent += `#GEN ${datumSträng}\n`;
  sieContent += `#SIETYP 4\n`;

  // Företagsinformation
  const företagsnamn = companyInfo?.företagsnamn || companyInfo?.email || "Företag";
  const organisationsnummer = formatOrganizationNumber(
    companyInfo?.organisationsnummer || "000000-0000"
  );

  sieContent += `#ORGNR ${organisationsnummer}\n`;
  sieContent += `#FNAMN "${sieEscape(företagsnamn)}"\n`;

  // Räkenskapsår (generera flera år)
  for (let i = 0; i >= -yearRange; i--) {
    const currentYear = baseYear + i;
    sieContent += `#RAR ${i} ${currentYear}0101 ${currentYear}1231\n`;
  }

  // Kontoplan
  sieContent += `#KPTYP BAS2014\n`;

  // Lägg till #KONTO-poster
  for (const konto of accounts) {
    const beskrivning = sieEscape(konto.beskrivning);
    sieContent += `#KONTO ${konto.kontonummer} "${beskrivning}"\n`;
  }

  return sieContent;
}
