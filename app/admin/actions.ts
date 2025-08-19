"use server";

import { Pool } from "pg";
import { getSessionAndUserId } from "../_utils/authUtils";
import { validateId } from "../_utils/validationUtils";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 🔒 ENTERPRISE ADMIN SÄKERHETSFUNKTIONER
const adminAttempts = new Map<string, { attempts: number; lastAttempt: number }>();

async function validateAdminSession(): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const { session, userId } = await getSessionAndUserId();
    if (!session?.user?.email) {
      return { valid: false, error: "Ingen session hittad" };
    }

    // 🔒 ADMIN-BEHÖRIGHETSKONTROLL
    // TODO: Implementera admin-roll i databasen
    // För tillfället: kontrollera om användaren är super-admin via env
    const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
    const userEmail = session.user.email;

    if (!userEmail || !adminEmails.includes(userEmail)) {
      await logAdminSecurityEvent(
        userId.toString(),
        "unauthorized_admin_access",
        `Unauthorized access attempt from: ${userEmail}`
      );
      return { valid: false, error: "Otillräcklig behörighet - endast administratörer" };
    }

    return { valid: true, userId: userId.toString() };
  } catch (error) {
    console.error("Admin session validation error:", error);
    return { valid: false, error: "Sessionvalidering misslyckades" };
  }
}

async function validateAdminAttempt(userId: string): Promise<boolean> {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minuter
  const maxAttempts = 10; // Striktare för admin-funktioner

  const userAttempts = adminAttempts.get(userId) || { attempts: 0, lastAttempt: 0 };

  if (now - userAttempts.lastAttempt > windowMs) {
    userAttempts.attempts = 0;
  }

  if (userAttempts.attempts >= maxAttempts) {
    await logAdminSecurityEvent(
      userId,
      "admin_rate_limit_exceeded",
      `Admin rate limit exceeded: ${userAttempts.attempts} attempts`
    );
    return false;
  }

  userAttempts.attempts++;
  userAttempts.lastAttempt = now;
  adminAttempts.set(userId, userAttempts);

  return true;
}

async function logAdminSecurityEvent(
  userId: string,
  eventType: string,
  details: string
): Promise<void> {
  try {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO security_logs ("userId", event_type, details, module, timestamp) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, eventType, details, "admin"]
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Failed to log admin security event:", error);
  }
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>'"&]/g, "").trim();
}

export async function hämtaTransaktionsposter(transaktionsId: number) {
  try {
    // 🔒 KRITISK ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;

    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök - vänta 15 minuter");
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

    console.error("❌ hämtaTransaktionsposter error:", error);
    return [];
  }
}

