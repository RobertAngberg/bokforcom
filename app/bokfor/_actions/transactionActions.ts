"use server";

import { pool } from "../../_utils/dbPool";
import { hamtaTransaktionsposter as hamtaTransaktionsposterCore } from "../../_utils/transaktioner/hamtaTransaktionsposter";
import { getUserId, requireOwnership } from "../../_utils/authUtils";
import { dateTillÅÅÅÅMMDD, datumTillPostgreSQL } from "../../_utils/trueDatum";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

export async function invalidateBokförCache() {
  revalidatePath("/historik");
  revalidatePath("/rapporter/huvudbok");
  revalidatePath("/rapporter/balansrapport");
  revalidatePath("/rapporter/resultatrapport");
  revalidatePath("/rapporter/momsrapport");
}

export async function hamtaTransaktionsposter(transaktionsId: number) {
  const rows = await hamtaTransaktionsposterCore(transaktionsId);
  return rows.map((r) => ({
    id: r.id,
    kontonummer: r.kontonummer,
    beskrivning: r.kontobeskrivning,
    debet: r.debet,
    kredit: r.kredit,
  }));
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

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9åäöÅÄÖ.\-_]/gi, "")
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
  const bilageUrl = formData.get("bilageUrl")?.toString(); // Den uppladdade blob URL:en
  const belopp = Number(formData.get("belopp")?.toString() || 0);
  const valtFörval = JSON.parse(formData.get("valtFörval")?.toString() || "{}");

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

  // Formatera transaktionsdatum för PostgreSQL
  let formattedDate = "";
  if (transaktionsdatum) {
    // Använd timezone-säker funktion från trueDatum.ts
    formattedDate = datumTillPostgreSQL(transaktionsdatum) || "";
  } else {
    throw new Error("Transaktionsdatum saknas");
  }

  let blobUrl: string | null = null;
  let filename = "";

  // Om bilageUrl finns (filen är redan uppladdad i Steg3), använd den
  if (bilageUrl) {
    blobUrl = bilageUrl;
    filename = bilageUrl.split("/").pop() || "unknown";
    console.log("🔍 DEBUG: Använder befintlig bilageUrl:", blobUrl);
  } else if (fil) {
    // Fallback för gammal kod som skickar fil direkt
    console.log("🔍 DEBUG: Fil namn:", fil.name);
    console.log("🔍 DEBUG: Fil storlek:", fil.size);
    console.log("🔍 DEBUG: Fil typ:", fil.type);

    try {
      const datum = dateTillÅÅÅÅMMDD(new Date(transaktionsdatum));
      const fileExtension = fil.name.split(".").pop() || "";
      const timestamp = Date.now();
      const originalName = sanitizeFilename(fil.name.split(".")[0]);
      filename = `${originalName}-${timestamp}.${fileExtension}`;

      const blobPath = `bokforing/${userId}/${datum}/${filename}`;

      console.log("🔍 DEBUG: Blob path:", blobPath);
      console.log("🔍 DEBUG: Försöker ladda upp fil...");

      const blob = await put(blobPath, fil, {
        access: "public",
        contentType: fil.type,
        addRandomSuffix: false,
      });

      blobUrl = blob.url; // Spara blob URL:en!
      console.log(`✅ Fil sparad till Blob Storage: ${blob.url}`);
      console.log("🔍 DEBUG: blobUrl satt till:", blobUrl);
    } catch (blobError) {
      console.error("❌ Kunde inte spara fil till Blob Storage:", blobError);
      console.log("🔍 DEBUG: Blob error detaljer:", blobError);
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
      RETURNING id, blob_url
      `,
      [formattedDate, valtFörval.namn ?? "", belopp, filename, kommentar, userId, blobUrl]
    );
    const transaktionsId = rows[0].id;
    const sparadBlobUrl = rows[0].blob_url;
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
        // Returnera direkt som string i YYYY-MM-DD format - ingen konvertering via Date-objekt
        return dateStr;
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
          null, // betaldatum ska alltid vara null vid registrering
          belopp,
          "Obetald", // status_betalning ska alltid vara "Obetald" vid registrering
          "Ej bokförd", // status_bokförd ska vara "Ej bokförd" (inte "Registrerad")
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
