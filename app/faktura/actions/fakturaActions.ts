"use server";

import { pool } from "../../_lib/db";
import { validateAmount, sanitizeInput, validateEmail } from "../../_utils/validationUtils";
import { ensureSession } from "../../_utils/session";
import { dateToYyyyMmDd, stringTillDate } from "../../_utils/datum";
import type { ArtikelInput, SparadFaktura } from "../types/types";

const normalizeStatus = (status: string | null | undefined) => {
  const normalized = (status || "").trim().toLowerCase();
  return normalized === "delvis betald" ? "skickad" : normalized;
};

const mapStatusToLegacy = (status: string | null | undefined) => {
  const normalized = normalizeStatus(status);

  if (normalized === "färdig") {
    return { status_bokförd: "Bokförd", status_betalning: "Betald" } as const;
  }

  if (normalized === "skickad") {
    return { status_bokförd: "Bokförd", status_betalning: "Obetald" } as const;
  }

  return { status_bokförd: "Ej bokförd", status_betalning: "Obetald" } as const;
};

const isStatusAtLeastSkickad = (status: string | null | undefined) => {
  const normalized = normalizeStatus(status);
  return normalized === "skickad" || normalized === "färdig";
};

type SanitizedArtikel = {
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  moms: number;
  valuta: string;
  typ: "tjänst" | "vara";
  rotRutTyp: "ROT" | "RUT" | null;
  rotRutKategori: string | null;
  avdragProcent: number | null;
  arbetskostnadExMoms: number | null;
  rotRutBeskrivning: string | null;
  rotRutStartdatum: string | null;
  rotRutSlutdatum: string | null;
  rotRutPersonnummer: string | null;
  rotRutFastighetsbeteckning: string | null;
  rotRutBoendeTyp: string | null;
  rotRutBrfOrg: string | null;
  rotRutBrfLagenhet: string | null;
  rotRutAntalTimmar: number | null;
  rotRutPrisPerTimme: number | null;
};

function sanitizeArtikelInput(row: ArtikelInput): SanitizedArtikel {
  const typ = row.typ === "tjänst" ? "tjänst" : "vara";
  const parseNumberStrict = (value: unknown, fallback: number | null = null) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const clampString = (value: unknown, maxLength: number): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (trimmed === "") return null;
    return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
  };

  const antal = parseNumberStrict(row.antal, 0) ?? 0;
  const prisPerEnhet = parseNumberStrict(row.prisPerEnhet, 0) ?? 0;
  const moms = parseNumberStrict(row.moms, 0) ?? 0;
  const valuta = typeof row.valuta === "string" && row.valuta.trim() !== "" ? row.valuta : "SEK";

  const rawRotRutTyp =
    typeof row.rotRutTyp === "string" ? row.rotRutTyp.trim().toUpperCase() : null;
  const isValidRotRut = rawRotRutTyp === "ROT" || rawRotRutTyp === "RUT";
  const isEligibleForRotRut = isValidRotRut && typ === "tjänst";
  const rotRutTyp = isEligibleForRotRut ? (rawRotRutTyp as "ROT" | "RUT") : null;

  const optionalNumber = (value: unknown) => parseNumberStrict(value, null);

  return {
    beskrivning: row.beskrivning,
    antal,
    prisPerEnhet,
    moms,
    valuta,
    typ,
    rotRutTyp,
    rotRutKategori: isEligibleForRotRut ? clampString(row.rotRutKategori, 100) : null,
    avdragProcent: isEligibleForRotRut ? optionalNumber(row.avdragProcent) : null,
    arbetskostnadExMoms: isEligibleForRotRut ? optionalNumber(row.arbetskostnadExMoms) : null,
    rotRutBeskrivning: isEligibleForRotRut ? clampString(row.rotRutBeskrivning, 500) : null,
    rotRutStartdatum: isEligibleForRotRut ? clampString(row.rotRutStartdatum, 32) : null,
    rotRutSlutdatum: isEligibleForRotRut ? clampString(row.rotRutSlutdatum, 32) : null,
    rotRutPersonnummer: isEligibleForRotRut ? clampString(row.rotRutPersonnummer, 20) : null,
    rotRutFastighetsbeteckning: isEligibleForRotRut
      ? clampString(row.rotRutFastighetsbeteckning, 100)
      : null,
    rotRutBoendeTyp: isEligibleForRotRut ? clampString(row.rotRutBoendeTyp, 20) : null,
    rotRutBrfOrg: isEligibleForRotRut ? clampString(row.rotRutBrfOrg, 20) : null,
    rotRutBrfLagenhet: isEligibleForRotRut ? clampString(row.rotRutBrfLagenhet, 20) : null,
    rotRutAntalTimmar: isEligibleForRotRut ? antal : null,
    rotRutPrisPerTimme: isEligibleForRotRut ? prisPerEnhet : null,
  } satisfies SanitizedArtikel;
}

