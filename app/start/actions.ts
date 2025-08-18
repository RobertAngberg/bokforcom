"use server";

import { Pool } from "pg";
import { auth } from "../../auth";
import { put } from "@vercel/blob";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 🔒 ENTERPRISE SÄKERHETSFUNKTIONER FÖR START-MODUL
const sessionAttempts = new Map<string, { attempts: number; lastAttempt: number }>();

async function validateSessionAttempt(sessionId: string): Promise<boolean> {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minuter
  const maxAttempts = 20; // Start-modulen används ofta, högre gräns

  const userAttempts = sessionAttempts.get(sessionId) || { attempts: 0, lastAttempt: 0 };

  if (now - userAttempts.lastAttempt > windowMs) {
    userAttempts.attempts = 0;
  }

  if (userAttempts.attempts >= maxAttempts) {
    await logStartSecurityEvent(
      sessionId,
      "rate_limit_exceeded",
      `Rate limit exceeded: ${userAttempts.attempts} attempts`
    );
    return false;
  }

  userAttempts.attempts++;
  userAttempts.lastAttempt = now;
  sessionAttempts.set(sessionId, userAttempts);

  return true;
}

async function logStartSecurityEvent(
  userId: string,
  eventType: string,
  details: string
): Promise<void> {
  try {
    // Kontrollera om security_logs tabellen finns
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'security_logs'
      );
    `);

    if (tableExists.rows[0].exists) {
      await pool.query(
        `INSERT INTO security_logs (user_id, event_type, details, timestamp, module) 
         VALUES ($1, $2, $3, NOW(), 'START')`,
        [userId, eventType, details]
      );
    } else {
      console.log(`Start Security Event [${eventType}] User: ${userId} - ${details}`);
    }
  } catch (error) {
    console.error("Failed to log start security event:", error);
    console.log(`Start Security Event [${eventType}] User: ${userId} - ${details}`);
  }
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>'"&]/g, "").trim();
}

function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB max för PDF-filer
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Filen är för stor (${Math.round(file.size / 1024 / 1024)}MB). Max 10MB tillåtet.`,
    };
  }

  if (file.type !== "application/pdf") {
    return { valid: false, error: "Endast PDF-filer är tillåtna" };
  }

  return { valid: true };
}

