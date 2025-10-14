import type { FavoritArtikel, FavoritArtikelRow } from "../types/types";

// Mappar databassvar från faktura_favoritartiklar till typed FavoritArtikel-objekt som klienten kan använda.
export function mappaFavoritartiklar(rows: FavoritArtikelRow[]): FavoritArtikel[] {
  return rows.map((row) => {
    const typ = row.typ === "tjänst" ? "tjänst" : "vara";
    const rotRutTyp =
      row.rot_rut_typ === "ROT" || row.rot_rut_typ === "RUT"
        ? (row.rot_rut_typ as "ROT" | "RUT")
        : undefined;
    const avdragProcentValue =
      row.avdrag_procent !== null && row.avdrag_procent !== undefined
        ? Number(row.avdrag_procent)
        : undefined;
    const arbetskostnadValue =
      row.arbetskostnad_ex_moms !== null && row.arbetskostnad_ex_moms !== undefined
        ? Number(row.arbetskostnad_ex_moms)
        : undefined;

    return {
      id: row.id,
      beskrivning: row.beskrivning,
      antal: Number(row.antal) || 0,
      prisPerEnhet: Number(row.pris_per_enhet) || 0,
      moms: Number(row.moms) || 0,
      valuta: row.valuta ?? "SEK",
      typ,
      rotRutTyp,
      rotRutKategori: row.rot_rut_kategori ?? undefined,
      avdragProcent:
        avdragProcentValue !== undefined && Number.isFinite(avdragProcentValue)
          ? avdragProcentValue
          : undefined,
      arbetskostnadExMoms:
        arbetskostnadValue !== undefined && Number.isFinite(arbetskostnadValue)
          ? arbetskostnadValue
          : undefined,
      rotRutBeskrivning: row.rot_rut_beskrivning ?? undefined,
      rotRutStartdatum: row.rot_rut_startdatum ?? undefined,
      rotRutSlutdatum: row.rot_rut_slutdatum ?? undefined,
      rotRutPersonnummer: row.rot_rut_personnummer ?? undefined,
      rotRutFastighetsbeteckning: row.rot_rut_fastighetsbeteckning ?? undefined,
      rotRutBoendeTyp: row.rot_rut_boende_typ ?? undefined,
      rotRutBrfOrg: row.rot_rut_brf_org ?? undefined,
      rotRutBrfLagenhet: row.rot_rut_brf_lagenhet ?? undefined,
    } satisfies FavoritArtikel;
  });
}
