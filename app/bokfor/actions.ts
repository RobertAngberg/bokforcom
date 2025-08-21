//#region Use server, imports, pool
"use server";

import { Pool } from "pg";
import { formatSEK } from "../_utils/format";
import { getUserId, getSessionAndUserId, requireOwnership } from "../_utils/authUtils";
import { dateTillÅÅÅÅMMDD, stringTillDate } from "../_utils/datum";
import { sanitizeFormInput } from "../_utils/validationUtils";
import OpenAI from "openai";
import { invalidateBokförCache } from "./invalidateBokförCache";
import { put } from "@vercel/blob";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
//#endregion

// Säker text-sanitization för OpenAI input
function sanitizeOCRText(text: string): string {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/[<>'"&{}]/g, "") // Ta bort potentiellt farliga tecken
    .replace(/\s+/g, " ") // Normalisera whitespace
    .trim()
    .substring(0, 2000); // Begränsa längd för API-anrop
}

export async function extractDataFromOCR(text: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  try {
    // Sanitize input before sending to OpenAI
    const safeText = sanitizeOCRText(text);

    if (!safeText) {
      return { datum: "", belopp: 0 };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content:
            'Extract date and amount from OCR text. Respond with *raw* JSON only (no markdown, no triple backticks). Format: { "datum": "YYYY-MM-DD", "belopp": 1234.56 }.',
        },
        { role: "user", content: safeText },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (content && content.startsWith("{")) {
      const parsed = JSON.parse(content);
      return parsed;
    }

    return { datum: "", belopp: 0 };
  } catch (error) {
    console.error("extractDataFromOCR error"); // Mindre detaljerade loggar
    return { datum: "", belopp: 0 };
  }
}

export async function extractDataFromOCRLevFakt(text: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  try {
    // Sanitize input before sending to OpenAI
    const safeText = sanitizeOCRText(text);

    if (!safeText) {
      return {
        leverantör: "",
        fakturadatum: null,
        förfallodatum: null,
        fakturanummer: "",
        belopp: 0,
        betaldatum: null,
      };
    }
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `Extract all relevant invoice data from OCR text. This is a supplier invoice (leverantörsfaktura). 
          
          Look for:
          - Supplier/company name (leverantör)
          - Invoice date (fakturadatum) 
          - Due date (förfallodatum)
          - Invoice number (fakturanummer)
          - Total amount (belopp)
          - Payment date if mentioned (betaldatum)
          
          Respond with *raw* JSON only (no markdown, no triple backticks). 
          Format: {
            "leverantör": "Company Name",
            "fakturadatum": "YYYY-MM-DD",
            "förfallodatum": "YYYY-MM-DD", 
            "fakturanummer": "12345",
            "belopp": 1234.56,
            "betaldatum": "YYYY-MM-DD"
          }
          
          If a field cannot be determined, use empty string "" for text fields, null for dates, or 0 for amount.`,
        },
        { role: "user", content: safeText },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (content && content.startsWith("{")) {
      const parsed = JSON.parse(content);
      console.log("✅ Leverantörsfaktura OCR extracted:", parsed);
      return parsed;
    }

    console.warn("⚠️ GPT unstructured content:", content);
    return {
      leverantör: "",
      fakturadatum: null,
      förfallodatum: null,
      fakturanummer: "",
      belopp: 0,
      betaldatum: null,
    };
  } catch (error) {
    console.error("❌ extractDataFromOCRLevFakt error:", error);
    return {
      leverantör: "",
      fakturadatum: null,
      förfallodatum: null,
      fakturanummer: "",
      belopp: 0,
      betaldatum: null,
    };
  }
}

export async function getKontoklass(kontonummer: string) {
  try {
    const client = await pool.connect();
    const query = "SELECT kontoklass FROM konton WHERE kontonummer = $1";
    const res = await client.query(query, [kontonummer]);

    console.log("🔎 SQL result:", res.rows);
    client.release();

    if (res.rows.length === 0) {
      console.warn("⛔ Konto inte funnet för kontonummer:", kontonummer);
      return null;
    }

    return res.rows[0].kontoklass;
  } catch (error) {
    console.error("❌ getKontoklass error:", error);
    return null;
  }
}

