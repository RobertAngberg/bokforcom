import { pool } from "../../_lib/db";
import type { AnvandarInfo, ForetagsProfil } from "../types/types";
import { ensureSession } from "../../_utils/session";

export async function hamtaAnvandarInfo(): Promise<AnvandarInfo | null> {
  try {
    const { userId } = await ensureSession();

    // Hämta användarinfo från databasen baserat på effective userId (kan vara impersonated)
    const result = await pool.query(
      'SELECT id, email, name, "createdAt" FROM "user" WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email || "",
      name: user.name || "",
      skapad: user.createdAt?.toISOString() || new Date().toISOString(),
    } as AnvandarInfo;
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    return null;
  }
}

export async function hamtaForetagsprofil(): Promise<ForetagsProfil | null> {
  try {
    const { userId } = await ensureSession();

    const client = await pool.connect();
    let res;
    try {
      res = await client.query(
        `SELECT 
        företagsnamn, adress, postnummer, stad, 
        organisationsnummer, momsregistreringsnummer, 
        telefonnummer, epost, webbplats, logo_url 
       FROM företagsprofil WHERE id = $1`,
        [userId]
      );
    } finally {
      client.release();
    }

    if (res.rows.length === 0) {
      return {
        foretagsnamn: "",
        adress: "",
        postnummer: "",
        stad: "",
        organisationsnummer: "",
        momsregistreringsnummer: "",
        telefonnummer: "",
        epost: "",
        webbplats: "",
        logo: "",
        logoWidth: 200,
      };
    }

    interface DbRow {
      företagsnamn?: string;
      adress?: string;
      postnummer?: string;
      stad?: string;
      organisationsnummer?: string;
      momsregistreringsnummer?: string;
      telefonnummer?: string;
      epost?: string;
      webbplats?: string;
      logo_url?: string | null;
    }
    const dbRow = res.rows[0] as DbRow;
    return {
      foretagsnamn: dbRow.företagsnamn || "",
      adress: dbRow.adress || "",
      postnummer: dbRow.postnummer || "",
      stad: dbRow.stad || "",
      organisationsnummer: dbRow.organisationsnummer || "",
      momsregistreringsnummer: dbRow.momsregistreringsnummer || "",
      telefonnummer: dbRow.telefonnummer || "",
      epost: dbRow.epost || "",
      webbplats: dbRow.webbplats || "",
      logo: dbRow.logo_url || "",
      logoWidth: 200,
    };
  } catch (error) {
    console.error("Failed to fetch företagsprofil:", error);
    return null;
  }
}
