"use server";

import { pool } from "../../_lib/db";
import { ensureSession } from "../../_utils/session";
import type { Företagsprofil } from "../types/types";

export async function hamtaForetagsprofil(): Promise<Företagsprofil | null> {
  const { userId } = await ensureSession();

  try {
    const { rows } = await pool.query(
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
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0] as {
      företagsnamn: string | null;
      adress: string | null;
      postnummer: string | null;
      stad: string | null;
      organisationsnummer: string | null;
      momsregistreringsnummer: string | null;
      telefonnummer: string | null;
      epost: string | null;
      webbplats: string | null;
      logo_url: string | null;
    };

    return {
      företagsnamn: row.företagsnamn ?? "",
      adress: row.adress ?? "",
      postnummer: row.postnummer ?? "",
      stad: row.stad ?? "",
      organisationsnummer: row.organisationsnummer ?? "",
      momsregistreringsnummer: row.momsregistreringsnummer ?? "",
      telefonnummer: row.telefonnummer ?? "",
      epost: row.epost ?? "",
      webbplats: row.webbplats ?? "",
      bankinfo: "",
      logo: row.logo_url ?? "",
      logoWidth: undefined,
    } satisfies Företagsprofil;
  } catch (error) {
    console.error("Fel vid hämtning av företagsprofil:", error);
    return null;
  }
}

export async function sparaForetagsprofil(data: Företagsprofil): Promise<{ success: boolean }> {
  const { userId } = await ensureSession();

  try {
    await pool.query(
      `
      INSERT INTO företagsprofil (
        id,
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
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      ON CONFLICT (id)
      DO UPDATE SET
        företagsnamn = EXCLUDED.företagsnamn,
        adress = EXCLUDED.adress,
        postnummer = EXCLUDED.postnummer,
        stad = EXCLUDED.stad,
        organisationsnummer = EXCLUDED.organisationsnummer,
        momsregistreringsnummer = EXCLUDED.momsregistreringsnummer,
        telefonnummer = EXCLUDED.telefonnummer,
        epost = EXCLUDED.epost,
        webbplats = EXCLUDED.webbplats,
        logo_url = EXCLUDED.logo_url
      `,
      [
        userId,
        data.företagsnamn,
        data.adress,
        data.postnummer,
        data.stad,
        data.organisationsnummer,
        data.momsregistreringsnummer,
        data.telefonnummer,
        data.epost,
        data.webbplats,
        data.logo ?? null,
      ]
    );

    return { success: true };
  } catch (error) {
    console.error("Fel vid sparande av företagsprofil:", error);
    return { success: false };
  }
}

export async function uploadLogoAction(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "Ingen fil vald" };
  }

  const { uploadCompanyLogo } = await import("../../_utils/blobUpload");
  return await uploadCompanyLogo(file);
}