export async function extractDataFromOCRKundfaktura(text: string) {
  console.log("🧠 Extracting kundfaktura data from OCR text:", text);

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: `Extract invoice data from OCR text. This is for creating a customer invoice (kundfaktura).
          
          IMPORTANT: Look specifically for:
          - Invoice date (fakturadatum) - the date when the invoice was issued
          - Due date (förfallodatum) - when payment is due 
          - Amount (belopp) - total invoice amount
          
          Do NOT confuse invoice date with payment date or transaction date.
          The invoice date is when the service/product was delivered or when the invoice was created.
          
          Respond with *raw* JSON only (no markdown, no triple backticks). 
          Format: {
            "fakturadatum": "YYYY-MM-DD",
            "förfallodatum": "YYYY-MM-DD", 
            "belopp": 1234.56
          }
          
          If a field cannot be determined, use null for dates or 0 for amount.`,
        },
        { role: "user", content: text },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (content && content.startsWith("{")) {
      const parsed = JSON.parse(content);
      console.log("✅ Kundfaktura OCR extracted:", parsed);
      return parsed;
    }

    console.warn("⚠️ GPT unstructured content:", content);
    return {
      fakturadatum: null,
      förfallodatum: null,
      belopp: 0,
    };
  } catch (error) {
    console.error("❌ extractDataFromOCRKundfaktura error:", error);
    return {
      fakturadatum: null,
      förfallodatum: null,
      belopp: 0,
    };
  }
}

export async function hämtaBokföringsmetod() {
  const userId = await getUserId();

  try {
    const client = await pool.connect();
    const query = "SELECT bokföringsmetod FROM users WHERE id = $1";
    const res = await client.query(query, [userId]);
    client.release();

    if (res.rows.length === 0) {
      console.warn("⛔ Användare inte funnen:", userId);
      return "Kontantmetoden"; // Default fallback
    }

    return res.rows[0].bokföringsmetod || "Kontantmetoden";
  } catch (error) {
    console.error("❌ hämtaBokföringsmetod error:", error);
    return "Kontantmetoden"; // Default fallback
  }
}

export async function taBortTransaktion(id: number) {
  const userId = await getUserId();

  const client = await pool.connect();
  try {
    // Säkerhetskontroll: Kontrollera att transaktionen tillhör användaren
    const ownerCheck = await client.query(`SELECT user_id FROM transaktioner WHERE id = $1`, [id]);

    if (ownerCheck.rows.length === 0) {
      throw new Error("Transaktionen hittades inte");
    }

    await requireOwnership(ownerCheck.rows[0].user_id);

    // Ta bort transaktionen
    await client.query(`DELETE FROM transaktioner WHERE id = $1`, [id]);
  } finally {
    client.release();
  }
}

export async function loggaFavoritförval(forvalId: number) {
  const userId = await getUserId();

  try {
    await pool.query(
      `
      INSERT INTO favoritförval (user_id, forval_id, antal, senaste)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (user_id, forval_id)
      DO UPDATE SET antal = favoritförval.antal + 1, senaste = NOW()
      `,
      [userId, forvalId]
    );
    console.log(`🌟 Favoritförval uppdaterad för user ${userId}, förval ${forvalId}`);
  } catch (error) {
    console.error("❌ loggaFavoritförval error:", error);
  }
}

export async function hamtaFavoritforval(): Promise<any[]> {
  const userId = await getUserId();

  try {
    const result = await pool.query(
      `
      SELECT f.*
      FROM favoritförval ff
      JOIN förval f ON ff.forval_id = f.id
      WHERE ff.user_id = $1
      ORDER BY ff.antal DESC, ff.senaste DESC
      LIMIT 10
      `,
      [userId]
    );

    console.log(`📥 Hittade ${result.rows.length} favoritförval för user ${userId}`);
    return result.rows;
  } catch (error) {
    console.error("❌ hamtaFavoritforval error:", error);
    return [];
  }
}

