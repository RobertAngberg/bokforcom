"use server";

import { auth } from "@/auth";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function checkUserSignupStatus() {
  const session = await auth();
  if (!session?.user?.email) {
    return { loggedIn: false };
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT företagsnamn, organisationsnummer FROM users WHERE email = $1`,
      [session.user.email]
    );

    if (result.rows.length === 0) {
      return { loggedIn: true, hasCompanyInfo: false };
    }

    const user = result.rows[0];
    const hasCompanyInfo = !!(user.företagsnamn || user.organisationsnummer);

    return {
      loggedIn: true,
      hasCompanyInfo,
      companyName: user.företagsnamn,
    };
  } catch (error) {
    console.error("Fel vid kontroll av använderstatus:", error);
    return { loggedIn: true, hasCompanyInfo: false, error: true };
  } finally {
    client.release();
  }
}

export async function saveSignupData(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Ingen användare inloggad" };
  }

  const client = await pool.connect();

  try {
    const organisationsnummer = formData.get("organisationsnummer")?.toString() || "";
    const företagsnamn = formData.get("företagsnamn")?.toString() || "";
    const momsperiod = formData.get("momsperiod")?.toString() || "";
    const bokföringsmetod = formData.get("redovisningsmetod")?.toString() || "";
    const första_bokslut = formData.get("första_bokslut")?.toString() || "";
    const startdatum = formData.get("startdatum")?.toString() || null;
    const slutdatum = formData.get("slutdatum")?.toString() || null;

    // Först kolla om användaren redan har företagsinformation
    const existingUser = await client.query(
      `SELECT id, företagsnamn, organisationsnummer FROM users WHERE email = $1`,
      [session.user.email]
    );

    if (existingUser.rows.length === 0) {
      return { success: false, error: "Användare hittades inte" };
    }

    const user = existingUser.rows[0];

    // Kontrollera om användaren redan har företagsinformation
    if (user.företagsnamn || user.organisationsnummer) {
      console.log("⚠️ Användare har redan företagsinformation:", session.user.email);
      return {
        success: false,
        error: "Företagsinformation finns redan registrerad för detta konto",
      };
    }

    console.log("💾 Sparar signup-data för ny användare:", session.user.email, {
      organisationsnummer,
      företagsnamn,
      momsperiod,
      bokföringsmetod,
      första_bokslut,
      startdatum,
      slutdatum,
    });

    // Uppdatera användarens profil med företagsinformation
    const result = await client.query(
      `UPDATE users 
       SET organisationsnummer = $1, 
           företagsnamn = $2, 
           momsperiod = $3, 
           bokföringsmetod = $4, 
           första_bokslut = $5, 
           startdatum = $6, 
           slutdatum = $7,
           skapad = NOW(),
           uppdaterad = NOW()
       WHERE email = $8 AND företagsnamn IS NULL AND organisationsnummer IS NULL
       RETURNING id, name, email, företagsnamn`,
      [
        organisationsnummer,
        företagsnamn,
        momsperiod,
        bokföringsmetod,
        första_bokslut,
        startdatum || null,
        slutdatum || null,
        session.user.email,
      ]
    );

    if (result.rows.length === 0) {
      return { success: false, error: "Användare hittades inte" };
    }

    console.log("✅ Signup-data sparad för användare:", result.rows[0]);

    return {
      success: true,
      message: "Företagsinformation sparad!",
      user: result.rows[0],
    };
  } catch (error) {
    console.error("❌ Fel vid sparande av signup-data:", error);
    return {
      success: false,
      error: "Kunde inte spara företagsinformation",
    };
  } finally {
    client.release();
  }
}
