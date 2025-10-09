/**
 * Validering av SIE-filer
 *
 * Innehåller funktioner för att validera SIE-filuppladdningar
 */

import { BAS_STANDARD_KONTON } from "./accounts";
import {
  validateFileSize as validateFileSizeUtil,
  validateSieFileType as validateSieFileTypeUtil,
  MAX_FILE_SIZES,
} from "../../_utils/fileUtils";

/**
 * Validerar filstorlek för SIE-filer
 * @param size Filstorlek i bytes
 * @returns Error-meddelande eller null om valid
 */
export function validateFileSize(size: number): string | null {
  const result = validateFileSizeUtil(size, MAX_FILE_SIZES.sie);
  return result.valid ? null : result.error || "Filen är för stor";
}

/**
 * Validerar att filen är en SIE-fil baserat på filtyp
 * @param type MIME-typ från filen
 * @returns Error-meddelande eller null om valid
 */
export function validateSieFileType(type: string): string | null {
  const result = validateSieFileTypeUtil(type);
  return result.valid ? null : result.error || "Ogiltig filtyp";
}

/**
 * Analyserar konton från SIE-fil och kategoriserar dem
 * @param sieKonton - Alla konton från SIE-filen
 * @param anvandaKonton - Lista över konton som faktiskt används i transaktioner
 * @returns Analys av kontostruktur med kategorier
 */
export function analyzeAccounts(sieKonton: string[], anvandaKonton: string[]) {
  // Separera mellan standard BAS-konton och specialkonton
  const standardKonton = sieKonton.filter((konto) => BAS_STANDARD_KONTON.has(konto));
  const specialKonton = sieKonton.filter((konto) => !BAS_STANDARD_KONTON.has(konto));

  // Kritiska konton som bör finnas - endast RIKTIGT företagsspecifika konton SOM OCKSÅ ANVÄNDS
  const kritiskaKonton = specialKonton.filter((konto) => {
    // Hoppa över konton som inte används
    if (!anvandaKonton.includes(konto)) return false;

    const kontoNum = parseInt(konto);

    // Konton längre än 4 siffror är nästan alltid företagsspecifika
    if (konto.length > 4) return true;

    // Konton utanför BAS-intervall
    if (kontoNum < 1000) return true;
    if (kontoNum > 9000 && kontoNum < 9900) return true;
    if (kontoNum > 9999) return true;

    return false;
  });

  return {
    totaltAntal: sieKonton.length,
    standardKonton: standardKonton.length,
    specialKonton: specialKonton.length,
    kritiskaKonton: kritiskaKonton,
    anvandaSaknade: specialKonton.filter((konto) => anvandaKonton.includes(konto)).length,
    totaltAnvanda: anvandaKonton.length,
  };
}