// Whitelist för tillåtna kolumner
const ALLOWED_CATEGORIES = ["Försäljning", "Inköp", "Moms", "Löner", "Administration", "Övriga"];
const ALLOWED_TYPES = ["Kundfaktura", "Leverantörsfaktura", "Utlägg", "Allmän"];

export async function fetchAllaForval(filters?: { sök?: string; kategori?: string; typ?: string }) {
  let query = "SELECT * FROM förval";
  const values: any[] = [];
  const conditions: string[] = [];

  if (filters?.sök) {
    const safeSearch = sanitizeFormInput(filters.sök);
    if (safeSearch) {
      conditions.push(
        `(LOWER(namn) LIKE $${values.length + 1} OR LOWER(beskrivning) LIKE $${values.length + 1})`
      );
      values.push(`%${safeSearch.toLowerCase()}%`);
    }
  }

  if (filters?.kategori && ALLOWED_CATEGORIES.includes(filters.kategori)) {
    conditions.push(`kategori = $${values.length + 1}`);
    values.push(filters.kategori);
  }

  if (filters?.typ && ALLOWED_TYPES.includes(filters.typ)) {
    conditions.push(`typ = $${values.length + 1}`);
    values.push(filters.typ);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(" AND ");
  }

  query += ` ORDER BY namn`;

  const res = await pool.query(query, values);
  return res.rows;
}

