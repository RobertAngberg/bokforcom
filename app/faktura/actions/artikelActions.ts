"use server";

import { pool } from "../../_lib/db";
import { getUserId } from "../../_utils/authUtils";
import { Artikel } from "../types/types";

export async function sparaFavoritArtikel(artikel: Artikel) {
  const userId = await getUserId();
  if (!userId) return { success: false };
  // userId already a number from getUserId()

  try {
    // Kolla om en liknande favorit redan finns för denna användare
    const existing = await pool.query(
      `SELECT id FROM faktura_favoritartiklar
       WHERE user_id = $1
         AND beskrivning = $2
         AND antal = $3
         AND pris_per_enhet = $4
         AND moms = $5
         AND valuta = $6
         AND typ = $7
         AND (rot_rut_typ IS NOT DISTINCT FROM $8)
         AND (rot_rut_kategori IS NOT DISTINCT FROM $9)
         AND (avdrag_procent IS NOT DISTINCT FROM $10)
         AND (arbetskostnad_ex_moms IS NOT DISTINCT FROM $11)
       LIMIT 1`,
      [
        userId,
        artikel.beskrivning,
        artikel.antal.toString(),
        artikel.prisPerEnhet.toString(),
        artikel.moms.toString(),
        artikel.valuta,
        artikel.typ,
        artikel.rotRutTyp ?? null,
        artikel.rotRutKategori ?? null,
        artikel.avdragProcent ?? null,
        artikel.arbetskostnadExMoms ?? null,
      ]
    );

    if (existing.rows.length > 0) {
      console.log("ℹ️ Artikeln finns redan som favorit, sparas inte igen.");
      return { success: true, alreadyExists: true };
    }

    // Spara till den nya favoritartiklar-tabellen
    await pool.query(
      `INSERT INTO faktura_favoritartiklar (
        user_id, beskrivning, antal, pris_per_enhet, moms, valuta, typ,
        rot_rut_typ, rot_rut_kategori, avdrag_procent, arbetskostnad_ex_moms,
        rot_rut_antal_timmar, rot_rut_pris_per_timme,
        rot_rut_beskrivning, rot_rut_startdatum, rot_rut_slutdatum,
        rot_rut_personnummer, rot_rut_fastighetsbeteckning, rot_rut_boende_typ,
        rot_rut_brf_org, rot_rut_brf_lagenhet
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
      [
        userId,
        artikel.beskrivning,
        artikel.antal.toString(),
        artikel.prisPerEnhet.toString(),
        artikel.moms.toString(),
        artikel.valuta,
        artikel.typ,
        artikel.rotRutTyp ?? null,
        artikel.rotRutKategori ?? null,
        artikel.avdragProcent ?? null,
        artikel.arbetskostnadExMoms ?? null,
        artikel.antal ?? null, // Använd antal istället för rotRutAntalTimmar
        artikel.prisPerEnhet ?? null, // Använd prisPerEnhet istället för rotRutPrisPerTimme
        artikel.rotRutBeskrivning ?? null,
        artikel.rotRutStartdatum
          ? new Date(artikel.rotRutStartdatum).toISOString().split("T")[0]
          : null,
        artikel.rotRutSlutdatum
          ? new Date(artikel.rotRutSlutdatum).toISOString().split("T")[0]
          : null,
        artikel.rotRutPersonnummer ?? null,
        artikel.rotRutFastighetsbeteckning ?? null,
        artikel.rotRutBoendeTyp ?? null,
        artikel.rotRutBrfOrg ?? null,
        artikel.rotRutBrfLagenhet ?? null,
      ]
    );

    return { success: true };
  } catch (err) {
    console.error("❌ Kunde inte spara favoritartikel:", err);
    return { success: false };
  }
}

export async function updateFavoritArtikel(id: number, artikel: Artikel) {
  const userId = await getUserId();
  if (!userId) return { success: false };
  // userId already a number from getUserId()

  try {
    await pool.query(
      `UPDATE faktura_favoritartiklar SET
        beskrivning = $1,
        antal = $2,
        pris_per_enhet = $3,
        moms = $4,
        valuta = $5,
        typ = $6,
        rot_rut_typ = $7,
        rot_rut_kategori = $8,
        avdrag_procent = $9,
        arbetskostnad_ex_moms = $10,
        rot_rut_antal_timmar = $11,
        rot_rut_pris_per_timme = $12,
        rot_rut_beskrivning = $13,
        rot_rut_startdatum = $14,
        rot_rut_slutdatum = $15,
        rot_rut_personnummer = $16,
        rot_rut_fastighetsbeteckning = $17,
        rot_rut_boende_typ = $18,
        rot_rut_brf_org = $19,
        rot_rut_brf_lagenhet = $20,
        uppdaterad = CURRENT_TIMESTAMP
       WHERE id = $21 AND user_id = $22`,
      [
        artikel.beskrivning,
        artikel.antal.toString(),
        artikel.prisPerEnhet.toString(),
        artikel.moms.toString(),
        artikel.valuta,
        artikel.typ,
        artikel.rotRutTyp ?? null,
        artikel.rotRutKategori ?? null,
        artikel.avdragProcent ?? null,
        artikel.arbetskostnadExMoms ? parseFloat(artikel.arbetskostnadExMoms.toString()) : null,
        artikel.antal ?? null, // Använd antal istället för rotRutAntalTimmar
        artikel.prisPerEnhet ?? null, // Använd prisPerEnhet istället för rotRutPrisPerTimme
        artikel.rotRutBeskrivning ?? null,
        artikel.rotRutStartdatum
          ? new Date(artikel.rotRutStartdatum).toISOString().split("T")[0]
          : null,
        artikel.rotRutSlutdatum
          ? new Date(artikel.rotRutSlutdatum).toISOString().split("T")[0]
          : null,
        artikel.rotRutPersonnummer ?? null,
        artikel.rotRutFastighetsbeteckning ?? null,
        artikel.rotRutBoendeTyp ?? null,
        artikel.rotRutBrfOrg ?? null,
        artikel.rotRutBrfLagenhet ?? null,
        id,
        userId,
      ]
    );

    return { success: true };
  } catch (err) {
    console.error("❌ Kunde inte uppdatera favoritartikel:", err);
    return { success: false };
  }
}

export async function deleteFavoritArtikel(id: number) {
  const userId = await getUserId();
  if (!userId) return { success: false };
  // userId already a number from getUserId()

  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM faktura_favoritartiklar WHERE id = $1 AND user_id = $2`, [
      id,
      userId,
    ]);
    return { success: true };
  } catch (err) {
    console.error("❌ deleteFavoritArtikel error:", err);
    return { success: false };
  } finally {
    client.release();
  }
}