export async function hämtaTransaktionsposter(transaktionsId: number) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const userId = session.user.id;

    if (!(await validateSessionAttempt(userId))) {
      throw new Error("För många försök - vänta 15 minuter");
    }

    // Validera input
    if (!transaktionsId || transaktionsId <= 0) {
      await logStartSecurityEvent(
        userId,
        "invalid_transaction_id",
        `Invalid transaction ID: ${transaktionsId}`
      );
      throw new Error("Ogiltigt transaktions-ID");
    }

    await logStartSecurityEvent(
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
      WHERE tp.transaktions_id = $1 AND t."userId" = $2
    `,
      [transaktionsId, userId]
    );

    await logStartSecurityEvent(
      userId,
      "fetch_transaction_posts_success",
      `Retrieved ${result.rows.length} posts for transaction ${transaktionsId}`
    );

    return result.rows;
  } catch (error) {
    // Logga fel om vi har session
    try {
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logStartSecurityEvent(
          errorSession.user.id,
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
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const userId = session.user.id;

    if (!(await validateSessionAttempt(userId))) {
      throw new Error("För många försök - vänta 15 minuter");
    }

    await logStartSecurityEvent(
      userId,
      "fetch_forval_attempt",
      `Fetching förval with filters: ${JSON.stringify(filters)}`
    );

    // 🔒 SÄKER DATABASACCESS - Endast användarens egna förval
    let query = 'SELECT * FROM förval WHERE "userId" = $1';
    const values: any[] = [userId];
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

    await logStartSecurityEvent(
      userId,
      "fetch_forval_success",
      `Retrieved ${res.rows.length} förval records`
    );

    return res.rows;
  } catch (error) {
    // Logga fel om vi har session
    try {
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logStartSecurityEvent(
          errorSession.user.id,
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

export async function fetchDataFromYear(year: string) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const userId = session.user.id;

    if (!(await validateSessionAttempt(userId))) {
      throw new Error("För många försök - vänta 15 minuter");
    }

    // Validera och sanitera år
    const sanitizedYear = sanitizeInput(year);
    const yearNum = parseInt(sanitizedYear);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      await logStartSecurityEvent(userId, "invalid_year", `Invalid year: ${year}`);
      throw new Error("Ogiltigt år");
    }

    const start = new Date(`${yearNum}-01-01`);
    const end = new Date(`${yearNum + 1}-01-01`);

    await logStartSecurityEvent(
      userId,
      "fetch_year_data_attempt",
      `Fetching data for year: ${yearNum}`
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
        WHERE t.transaktionsdatum >= $1 AND t.transaktionsdatum < $2 AND t."userId" = $3
        ORDER BY t.transaktionsdatum ASC
      `;

      const result = await client.query(query, [start, end, userId]);
      const rows = result.rows;

      await logStartSecurityEvent(
        userId,
        "fetch_year_data_processing",
        `Processing ${rows.length} records for year ${yearNum}`
      );

      const grouped: Record<string, { inkomst: number; utgift: number }> = {};
      let totalInkomst = 0;
      let totalUtgift = 0;

      rows.forEach((row, i) => {
        const { transaktionsdatum, debet, kredit, kontonummer } = row;

        if (!transaktionsdatum || !kontonummer) {
          console.warn(`⚠️ Rad ${i + 1} saknar datum eller kontonummer:`, row);
          return;
        }

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

      await logStartSecurityEvent(
        userId,
        "fetch_year_data_success",
        `Year data compiled: ${yearData.length} months, total income: ${totalInkomst}, total expense: ${totalUtgift}`
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
    // Logga fel om vi har session
    try {
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logStartSecurityEvent(
          errorSession.user.id,
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
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const userId = session.user.id;

    if (!(await validateSessionAttempt(userId))) {
      throw new Error("För många försök - vänta 15 minuter");
    }

    await logStartSecurityEvent(
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
          "userId"
        FROM transaktioner
        WHERE "userId" = $1
        ORDER BY id DESC
      `,
        [userId]
      );

      await logStartSecurityEvent(
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
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logStartSecurityEvent(
          errorSession.user.id,
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
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const userId = session.user.id;

    if (!(await validateSessionAttempt(userId))) {
      throw new Error("För många försök - vänta 15 minuter");
    }

    await logStartSecurityEvent(userId, "fetch_all_invoices_attempt", "Fetching all user invoices");

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
          "userId"
        FROM fakturor
        WHERE "userId" = $1
        ORDER BY id DESC
      `,
        [userId]
      );

      await logStartSecurityEvent(
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
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logStartSecurityEvent(
          errorSession.user.id,
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
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const userId = session.user.id;

    // Validera och rensa input
    if (!fakturaId || isNaN(fakturaId) || fakturaId <= 0) {
      throw new Error("Ogiltigt faktura-ID");
    }

    if (!(await validateSessionAttempt(userId))) {
      throw new Error("För många försök - vänta 15 minuter");
    }

    await logStartSecurityEvent(
      userId,
      "delete_invoice_attempt",
      `Attempting to delete invoice ID: ${fakturaId}`
    );

    const client = await pool.connect();
    try {
      // 🔒 SÄKER BORTTAGNING - Endast användarens egna fakturor
      const deleteRes = await client.query(
        'DELETE FROM fakturor WHERE id = $1 AND "userId" = $2 RETURNING id',
        [fakturaId, userId]
      );

      if (deleteRes.rowCount === 0) {
        await logStartSecurityEvent(
          userId,
          "delete_invoice_unauthorized",
          `Unauthorized attempt to delete invoice ID: ${fakturaId}`
        );
        throw new Error("Faktura hittades inte eller du saknar behörighet");
      }

      await logStartSecurityEvent(
        userId,
        "delete_invoice_success",
        `Deleted invoice ID: ${fakturaId}`
      );

      return { success: true, message: "Faktura raderad" };
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har session
    try {
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logStartSecurityEvent(
          errorSession.user.id,
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
  const client = await pool.connect();
  try {
    await client.query(`UPDATE fakturor SET fakturanummer = $1 WHERE id = $2`, [nyttNummer, id]);
  } finally {
    client.release();
  }
}

export async function saveInvoice(data: any) {
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
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const userId = session.user.id;

    if (!(await validateSessionAttempt(userId))) {
      throw new Error("För många försök - vänta 15 minuter");
    }

    const client = await pool.connect();
    try {
      let query = `SELECT COUNT(*) FROM förval WHERE "userId" = $1`;
      let params = [userId];

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
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const userId = session.user.id;

    if (!(await validateSessionAttempt(userId))) {
      throw new Error("För många försök - vänta 15 minuter");
    }

    // 🔒 INDATAVALIDERING
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

    if (!id || isNaN(id) || id <= 0) {
      throw new Error("Ogiltigt ID");
    }

    await logStartSecurityEvent(
      userId,
      "update_forval_attempt",
      `Updating förval ID: ${id}, column: ${kolumn}`
    );

    const client = await pool.connect();

    try {
      let query = "";
      let value: any = sanitizeInput(nyttVärde);

      if (kolumn === "konton" || kolumn === "sökord") {
        // 🔒 SÄKER JSON-HANTERING
        try {
          JSON.parse(value);
        } catch {
          throw new Error("Ogiltigt JSON-format");
        }
        query = `UPDATE förval SET ${kolumn} = $1::jsonb WHERE id = $2 AND "userId" = $3`;
      } else if (kolumn === "momssats") {
        if (isNaN(parseFloat(value))) {
          throw new Error("Ogiltigt momssats-värde");
        }
        query = `UPDATE förval SET ${kolumn} = $1::real WHERE id = $2 AND "userId" = $3`;
      } else {
        query = `UPDATE förval SET ${kolumn} = $1 WHERE id = $2 AND "userId" = $3`;
      }

      const result = await client.query(query, [value, id, userId]);

      if (result.rowCount === 0) {
        await logStartSecurityEvent(
          userId,
          "update_forval_unauthorized",
          `Unauthorized attempt to update förval ID: ${id}`
        );
        throw new Error("Förval hittades inte eller du saknar behörighet");
      }

      await logStartSecurityEvent(userId, "update_forval_success", `Updated förval ID: ${id}`);
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har session
    try {
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logStartSecurityEvent(
          errorSession.user.id,
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
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const userId = session.user.id;

    if (!(await validateSessionAttempt(userId))) {
      throw new Error("För många försök - vänta 15 minuter");
    }

    if (!id || isNaN(id) || id <= 0) {
      throw new Error("Ogiltigt ID");
    }

    await logStartSecurityEvent(
      userId,
      "delete_forval_attempt",
      `Attempting to delete förval ID: ${id}`
    );

    const client = await pool.connect();
    try {
      // 🔒 SÄKER BORTTAGNING - Endast användarens egna förval
      const result = await client.query(
        `DELETE FROM förval WHERE id = $1 AND "userId" = $2 RETURNING id`,
        [id, userId]
      );

      if (result.rowCount === 0) {
        await logStartSecurityEvent(
          userId,
          "delete_forval_unauthorized",
          `Unauthorized attempt to delete förval ID: ${id}`
        );
        throw new Error("Förval hittades inte eller du saknar behörighet");
      }

      await logStartSecurityEvent(userId, "delete_forval_success", `Deleted förval ID: ${id}`);
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har session
    try {
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logStartSecurityEvent(
          errorSession.user.id,
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
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const userId = session.user.id;

    if (!(await validateSessionAttempt(userId))) {
      throw new Error("För många försök - vänta 15 minuter");
    }

    if (!id || isNaN(id) || id <= 0) {
      throw new Error("Ogiltigt ID");
    }

    await logStartSecurityEvent(
      userId,
      "delete_transaction_attempt",
      `Attempting to delete transaction ID: ${id}`
    );

    const client = await pool.connect();
    try {
      // 🔒 SÄKER BORTTAGNING - Endast användarens egna transaktioner
      const result = await client.query(
        `DELETE FROM transaktioner WHERE id = $1 AND "userId" = $2 RETURNING id`,
        [id, userId]
      );

      if (result.rowCount === 0) {
        await logStartSecurityEvent(
          userId,
          "delete_transaction_unauthorized",
          `Unauthorized attempt to delete transaction ID: ${id}`
        );
        throw new Error("Transaktion hittades inte eller du saknar behörighet");
      }

      await logStartSecurityEvent(
        userId,
        "delete_transaction_success",
        `Deleted transaction ID: ${id}`
      );
    } finally {
      client.release();
    }
  } catch (error) {
    // Logga fel om vi har session
    try {
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logStartSecurityEvent(
          errorSession.user.id,
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
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const userId = session.user.id;

    if (!(await validateSessionAttempt(userId))) {
      throw new Error("För många försök - vänta 15 minuter");
    }

    await logStartSecurityEvent(
      userId,
      "fetch_forval_errors_attempt",
      "Fetching förval with errors"
    );

    const client = await pool.connect();

    try {
      // 🔒 SÄKER DATABASACCESS - Användarens data
      const kontonResult = await client.query(
        'SELECT kontonummer FROM konton WHERE "userId" = $1',
        [userId]
      );
      const giltigaKonton = kontonResult.rows.map((row) => row.kontonummer);

      const forvalResult = await client.query('SELECT * FROM förval WHERE "userId" = $1', [userId]);

      const felaktiga = forvalResult.rows.filter((f) => {
        try {
          const konton = Array.isArray(f.konton) ? f.konton : JSON.parse(f.konton);
          return konton.some(
            (konto: any) => konto.kontonummer && !giltigaKonton.includes(konto.kontonummer)
          );
        } catch (err) {
          console.error("❌ JSON parse-fel i förval id:", f.id);
          return true;
        }
      });

      await logStartSecurityEvent(
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
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logStartSecurityEvent(
          errorSession.user.id,
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
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Åtkomst nekad - ingen giltig session");
    }

    const userId = session.user.id;

    if (!(await validateSessionAttempt(userId))) {
      throw new Error("För många försök - vänta 15 minuter");
    }

    await logStartSecurityEvent(userId, "upload_pdf_attempt", "Attempting PDF upload");

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

    await logStartSecurityEvent(
      userId,
      "upload_pdf_success",
      `Uploaded PDF: ${safeFileName} to ${blob.url}`
    );

    return { success: true, blob };
  } catch (error) {
    // Logga fel om vi har session
    try {
      const errorSession = await auth();
      if (errorSession?.user?.id) {
        await logStartSecurityEvent(
          errorSession.user.id,
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