export async function fetchFavoritforval() {
  const userId = await getUserId();

  const query = `
    SELECT f.*
    FROM favoritförval ff
    JOIN förval f ON ff.forval_id = f.id
    WHERE ff.user_id = $1
    ORDER BY ff.antal DESC
    LIMIT 5
  `;

  const client = await pool.connect();
  try {
    const res = await client.query(query, [userId]);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function fetchTransactionWithBlob(transactionId: number) {
  const userId = await getUserId();

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT *, blob_url FROM transaktioner WHERE id = $1 AND "user_id" = $2`,
      [transactionId, userId]
    );

    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function hämtaAnställda() {
  const userId = await getUserId();

  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT id, förnamn, efternamn FROM anställda WHERE user_id = $1 ORDER BY förnamn, efternamn",
      [userId]
    );

    return result.rows;
  } finally {
    client.release();
  }
}

// Säker filnamn-sanitization
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Ersätt osäkra tecken
    .substring(0, 100) // Begränsa längd
    .toLowerCase();
}

export async function saveTransaction(formData: FormData) {
  const anstalldId = formData.get("anstalldId")?.toString();
  const leverantorId = formData.get("leverantorId")?.toString();
  const userId = await getUserId();

  const transaktionsdatum = formData.get("transaktionsdatum")?.toString().trim() || "";
  const kommentar = formData.get("kommentar")?.toString().trim() || "";
  const fil = formData.get("fil") as File | null;
  const belopp = Number(formData.get("belopp")?.toString() || 0);
  const valtFörval = JSON.parse(formData.get("valtFörval")?.toString() || "{}");

  // Hämta färdiga transaktionsposter från frontend
  const transaktionsposter = JSON.parse(
    formData.get("transaktionsposter")?.toString() || "[]"
  ) as Array<{
    kontonummer: string;
    debet: number;
    kredit: number;
  }>;

  const utlaggMode = formData.get("utlaggMode") === "true";
  const levfaktMode = formData.get("levfaktMode") === "true";

  console.log(`🎯 Processing transaction: ${valtFörval.namn}`);

  // Konvertera transaktionsdatum till korrekt format för PostgreSQL
  let formattedDate = "";
  if (transaktionsdatum) {
    try {
      const date = stringTillDate(transaktionsdatum);
      if (date) {
        formattedDate = dateTillÅÅÅÅMMDD(date);
      } else {
        console.error("Ogiltigt transaktionsdatum");
        throw new Error("Ogiltigt transaktionsdatum");
      }
    } catch (error) {
      console.error("Fel vid datumkonvertering");
      throw new Error("Kunde inte konvertera transaktionsdatum");
    }
  } else {
    throw new Error("Transaktionsdatum saknas");
  }

  let blobUrl = null;
  let filename = "";

  if (fil) {
    try {
      const datum = new Date(transaktionsdatum).toISOString().slice(0, 10);
      const fileExtension = fil.name.split(".").pop() || "";
      const timestamp = Date.now();
      const originalName = sanitizeFilename(fil.name.split(".")[0]);
      filename = `${originalName}-${timestamp}.${fileExtension}`;

      const blobPath = `bokforing/${userId}/${datum}/${filename}`;

      const blob = await put(blobPath, fil, {
        access: "public",
        contentType: fil.type,
        addRandomSuffix: false,
      });

      console.log(`✅ Fil sparad till Blob Storage`);
    } catch (blobError) {
      console.error("Kunde inte spara fil till Blob Storage");
      filename = sanitizeFilename(fil.name);
    }
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `
      INSERT INTO transaktioner (
        transaktionsdatum, kontobeskrivning, belopp, fil, kommentar, "user_id", blob_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id
      `,
      [formattedDate, valtFörval.namn ?? "", belopp, filename, kommentar, userId, blobUrl]
    );
    const transaktionsId = rows[0].id;
    console.log("🆔 Skapad transaktion:", transaktionsId);

    // Spara alla transaktionsposter som beräknats på frontend
    const insertPost = `
      INSERT INTO transaktionsposter
        (transaktions_id, konto_id, debet, kredit)
      VALUES ($1,$2,$3,$4)
    `;

    for (const post of transaktionsposter) {
      const { rows: kontoRows } = await client.query(
        `SELECT id FROM konton WHERE kontonummer::text = $1`,
        [post.kontonummer]
      );

      if (!kontoRows.length) {
        console.warn(`⛔ Konto ${post.kontonummer} hittades inte`);
        continue;
      }

      if (post.debet === 0 && post.kredit === 0) {
        console.log(`⚠️ Skipping konto ${post.kontonummer} because both debet and kredit are 0`);
        continue;
      }

      console.log(`� Sparar post för konto ${post.kontonummer}: D=${post.debet}, K=${post.kredit}`);
      await client.query(insertPost, [transaktionsId, kontoRows[0].id, post.debet, post.kredit]);
    }
    // Skapa utlägg-rad om utläggs-mode och anstalldId finns
    if (utlaggMode && anstalldId) {
      console.log("🔍 Utlägg formData:", {
        userId,
        transaktionsId,
        anstalldId,
        belopp,
        transaktionsdatum,
        kommentar,
      });
      const res = await client.query(
        `INSERT INTO utlägg (user_id, transaktion_id, anställd_id) VALUES ($1, $2, $3) RETURNING *`,
        [userId, transaktionsId, anstalldId]
      );
      console.log("📝 Utlägg SQL-result:", res.rows);
    }

    // Skapa leverantörsfaktura-rad om levfakt-mode
    if (leverantorId) {
      // Hämta leverantörsnamn från databasen
      const leverantörResult = await client.query(
        `SELECT "namn" FROM "leverantörer" WHERE "id" = $1 AND "user_id" = $2`,
        [parseInt(leverantorId), userId]
      );

      const leverantörNamn =
        leverantörResult.rows.length > 0
          ? leverantörResult.rows[0].namn
          : (() => {
              throw new Error(`Leverantör med ID ${leverantorId} hittades inte`);
            })();

      const fakturanummer = formData.get("fakturanummer")?.toString() || null;
      const fakturadatum = formData.get("fakturadatum")?.toString() || null;
      const förfallodatum = formData.get("förfallodatum")?.toString() || null;
      const betaldatum = formData.get("betaldatum")?.toString() || null;

      console.log("🔍 Leverantörsfaktura formData:", {
        userId,
        transaktionsId,
        leverantorId,
        leverantörNamn,
        fakturanummer,
        fakturadatum,
        förfallodatum,
        betaldatum,
        belopp,
      });

      // Formatera datum korrekt för PostgreSQL
      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        const date = stringTillDate(dateStr);
        return date ? dateTillÅÅÅÅMMDD(date) : null;
      };

      const formattedFakturadatum = formatDate(fakturadatum);
      const formattedFörfallodatum = formatDate(förfallodatum);
      const formattedBetaldatum = formatDate(betaldatum);

      const res = await client.query(
        `INSERT INTO leverantörsfakturor (
          "user_id", transaktions_id, leverantör_namn, leverantor_id, fakturanummer, 
          fakturadatum, förfallodatum, betaldatum, belopp, status_betalning, status_bokförd
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          userId,
          transaktionsId,
          leverantörNamn,
          parseInt(leverantorId),
          fakturanummer,
          formattedFakturadatum,
          formattedFörfallodatum,
          formattedBetaldatum,
          belopp,
          formattedBetaldatum ? "Betald" : "Obetald", // status_betalning
          "Bokförd", // status_bokförd
        ]
      );
      console.log("📝 Leverantörsfaktura SQL-result:", res.rows);
    }

    client.release();
    await invalidateBokförCache();
    return { success: true, id: transaktionsId, blobUrl };
  } catch (err) {
    client.release();
    console.error("❌ saveTransaction error:", err);
    return { success: false, error: (err as Error).message };
  }
}

