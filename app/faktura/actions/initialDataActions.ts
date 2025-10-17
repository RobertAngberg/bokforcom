"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import type {
  Företagsprofil,
  KundListItem,
  FavoritArtikel,
  FavoritArtikelRow,
} from "../types/types";
import { mappaFavoritartiklar } from "../utils/mappaFavoritartiklar";

// Samla ihop allt som Ny Faktura behöver redan på serversidan för att slippa flera separata POST-anrop vid första rendern.
interface FakturaInitialData {
  foretagsprofil?: Partial<Företagsprofil>;
  kunder: KundListItem[];
  artiklar: FavoritArtikel[];
  senasteBetalning?: {
    betalningsmetod: string | null;
    nummer: string | null;
  };
  bokforingsmetod?: "kontantmetoden" | "fakturametoden";
}

// Hämtar och paketerar basdata för fakturaflödet: företagsprofil, kundlista, favoritartiklar samt senast använda betal- och bokföringsinställningar.
export async function hamtaFakturaInitialData(): Promise<FakturaInitialData> {
  const { userId } = await ensureSession();

  const client = await pool.connect();
  try {
    // Kör allt parallellt: varje SELECT är fristående men bidrar till samma initiala payload.
    const [profilRes, kunderRes, artiklarRes, senasteBetalningRes, bokforingsmetodRes] =
      await Promise.all([
        client.query(
          `
        SELECT
          företagsnamn,
          adress,
          postnummer,
          stad,
          organisationsnummer,
          momsregistreringsnummer,
          telefonnummer,
          epost,
          webbplats,
          logo_url
        FROM företagsprofil
        WHERE id = $1
        LIMIT 1
      `,
          [userId]
        ),
        client.query<KundListItem>(
          `
        SELECT
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
        ORDER BY LOWER(kundnamn), id
      `,
          [userId]
        ),
        client.query<FavoritArtikelRow>(
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
        ),
        client.query(
          `
        SELECT 
          betalningsmetod,
          nummer
        FROM fakturor
        WHERE "user_id" = $1 
          AND betalningsmetod IS NOT NULL
          AND betalningsmetod <> ''
          AND nummer IS NOT NULL
          AND nummer <> ''
        ORDER BY id DESC
        LIMIT 1
      `,
          [userId]
        ),
        client.query('SELECT bokföringsmetod FROM "user" WHERE id = $1 LIMIT 1', [userId]),
      ]);

    const profilRad = profilRes.rows[0] as
      | (Företagsprofil & { logo_url?: string | null })
      | undefined;

    const foretagsprofil = profilRad
      ? {
          företagsnamn: profilRad.företagsnamn ?? "",
          adress: profilRad.adress ?? "",
          postnummer: profilRad.postnummer ?? "",
          stad: profilRad.stad ?? "",
          organisationsnummer: profilRad.organisationsnummer ?? "",
          momsregistreringsnummer: profilRad.momsregistreringsnummer ?? "",
          telefonnummer: profilRad.telefonnummer ?? "",
          epost: profilRad.epost ?? "",
          webbplats: profilRad.webbplats ?? "",
          bankinfo: "",
          logo: (profilRad as { logo_url?: string | null }).logo_url ?? "",
          logoWidth: undefined,
        }
      : undefined;

    const artiklar = mappaFavoritartiklar(artiklarRes.rows);

    // Pullar den senast använda betalningsmetoden om det finns någon historik.
    const senasteBetalningRad = senasteBetalningRes.rows[0] as
      | { betalningsmetod: string | null; nummer: string | null }
      | undefined;

    const senasteBetalning = senasteBetalningRad
      ? {
          betalningsmetod: senasteBetalningRad.betalningsmetod,
          nummer: senasteBetalningRad.nummer,
        }
      : undefined;

    // Och hämta användarens bokföringsmetod så att klienten slipper fråga igen.
    const bokforingsmetodRad = bokforingsmetodRes.rows[0] as
      | { bokföringsmetod?: string | null }
      | undefined;
    const normalizedBokforingsmetod = (() => {
      const raw = bokforingsmetodRad?.bokföringsmetod?.toLowerCase();
      if (raw === "kontantmetoden") return "kontantmetoden" as const;
      if (raw === "fakturametoden") return "fakturametoden" as const;
      return undefined;
    })();

    return {
      foretagsprofil,
      kunder: kunderRes.rows,
      artiklar,
      senasteBetalning,
      bokforingsmetod: normalizedBokforingsmetod,
    };
  } catch (error) {
    console.error("❌ hamtaFakturaInitialData error:", error);
    return {
      foretagsprofil: undefined,
      kunder: [],
      artiklar: [],
      senasteBetalning: undefined,
      bokforingsmetod: undefined,
    };
  } finally {
    client.release();
  }
}
