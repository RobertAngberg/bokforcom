"use server";

import { pool } from "../_lib/db";
import { put } from "@vercel/blob";
import { validateId, sanitizeInput } from "../_utils/validationUtils";
import { getUserId } from "../_utils/authUtils";
import { updateFakturanummerCore, updateFörvalCore } from "../_utils/dbUtils";

// 🎉 VÄLKOMSTMEDDELANDE FUNKTIONER
export async function checkWelcomeStatus(): Promise<boolean> {
  try {
    const userId = await getUserId();
    console.log("📋 Kontrollerar välkomststatus för användare:", userId);

    // Better Auth har inte welcome_shown kolumn
    // För nu, visa aldrig välkomstmeddelandet (return false = visa inte)
    return false;
  } catch (error) {
    console.error("Error checking welcome status:", error);
    return false; // Vid fel, visa inte välkomstmeddelande
  }
}

export async function markWelcomeAsShown(): Promise<void> {
  try {
    const userId = await getUserId();
    const client = await pool.connect();

    await client.query('UPDATE "user" SET welcome_shown = true WHERE id = $1', [userId]);

    client.release();
  } catch (error) {
    console.error("Error marking welcome as shown:", error);
  }
}

// 🔒 ENTERPRISE SÄKERHETSFUNKTIONER FÖR START-MODUL

// REMOVED: Security logging functionality (security_logs table doesn't exist)
// All security events are now logged to console only for development debugging
function logStartSecurityEvent(userId: number | string, eventType: string, details: string): void {
  console.log(`🔒 Start Security Event [${eventType}] User: ${userId} - ${details}`);
}

export async function hämtaTransaktionsposter(transaktionsId: number) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    // Validera input
    if (!transaktionsId || transaktionsId <= 0) {
      logStartSecurityEvent(
        userId,
        "invalid_transaction_id",
        `Invalid transaction ID: ${transaktionsId}`
      );
      throw new Error("Ogiltigt transaktions-ID");
    }

    logStartSecurityEvent(
      userId,
      "fetch_transaction_posts",
      `Fetching posts for transaction: ${transaktionsId}`
    );

    // 🔒 SÄKER DATABASACCESS - Endast användarens egna transaktioner
    const result = await pool.query(
      `
      SELECT tp.konto_id, k.kontobeskrivning, tp.debet, tp.kredit
      FROM transaktionsposter tp
      LEFT JOIN konton k ON k.id = tp.konto_id
      LEFT JOIN transaktioner t ON tp.transaktions_id = t.id
      WHERE tp.transaktions_id = $1 AND t."user_id" = $2
    `,
      [transaktionsId, userId]
    );

    logStartSecurityEvent(
      userId,
      "fetch_transaction_posts_success",
      `Retrieved ${result.rows.length} posts for transaction ${transaktionsId}`
    );

    return result.rows;
  } catch (error) {
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        logStartSecurityEvent(
          userId,
          "fetch_transaction_posts_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ hämtaTransaktionsposter error:", error);
    return [];
  }
}

export async function fetchAllaForval(filters?: { sök?: string; kategori?: string; typ?: string }) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    logStartSecurityEvent(
      userId,
      "fetch_forval_attempt",
      `Fetching förval with filters: ${JSON.stringify(filters)}`
    );

    // 🔒 SÄKER DATABASACCESS - Endast användarens egna förval med popularitetsdata
    let query = `
      SELECT f.*, 
             COALESCE(ff.antal, 0) as användningar,
             ff.senaste as senast_använd
      FROM förval f
      LEFT JOIN favoritförval ff ON f.id = ff.forval_id AND ff.user_id = $1
      WHERE f."user_id" = $1
    `;
    const values: (string | number)[] = [userId];
    const conditions: string[] = [];

    // Sanitera och validera filter
    if (filters?.sök) {
      const sanitizedSök = sanitizeInput(filters.sök);
      if (sanitizedSök.length > 0) {
        conditions.push(
          `(LOWER(namn) LIKE $${values.length + 1} OR LOWER(beskrivning) LIKE $${values.length + 1})`
        );
        values.push(`%${sanitizedSök.toLowerCase()}%`);
      }
    }

    if (filters?.kategori) {
      const sanitizedKategori = sanitizeInput(filters.kategori);
      if (sanitizedKategori.length > 0) {
        conditions.push(`kategori = $${values.length + 1}`);
        values.push(sanitizedKategori);
      }
    }

    if (filters?.typ) {
      const sanitizedTyp = sanitizeInput(filters.typ);
      if (sanitizedTyp.length > 0) {
        conditions.push(`LOWER(typ) = $${values.length + 1}`);
        values.push(sanitizedTyp.toLowerCase());
      }
    }

    if (conditions.length > 0) {
      query += ` AND ` + conditions.join(" AND ");
    }

    query += ` ORDER BY namn`;

    const res = await pool.query(query, values);

    logStartSecurityEvent(
      userId,
      "fetch_forval_success",
      `Retrieved ${res.rows.length} förval records`
    );

    return res.rows;
  } catch (error) {
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        logStartSecurityEvent(
          userId,
          "fetch_forval_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ fetchAllaForval error:", error);
    return [];
  }
}

