import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { fetchTransactionWithEntries } from "../../_utils/transactions";

/**
 * Hämta företagsprofil för inloggad användare
 * Återanvänd över flera rapporter
 * Används direkt från Server Components - ingen "use server" behövs
 */
export async function getForetagsprofil(userId?: string) {
  const { userId: sessionUserId } = await ensureSession();

  // Använd sessionUserId om inget userId skickades
  const targetUserId = userId ?? sessionUserId;

  if (targetUserId !== sessionUserId) {
    throw new Error("Otillåten åtkomst: Du äger inte denna resurs");
  }

  const client = await pool.connect();
  try {
    const query = `
      SELECT företagsnamn, organisationsnummer
      FROM företagsprofil
      WHERE id = $1
      LIMIT 1
    `;
    const res = await client.query(query, [targetUserId]);
    return res.rows[0] ?? null;
  } finally {
    client.release();
  }
}

/**
 * Hämta transaktionsdetaljer för en specifik transaktion
 * Återanvänd över flera rapporter
 * Används direkt från Server Components - ingen "use server" behövs
 */
export async function getTransactionDetails(transaktionsId: number) {
  const { userId } = await ensureSession();

  try {
    return await fetchTransactionWithEntries(userId, transaktionsId);
  } catch (error) {
    console.error("❌ getTransactionDetails error:", error);
    return null;
  }
}
