"use server";

import { Pool } from "pg";
import {
  validateAdminSession,
  validateAdminAttempt,
  logAdminSecurityEvent,
} from "./sakerhetsActions";
import { sanitizeAdminInput } from "../../_utils/validationUtils";
import { updateFakturanummerCore } from "../../_utils/dbUtils";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * 🔥 Hamta transaktionsposter
 * Enterprise-grade transaction post fetching with security
 */
export async function hamtaTransaktionsposter(transaktionsId: number) {
  try {
    // 🔒 KRITISK ADMIN-SAKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Atkomst nekad");
    }

    const userId = adminAuth.userId!;

    if (!(await validateAdminAttempt(userId))) {
      throw new Error("For manga admin-forsok - vanta 15 minuter");
    }

    if (!transaktionsId || isNaN(transaktionsId) || transaktionsId <= 0) {
      throw new Error("Ogiltigt transaktions-ID");
    }

    await logAdminSecurityEvent(
      userId,
      "fetch_transaction_posts_attempt",
      `Admin fetching transaction posts for ID: ${transaktionsId}`
    );

    const result = await pool.query(
      `
      SELECT 
        k.kontonummer, 
        k.beskrivning AS kontobeskrivning, 
        tp.debet, 
        tp.kredit
      FROM transaktionsposter tp
      LEFT JOIN konton k ON k.id = tp.konto_id
      WHERE tp.transaktions_id = $1
    `,
      [transaktionsId]
    );

    await logAdminSecurityEvent(
      userId,
      "fetch_transaction_posts_success",
      `Retrieved ${result.rows.length} transaction posts for transaction ID: ${transaktionsId}`
    );

    return result.rows;
  } catch (error) {
    // Logga fel om vi har admin session
    try {
      const adminAuth = await validateAdminSession();
      if (adminAuth.valid) {
        await logAdminSecurityEvent(
          adminAuth.userId!,
          "fetch_transaction_posts_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ hamtaTransaktionsposter error:", error);
    return [];
  }
}

/**
 * 🔥 Hamta alla forval med filter
 * Enterprise-grade forval fetching with advanced filtering
 */
export async function fetchAllaForval(filters?: { sok?: string; kategori?: string; typ?: string }) {
  try {
    // 🔒 KRITISK ADMIN-SAKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Atkomst nekad");
    }

    const userId = adminAuth.userId!;

    if (!(await validateAdminAttempt(userId))) {
      throw new Error("For manga admin-forsok - vanta 15 minuter");
    }

    await logAdminSecurityEvent(
      userId,
      "fetch_all_forval_attempt",
      `Admin fetching all forval with filters: ${JSON.stringify(filters)}`
    );

    let query = "SELECT * FROM forval";
    const values: any[] = [];
    const conditions: string[] = [];

    if (filters?.sok) {
      const safeSok = sanitizeAdminInput(filters.sok);
      conditions.push(
        `(LOWER(namn) LIKE $${values.length + 1} OR LOWER(beskrivning) LIKE $${values.length + 1})`
      );
      values.push(`%${safeSok.toLowerCase()}%`);
    }

    if (filters?.kategori) {
      const safeKategori = sanitizeAdminInput(filters.kategori);
      conditions.push(`kategori = $${values.length + 1}`);
      values.push(safeKategori);
    }

    if (filters?.typ) {
      const safeTyp = sanitizeAdminInput(filters.typ);
      conditions.push(`typ = $${values.length + 1}`);
      values.push(safeTyp);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY namn ASC";

    const result = await pool.query(query, values);

    await logAdminSecurityEvent(
      userId,
      "fetch_all_forval_success",
      `Retrieved ${result.rows.length} forval entries`
    );

    return result.rows;
  } catch (error) {
    console.error("❌ fetchAllaForval error:", error);
    return [];
  }
}

/**
 * 🔥 Uppdatera fakturanummer
 * Enterprise-grade invoice number updating
 */
export async function uppdateraFakturanummer(id: number, nyttNummer: string) {
  try {
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Atkomst nekad");
    }

    const userId = adminAuth.userId!;

    if (!(await validateAdminAttempt(userId))) {
      throw new Error("For manga admin-forsok - vanta 15 minuter");
    }

    await logAdminSecurityEvent(
      userId,
      "update_invoice_number_attempt",
      `Admin updating invoice ${id} number to: ${nyttNummer}`
    );

    const result = await updateFakturanummerCore(id, nyttNummer);

    await logAdminSecurityEvent(
      userId,
      "update_invoice_number_success",
      `Invoice ${id} number updated to: ${nyttNummer}`
    );

    return result;
  } catch (error) {
    console.error("❌ uppdateraFakturanummer error:", error);
    throw error;
  }
}
