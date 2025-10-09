/**
 * Validering av SIE-filer
 *
 * Innehåller funktioner för att validera SIE-filuppladdningar
 */

import { BAS_STANDARD_KONTON } from "./accounts";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * Validerar filstorlek
 * @param size Filstorlek i bytes
 * @returns Error-meddelande eller null om valid
 */
export function validateFileSize(size: number): string | null {
  if (size > MAX_FILE_SIZE) {
    return `Filen är för stor (${Math.round(size / 1024 / 1024)}MB). Max ${MAX_FILE_SIZE / 1024 / 1024}MB tillåtet.`;
  }
  return null;
}

/**
 * Validerar att filen är en SIE-fil baserat på filtyp
 * @param type MIME-typ från filen
 * @returns Error-meddelande eller null om valid
 */
export function validateSieFileType(type: string): string | null {
  // SIE-filer kan ha olika MIME-typer beroende på system
  const validTypes = [
    "text/plain",
    "application/octet-stream",
    "application/x-sie",
    "", // Tomma typer accepteras också
  ];

  if (!validTypes.includes(type)) {
    return `Ogiltig filtyp: ${type}. Endast SIE-filer är tillåtna.`;
  }

  return null;
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
