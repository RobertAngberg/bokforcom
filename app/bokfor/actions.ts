//#region Use server, imports, pool
"use server";

import { Pool } from "pg";
import { auth } from "@/auth";
import OpenAI from "openai";
import { invalidateBokförCache } from "../_utils/invalidateBokförCache";
import { put } from "@vercel/blob";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
//#endregion

export async function extractDataFromOCR(text: string) {
  console.log("🧠 Extracting data from OCR text:", text);

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content:
            'Extract date and amount from OCR text. Respond with *raw* JSON only (no markdown, no triple backticks). Format: { "datum": "YYYY-MM-DD", "belopp": 1234.56 }.',
        },
        { role: "user", content: text },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (content && content.startsWith("{")) {
      const parsed = JSON.parse(content);
      console.log("✅ OCR extracted:", parsed);
      return parsed;
    }

    console.warn("⚠️ GPT unstructured content:", content);
    return { datum: "", belopp: 0 };
  } catch (error) {
    console.error("❌ extractDataFromOCR error:", error);
    return { datum: "", belopp: 0 };
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

export async function taBortTransaktion(id: number) {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM transaktioner WHERE id = $1`, [id]);
  } finally {
    client.release();
  }
}

export async function loggaFavoritförval(forvalId: number) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    console.warn("⛔ Ingen användare inloggad vid loggaFavoritförval");
    return;
  }

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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    console.warn("⛔ Ingen användare inloggad vid hamtaFavoritforval");
    return [];
  }

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

export async function fetchAllaForval(filters?: { sök?: string; kategori?: string; typ?: string }) {
  let query = "SELECT * FROM förval";
  const values: any[] = [];
  const conditions: string[] = [];

  if (filters?.sök) {
    conditions.push(
      `(LOWER(namn) LIKE $${values.length + 1} OR LOWER(beskrivning) LIKE $${values.length + 1})`
    );
    values.push(`%${filters.sök.toLowerCase()}%`);
  }

  if (filters?.kategori) {
    conditions.push(`kategori = $${values.length + 1}`);
    values.push(filters.kategori);
  }

  if (filters?.typ) {
    conditions.push(`LOWER(typ) = $${values.length + 1}`);
    values.push(filters.typ.toLowerCase());
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(" AND ");
  }

  query += ` ORDER BY namn`;

  const res = await pool.query(query, values);
  return res.rows;
}

export async function fetchFavoritforval() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = parseInt(session.user.id);

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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Ingen användare inloggad");

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT *, blob_url FROM transaktioner WHERE id = $1 AND "userId" = $2`,
      [transactionId, Number(session.user.id)]
    );

    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

export async function processImageOCR(imageBase64: string): Promise<string> {
  console.log("🤖 Server OCR startar...");

  try {
    const buffer = Buffer.from(imageBase64, "base64");

    // Tesseract vill ha Buffer direkt, inte Uint8Array
    const result = await Tesseract.recognize(buffer, "swe+eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`🤖 Server OCR: ${(m.progress * 100).toFixed(1)}%`);
        }
      },
    });

    console.log("✅ Server OCR klar");
    return result.data.text;
  } catch (error) {
    console.error("❌ Server OCR fel:", error);
    return "";
  }
}

export async function extractPDFText(pdfBase64: string): Promise<string> {
  console.log("📄 Server PDF-extraktion startar...");

  try {
    const buffer = Buffer.from(pdfBase64, "base64");

    // PDF.js vill ha Uint8Array
    const uint8Array = new Uint8Array(buffer);

    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    console.log("✅ Server PDF-extraktion klar");
    return fullText.trim();
  } catch (error) {
    console.error("❌ Server PDF-extraktion fel:", error);
    return "";
  }
}

export async function hämtaAnställda() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Inte inloggad");
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT id, förnamn, efternamn FROM anställda WHERE user_id = $1 ORDER BY förnamn, efternamn",
      [session.user.id]
    );

    return result.rows;
  } finally {
    client.release();
  }
}

