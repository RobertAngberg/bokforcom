/**
 * Account Analysis Utilities
 * Funktioner för att analysera konton i SIE-filer
 */

import type { SieData } from "../types/types";
import { BAS_STANDARD_KONTON } from "./accounts";

/**
 * Extraherar alla konton som faktiskt används i en SIE-fil
 * (från verifikationer, balanser och resultat)
 * @param sieData - Parsad SIE-data
 * @returns Set med kontonummer som används
 */
export function extractUsedAccounts(sieData: SieData): Set<string> {
  const anvandaKonton = new Set<string>();

  // Konton från verifikationer/transaktioner
  sieData.verifikationer.forEach((ver) => {
    ver.transaktioner.forEach((trans) => {
      anvandaKonton.add(trans.konto);
    });
  });

  // Konton från balanser
  sieData.balanser.ingående.forEach((b) => anvandaKonton.add(b.konto));
  sieData.balanser.utgående.forEach((b) => anvandaKonton.add(b.konto));

  // Konton från resultat
  sieData.resultat.forEach((r) => anvandaKonton.add(r.konto));

  return anvandaKonton;
}

/**
 * Analyserar saknade konton och kategoriserar dem
 * @param sieKonton - Alla konton från SIE-filen
 * @param befintligaKonton - Konton som finns i databasen
 * @param anvandaKonton - Konton som faktiskt används (optional)
 * @returns Analys med saknade konton kategoriserade
 */
export function analyseMissingAccounts(
  sieKonton: string[],
  befintligaKonton: Set<string>,
  anvandaKonton?: string[]
): {
  allaSaknade: string[];
  standardKonton: string[];
  specialKonton: string[];
  kritiskaKonton: string[];
  anvandaSaknade: string[];
  saknadeAttVisa: string[];
} {
  // Hitta konton som finns i SIE men inte i databasen
  const allaSaknade = sieKonton.filter((kontonr) => {
    const kontoStr = kontonr.toString().trim();
    return !befintligaKonton.has(kontoStr);
  });

  // Separera mellan standard BAS-konton och specialkonton
  const standardKonton = allaSaknade.filter((konto) => BAS_STANDARD_KONTON.has(konto));
  const specialKonton = allaSaknade.filter((konto) => !BAS_STANDARD_KONTON.has(konto));

  // Om vi har information om använda konton, fokusera på dem
  const anvandaSaknade = anvandaKonton
    ? allaSaknade.filter((konto) => anvandaKonton.includes(konto))
    : allaSaknade;

  // Identifiera kritiska konton
  const kritiskaKonton = identifyCriticalAccounts(specialKonton, anvandaKonton);

  // Returnera endast konton som VERKLIGEN saknas i databasen och som används
  const saknadeAttVisa = anvandaKonton
    ? allaSaknade.filter((konto) => anvandaKonton.includes(konto))
    : allaSaknade;

  return {
    allaSaknade,
    standardKonton,
    specialKonton,
    kritiskaKonton,
    anvandaSaknade,
    saknadeAttVisa,
  };
}

/**
 * Identifierar kritiska konton - företagsspecifika konton som bör finnas
 * @param specialKonton - Konton som inte är BAS-standard
 * @param anvandaKonton - Konton som faktiskt används (optional)
 * @returns Array med kritiska kontonummer
 */
export function identifyCriticalAccounts(
  specialKonton: string[],
  anvandaKonton?: string[]
): string[] {
  return specialKonton.filter((konto) => {
    // Hoppa över konton som inte används om vi har den informationen
    if (anvandaKonton && !anvandaKonton.includes(konto)) return false;

    // Endast konton som är:
    // - Längre än 4 siffror (detaljkonton som 19301, 24401 etc)
    // - Konton som INTE är inom BAS-standardintervall
    // - Konton som börjar på 9 men INTE är 8910-8999 (som är BAS-resultatdisposition)
    const kontoNum = parseInt(konto);

    // Konton längre än 4 siffror är nästan alltid företagsspecifika
    if (konto.length > 4) return true;

    // Konton utanför BAS-intervall (under 1000 eller över 9000 men inte 9900-9999)
    if (kontoNum < 1000) return true;
    if (kontoNum > 9000 && kontoNum < 9900) return true;
    if (kontoNum > 9999) return true;

    return false;
  });
}
