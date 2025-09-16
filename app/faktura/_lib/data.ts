import { auth } from "../../_lib/auth";
import { query, queryOne } from "../../_utils/dbUtils";

// Funktioner för att hämta data direkt i server components
// Används istället för actions för data-hämtning

export async function hämtaFöretagsprofil() {
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
        företagsnamn: "",
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

    return res.rows[0];
  } catch (error) {
    console.error("Failed to fetch företagsprofil:", error);
    return null;
  }
}

export async function hämtaFakturaStatistik() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return null;

    // Hämta statistik för startsidan
    const [sparadeRes, bokfordaRes] = await Promise.all([
      query(`SELECT COUNT(*) as antal FROM fakturor WHERE user_id = $1`, [userId]),
      query(
        `SELECT COUNT(*) as antal FROM leverantörsfakturor WHERE user_id = $1 AND status_bokförd = 'bokförd'`,
        [userId]
      ),
    ]);

    return {
      sparadeFakturor: parseInt(sparadeRes.rows[0]?.antal || "0"),
      bokfordaFakturor: parseInt(bokfordaRes.rows[0]?.antal || "0"),
    };
  } catch (error) {
    console.error("Failed to fetch faktura statistik:", error);
    return {
      sparadeFakturor: 0,
      bokfordaFakturor: 0,
    };
  }
}

export async function hämtaSparadeKunder() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];

    const res = await query(`SELECT * FROM kunder WHERE user_id = $1 ORDER BY kundnamn`, [userId]);

    return res.rows;
  } catch (error) {
    console.error("Failed to fetch kunder:", error);
    return [];
  }
}

export async function hämtaSparadeArtiklar() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];

    const res = await query(
      `SELECT id, beskrivning, antal, pris_per_enhet, moms, valuta, typ,
        rot_rut_typ, rot_rut_kategori, avdrag_procent, arbetskostnad_ex_moms,
        rot_rut_antal_timmar, rot_rut_pris_per_timme, rot_rut_beskrivning,
        rot_rut_startdatum, rot_rut_slutdatum,
        rot_rut_personnummer, rot_rut_fastighetsbeteckning,
        rot_rut_boende_typ, rot_rut_brf_org, rot_rut_brf_lagenhet
       FROM faktura_favoritartiklar WHERE user_id = $1 ORDER BY beskrivning`,
      [userId]
    );

    return res.rows;
  } catch (error) {
    console.error("Failed to fetch artiklar:", error);
    return [];
  }
}