function safeParseFakturaJSON(jsonString: string): ArtikelInput[] {
  try {
    if (!jsonString || typeof jsonString !== "string") return [];
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return [];

    // Validera varje artikel i arrayen med centraliserad sanitisering
    return parsed.filter(
      (artikel) =>
        artikel &&
        typeof artikel === "object" &&
        typeof artikel.beskrivning === "string" &&
        sanitizeInput(artikel.beskrivning, 500).length > 0
    );
  } catch {
    return [];
  }
}

// Intern funktion utan rate limiting (för wrappers)
export async function saveInvoiceInternal(formData: FormData) {
  const { userId } = await ensureSession();

  // SÄKERHETSVALIDERING: Kolla att kund är vald och säker
  const kundIdRaw = formData.get("kundId")?.toString();
  if (!kundIdRaw || kundIdRaw.trim() === "") {
    return { success: false, error: "Kund måste väljas" };
  }

  const kundId = parseInt(kundIdRaw);
  if (isNaN(kundId) || kundId <= 0) {
    return { success: false, error: "Ogiltigt kund-ID" };
  }

  // SÄKERHETSVALIDERING: Säker parsing av artiklar
  const artiklarRaw = formData.get("artiklar") as string;
  const artiklar = safeParseFakturaJSON(artiklarRaw);
  if (artiklar.length === 0) {
    return { success: false, error: "Minst en artikel krävs" };
  }

  // SÄKERHETSVALIDERING: Validera alla artiklar
  for (const artikel of artiklar) {
    if (!artikel.beskrivning || sanitizeInput(artikel.beskrivning).length < 2) {
      return { success: false, error: "Alla artiklar måste ha en giltig beskrivning" };
    }

    if (!validateAmount(artikel.antal) || artikel.antal <= 0) {
      return { success: false, error: "Ogiltigt antal i artikel" };
    }

    if (!validateAmount(artikel.prisPerEnhet) || artikel.prisPerEnhet < 0) {
      return { success: false, error: "Ogiltigt pris i artikel" };
    }

    if (!validateAmount(artikel.moms) || artikel.moms < 0 || artikel.moms > 100) {
      return { success: false, error: "Ogiltig moms i artikel" };
    }
  }

  const sanitizedArtiklar = artiklar.map(sanitizeArtikelInput);

  // Kolla om det är en uppdatering eller ny faktura
  const fakturaIdRaw = formData.get("id");
  const isUpdate = !!fakturaIdRaw;

  // SÄKERHETSVALIDERING: Validera fakturauppgifter
  const fakturaNummerRaw = formData.get("fakturanummer")?.toString();
  const fakturanummer = sanitizeInput(fakturaNummerRaw || "");

  // För uppdateringar krävs fakturanummer, för nya fakturor genereras det automatiskt
  if (isUpdate && (!fakturanummer || fakturanummer.length < 1)) {
    return { success: false, error: "Fakturanummer krävs för befintliga fakturor" };
  }

  // SÄKERHETSVALIDERING: Validera kunduppgifter
  const kundnamn = sanitizeInput(formData.get("kundnamn")?.toString() || "");
  const kundEmail = sanitizeInput(formData.get("kundemail")?.toString() || "", 255);

  if (!kundnamn || kundnamn.length < 2) {
    return { success: false, error: "Giltigt kundnamn krävs" };
  }

  if (kundEmail && !validateEmail(kundEmail)) {
    return { success: false, error: "Ogiltig email-adress" };
  }

  if (artiklar.length === 0) {
    return { success: false, error: "Fakturan måste ha minst en artikel" };
  }

  // Använd utils istället för manuell databas och datum-hantering
  const client = await pool.connect();
  try {
    // Använd utils för säker datum-hantering
    const fakturadatum = dateToYyyyMmDd(stringTillDate(formData.get("fakturadatum")?.toString()));
    const forfallodatum = dateToYyyyMmDd(stringTillDate(formData.get("forfallodatum")?.toString()));
    const fakturaId = isUpdate ? parseInt(fakturaIdRaw!.toString(), 10) : undefined;

    // För nya fakturor: sätt dagens datum som default om inget fakturadatum anges
    const fakturaDateString = isUpdate ? fakturadatum : fakturadatum || dateToYyyyMmDd(new Date());

    // För nya fakturor: sätt 30 dagar från idag som default för förfallodatum om inget anges
    const forfalloDatumsString = isUpdate
      ? forfallodatum
      : forfallodatum ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          return dateToYyyyMmDd(d);
        })();

    if (isUpdate && fakturaId) {
      // ta bort och lägger till helt nytt längre ner
      await client.query(`DELETE FROM faktura_artiklar WHERE faktura_id = $1`, [fakturaId]);

      await client.query(
        `UPDATE fakturor SET
          fakturanummer = $1,
          fakturadatum = $2::date,
          forfallodatum = $3::date,
          betalningsmetod = $4,
          betalningsvillkor = $5,
          drojsmalsranta = $6,
          "kundId" = $7,
          nummer = $8,
          logo_width = $9
        WHERE id = $10 AND "user_id" = $11`,
        [
          formData.get("fakturanummer"),
          fakturaDateString,
          forfalloDatumsString,
          formData.get("betalningsmetod"),
          formData.get("betalningsvillkor"),
          formData.get("drojsmalsranta"),
          formData.get("kundId") ? parseInt(formData.get("kundId")!.toString()) : null,
          formData.get("nummer"),
          formData.get("logoWidth") ? parseInt(formData.get("logoWidth")!.toString()) : 200,
          fakturaId,
          userId,
        ]
      );

      for (const rad of sanitizedArtiklar) {
        await client.query(
          `INSERT INTO faktura_artiklar (
            faktura_id, beskrivning, antal, pris_per_enhet, moms, valuta, typ,
            rot_rut_typ, rot_rut_kategori, avdrag_procent, arbetskostnad_ex_moms,
            rot_rut_antal_timmar, rot_rut_pris_per_timme,
            rot_rut_beskrivning, rot_rut_startdatum, rot_rut_slutdatum,
            rot_rut_personnummer, rot_rut_fastighetsbeteckning, rot_rut_boende_typ,
            rot_rut_brf_org, rot_rut_brf_lagenhet
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
          [
            fakturaId,
            rad.beskrivning,
            rad.antal,
            rad.prisPerEnhet,
            rad.moms,
            rad.valuta,
            rad.typ,
            rad.rotRutTyp ?? null,
            rad.rotRutKategori ?? null,
            rad.avdragProcent ?? null,
            rad.arbetskostnadExMoms ?? null,
            rad.rotRutAntalTimmar ?? null,
            rad.rotRutPrisPerTimme ?? null,
            rad.rotRutBeskrivning ?? null,
            rad.rotRutStartdatum ? dateToYyyyMmDd(new Date(rad.rotRutStartdatum)) : null,
            rad.rotRutSlutdatum ? dateToYyyyMmDd(new Date(rad.rotRutSlutdatum)) : null,
            rad.rotRutPersonnummer ?? null,
            rad.rotRutFastighetsbeteckning ?? null,
            rad.rotRutBoendeTyp ?? null,
            rad.rotRutBrfOrg ?? null,
            rad.rotRutBrfLagenhet ?? null,
          ]
        );
      }

      return { success: true, id: fakturaId };
    } else {
      let fakturanummer = formData.get("fakturanummer")?.toString();
      if (!fakturanummer) {
        const latest = await client.query(
          `SELECT MAX(CAST(fakturanummer AS INTEGER)) AS max FROM fakturor WHERE "user_id" = $1`,
          [userId]
        );
        fakturanummer = ((latest.rows[0].max || 0) + 1).toString();
      }

      const insertF = await client.query(
        `INSERT INTO fakturor (
          "user_id", fakturanummer, fakturadatum, forfallodatum,
          betalningsmetod, betalningsvillkor, drojsmalsranta,
          "kundId", nummer, logo_width, status
        ) VALUES ($1, $2, $3::date, $4::date, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          userId,
          fakturanummer,
          fakturaDateString,
          forfalloDatumsString,
          formData.get("betalningsmetod"),
          formData.get("betalningsvillkor"),
          formData.get("drojsmalsranta"),
          formData.get("kundId") ? parseInt(formData.get("kundId")!.toString()) : null,
          formData.get("nummer"),
          formData.get("logoWidth") ? parseInt(formData.get("logoWidth")!.toString()) : 200,
          "Oskickad",
        ]
      );

      const newId = insertF.rows[0].id;

      for (const rad of sanitizedArtiklar) {
        await client.query(
          `INSERT INTO faktura_artiklar (
            faktura_id, beskrivning, antal, pris_per_enhet, moms, valuta, typ,
            rot_rut_typ, rot_rut_kategori, avdrag_procent, arbetskostnad_ex_moms,
            rot_rut_antal_timmar, rot_rut_pris_per_timme,
            rot_rut_beskrivning, rot_rut_startdatum, rot_rut_slutdatum,
            rot_rut_personnummer, rot_rut_fastighetsbeteckning, rot_rut_boende_typ,
            rot_rut_brf_org, rot_rut_brf_lagenhet
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
          [
            newId,
            rad.beskrivning,
            rad.antal,
            rad.prisPerEnhet,
            rad.moms,
            rad.valuta,
            rad.typ,
            rad.rotRutTyp ?? null,
            rad.rotRutKategori ?? null,
            rad.avdragProcent ?? null,
            rad.arbetskostnadExMoms ?? null,
            rad.rotRutAntalTimmar ?? null,
            rad.rotRutPrisPerTimme ?? null,
            rad.rotRutBeskrivning ?? null,
            rad.rotRutStartdatum ? dateToYyyyMmDd(new Date(rad.rotRutStartdatum)) : null,
            rad.rotRutSlutdatum ? dateToYyyyMmDd(new Date(rad.rotRutSlutdatum)) : null,
            rad.rotRutPersonnummer ?? null,
            rad.rotRutFastighetsbeteckning ?? null,
            rad.rotRutBoendeTyp ?? null,
            rad.rotRutBrfOrg ?? null,
            rad.rotRutBrfLagenhet ?? null,
          ]
        );
      }

      return { success: true, id: newId };
    }
  } finally {
    client.release();
  }
}

export async function hamtaNastaFakturanummer() {
  const { userId } = await ensureSession();

  const client = await pool.connect();
  try {
    const latest = await client.query(
      `SELECT MAX(CAST(fakturanummer AS INTEGER)) AS max FROM fakturor WHERE "user_id" = $1`,
      [userId]
    );
    return (latest.rows[0].max || 0) + 1;
  } finally {
    client.release();
  }
}

export async function hamtaFakturaMedRader(id: number) {
  const client = await pool.connect();
  try {
    // Hämta faktura + kunduppgifter
    const fakturaRes = await client.query(
      `
      SELECT 
        f.*, 
        k.kundnamn, 
        k.kundnummer, 
        k.kundorgnummer as kundorganisationsnummer, 
        k.kundmomsnummer, 
        k.kundadress1 as kundadress, 
        k.kundpostnummer, 
        k.kundstad, 
        k.kundemail
      FROM fakturor f
      LEFT JOIN kunder k ON f."kundId" = k.id
      WHERE f.id = $1
      LIMIT 1
      `,
      [id]
    );
    const faktura = fakturaRes.rows[0];

    // Hämta artiklar (inklusive ROT/RUT data som nu finns i samma tabell)
    const artiklarRes = await client.query(
      `SELECT * FROM faktura_artiklar WHERE faktura_id = $1 ORDER BY id ASC`,
      [id]
    );

    // Mappa databaskolumner till camelCase för frontend
    const artiklar = artiklarRes.rows.map((row) => ({
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
      rotRutBeskrivning: row.rot_rut_beskrivning,
      rotRutStartdatum: row.rot_rut_startdatum,
      rotRutSlutdatum: row.rot_rut_slutdatum,
      rotRutPersonnummer: row.rot_rut_personnummer,
      rotRutFastighetsbeteckning: row.rot_rut_fastighetsbeteckning,
      rotRutBoendeTyp: row.rot_rut_boende_typ,
      rotRutBrfOrg: row.rot_rut_brf_org,
      rotRutBrfLagenhet: row.rot_rut_brf_lagenhet,
    }));

    // ROT/RUT data finns nu i artiklarna, så vi kan skapa ett rotRut-objekt från första artikeln som har ROT/RUT data
    const rotRutArtikel = artiklar.find((artikel) => artikel.rotRutTyp);
    const rotRut = rotRutArtikel
      ? {
          typ: rotRutArtikel.rotRutTyp,
          personnummer: rotRutArtikel.rotRutPersonnummer,
          fastighetsbeteckning: rotRutArtikel.rotRutFastighetsbeteckning,
          rot_boende_typ: rotRutArtikel.rotRutBoendeTyp,
          brf_organisationsnummer: rotRutArtikel.rotRutBrfOrg,
          brf_lagenhetsnummer: rotRutArtikel.rotRutBrfLagenhet,
          // Beräkna totaler från alla ROT/RUT artiklar
          arbetskostnad_ex_moms: artiklar
            .filter((a) => a.rotRutTyp)
            .reduce((sum, a) => sum + (parseFloat(a.arbetskostnadExMoms) || 0), 0),
          avdrag_procent: rotRutArtikel.avdragProcent,
          avdrag_belopp: artiklar
            .filter((a) => a.rotRutTyp)
            .reduce((sum, a) => {
              const arbetskostnad = parseFloat(a.arbetskostnadExMoms) || 0;
              const procent = parseFloat(a.avdragProcent) || 0;
              return sum + (arbetskostnad * procent) / 100;
            }, 0),
        }
      : {};

    return { faktura, artiklar, rotRut };
  } finally {
    client.release();
  }
}

export async function hamtaSparadeFakturor(): Promise<SparadFaktura[]> {
  const { userId } = await ensureSession();

  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      SELECT
        f.id, f.fakturanummer, f.fakturadatum, f."kundId",
        f.status, f.betaldatum,
        f.transaktions_id, f.rot_rut_status, 'kund' as typ,
        k.kundnamn
      FROM fakturor f
      LEFT JOIN kunder k ON f."kundId" = k.id
      WHERE f."user_id" = $1
      ORDER BY f.id DESC
      `,
      [userId]
    );

    // Hämta artiklar och beräkna totalt belopp för varje faktura
    const fakturorMedTotaler = await Promise.all(
      res.rows.map(async (faktura) => {
        const artiklarRes = await client.query(
          `SELECT antal, pris_per_enhet, moms, rot_rut_typ FROM faktura_artiklar WHERE faktura_id = $1`,
          [faktura.id]
        );

        const totalBelopp = artiklarRes.rows.reduce((sum, artikel) => {
          const prisInkMoms = artikel.pris_per_enhet * (1 + artikel.moms / 100);
          return sum + artikel.antal * prisInkMoms;
        }, 0);

        // Kolla om fakturan har ROT/RUT-artiklar
        const rotRutArtiklar = artiklarRes.rows.filter((artikel) => artikel.rot_rut_typ);
        const harROT = rotRutArtiklar.some((artikel) => artikel.rot_rut_typ === "ROT");
        const harRUT = rotRutArtiklar.some((artikel) => artikel.rot_rut_typ === "RUT");

        let rotRutTyp: SparadFaktura["rotRutTyp"] = null;
        if (harROT && harRUT) {
          rotRutTyp = "ROT+RUT";
        } else if (harROT) {
          rotRutTyp = "ROT";
        } else if (harRUT) {
          rotRutTyp = "RUT";
        }

        const legacy = mapStatusToLegacy(faktura.status);

        return {
          id: faktura.id,
          fakturanummer: faktura.fakturanummer,
          fakturadatum: faktura.fakturadatum,
          kundId: faktura.kundId,
          status: faktura.status,
          status_betalning: legacy.status_betalning,
          status_bokförd: legacy.status_bokförd,
          betaldatum: faktura.betaldatum,
          transaktions_id: faktura.transaktions_id,
          rot_rut_status: faktura.rot_rut_status,
          typ: faktura.typ,
          kundnamn: faktura.kundnamn,
          totalBelopp: Math.round(totalBelopp * 100) / 100,
          antalArtiklar: artiklarRes.rows.length,
          rotRutTyp,
        } as SparadFaktura;
      })
    );

    return fakturorMedTotaler;
  } catch (err) {
    console.error("❌ hamtaSparadeFakturor error:", err);
    return [];
  } finally {
    client.release();
  }
}

export async function deleteFaktura(id: number) {
  const { userId } = await ensureSession();

  // SÄKERHETSVALIDERING: Validera faktura-ID
  if (!validateAmount(id) || id <= 0) {
    console.error("[deleteFaktura] Ogiltigt faktura-ID vid radering", {
      userId,
      fakturaId: id,
    });
    return { success: false, error: "Ogiltigt faktura-ID" };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // SÄKERHETSVALIDERING: Verifiera att fakturan tillhör denna användare
    const verifyRes = await client.query(
      `SELECT id, transaktions_id, status FROM fakturor WHERE id = $1 AND "user_id" = $2`,
      [id, userId]
    );

    if (verifyRes.rows.length === 0) {
      await client.query("ROLLBACK");
      console.error("[deleteFaktura] Försök att radera faktura som inte ägs", {
        userId,
        fakturaId: id,
      });
      return { success: false, error: "Fakturan finns inte eller tillhör inte dig" };
    }

    const status = verifyRes.rows[0]?.status as string | null;

    if (status && isStatusAtLeastSkickad(status)) {
      await client.query("ROLLBACK");
      const normalized = status.trim();
      const errorMessage =
        normalized === "Färdig"
          ? "Det går inte att radera fakturor som är färdiga"
          : "Skickade fakturor kan inte raderas";
      return { success: false, error: errorMessage };
    }

    const transaktionsId = verifyRes.rows[0]?.transaktions_id;

    // Radera i rätt ordning (child tables först)
    // 1. Radera transaktionsposter (om det finns en transaktion)
    if (transaktionsId) {
      await client.query(`DELETE FROM transaktionsposter WHERE transaktions_id = $1`, [
        transaktionsId,
      ]);

      // 2. Radera transaktionen
      await client.query(`DELETE FROM transaktioner WHERE id = $1`, [transaktionsId]);
    }

    // 3. Radera faktura_artiklar (inklusive ROT/RUT data)
    await client.query(`DELETE FROM faktura_artiklar WHERE faktura_id = $1`, [id]);

    // 4. Radera fakturan själv (med dubbel validering av ägarskap)
    const deleteRes = await client.query(`DELETE FROM fakturor WHERE id = $1 AND "user_id" = $2`, [
      id,
      userId,
    ]);

    if (deleteRes.rowCount === 0) {
      await client.query("ROLLBACK");
      throw new Error("Fakturan kunde inte raderas - ägarskapsvalidering misslyckades");
    }

    await client.query("COMMIT");

    console.log(`✅ Säkert raderade faktura ${id} för user ${userId}`);
    if (transaktionsId) {
      console.log(`✅ Raderade transaktion ${transaktionsId} och dess poster`);
    }

    return { success: true };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("❌ ROLLBACK misslyckades i deleteFaktura:", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function getAllInvoices() {
  const { userId } = await ensureSession();

  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT * FROM fakturor WHERE "user_id" = $1 ORDER BY id DESC`, [
      userId,
    ]);
    const fakturor = res.rows;

    for (const f of fakturor) {
      const r = await client.query(`SELECT * FROM faktura_artiklar WHERE faktura_id = $1`, [f.id]);
      f.artiklar = r.rows.map((rad: { pris_per_enhet: number | string }) => ({
        ...rad,
        prisPerEnhet: Number(rad.pris_per_enhet),
      }));
    }

    return { success: true, invoices: fakturor };
  } finally {
    client.release();
  }
}

// EXPORTS (rate limiting moved to middleware)
export const saveInvoice = saveInvoiceInternal;
export const deleteInvoiceSecure = deleteFaktura;