export async function fetchRawYearData(year: string) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    // Validera och sanitera år
    const sanitizedYear = sanitizeInput(year);
    const yearNum = parseInt(sanitizedYear);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      logStartSecurityEvent(userId, "invalid_year", `Invalid year: ${year}`);
      throw new Error("Ogiltigt år");
    }

    const start = new Date(`${yearNum}-01-01`);
    const end = new Date(`${yearNum + 1}-01-01`);

    logStartSecurityEvent(
      userId,
      "fetch_year_data_attempt",
      `Fetching raw data for year: ${yearNum}`
    );

    const client = await pool.connect();
    try {
      // 🔒 SÄKER DATABASACCESS - Endast användarens egna data
      const query = `
        SELECT 
          t.transaktionsdatum,
          tp.debet,
          tp.kredit,
          k.kontoklass,
          k.kontonummer
        FROM transaktioner t
        JOIN transaktionsposter tp ON t.id = tp.transaktions_id
        JOIN konton k ON tp.konto_id = k.id
        WHERE t.transaktionsdatum >= $1 AND t.transaktionsdatum < $2 AND t."user_id" = $3
        ORDER BY t.transaktionsdatum ASC
      `;

      const result = await client.query(query, [start, end, userId]);

      logStartSecurityEvent(
        userId,
        "fetch_raw_year_data_success",
        `Retrieved ${result.rows.length} raw records for year ${yearNum}`
      );

      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        logStartSecurityEvent(
          userId,
          "fetch_raw_year_data_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ fetchRawYearData error:", error);
    return [];
  }
}

export async function hämtaAllaTransaktioner() {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    logStartSecurityEvent(
      userId,
      "fetch_all_transactions_attempt",
      "Fetching all user transactions"
    );

    const client = await pool.connect();
    try {
      // 🔒 SÄKER DATABASACCESS - Endast användarens egna transaktioner
      const res = await client.query(
        `
        SELECT 
          id,
          transaktionsdatum,
          kontobeskrivning,
          kontoklass,
          belopp,
          fil,
          kommentar,
          "user_id"
        FROM transaktioner
        WHERE "user_id" = $1
        ORDER BY id DESC
      `,
        [userId]
      );

      logStartSecurityEvent(
        userId,
        "fetch_all_transactions_success",
        `Retrieved ${res.rows.length} transactions`
      );

      return res.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        logStartSecurityEvent(
          userId,
          "fetch_all_transactions_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ hämtaAllaTransaktioner error:", error);
    return [];
  }
}

export async function getAllInvoices() {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    logStartSecurityEvent(userId, "fetch_all_invoices_attempt", "Fetching all user invoices");

    const client = await pool.connect();
    try {
      // 🔒 SÄKER DATABASACCESS - Endast användarens egna fakturor
      const res = await client.query(
        `
        SELECT 
          id,
          fakturanamn,
          kundnamn,
          totalbelopp,
          status,
          utfardandedatum,
          "user_id"
        FROM fakturor
        WHERE "user_id" = $1
        ORDER BY id DESC
      `,
        [userId]
      );

      logStartSecurityEvent(
        userId,
        "fetch_all_invoices_success",
        `Retrieved ${res.rows.length} invoices`
      );

      return res.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        logStartSecurityEvent(
          userId,
          "fetch_all_invoices_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ getAllInvoices error:", error);
    return [];
  }
}

