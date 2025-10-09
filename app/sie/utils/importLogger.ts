/**
 * Import-loggning för SIE-importer
 *
 * Innehåller logik för att skapa och uppdatera import-loggar i databasen
 */

import { PoolClient } from "pg";
import type { SieData, Verification, FileInfo } from "../types/types";

/**
 * Skapar en import-logg för SIE-import
 *
 * Beräknar datumintervall, räknar poster och skapar en loggpost med status 'pågående'.
 * Returnerar det genererade import-ID:t för senare uppdateringar.
 *
 * @param client PostgreSQL client (inom en transaktion)
 * @param userId Användar-ID som äger importen
 * @param fileInfo Information om den uppladdade filen
 * @param sieData Parsad SIE-data
 * @returns Import-ID från databasen
 *
 * @example
 * const importId = await createImportLogEntry(client, userId, fileInfo, sieData);
 * // Senare: uppdatera status till 'slutförd' eller 'misslyckad'
 */
export async function createImportLogEntry(
  client: PoolClient,
  userId: string,
  fileInfo: FileInfo,
  sieData: SieData
): Promise<number> {
  // Hitta start- och slutdatum från verifikationer
  const startDatum =
    sieData.verifikationer.length > 0
      ? sieData.verifikationer.reduce(
          (earliest: string, v: Verification) => (v.datum < earliest ? v.datum : earliest),
          sieData.verifikationer[0].datum
        )
      : null;

  const slutDatum =
    sieData.verifikationer.length > 0
      ? sieData.verifikationer.reduce(
          (latest: string, v: Verification) => (v.datum > latest ? v.datum : latest),
          sieData.verifikationer[0].datum
        )
      : null;

  // Räkna alla poster från SIE-filen
  const antalTransaktionsposter = sieData.verifikationer.reduce(
    (total: number, ver: Verification) => total + ver.transaktioner.length,
    0
  );
  const antalBalansposter = sieData.balanser.ingående.length + sieData.balanser.utgående.length;
  const antalResultatposter = sieData.resultat.length;

  const importResult = await client.query(
    `
    INSERT INTO sie_importer (
      "user_id", filnamn, filstorlek, sie_program, sie_organisationsnummer, 
      sie_företagsnamn, sie_datumintervall_från, sie_datumintervall_till,
      antal_verifikationer, antal_transaktionsposter, antal_balansposter, 
      antal_resultatposter, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pågående')
    RETURNING id
  `,
    [
      userId,
      fileInfo.filnamn,
      fileInfo.filstorlek,
      sieData.header.program,
      sieData.header.organisationsnummer,
      sieData.header.företagsnamn,
      startDatum,
      slutDatum,
      sieData.verifikationer.length,
      antalTransaktionsposter,
      antalBalansposter,
      antalResultatposter,
    ]
  );

  return importResult.rows[0].id;
}
