//#region Use server, imports, pool
"use server";

import { Pool } from "pg";
import { auth } from "../../auth";
import OpenAI from "openai";
import { invalidateBokförCache } from "../_utils/invalidateBokförCache";
import { put } from "@vercel/blob";

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

export async function extractDataFromOCRLevFakt(text: string) {
  console.log("🧠 Extracting leverantörsfaktura data from OCR text:", text);

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  try {
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
        { role: "user", content: text },
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
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen användare inloggad");
  }

  try {
    const client = await pool.connect();
    const query = "SELECT bokföringsmetod FROM users WHERE id = $1";
    const res = await client.query(query, [session.user.id]);
    client.release();

    if (res.rows.length === 0) {
      console.warn("⛔ Användare inte funnen:", session.user.id);
      return "Kontantmetoden"; // Default fallback
    }

    return res.rows[0].bokföringsmetod || "Kontantmetoden";
  } catch (error) {
    console.error("❌ hämtaBokföringsmetod error:", error);
    return "Kontantmetoden"; // Default fallback
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
  const leverantorId = formData.get("leverantorId")?.toString();
  const session = await auth();
  if (!session?.user?.id) throw new Error("Ingen användare inloggad");
  const userId = Number(session.user.id);

  const transaktionsdatum = formData.get("transaktionsdatum")?.toString().trim() || "";
  const kommentar = formData.get("kommentar")?.toString().trim() || "";
  const fil = formData.get("fil") as File | null;

  console.log("📋 Sparar transaktion med leverantorId:", leverantorId);

  // Konvertera transaktionsdatum till korrekt format för PostgreSQL
  let formattedDate = "";
  if (transaktionsdatum) {
    try {
      const date = new Date(transaktionsdatum);
      if (!isNaN(date.getTime())) {
        // Formatera som YYYY-MM-DD för PostgreSQL
        formattedDate = date.toISOString().split("T")[0];
      } else {
        console.error("❌ Ogiltigt datum:", transaktionsdatum);
        throw new Error("Ogiltigt transaktionsdatum");
      }
    } catch (error) {
      console.error("❌ Fel vid datumkonvertering:", error, "Datum:", transaktionsdatum);
      throw new Error("Kunde inte konvertera transaktionsdatum");
    }
  } else {
    throw new Error("Transaktionsdatum saknas");
  }

  console.log("📅 Datum konverterat:", transaktionsdatum, "→", formattedDate);

  const valtFörval = JSON.parse(formData.get("valtFörval")?.toString() || "{}");
  if (!valtFörval?.konton) throw new Error("⛔ Saknar valda förval");

  const moms = Number(formData.get("moms")?.toString() || 0);
  const beloppUtanMoms = Number(formData.get("beloppUtanMoms")?.toString() || 0);
  const belopp = Number(formData.get("belopp")?.toString() || 0);

  const extrafält = JSON.parse(formData.get("extrafält")?.toString() || "{}") as Record<
    string,
    { label?: string; debet: number; kredit: number }
  >;

  // NYTT: Kolla om vi är i utläggs-mode eller leverantörsfaktura-mode
  const utlaggMode = formData.get("utlaggMode") === "true";
  const levfaktMode = formData.get("levfaktMode") === "true";
  console.log(`🔍 DEBUG: utlaggMode = ${utlaggMode}, levfaktMode = ${levfaktMode}`);

  console.log("📥 formData:", {
    transaktionsdatum: formattedDate, // Använd formaterade datumet i debug
    belopp,
    moms,
    beloppUtanMoms,
    utlaggMode,
    levfaktMode,
  });
  console.log(
    `🎯 Processing transaction: ${valtFörval.namn}, specialtyp: ${valtFörval.specialtyp}`
  );
  console.log(`📋 extrafält:`, extrafält);

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

      // blobUrl = blob.url;
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
        formattedDate, // Använd det formaterade datumet istället för new Date()
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

    const getBelopp = (nr: string, typ: "debet" | "kredit") => {
      const klass = nr[0];
      console.log(
        `🔍 getBelopp called: nr=${nr}, typ=${typ}, klass=${klass}, belopp=${belopp}, beloppUtanMoms=${beloppUtanMoms}`
      );

      if (typ === "debet") {
        // CHECKPOINT FIX 2025-07-31: Specifikt för 1930 vid försäljning
        if (nr === "1930" && valtFörval.namn?.includes("Försäljning")) {
          console.log(`💰 Returning belopp ${belopp} for debet 1930 (försäljning)`);
          return belopp;
        }
        // KUNDFAKTURA FIX: 1510 ska få hela beloppet som debet (kundfordringar)
        if (nr === "1510") {
          console.log(`💰 Returning belopp ${belopp} for debet 1510 (kundfordringar)`);
          return belopp;
        }
        // Alla andra klass 1-konton får beloppUtanMoms som tidigare
        if (klass === "1") return beloppUtanMoms;
        if (klass === "2") return moms; // FIXED: 2640 moms-konton som debet
        if (klass === "3") return 0;
        if (klass === "4" || klass === "5" || klass === "6" || klass === "7" || klass === "8")
          return beloppUtanMoms; // FIXED: Kostnader
        return 0;
      }
      // typ === "kredit"
      // CHECKPOINT FIX 2025-07-31: Specifikt för 1930 vid försäljning
      if (nr === "1930" && valtFörval.namn?.includes("Försäljning")) {
        console.log(`💰 Returning 0 for kredit 1930 (försäljning) - should not be credit`);
        return 0;
      }
      // KUNDFAKTURA FIX: 1510 ska inte vara kredit
      if (nr === "1510") {
        console.log(`💰 Returning 0 for kredit 1510 (kundfordringar) - should not be credit`);
        return 0;
      }
      // UTLÄGG FIX: 2890 ska få hela beloppet som kredit (ersätter 1930)
      if (nr === "2890") {
        console.log(`💰 Returning belopp ${belopp} for kredit 2890 (utlägg)`);
        return belopp;
      }
      // LEVERANTÖRSFAKTURA FIX: 2440 ska få hela beloppet som kredit (ersätter 1930)
      if (nr === "2440") {
        console.log(`💰 Returning belopp ${belopp} for kredit 2440 (leverantörsfaktura)`);
        return belopp;
      }
      // Alla andra klass 1-konton får belopp som tidigare
      if (klass === "1") return belopp;
      if (klass === "2") {
        console.log(`💰 Returning moms ${moms} for kredit klass 2 (konto ${nr})`);
        return moms; // FIXED: 2610 utgående moms ska vara kredit vid försäljning
      }
      if (klass === "3") return beloppUtanMoms;
      if (klass === "4" || klass === "5" || klass === "6" || klass === "7" || klass === "8")
        return 0; // Kostnader ska inte vara kredit
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

        // CHECKPOINT FIX 2025-07-31: Använd samma logik som getBelopp för 1930 vid försäljning
        let { debet = 0, kredit = 0 } = data;

        // Om detta är konto 1930 och det är försäljning, använd rätt belopp
        if (nr === "1930" && valtFörval.namn?.includes("Försäljning")) {
          if (debet > 0) {
            debet = belopp; // Hela beloppet som debet, inte beloppUtanMoms
          }
          if (kredit > 0) {
            kredit = 0; // 1930 ska inte vara kredit vid försäljning
          }
        }

        // KUNDFAKTURA FIX: 1510 ska få hela beloppet som debet
        if (nr === "1510") {
          if (debet > 0) {
            debet = belopp; // Hela beloppet som debet
          }
          if (kredit > 0) {
            kredit = 0; // 1510 ska inte vara kredit
          }
        }

        if (debet === 0 && kredit === 0) continue;

        console.log(`➕ Extrafält  ${nr}: D ${debet}  K ${kredit}`);
        await client.query(insertPost, [transaktionsId, rows[0].id, debet, kredit]);
      }
    }

    if (!valtFörval.specialtyp) {
      for (const k of valtFörval.konton) {
        let nr = k.kontonummer?.toString().trim();
        if (!nr) continue;

        // NYTT: Byt ut 1930 mot 2890 om utläggs-mode, eller mot 2440 om leverantörsfaktura-mode, eller mot 1510 om försäljning
        if (utlaggMode && nr === "1930") {
          nr = "2890";
        } else if (levfaktMode && nr === "1930") {
          // Kolla om det är försäljning (kundfaktura)
          if (valtFörval.namn?.includes("Försäljning")) {
            nr = "1510"; // Kundfordringar för kundfakturor
          } else {
            nr = "2440"; // Leverantörsskulder för leverantörsfakturor
          }
        }
        console.log(
          `🔍 Kontokonvertering: utlaggMode=${utlaggMode}, levfaktMode=${levfaktMode}, nr=${nr}`
        );

        const { rows } = await client.query(`SELECT id FROM konton WHERE kontonummer::text=$1`, [
          nr,
        ]);
        if (!rows.length) {
          console.warn(`⛔ Konto ${nr} hittades inte`);
          continue;
        }

        const debet = k.debet ? getBelopp(nr, "debet") : 0;
        const kredit = k.kredit ? getBelopp(nr, "kredit") : 0;
        console.log(
          `📘 Förvalskonto ${nr}: k.debet=${k.debet}, k.kredit=${k.kredit}, calculated D=${debet}, K=${kredit}`
        );

        if (debet === 0 && kredit === 0) {
          console.log(`⚠️ Skipping konto ${nr} because both debet and kredit are 0`);
          continue;
        }

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

    // Skapa leverantörsfaktura-rad om levfakt-mode
    if (leverantorId) {
      // Hämta leverantörsnamn från databasen
      const leverantörResult = await client.query(
        `SELECT "namn" FROM "leverantörer" WHERE "id" = $1 AND "userId" = $2`,
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
        try {
          const date = new Date(dateStr);
          return !isNaN(date.getTime()) ? date.toISOString().split("T")[0] : null;
        } catch {
          return null;
        }
      };

      const formattedFakturadatum = formatDate(fakturadatum);
      const formattedFörfallodatum = formatDate(förfallodatum);
      const formattedBetaldatum = formatDate(betaldatum);

      const res = await client.query(
        `INSERT INTO leverantörsfakturor (
          "userId", transaktions_id, leverantör_namn, leverantor_id, fakturanummer, 
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