export async function deleteInvoice(fakturaId: number) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    // Validera och rensa input
    if (!fakturaId || isNaN(fakturaId) || fakturaId <= 0) {
      throw new Error("Ogiltigt faktura-ID");
    }

    logStartSecurityEvent(
      userId,
      "delete_invoice_attempt",
      `Attempting to delete invoice ID: ${fakturaId}`
    );

    const client = await pool.connect();
    try {
      // 🔒 SÄKER BORTTAGNING - Endast användarens egna fakturor
      const deleteRes = await client.query(
        'DELETE FROM fakturor WHERE id = $1 AND "user_id" = $2 RETURNING id',
        [fakturaId, userId]
      );

      if (deleteRes.rowCount === 0) {
        logStartSecurityEvent(
          userId,
          "delete_invoice_unauthorized",
          `Unauthorized attempt to delete invoice ID: ${fakturaId}`
        );
        throw new Error("Faktura hittades inte eller du saknar behörighet");
      }

      logStartSecurityEvent(userId, "delete_invoice_success", `Deleted invoice ID: ${fakturaId}`);

      return { success: true, message: "Faktura raderad" };
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        logStartSecurityEvent(
          userId,
          "delete_invoice_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ deleteInvoice error:", error);
    return { success: false, message: "Kunde inte radera faktura" };
  }
}

export async function updateFakturanummer(id: number, nyttNummer: string) {
  // 🔒 SÄKERHETSVALIDERING - Session
  const userId = await getUserId();
  if (!userId) {
    throw new Error("Åtkomst nekad - ingen giltig session");
  }

  if (!validateId(id)) {
    throw new Error("Ogiltigt faktura-ID");
  }

  const safeNummer = sanitizeInput(nyttNummer, 50); // Begränsa till 50 tecken
  if (!safeNummer) {
    throw new Error("Ogiltigt fakturanummer");
  }

  // Använd centraliserad databasoperation med ägarskapskontroll
  await updateFakturanummerCore(id, safeNummer, userId);
}

export async function saveInvoice(data: {
  fakturanummer: string;
  kundnamn: string;
  total: number;
}) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO fakturor (fakturanummer, kundnamn, total, skapad) VALUES ($1, $2, $3, NOW())`,
      [data.fakturanummer, data.kundnamn, data.total]
    );
  } finally {
    client.release();
  }
}

export async function hämtaFörvalMedSökning(sök: string, offset: number, limit: number) {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id, namn, beskrivning, typ, kategori, konton, sökord, momssats, specialtyp
      FROM förval
      WHERE namn ILIKE $1 OR beskrivning ILIKE $1
      ORDER BY id
      OFFSET $2
      LIMIT $3
    `;

    const values = [`%${sök}%`, offset, limit];
    const res = await client.query(query, values);

    return res.rows.map((row) => ({
      ...row,
      konton: typeof row.konton === "string" ? JSON.parse(row.konton) : row.konton,
      sökord: Array.isArray(row.sökord) ? row.sökord : [],
    }));
  } catch (err) {
    console.error("❌ hämtaFörvalMedSökning error:", err);
    return [];
  } finally {
    client.release();
  }
}

export async function räknaFörval(sök?: string) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const client = await pool.connect();
    try {
      let query = `SELECT COUNT(*) FROM förval WHERE "user_id" = $1`;
      const params: (number | string)[] = [userId];

      if (sök) {
        const safeSök = sanitizeInput(sök);
        query += ` AND (namn ILIKE $2 OR beskrivning ILIKE $2)`;
        params.push(`%${safeSök}%`);
      }

      const res = await client.query(query, params);
      return parseInt(res.rows[0].count);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ räknaFörval error:", error);
    return 0;
  }
}

export async function uppdateraFörval(id: number, kolumn: string, nyttVärde: string) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    if (!validateId(id)) {
      throw new Error("Ogiltigt ID");
    }

    logStartSecurityEvent(
      userId,
      "update_forval_attempt",
      `Updating förval ID: ${id}, column: ${kolumn}`
    );

    const sanitizedValue = sanitizeInput(nyttVärde);

    // Använd centraliserad databasoperation med user ownership
    const result = await updateFörvalCore(id, kolumn, sanitizedValue, userId);

    if (result.rowCount === 0) {
      logStartSecurityEvent(
        userId,
        "update_forval_unauthorized",
        `Unauthorized attempt to update förval ID: ${id}`
      );
      throw new Error("Förval hittades inte eller du saknar behörighet");
    }

    logStartSecurityEvent(userId, "update_forval_success", `Updated förval ID: ${id}`);
  } catch (error) {
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        logStartSecurityEvent(
          userId,
          "update_forval_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ uppdateraFörval error:", error);
    throw error;
  }
}

