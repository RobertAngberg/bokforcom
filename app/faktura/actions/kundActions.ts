"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { sanitizeInput, validateEmail } from "../../_utils/validationUtils";
import type { KundListItem } from "../types/types";

export async function sparaNyKund(formData: FormData) {
  const { userId } = await ensureSession();

  // SÄKERHETSVALIDERING: Sanitera och validera all kundinformation
  const kundnamn = sanitizeInput(formData.get("kundnamn")?.toString() || "");
  const kundEmail = formData.get("kundemail")?.toString() || "";
  const orgNummer = formData.get("kundorgnummer")?.toString() || "";
  const personnummer = formData.get("personnummer")?.toString() || "";

  // Validera obligatoriska fält
  if (!kundnamn || kundnamn.length < 2) {
    return { success: false, error: "Kundnamn krävs (minst 2 tecken)" };
  }

  // Validera email om angivet
  if (kundEmail && !validateEmail(kundEmail)) {
    return { success: false, error: "Ogiltig email-adress" };
  }

  // Validera personnummer om angivet (grundläggande format)
  if (personnummer && !/^\d{6}-?\d{4}$/.test(personnummer.replace(/\s/g, ""))) {
    return { success: false, error: "Ogiltigt personnummer (format: YYMMDD-XXXX)" };
  }

  let result;
  const client = await pool.connect();
  try {
    // Säker parametriserad query med saniterade värden
    const res = await client.query(
      `INSERT INTO kunder (
        "user_id", kundnamn, kundorgnummer, kundnummer,
        kundmomsnummer, kundadress1, kundpostnummer, kundstad, kundemail
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        userId,
        kundnamn,
        sanitizeInput(orgNummer),
        sanitizeInput(formData.get("kundnummer")?.toString() || ""),
        sanitizeInput(formData.get("kundmomsnummer")?.toString() || ""),
        sanitizeInput(formData.get("kundadress1")?.toString() || ""),
        sanitizeInput(formData.get("kundpostnummer")?.toString() || ""),
        sanitizeInput(formData.get("kundstad")?.toString() || ""),
        kundEmail,
      ]
    );
    result = { success: true, id: res.rows[0].id };
  } finally {
    client.release();
  }

  if (!result) {
    throw new Error("Kunden kunde inte sparas");
  }

  if (result.success) {
    await revalidateTag("faktura-kunder");
  }

  return result;
}

export async function uppdateraKund(id: number, formData: FormData) {
  const { userId } = await ensureSession();

  try {
    // SÄKERHETSEVENT: Logga uppdateringsförsök
    console.log(`🔒 Säker kunduppdatering initierad för user ${userId}, kund ${id}`);

    // SÄKERHETSVALIDERING: Validera kund-ID
    if (isNaN(id) || id <= 0) {
      console.error("❌ Säkerhetsvarning: Ogiltigt kund-ID vid uppdatering");
      return { success: false, error: "Ogiltigt kund-ID" };
    }

    // SÄKERHETSVALIDERING: Sanitera alla input-värden
    const kundnamn = sanitizeInput(formData.get("kundnamn")?.toString() || "");
    const kundEmail = formData.get("kundemail")?.toString() || "";
    const orgNummer = formData.get("kundorgnummer")?.toString() || "";
    const personnummer = formData.get("personnummer")?.toString() || "";

    // Validera obligatoriska fält
    if (!kundnamn || kundnamn.length < 2) {
      return { success: false, error: "Kundnamn krävs (minst 2 tecken)" };
    }

    // Validera email om angivet
    if (kundEmail && !validateEmail(kundEmail)) {
      return { success: false, error: "Ogiltig email-adress" };
    }

    // Validera personnummer om angivet
    if (personnummer && !/^\d{6}-?\d{4}$/.test(personnummer.replace(/\s/g, ""))) {
      return { success: false, error: "Ogiltigt personnummer (format: YYMMDD-XXXX)" };
    }

    const client = await pool.connect();
    try {
      // SÄKERHETSVALIDERING: Verifiera att kunden tillhör denna användare
      const verifyRes = await client.query(
        `SELECT id FROM kunder WHERE id = $1 AND "user_id" = $2`,
        [id, userId]
      );

      if (verifyRes.rows.length === 0) {
        return { success: false, error: "Kunden finns inte eller tillhör inte dig" };
      }

      await client.query(
        `
        UPDATE kunder SET
          kundnamn = $1,
          kundnummer = $2,
          kundorgnummer = $3,
          kundmomsnummer = $4,
          kundadress1 = $5,
          kundpostnummer = $6,
          kundstad = $7,
          kundemail = $8
        WHERE id = $9 AND "user_id" = $10
        `,
        [
          kundnamn,
          sanitizeInput(formData.get("kundnummer")?.toString() || ""),
          sanitizeInput(orgNummer),
          sanitizeInput(formData.get("kundmomsnummer")?.toString() || ""),
          sanitizeInput(formData.get("kundadress1")?.toString() || ""),
          sanitizeInput(formData.get("kundpostnummer")?.toString() || ""),
          sanitizeInput(formData.get("kundstad")?.toString() || ""),
          kundEmail,
          id,
          userId,
        ]
      );

      console.log(`✅ Kund ${id} uppdaterad säkert för user ${userId}`);
      await revalidateTag("faktura-kunder");
      return { success: true };
    } catch (err) {
      console.error("❌ Databasfel vid uppdatering av kund:", err);
      return { success: false, error: "Kunde inte uppdatera kund säkert" };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ Säkerhetsfel vid uppdatering av kund:", err);
    return { success: false, error: "Kunde inte uppdatera kund säkert" };
  }
}

export async function deleteKund(id: number) {
  const { userId } = await ensureSession();

  try {
    // SÄKERHETSEVENT: Logga raderingsförsök
    console.log(`🔒 Säker kundradering initierad för user ${userId}, kund ${id}`);

    // SÄKERHETSVALIDERING: Validera kund-ID
    if (isNaN(id) || id <= 0) {
      console.error("❌ Säkerhetsvarning: Ogiltigt kund-ID vid radering");
      return { success: false, error: "Ogiltigt kund-ID" };
    }

    const client = await pool.connect();
    try {
      // SÄKERHETSVALIDERING: Verifiera att kunden tillhör denna användare
      const verifyRes = await client.query(
        `SELECT id FROM kunder WHERE id = $1 AND "user_id" = $2`,
        [id, userId]
      );

      if (verifyRes.rows.length === 0) {
        console.error(
          `❌ Säkerhetsvarning: User ${userId} försökte radera kund ${id} som de inte äger`
        );
        return { success: false, error: "Kunden finns inte eller tillhör inte dig" };
      }

      // Radera kunden med dubbel validering av ägarskap
      const deleteRes = await client.query(`DELETE FROM kunder WHERE id = $1 AND "user_id" = $2`, [
        id,
        userId,
      ]);

      if (deleteRes.rowCount === 0) {
        throw new Error("Kunden kunde inte raderas - ägarskapsvalidering misslyckades");
      }

      console.log(`✅ Säkert raderade kund ${id} för user ${userId}`);
      await revalidateTag("faktura-kunder");
      return { success: true };
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ Säkerhetsfel vid radering av kund:", err);
    return { success: false, error: "Kunde inte radera kund säkert" };
  }
}

const fetchSparadeKunder = unstable_cache(
  async (userId: string): Promise<KundListItem[]> => {
    const res = await pool.query<KundListItem>(
      `SELECT
         id,
         kundnamn,
         kundorgnummer,
         kundnummer,
         kundmomsnummer,
         kundadress1,
         kundpostnummer,
         kundstad,
         kundemail
       FROM kunder
       WHERE "user_id" = $1
         AND kundnamn IS NOT NULL
         AND kundnamn <> ''
       ORDER BY LOWER(kundnamn), id`,
      [userId]
    );

    return res.rows;
  },
  ["faktura-kunder"],
  { revalidate: 60, tags: ["faktura-kunder"] }
);

export async function hämtaSparadeKunder(): Promise<KundListItem[]> {
  const { userId } = await ensureSession();

  try {
    return await fetchSparadeKunder(String(userId));
  } catch (err) {
    console.error("❌ hämtaSparadeKunder error:", err);
    return [];
  }
}
