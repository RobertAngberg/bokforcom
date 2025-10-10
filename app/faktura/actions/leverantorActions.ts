"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import { sanitizeInput, validateEmail } from "../../_utils/validationUtils";

export async function saveLeverantor(formData: FormData) {
  const { userId } = await ensureSession();

  const namn = sanitizeInput(formData.get("namn")?.toString() || "");
  const organisationsnummer = sanitizeInput(
    formData.get("organisationsnummer")?.toString() || formData.get("vatnummer")?.toString() || ""
  );
  const adress = sanitizeInput(formData.get("adress")?.toString() || "");
  const postnummer = sanitizeInput(formData.get("postnummer")?.toString() || "");
  const ort = sanitizeInput(formData.get("ort")?.toString() || "");
  const telefon = sanitizeInput(formData.get("telefon")?.toString() || "");
  const email = formData.get("email")?.toString() || "";

  // Validera obligatoriska fält
  if (!namn || namn.length < 2) {
    return { success: false, error: "Leverantörsnamn krävs (minst 2 tecken)" };
  }

  // Validera email om angivet
  if (email && !validateEmail(email)) {
    return { success: false, error: "Ogiltig email-adress" };
  }

  const client = await pool.connect();

  try {
    const result = await client.query(
      `INSERT INTO "leverantörer" (
        "user_id", "namn", "organisationsnummer", "adress", "postnummer", "ort", 
        "telefon", "email"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [userId, namn, organisationsnummer, adress, postnummer, ort, telefon, email]
    );

    return { success: true, leverantör: result.rows[0] };
  } catch (error) {
    console.error("❌ Säkerhetsfel vid sparande av leverantör:", error);
    return { success: false, error: "Kunde inte spara leverantör säkert" };
  } finally {
    client.release();
  }
}

export async function getLeverantorer() {
  const { userId } = await ensureSession();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT * FROM "leverantörer" WHERE "user_id" = $1 ORDER BY "namn" ASC`,
      [userId]
    );

    return { success: true, leverantörer: result.rows };
  } catch (error) {
    console.error("Fel vid hämtning av leverantörer:", error);
    return { success: false, error: "Kunde inte hämta leverantörer" };
  } finally {
    client.release();
  }
}

export async function updateLeverantor(
  id: number,
  data: {
    namn: string;
    organisationsnummer?: string;
    adress?: string;
    postnummer?: string;
    ort?: string;
    telefon?: string;
    email?: string;
  }
) {
  const { userId } = await ensureSession();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `UPDATE "leverantörer" 
       SET "namn" = $1, "organisationsnummer" = $2, "adress" = $3, 
           "postnummer" = $4, "ort" = $5, "telefon" = $6, "email" = $7, "uppdaterad" = NOW()
       WHERE "id" = $8 AND "user_id" = $9`,
      [
        data.namn,
        data.organisationsnummer,
        data.adress,
        data.postnummer,
        data.ort,
        data.telefon,
        data.email,
        id,
        userId,
      ]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Leverantör hittades inte" };
    }

    return { success: true };
  } catch (error) {
    console.error("Fel vid uppdatering av leverantör:", error);
    return { success: false, error: "Kunde inte uppdatera leverantör" };
  } finally {
    client.release();
  }
}

export async function deleteLeverantor(id: number) {
  const { userId } = await ensureSession();
  const client = await pool.connect();

  try {
    const result = await client.query(
      `DELETE FROM "leverantörer" WHERE "id" = $1 AND "user_id" = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Leverantör hittades inte" };
    }

    return { success: true };
  } catch (error) {
    console.error("Fel vid borttagning av leverantör:", error);
    return { success: false, error: "Kunde inte ta bort leverantör" };
  } finally {
    client.release();
  }
}