export async function taBortFörval(id: number) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    if (!validateId(id)) {
      throw new Error("Ogiltigt ID");
    }

    logStartSecurityEvent(userId, "delete_forval_attempt", `Attempting to delete förval ID: ${id}`);

    const client = await pool.connect();
    try {
      // 🔒 SÄKER BORTTAGNING - Endast användarens egna förval
      const result = await client.query(
        `DELETE FROM förval WHERE id = $1 AND "user_id" = $2 RETURNING id`,
        [id, userId]
      );

      if (result.rowCount === 0) {
        logStartSecurityEvent(
          userId,
          "delete_forval_unauthorized",
          `Unauthorized attempt to delete förval ID: ${id}`
        );
        throw new Error("Förval hittades inte eller du saknar behörighet");
      }

      logStartSecurityEvent(userId, "delete_forval_success", `Deleted förval ID: ${id}`);
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        logStartSecurityEvent(
          userId,
          "delete_forval_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ taBortFörval error:", error);
    throw error;
  }
}

export async function taBortTransaktion(id: number) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    if (!validateId(id)) {
      throw new Error("Ogiltigt ID");
    }

    logStartSecurityEvent(
      userId,
      "delete_transaction_attempt",
      `Attempting to delete transaction ID: ${id}`
    );

    const client = await pool.connect();
    try {
      // 🔒 SÄKER BORTTAGNING - Endast användarens egna transaktioner
      const result = await client.query(
        `DELETE FROM transaktioner WHERE id = $1 AND "user_id" = $2 RETURNING id`,
        [id, userId]
      );

      if (result.rowCount === 0) {
        logStartSecurityEvent(
          userId,
          "delete_transaction_unauthorized",
          `Unauthorized attempt to delete transaction ID: ${id}`
        );
        throw new Error("Transaktion hittades inte eller du saknar behörighet");
      }

      logStartSecurityEvent(userId, "delete_transaction_success", `Deleted transaction ID: ${id}`);
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        logStartSecurityEvent(
          userId,
          "delete_transaction_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ taBortTransaktion error:", error);
    throw error;
  }
}

export async function fetchForvalMedFel() {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    logStartSecurityEvent(userId, "fetch_forval_errors_attempt", "Fetching förval with errors");

    const client = await pool.connect();

    try {
      // 🔒 SÄKER DATABASACCESS - Användarens data
      const kontonResult = await client.query(
        'SELECT kontonummer FROM konton WHERE "user_id" = $1',
        [userId]
      );
      const giltigaKonton = kontonResult.rows.map((row) => row.kontonummer);

      const forvalResult = await client.query('SELECT * FROM förval WHERE "user_id" = $1', [
        userId,
      ]);

      const felaktiga = forvalResult.rows.filter((f) => {
        try {
          const konton = Array.isArray(f.konton) ? f.konton : JSON.parse(f.konton);
          return konton.some(
            (konto: { kontonummer?: string }) =>
              konto.kontonummer && !giltigaKonton.includes(konto.kontonummer)
          );
        } catch {
          console.error("❌ JSON parse-fel i förval id:", f.id);
          return true;
        }
      });

      logStartSecurityEvent(
        userId,
        "fetch_forval_errors_success",
        `Found ${felaktiga.length} förval with errors`
      );

      return felaktiga;
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        logStartSecurityEvent(
          userId,
          "fetch_forval_errors_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ fetchForvalMedFel error:", error);
    return [];
  }
}

export async function uploadPDF(formData: FormData) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const userId = await getUserId();
    if (!userId) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    logStartSecurityEvent(userId, "upload_pdf_attempt", "Attempting PDF upload");

    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("Ingen fil vald");
    }

    // 🔒 SÄKERHETSVALIDERING - Filtyp och storlek
    if (file.type !== "application/pdf") {
      throw new Error("Endast PDF-filer är tillåtna");
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error("Filen är för stor (max 10MB)");
    }

    // Skapa säkert filnamn
    const safeFileName = sanitizeInput(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");

    // Ladda upp till Vercel Blob med användar-prefix
    const blob = await put(`uploads/${userId}/${safeFileName}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    logStartSecurityEvent(
      userId,
      "upload_pdf_success",
      `Uploaded PDF: ${safeFileName} to ${blob.url}`
    );

    return { success: true, blob };
  } catch (error) {
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        logStartSecurityEvent(
          userId,
          "upload_pdf_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("Upload error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Okänt fel" };
  }
}
