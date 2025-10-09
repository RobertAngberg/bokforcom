/**
 * Dubbletthantering för konton
 *
 * Innehåller logik för att hitta och hantera dubblerade konton i databasen
 */

import { Pool, PoolClient } from "pg";
import type { DuplicateAccount } from "../types/types";

/**
 * Hittar dubbletter av konton för en specifik användare
 *
 * Returnerar alla kontonummer som förekommer fler än en gång i databasen
 * för den angivna användaren, tillsammans med antal och alla ID:n.
 *
 * @param pool PostgreSQL connection pool
 * @param userId Användar-ID att söka dubbletter för
 * @returns Array av dubletter med kontonummer, antal och ID:n
 *
 * @example
 * const dubletter = await findDuplicateAccounts(pool, userId);
 * console.log(`Hittade ${dubletter.length} kontonummer med dubbletter`);
 */
export async function findDuplicateAccounts(
  pool: Pool,
  userId: string
): Promise<DuplicateAccount[]> {
  const dublettQuery = `
    SELECT kontonummer, COUNT(*) as antal, 
           array_agg(id ORDER BY id) as ids
    FROM konton 
    WHERE "user_id" = $1 
    GROUP BY kontonummer 
    HAVING COUNT(*) > 1
  `;

  const { rows } = await pool.query<DuplicateAccount>(dublettQuery, [userId]);
  return rows;
}

/**
 * Tar bort dubbletter av ett konto, behåller endast den första (lägsta ID)
 *
 * @param client PostgreSQL client (inom en transaktion)
 * @param kontonummer Kontonumret att rensa dubbletter för
 * @param ids Array av alla ID:n för detta konto (första behålls)
 * @param userId Användar-ID för säkerhetskontroll
 * @returns Antal borttagna dubbletter
 *
 * @example
 * const rensade = await removeDuplicatesForAccount(client, "1930", [45, 67, 89], userId);
 * console.log(`Tog bort ${rensade} dubbletter av konto 1930`);
 */
export async function removeDuplicatesForAccount(
  client: PoolClient,
  kontonummer: string,
  ids: number[],
  userId: string
): Promise<number> {
  let rensadeAntal = 0;

  // Behåll första posten (lägsta ID), ta bort resten
  const attRensa = ids.slice(1);

  for (const id of attRensa) {
    try {
      await client.query('DELETE FROM konton WHERE id = $1 AND "user_id" = $2', [id, userId]);
      console.log(`🗑️ Tog bort dublett av konto ${kontonummer} (ID: ${id})`);
      rensadeAntal++;
    } catch (error) {
      console.error(`❌ Kunde inte ta bort dublett ${id}:`, error);
    }
  }

  return rensadeAntal;
}