// Bokför ett utlägg och koppla till transaktion
export async function bokförUtlägg(utläggId: number) {
  const userId = await getUserId();

  const client = await pool.connect();
  try {
    // Hämta utläggsraden
    const { rows: utläggRows } = await client.query(
      `SELECT * FROM utlägg WHERE id = $1 AND user_id = $2`,
      [utläggId, userId]
    );
    if (!utläggRows.length) throw new Error("Utlägg hittades inte");
    const utlägg = utläggRows[0];

    // Skapa transaktion
    const { rows: transRows } = await client.query(
      `INSERT INTO transaktioner (
        transaktionsdatum, kontobeskrivning, belopp, fil, kommentar, "user_id"
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        utlägg.datum,
        utlägg.beskrivning || "Utlägg",
        utlägg.belopp,
        utlägg.kvitto_fil || null,
        utlägg.kommentar || "",
        userId,
      ]
    );
    const transaktionsId = transRows[0].id;

    // Hämta konto-id för 2890 och 1930
    const kontoRes = await client.query(
      `SELECT id, kontonummer FROM konton WHERE kontonummer IN ('2890','1930')`
    );
    const kontoMap = Object.fromEntries(kontoRes.rows.map((r: any) => [r.kontonummer, r.id]));
    if (!kontoMap["2890"] || !kontoMap["1930"]) throw new Error("Konto 2890 eller 1930 saknas");

    // Skapa transaktionsposter
    await client.query(
      `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)`,
      [transaktionsId, kontoMap["2890"], utlägg.belopp, 0]
    );
    await client.query(
      `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)`,
      [transaktionsId, kontoMap["1930"], 0, utlägg.belopp]
    );

    // Uppdatera utlägg med transaktion_id och status
    await client.query(`UPDATE utlägg SET transaktion_id = $1, status = 'Bokförd' WHERE id = $2`, [
      transaktionsId,
      utläggId,
    ]);

    client.release();
    await invalidateBokförCache();
    return { success: true, transaktionsId };
  } catch (err) {
    client.release();
    console.error("❌ bokförUtlägg error:", err);
    return { success: false, error: (err as Error).message };
  }
}
