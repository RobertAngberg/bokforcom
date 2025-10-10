"use server";

import { pool } from "../../_lib/db";
import { put } from "@vercel/blob";
import { validateId, sanitizeInput, validateYear } from "../../_utils/validationUtils";
import { ensureSession } from "../../_utils/session";
import type { FörvalFilter, SaveInvoiceData, UploadResult, DeleteResult } from "../types/types";

// 🎉 VÄLKOMSTMEDDELANDE FUNKTIONER
export async function checkWelcomeStatus(): Promise<boolean> {
  try {
    await ensureSession();

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
    const { userId } = await ensureSession();
    const client = await pool.connect();

    await client.query('UPDATE "user" SET welcome_shown = true WHERE id = $1', [userId]);

    client.release();
  } catch (error) {
    console.error("Error marking welcome as shown:", error);
  }
}

// 🔒 ENTERPRISE SÄKERHETSFUNKTIONER FÖR START-MODUL

export async function hamtaTransaktionsposter(transaktionsId: number) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

    // Validera input
    if (!transaktionsId || transaktionsId <= 0) {
      throw new Error("Ogiltigt transaktions-ID");
    }

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

    return result.rows;
  } catch (error) {
    console.error("❌ hamtaTransaktionsposter error:", error);
    return [];
  }
}

export async function fetchAllaForval(filters?: FörvalFilter) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

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

    return res.rows;
  } catch (error) {
    console.error("❌ fetchAllaForval error:", error);
    return [];
  }
}

export async function fetchRawYearData(year: string) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

    // Validera och sanitera år
    const sanitizedYear = sanitizeInput(year);
    const yearNum = parseInt(sanitizedYear);
    if (!validateYear(yearNum)) {
      throw new Error("Ogiltigt år");
    }

    const start = new Date(`${yearNum}-01-01`);
    const end = new Date(`${yearNum + 1}-01-01`);

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

      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ fetchRawYearData error:", error);
    return [];
  }
}

export async function hamtaAllaTransaktioner() {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

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

      return res.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ hamtaAllaTransaktioner error:", error);
    return [];
  }
}

export async function getAllInvoices() {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

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

      return res.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ getAllInvoices error:", error);
    return [];
  }
}

export async function deleteInvoice(fakturaId: number): Promise<DeleteResult> {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

    // Validera och rensa input
    if (!fakturaId || isNaN(fakturaId) || fakturaId <= 0) {
      throw new Error("Ogiltigt faktura-ID");
    }

    const client = await pool.connect();
    try {
      // 🔒 SÄKER BORTTAGNING - Endast användarens egna fakturor
      const deleteRes = await client.query(
        'DELETE FROM fakturor WHERE id = $1 AND "user_id" = $2 RETURNING id',
        [fakturaId, userId]
      );

      if (deleteRes.rowCount === 0) {
        throw new Error("Faktura hittades inte eller du saknar behörighet");
      }

      return { success: true, message: "Faktura raderad" };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ deleteInvoice error:", error);
    return { success: false, message: "Kunde inte radera faktura" };
  }
}

export async function updateFakturanummer(id: number, nyttNummer: string) {
  // 🔒 SÄKERHETSVALIDERING - Session
  const { userId } = await ensureSession();

  if (!validateId(id)) {
    throw new Error("Ogiltigt faktura-ID");
  }

  const safeNummer = sanitizeInput(nyttNummer, 50); // Begränsa till 50 tecken
  if (!safeNummer) {
    throw new Error("Ogiltigt fakturanummer");
  }

  const client = await pool.connect();
  try {
    const res = await client.query(
      `UPDATE fakturor SET fakturanummer = $1 WHERE id = $2 AND user_id = $3`,
      [safeNummer, id, userId]
    );

    if (res.rowCount === 0) {
      throw new Error("Faktura hittades inte eller otillåten åtkomst");
    }
  } finally {
    client.release();
  }
}

export async function saveInvoice(data: SaveInvoiceData) {
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

export async function hamtaForvalMedSokning(sök: string, offset: number, limit: number) {
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
    console.error("❌ hamtaForvalMedSokning error:", err);
    return [];
  } finally {
    client.release();
  }
}

export async function raknaForval(sök?: string) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

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
    console.error("❌ raknaForval error:", error);
    return 0;
  }
}

export async function uppdateraForval(id: number, kolumn: string, nyttVärde: string) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

    if (!validateId(id)) {
      throw new Error("Ogiltigt ID");
    }

    const sanitizedValue = sanitizeInput(nyttVärde);

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
      throw new Error(`Ogiltig kolumn: ${kolumn}`);
    }

    const client = await pool.connect();
    try {
      let queryText = "";
      let params: (string | number)[] = [];

      if (kolumn === "konton" || kolumn === "sökord") {
        try {
          JSON.parse(sanitizedValue);
        } catch {
          throw new Error("Ogiltigt JSON-format");
        }

        queryText = `UPDATE förval SET "${kolumn}" = $1::jsonb WHERE id = $2 AND "user_id" = $3`;
        params = [sanitizedValue, id, userId];
      } else if (kolumn === "momssats") {
        if (isNaN(parseFloat(sanitizedValue))) {
          throw new Error("Ogiltigt momssats-värde");
        }

        queryText = `UPDATE förval SET "${kolumn}" = $1::real WHERE id = $2 AND "user_id" = $3`;
        params = [sanitizedValue, id, userId];
      } else {
        queryText = `UPDATE förval SET "${kolumn}" = $1 WHERE id = $2 AND "user_id" = $3`;
        params = [sanitizedValue, id, userId];
      }

      const result = await client.query(queryText, params);

      if (result.rowCount === 0) {
        throw new Error("Förval hittades inte eller du saknar behörighet");
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ uppdateraForval error:", error);
    throw error;
  }
}

export async function taBortForval(id: number) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

    if (!validateId(id)) {
      throw new Error("Ogiltigt ID");
    }

    const client = await pool.connect();
    try {
      // 🔒 SÄKER BORTTAGNING - Endast användarens egna förval
      const result = await client.query(
        `DELETE FROM förval WHERE id = $1 AND "user_id" = $2 RETURNING id`,
        [id, userId]
      );

      if (result.rowCount === 0) {
        throw new Error("Förval hittades inte eller du saknar behörighet");
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ taBortForval error:", error);
    throw error;
  }
}

export async function taBortTransaktion(id: number) {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

    if (!validateId(id)) {
      throw new Error("Ogiltigt ID");
    }

    const client = await pool.connect();
    try {
      // 🔒 SÄKER BORTTAGNING - Endast användarens egna transaktioner
      const result = await client.query(
        `DELETE FROM transaktioner WHERE id = $1 AND "user_id" = $2 RETURNING id`,
        [id, userId]
      );

      if (result.rowCount === 0) {
        throw new Error("Transaktion hittades inte eller du saknar behörighet");
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ taBortTransaktion error:", error);
    throw error;
  }
}

export async function fetchForvalMedFel() {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

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

      return felaktiga;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ fetchForvalMedFel error:", error);
    return [];
  }
}

export async function uploadPDF(formData: FormData): Promise<UploadResult> {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session
    const { userId } = await ensureSession();

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

    return { success: true, blob };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Okänt fel" };
  }
}
