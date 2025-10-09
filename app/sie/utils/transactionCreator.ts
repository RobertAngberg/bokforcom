/**
 * Transaktionsskapare för balanser
 *
 * Innehåller logik för att skapa balanstransaktioner från SIE-data
 */

import { PoolClient } from "pg";
import { convertToDebetKredit } from "./accounting";
import type { BalansPost } from "../types/types";

/**
 * Skapar en balanstransaktion med tillhörande poster
 *
 * Används för att importera ingående eller utgående balanser från SIE-filer.
 * Skapar en transaktion och sedan en transaktionspost för varje balanspost.
 *
 * @param client PostgreSQL client (inom en transaktion)
 * @param userId Användar-ID som äger transaktionen
 * @param balanser Array av balansposter att importera
 * @param transaktionsdatum Datum för balanstransaktionen
 * @param beskrivning Beskrivning av transaktionen
 * @param kommentar Kommentar för transaktionen
 * @returns Antal importerade balansposter
 *
 * @example
 * const antal = await createBalanceTransaction(
 *   client, userId, sieData.balanser.ingående,
 *   "2024-01-01", "Ingående balanser", "SIE Import"
 * );
 */
export async function createBalanceTransaction(
  client: PoolClient,
  userId: string,
  balanser: BalansPost[],
  transaktionsdatum: string,
  beskrivning: string,
  kommentar: string
): Promise<number> {
  if (balanser.length === 0) {
    return 0;
  }

  // Skapa huvudtransaktion
  const { rows: transaktionRows } = await client.query(
    `INSERT INTO transaktioner (
      transaktionsdatum, 
      kontobeskrivning, 
      kommentar, 
      "user_id"
    ) VALUES ($1, $2, $3, $4)
    RETURNING id`,
    [transaktionsdatum, beskrivning, kommentar, userId]
  );

  const transaktionsId = transaktionRows[0].id;
  let importeradeAntal = 0;

  // Skapa transaktionsposter för varje balanspost
  for (const balans of balanser) {
    if (balans.belopp !== 0) {
      console.log(`🔍 Försöker importera balans för konto ${balans.konto}: ${balans.belopp}`);

      // Hämta konto_id
      const { rows: kontoRows } = await client.query(
        "SELECT id FROM konton WHERE kontonummer = $1",
        [balans.konto]
      );

      if (kontoRows.length === 0) {
        console.warn(`❌ Konto ${balans.konto} hittades inte för balans`);
        continue;
      }

      const kontoId = kontoRows[0].id;
      const { debet, kredit } = convertToDebetKredit(balans.belopp);

      console.log(`✅ Skapar balans för konto ${balans.konto}: debet=${debet}, kredit=${kredit}`);

      await client.query(
        `INSERT INTO transaktionsposter (
          transaktions_id,
          konto_id,
          debet,
          kredit
        ) VALUES ($1, $2, $3, $4)`,
        [transaktionsId, kontoId, debet, kredit]
      );

      importeradeAntal++;
      console.log(`📈 Räknare för balanser nu: ${importeradeAntal}`);
    }
  }

  return importeradeAntal;
}
