"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { fetchTransactionWithEntries } from "../../_utils/transactions";

/**
 * Hämta företagsprofil för inloggad användare
 * Återanvänd över flera rapporter
 */
export async function fetchForetagsprofil(userId?: string) {
  const { userId: sessionUserId } = await ensureSession();

  // Använd sessionUserId om inget userId skickades
  const targetUserId = userId || sessionUserId;

  if (targetUserId !== sessionUserId) {
    throw new Error("Otillåten åtkomst: Du äger inte denna resurs");
  }

  try {
    const client = await pool.connect();
    const query = `
      SELECT företagsnamn, organisationsnummer
      FROM företagsprofil
      WHERE id = $1
      LIMIT 1
    `;
    const res = await client.query(query, [targetUserId]);
    client.release();
    return res.rows[0] || null;
  } catch (error) {
    console.error("❌ fetchForetagsprofil error:", error);
    return null;
  }
}

/**
 * Hämta transaktionsdetaljer för en specifik transaktion
 * Återanvänd över flera rapporter
 */
export async function fetchTransactionDetails(transaktionsId: number) {
  const { userId } = await ensureSession();

  try {
    return await fetchTransactionWithEntries(userId, transaktionsId);
  } catch (error) {
    console.error("❌ fetchTransactionDetails error:", error);
    return null;
  }
}