export async function saveTransaction(formData: FormData) {
  const anstalldId = formData.get("anstalldId")?.toString();
  const session = await auth();
  if (!session?.user?.id) throw new Error("Ingen användare inloggad");
  const userId = Number(session.user.id);

  const transaktionsdatum = formData.get("transaktionsdatum")?.toString().trim() || "";
  const kommentar = formData.get("kommentar")?.toString().trim() || "";
  const fil = formData.get("fil") as File | null;

  const valtFörval = JSON.parse(formData.get("valtFörval")?.toString() || "{}");
  if (!valtFörval?.konton) throw new Error("⛔ Saknar valda förval");

  const moms = Number(formData.get("moms")?.toString() || 0);
  const beloppUtanMoms = Number(formData.get("beloppUtanMoms")?.toString() || 0);
  const belopp = Number(formData.get("belopp")?.toString() || 0);

  const extrafält = JSON.parse(formData.get("extrafält")?.toString() || "{}") as Record<
    string,
    { label?: string; debet: number; kredit: number }
  >;

  // NYTT: Kolla om vi är i utläggs-mode
  const utlaggMode = formData.get("utlaggMode") === "true";

  console.log("📥 formData:", {
    transaktionsdatum,
    belopp,
    moms,
    beloppUtanMoms,
    utlaggMode,
  });

  let blobUrl = null;
  let filename = "";

  if (fil) {
    try {
      const datum = new Date(transaktionsdatum).toISOString().slice(0, 10);
      const fileExtension = fil.name.split(".").pop() || "";
      const timestamp = Date.now();
      const originalName = fil.name.split(".")[0];
      filename = `${originalName}-${timestamp}.${fileExtension}`;

      const blobPath = `bokforing/${userId}/${datum}/${filename}`;

      const blob = await put(blobPath, fil, {
        access: "public",
        contentType: fil.type,
        addRandomSuffix: false,
      });

      blobUrl = blob.url;
      console.log(`✅ Fil sparad till Blob Storage: ${blobUrl}`);
    } catch (blobError) {
      console.error("❌ Kunde inte spara fil till Blob Storage:", blobError);
      filename = fil.name;
    }
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `
      INSERT INTO transaktioner (
        transaktionsdatum, kontobeskrivning, belopp, fil, kommentar, "userId", blob_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id
      `,
      [
        new Date(transaktionsdatum),
        valtFörval.namn ?? "",
        belopp,
        filename,
        kommentar,
        userId,
        blobUrl,
      ]
    );
    const transaktionsId = rows[0].id;
    console.log("🆔  Skapad transaktion:", transaktionsId);

    const insertPost = `
      INSERT INTO transaktionsposter
        (transaktions_id, konto_id, debet, kredit)
      VALUES ($1,$2,$3,$4)
    `;

    const getBelopp = (nr: string, typ: "debet" | "kredit"): number => {
      const klass = nr[0];
      if (typ === "debet") {
        if (klass === "1") return belopp;
        if (klass === "2") return moms;
        return beloppUtanMoms;
      }
      if (klass === "1") return belopp;
      if (nr.startsWith("20")) return belopp;
      if (klass === "2") return moms;
      if (klass === "3") return beloppUtanMoms;
      return 0;
    };

    if (Object.keys(extrafält).length) {
      for (const [nr, data] of Object.entries(extrafält)) {
        const { rows } = await client.query(`SELECT id FROM konton WHERE kontonummer::text=$1`, [
          nr,
        ]);
        if (!rows.length) {
          console.warn(`⛔ Konto ${nr} hittades inte`);
          continue;
        }

        const { debet = 0, kredit = 0 } = data;
        if (debet === 0 && kredit === 0) continue;

        console.log(`➕ Extrafält  ${nr}: D ${debet}  K ${kredit}`);
        await client.query(insertPost, [transaktionsId, rows[0].id, debet, kredit]);
      }
    }

    if (!valtFörval.specialtyp) {
      for (const k of valtFörval.konton) {
        let nr = k.kontonummer?.toString().trim();
        if (!nr) continue;

        // NYTT: Byt ut 1930 mot 2890 om utläggs-mode
        if (utlaggMode && nr === "1930") nr = "2890";

        const { rows } = await client.query(`SELECT id FROM konton WHERE kontonummer::text=$1`, [
          nr,
        ]);
        if (!rows.length) {
          console.warn(`⛔ Konto ${nr} hittades inte`);
          continue;
        }

        const debet = k.debet ? getBelopp(nr, "debet") : 0;
        const kredit = k.kredit ? getBelopp(nr, "kredit") : 0;
        if (debet === 0 && kredit === 0) continue;

        console.log(`📘 Förvalskonto ${nr}: D ${debet}  K ${kredit}`);
        await client.query(insertPost, [transaktionsId, rows[0].id, debet, kredit]);
      }
    } else {
      console.log("⏭️  Förvalskonton hoppas över – specialtyp:", valtFörval.specialtyp);
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
  const session = await auth();
  if (!session?.user?.id) throw new Error("Ingen användare inloggad");
  const userId = Number(session.user.id);

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
        transaktionsdatum, kontobeskrivning, belopp, fil, kommentar, "userId"
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