export async function hämtaSparadeArtiklar(): Promise<Artikel[]> {
  const userId = await getUserId();
  if (!userId) return [];
  // userId already a number from getUserId()

  try {
    const res = await pool.query(
      `
      SELECT id, beskrivning, antal, pris_per_enhet, moms, valuta, typ,
        rot_rut_typ, rot_rut_kategori, avdrag_procent, arbetskostnad_ex_moms,
        rot_rut_antal_timmar, rot_rut_pris_per_timme, rot_rut_beskrivning,
        rot_rut_startdatum, rot_rut_slutdatum,
        rot_rut_personnummer, rot_rut_fastighetsbeteckning,
        rot_rut_boende_typ, rot_rut_brf_org, rot_rut_brf_lagenhet
      FROM faktura_favoritartiklar
      WHERE user_id = $1
      ORDER BY beskrivning ASC
    `,
      [userId]
    );

    return res.rows.map((row) => ({
      id: row.id,
      beskrivning: row.beskrivning,
      antal: Number(row.antal),
      prisPerEnhet: Number(row.pris_per_enhet),
      moms: Number(row.moms),
      valuta: row.valuta,
      typ: row.typ,
      rotRutTyp: row.rot_rut_typ,
      rotRutKategori: row.rot_rut_kategori,
      avdragProcent: row.avdrag_procent,
      arbetskostnadExMoms: row.arbetskostnad_ex_moms,
      // rotRutAntalTimmar och rotRutPrisPerTimme ersätts av antal och prisPerEnhet
      rotRutBeskrivning: row.rot_rut_beskrivning,
      rotRutStartdatum: row.rot_rut_startdatum,
      rotRutSlutdatum: row.rot_rut_slutdatum,
      rotRutPersonnummer: row.rot_rut_personnummer,
      rotRutFastighetsbeteckning: row.rot_rut_fastighetsbeteckning,
      rotRutBoendeTyp: row.rot_rut_boende_typ,
      rotRutBrfOrg: row.rot_rut_brf_org,
      rotRutBrfLagenhet: row.rot_rut_brf_lagenhet,
    }));
  } catch (err) {
    console.error("❌ Kunde inte hämta sparade artiklar:", err);
    return [];
  }
}
