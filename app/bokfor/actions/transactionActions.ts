"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { dateToYyyyMmDd, datumTillPostgreSQL } from "../../_utils/datum";
import { sanitizeInput } from "../../_utils/validationUtils";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";

export async function invalidateBokforCache() {
  revalidatePath("/historik");
  revalidatePath("/rapporter");
}

export async function taBortTransaktion(id: number) {
  const client = await pool.connect();
  try {
    const { userId } = await ensureSession();

    // Säkerhetskontroll: Kontrollera att transaktionen tillhör användaren
    const ownerCheck = await client.query(`SELECT user_id FROM transaktioner WHERE id = $1`, [id]);

    if (ownerCheck.rows.length === 0) {
      throw new Error("Transaktionen hittades inte");
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      throw new Error("Otillåten åtkomst: Du äger inte denna transaktion");
    }

    // Ta bort transaktionen
    await client.query(`DELETE FROM transaktioner WHERE id = $1`, [id]);
  } finally {
    client.release();
  }
}

export async function fetchTransactionWithBlob(transactionId: number) {
  const { userId } = await ensureSession();

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
  const { userId } = await ensureSession();

  const transaktionsdatum = formData.get("transaktionsdatum")?.toString() || "";
  const kommentar = sanitizeInput(formData.get("kommentar")?.toString() || "", 500);
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

  // Formatera transaktionsdatum för PostgreSQL
  let formattedDate = "";
  if (transaktionsdatum) {
    // Använd timezone-säker funktion från datum.ts
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
  } else if (fil) {
    // Fallback för gammal kod som skickar fil direkt
    try {
      const datum = dateToYyyyMmDd(new Date(transaktionsdatum));
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

      blobUrl = blob.url; // Spara blob URL:en!
    } catch (blobError) {
      console.error("❌ Kunde inte spara fil till Blob Storage:", blobError);
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
        continue;
      }

      await client.query(insertPost, [transaktionsId, kontoRows[0].id, post.debet, post.kredit]);
    }
    // Skapa utlägg-rad om utläggs-mode och anstalldId finns
    if (utlaggMode && anstalldId) {
      await client.query(
        `INSERT INTO utlägg (user_id, transaktion_id, anställd_id) VALUES ($1, $2, $3) RETURNING *`,
        [userId, transaktionsId, anstalldId]
      );
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

      // Formatera datum korrekt för PostgreSQL
      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        // Returnera direkt som string i YYYY-MM-DD format - ingen konvertering via Date-objekt
        return dateStr;
      };

      const formattedFakturadatum = formatDate(fakturadatum);
      const formattedFörfallodatum = formatDate(förfallodatum);

      await client.query(
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
    }

    await invalidateBokforCache();
    return { success: true, id: transaktionsId, blobUrl };
  } catch (err) {
    console.error("❌ saveTransaction error:", err);
    return { success: false, error: (err as Error).message };
  } finally {
    client.release();
  }
}

export async function bokforUtlagg(utläggId: number) {
  const { userId } = await ensureSession();

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
    const kontoMap = Object.fromEntries(
      kontoRes.rows.map((r: { kontonummer: string; id: number }) => [r.kontonummer, r.id])
    );
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

    await invalidateBokforCache();
    return { success: true, transaktionsId };
  } catch (err) {
    console.error("❌ bokförUtlägg error:", err);
    return { success: false, error: (err as Error).message };
  } finally {
    client.release();
  }
}