export async function fetchAllaForval(filters?: { sök?: string; kategori?: string; typ?: string }) {
  try {
    // 🔒 KRITISK ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;

    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök - vänta 15 minuter");
    }

    await logAdminSecurityEvent(
      userId,
      "fetch_all_forval_attempt",
      `Admin fetching all förval with filters: ${JSON.stringify(filters)}`
    );

    let query = "SELECT * FROM förval";
    const values: any[] = [];
    const conditions: string[] = [];

    if (filters?.sök) {
      const safeSök = sanitizeInput(filters.sök);
      conditions.push(
        `(LOWER(namn) LIKE $${values.length + 1} OR LOWER(beskrivning) LIKE $${values.length + 1})`
      );
      values.push(`%${safeSök.toLowerCase()}%`);
    }

    if (filters?.kategori) {
      const safeKategori = sanitizeInput(filters.kategori);
      conditions.push(`kategori = $${values.length + 1}`);
      values.push(safeKategori);
    }

    if (filters?.typ) {
      const safeTyp = sanitizeInput(filters.typ);
      conditions.push(`LOWER(typ) = $${values.length + 1}`);
      values.push(safeTyp.toLowerCase());
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ");
    }

    query += ` ORDER BY namn`;

    const res = await pool.query(query, values);

    await logAdminSecurityEvent(
      userId,
      "fetch_all_forval_success",
      `Retrieved ${res.rows.length} förval for admin review`
    );

    return res.rows;
  } catch (error) {
    // Logga fel om vi har admin session
    try {
      const adminAuth = await validateAdminSession();
      if (adminAuth.valid) {
        await logAdminSecurityEvent(
          adminAuth.userId!,
          "fetch_all_forval_error",
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

export async function fetchDataFromYear(year: string) {
  try {
    // 🔒 KRITISK ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;

    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök - vänta 15 minuter");
    }

    const sanitizedYear = sanitizeInput(year);
    if (!/^\d{4}$/.test(sanitizedYear)) {
      throw new Error("Ogiltigt årformat");
    }

    await logAdminSecurityEvent(
      userId,
      "fetch_year_data_attempt",
      `Admin fetching year data for: ${sanitizedYear}`
    );

    const start = new Date(`${sanitizedYear}-01-01`);
    const end = new Date(`${+sanitizedYear + 1}-01-01`);

    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        SELECT 
          t.transaktionsdatum,
          tp.debet,
          tp.kredit,
          k.kontoklass,
          k.kontonummer
        FROM transaktioner t
        JOIN transaktionsposter tp ON t.id = tp.transaktions_id
        JOIN konton k ON tp.konto_id = k.id
        WHERE t.transaktionsdatum >= $1 AND t.transaktionsdatum < $2
        ORDER BY t.transaktionsdatum ASC
      `,
        [start, end]
      );

      const rows = result.rows;
      const grouped: Record<string, { inkomst: number; utgift: number }> = {};
      let totalInkomst = 0;
      let totalUtgift = 0;

      rows.forEach((row) => {
        const { transaktionsdatum, debet, kredit, kontonummer } = row;
        if (!transaktionsdatum || !kontonummer) return;

        const date = new Date(transaktionsdatum);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;

        const deb = Number(debet ?? 0);
        const kre = Number(kredit ?? 0);
        const prefix = kontonummer?.toString()[0];

        if (!grouped[key]) grouped[key] = { inkomst: 0, utgift: 0 };

        if (prefix === "3") {
          grouped[key].inkomst += kre;
          totalInkomst += kre;
        }

        if (["5", "6", "7", "8"].includes(prefix)) {
          grouped[key].utgift += deb;
          totalUtgift += deb;
        }
      });

      const yearData = Object.entries(grouped).map(([month, values]) => ({
        month,
        inkomst: values.inkomst,
        utgift: values.utgift,
      }));

      await logAdminSecurityEvent(
        userId,
        "fetch_year_data_success",
        `Retrieved year data for ${sanitizedYear}: ${rows.length} transactions`
      );

      return {
        totalInkomst: +totalInkomst.toFixed(2),
        totalUtgift: +totalUtgift.toFixed(2),
        totalResultat: +(totalInkomst - totalUtgift).toFixed(2),
        yearData,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har admin session
    try {
      const adminAuth = await validateAdminSession();
      if (adminAuth.valid) {
        await logAdminSecurityEvent(
          adminAuth.userId!,
          "fetch_year_data_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ fetchDataFromYear error:", error);
    return {
      totalInkomst: 0,
      totalUtgift: 0,
      totalResultat: 0,
      yearData: [],
    };
  }
}

export async function hämtaAllaTransaktioner() {
  try {
    // 🔒 KRITISK ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;

    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök - vänta 15 minuter");
    }

    await logAdminSecurityEvent(
      userId,
      "fetch_all_transactions_attempt",
      "Admin fetching all transactions"
    );

    const client = await pool.connect();
    try {
      // 🔒 ADMIN kan se alla transaktioner men med säkerhetsloggning
      const res = await client.query(`
        SELECT 
          id,
          transaktionsdatum,
          kontobeskrivning,
          belopp,
          fil,
          kommentar,
          "userId"
        FROM transaktioner
        ORDER BY id DESC
      `);

      await logAdminSecurityEvent(
        userId,
        "fetch_all_transactions_success",
        `Retrieved ${res.rows.length} transactions for admin review`
      );

      return res.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har admin session
    try {
      const adminAuth = await validateAdminSession();
      if (adminAuth.valid) {
        await logAdminSecurityEvent(
          adminAuth.userId!,
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
    // 🔒 KRITISK ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;

    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök - vänta 15 minuter");
    }

    await logAdminSecurityEvent(
      userId,
      "fetch_all_invoices_attempt",
      "Admin fetching all invoices"
    );

    const client = await pool.connect();
    try {
      // 🔒 ADMIN kan se alla fakturor men med säkerhetsloggning
      const res = await client.query(`SELECT * FROM fakturor ORDER BY skapad ASC`);

      await logAdminSecurityEvent(
        userId,
        "fetch_all_invoices_success",
        `Retrieved ${res.rows.length} invoices for admin review`
      );

      return res.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har admin session
    try {
      const adminAuth = await validateAdminSession();
      if (adminAuth.valid) {
        await logAdminSecurityEvent(
          adminAuth.userId!,
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

export async function deleteInvoice(id: number) {
  try {
    // 🔒 KRITISK ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;

    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök - vänta 15 minuter");
    }

    if (!validateId(id)) {
      throw new Error("Ogiltigt faktura-ID");
    }

    await logAdminSecurityEvent(
      userId,
      "admin_delete_invoice_attempt",
      `Admin attempting to delete invoice ID: ${id}`
    );

    const client = await pool.connect();
    try {
      // 🔒 ADMIN kan radera alla fakturor men med säkerhetsloggning
      const result = await client.query(`DELETE FROM fakturor WHERE id = $1 RETURNING id`, [id]);

      if (result.rowCount === 0) {
        await logAdminSecurityEvent(
          userId,
          "admin_delete_invoice_not_found",
          `Invoice ID ${id} not found for deletion`
        );
        throw new Error("Faktura hittades inte");
      }

      await logAdminSecurityEvent(
        userId,
        "admin_delete_invoice_success",
        `Admin deleted invoice ID: ${id}`
      );
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har admin session
    try {
      const adminAuth = await validateAdminSession();
      if (adminAuth.valid) {
        await logAdminSecurityEvent(
          adminAuth.userId!,
          "admin_delete_invoice_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ deleteInvoice error:", error);
    throw error;
  }
}

export async function updateFakturanummer(id: number, nyttNummer: string) {
  try {
    // 🔒 KRITISK ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;

    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök - vänta 15 minuter");
    }

    if (!validateId(id)) {
      throw new Error("Ogiltigt faktura-ID");
    }

    const safeNummer = sanitizeInput(nyttNummer);
    if (!safeNummer) {
      throw new Error("Ogiltigt fakturanummer");
    }

    await logAdminSecurityEvent(
      userId,
      "admin_update_invoice_number_attempt",
      `Admin updating invoice ${id} number to: ${safeNummer}`
    );

    const client = await pool.connect();
    try {
      await client.query(`UPDATE fakturor SET fakturanummer = $1 WHERE id = $2`, [safeNummer, id]);
      await logAdminSecurityEvent(
        userId,
        "admin_update_invoice_number_success",
        `Admin updated invoice ${id} number to: ${safeNummer}`
      );
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har admin session
    try {
      const adminAuth = await validateAdminSession();
      if (adminAuth.valid) {
        await logAdminSecurityEvent(
          adminAuth.userId!,
          "admin_update_invoice_number_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ updateFakturanummer error:", error);
    throw error;
  }
}

export async function saveInvoice(data: any) {
  try {
    // 🔒 KRITISK ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;

    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök - vänta 15 minuter");
    }

    const safeData = {
      fakturanummer: sanitizeInput(data.fakturanummer || ""),
      kundnamn: sanitizeInput(data.kundnamn || ""),
      total: parseFloat(data.total) || 0,
    };

    await logAdminSecurityEvent(
      userId,
      "admin_save_invoice_attempt",
      `Admin saving invoice: ${safeData.fakturanummer}`
    );

    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO fakturor (fakturanummer, kundnamn, total, skapad) VALUES ($1, $2, $3, NOW())`,
        [safeData.fakturanummer, safeData.kundnamn, safeData.total]
      );
      await logAdminSecurityEvent(
        userId,
        "admin_save_invoice_success",
        `Admin saved invoice: ${safeData.fakturanummer}`
      );
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel
    try {
      const adminAuth = await validateAdminSession();
      if (adminAuth.valid) {
        await logAdminSecurityEvent(
          adminAuth.userId!,
          "admin_save_invoice_error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    console.error("❌ saveInvoice error:", error);
    throw error;
  }
}

export async function hämtaFörvalMedSökning(sök: string, offset: number, limit: number) {
  try {
    // 🔒 ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;
    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök");
    }

    const safeSök = sanitizeInput(sök);
    const safeOffset = Math.max(0, parseInt(offset.toString()) || 0);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit.toString()) || 10));

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
      const values = [`%${safeSök}%`, safeOffset, safeLimit];
      const res = await client.query(query, values);

      return res.rows.map((row) => ({
        ...row,
        konton: typeof row.konton === "string" ? JSON.parse(row.konton) : row.konton,
        sökord: Array.isArray(row.sökord) ? row.sökord : [],
      }));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ hämtaFörvalMedSökning error:", error);
    return [];
  }
}

export async function räknaFörval(sök: string) {
  try {
    // 🔒 ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;
    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök");
    }

    const safeSök = sanitizeInput(sök);
    const client = await pool.connect();
    try {
      const res = await client.query(
        `SELECT COUNT(*) FROM förval WHERE namn ILIKE $1 OR beskrivning ILIKE $1`,
        [`%${safeSök}%`]
      );
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
    // 🔒 KRITISK ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;
    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök");
    }

    const tillåtnaKolumner = [
      "namn",
      "beskrivning",
      "typ",
      "kategori",
      "momssats",
      "specialtyp",
      "konton",
      "sökord",
    ];

    if (!tillåtnaKolumner.includes(kolumn)) {
      throw new Error("Ogiltig kolumn");
    }

    if (!validateId(id)) {
      throw new Error("Ogiltigt ID");
    }

    await logAdminSecurityEvent(
      userId,
      "admin_update_forval_attempt",
      `Admin updating förval ${id}, column: ${kolumn}`
    );

    const client = await pool.connect();
    try {
      let query = "";
      let value: any = sanitizeInput(nyttVärde);

      if (kolumn === "konton" || kolumn === "sökord") {
        try {
          JSON.parse(value);
        } catch {
          throw new Error("Ogiltigt JSON-format");
        }
        query = `UPDATE förval SET ${kolumn} = $1::jsonb WHERE id = $2`;
      } else if (kolumn === "momssats") {
        if (isNaN(parseFloat(value))) {
          throw new Error("Ogiltigt momssats-värde");
        }
        query = `UPDATE förval SET ${kolumn} = $1::real WHERE id = $2`;
      } else {
        query = `UPDATE förval SET ${kolumn} = $1 WHERE id = $2`;
      }

      await client.query(query, [value, id]);
      await logAdminSecurityEvent(
        userId,
        "admin_update_forval_success",
        `Admin updated förval ${id}`
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ uppdateraFörval error:", error);
    throw error;
  }
}

export async function taBortFörval(id: number) {
  try {
    // 🔒 KRITISK ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;
    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök");
    }

    if (!validateId(id)) {
      throw new Error("Ogiltigt ID");
    }

    await logAdminSecurityEvent(
      userId,
      "admin_delete_forval_attempt",
      `Admin deleting förval ${id}`
    );

    const client = await pool.connect();
    try {
      await client.query(`DELETE FROM förval WHERE id = $1`, [id]);
      await logAdminSecurityEvent(
        userId,
        "admin_delete_forval_success",
        `Admin deleted förval ${id}`
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ taBortFörval error:", error);
    throw error;
  }
}

export async function taBortTransaktion(id: number) {
  try {
    // 🔒 KRITISK ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;
    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök");
    }

    if (!validateId(id)) {
      throw new Error("Ogiltigt ID");
    }

    await logAdminSecurityEvent(
      userId,
      "admin_delete_transaction_attempt",
      `Admin deleting transaction ${id}`
    );

    const client = await pool.connect();
    try {
      await client.query(`DELETE FROM transaktioner WHERE id = $1`, [id]);
      await logAdminSecurityEvent(
        userId,
        "admin_delete_transaction_success",
        `Admin deleted transaction ${id}`
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ taBortTransaktion error:", error);
    throw error;
  }
}

export async function hämtaAllaKonton() {
  try {
    // 🔒 KRITISK ADMIN-SÄKERHET
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;
    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök");
    }

    await logAdminSecurityEvent(
      userId,
      "admin_fetch_all_accounts_attempt",
      "Admin fetching all accounts"
    );

    const client = await pool.connect();

    try {
      const res = await client.query(`
        SELECT kontonummer, beskrivning, kontoklass, kategori, sökord
        FROM konton
        ORDER BY kontonummer ASC
      `);

      await logAdminSecurityEvent(
        userId,
        "admin_fetch_all_accounts_success",
        `Admin retrieved ${res.rows.length} accounts`
      );

      return res.rows.map((rad) => ({
        kontonummer: rad.kontonummer,
        kontobeskrivning: rad.beskrivning ?? "",
        kontoklass: rad.kontoklass ?? "",
        kategori: rad.kategori ?? "",
        sökord:
          typeof rad.sökord === "string"
            ? rad.sökord
                .replace(/[{}"]/g, "")
                .split(",")
                .map((s: string) => s.trim())
            : Array.isArray(rad.sökord)
              ? rad.sökord
              : [],
      }));
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ hämtaAllaKonton error:", error);
    return [];
  }
}

export async function körSQL(sql: string) {
  try {
    // 🔒 KRITISK ADMIN-SÄKERHET - SQL-EXEKVERING
    const adminAuth = await validateAdminSession();
    if (!adminAuth.valid) {
      throw new Error(adminAuth.error || "Åtkomst nekad");
    }

    const userId = adminAuth.userId!;

    if (!(await validateAdminAttempt(userId))) {
      throw new Error("För många admin-försök - vänta 15 minuter");
    }

    await logAdminSecurityEvent(
      userId,
      "sql_execution_attempt",
      `Executing SQL: ${sql.substring(0, 100)}...`
    );

    // 🔒 SQL-SÄKERHETSVALIDERING
    const safeSql = sanitizeInput(sql);

    // Förhindra farliga kommandon
    const dangerousPatterns = [
      /DROP\s+TABLE/i,
      /DROP\s+DATABASE/i,
      /DELETE\s+FROM\s+users/i,
      /DELETE\s+FROM\s+security_logs/i,
      /TRUNCATE/i,
      /ALTER\s+TABLE/i,
      /CREATE\s+USER/i,
      /GRANT/i,
      /REVOKE/i,
    ];

    const isDangerous = dangerousPatterns.some((pattern) => pattern.test(safeSql));
    if (isDangerous) {
      await logAdminSecurityEvent(
        userId,
        "dangerous_sql_blocked",
        `Blocked dangerous SQL: ${safeSql}`
      );
      throw new Error("Farlig SQL-operation blockerad av säkerhetssystem");
    }

    const result = await pool.query(safeSql);

    await logAdminSecurityEvent(
      userId,
      "sql_execution_success",
      `SQL executed successfully. Rows affected: ${result.rowCount || result.rows?.length || 0}`
    );

    if (result.rows?.length) {
      return { rows: result.rows };
    }

    return {
      rowCount: result.rowCount,
      command: result.command,
    };
  } catch (error) {
    // Logga fel om vi har userId
    try {
      const adminAuth = await validateAdminSession();
      if (adminAuth.valid) {
        await logAdminSecurityEvent(
          adminAuth.userId!,
          "sql_execution_error",
          `SQL Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log SQL error:", logError);
    }

    console.error("SQL-fel:", error);
    throw new Error(`Fel: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function sparaForetagsprofil(formData: FormData) {
  const { userId } = await getSessionAndUserId();

  const f = (key: string) => formData.get(key)?.toString() ?? "";

  try {
    const client = await pool.connect();
    await client.query(
      `
      INSERT INTO företagsprofil (
        "userId", företagsnamn, adress, postnummer, stad,
        organisationsnummer, momsregistreringsnummer,
        telefonnummer, epost, bankinfo, webbplats
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT ("userId") DO UPDATE SET
        företagsnamn = EXCLUDED.företagsnamn,
        adress = EXCLUDED.adress,
        postnummer = EXCLUDED.postnummer,
        stad = EXCLUDED.stad,
        organisationsnummer = EXCLUDED.organisationsnummer,
        momsregistreringsnummer = EXCLUDED.momsregistreringsnummer,
        telefonnummer = EXCLUDED.telefonnummer,
        epost = EXCLUDED.epost,
        bankinfo = EXCLUDED.bankinfo,
        webbplats = EXCLUDED.webbplats
    `,
      [
        userId,
        f("företagsnamn"),
        f("adress"),
        f("postnummer"),
        f("stad"),
        f("organisationsnummer"),
        f("momsregistreringsnummer"),
        f("telefonnummer"),
        f("epost"),
        f("bankinfo"),
        f("webbplats"),
      ]
    );

    client.release();
    return { success: true };
  } catch (err) {
    console.error("❌ Kunde inte spara företagsprofil:", err);
    return { success: false };
  }
}

// export async function hamtaFöretagsprofil() {
//   const session = await auth();
//   if (!session?.user?.id) return null;
//   const userId = parseInt(session.user.id);

//   const client = await pool.connect();
//   try {
//     const res = await client.query(`SELECT * FROM företagsprofil WHERE "userId" = $1`, [userId]);
//     return res.rows[0] ?? null;
//   } catch (err) {
//     console.error("❌ Kunde inte hämta företagsprofil:", err);
//     return null;
//   } finally {
//     client.release();
//   }
// }
