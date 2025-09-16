import { auth } from "../../_lib/auth";
import { queryOne, query } from "../../_utils/dbUtils";
import type { AnvandarInfo, ForetagsProfil } from "../_types/types";

export async function getAnvandarInfo(): Promise<AnvandarInfo | null> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return null;

    return await queryOne<AnvandarInfo>(
      "SELECT id, email, name, created_at as skapad FROM users WHERE id = $1",
      [userId]
    );
  } catch (error) {
    console.error("Failed to fetch user info:", error);
    return null;
  }
}

export async function getForetagsprofil(): Promise<ForetagsProfil | null> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return null;

    const res = await query(
      `SELECT 
        företagsnamn, adress, postnummer, stad, 
        organisationsnummer, momsregistreringsnummer, 
        telefonnummer, epost, webbplats 
       FROM företagsprofil WHERE id = $1`,
      [userId]
    );

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
      };
    }

    const dbRow: any = res.rows[0];
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
    };
  } catch (error) {
    console.error("Failed to fetch företagsprofil:", error);
    return null;
  }
}
