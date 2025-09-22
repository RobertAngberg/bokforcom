"use server";

import { pool } from "../../_lib/db";
import {
  validateKontonummer,
  validateAmount,
  sanitizeInput,
  sanitizeExportInput,
} from "../../_utils/validationUtils";
import { validateEmail } from "../../login/sakerhet/loginValidation";
import { getUserId, logSecurityEvent } from "../../_utils/authUtils";
import { withDatabase, withTransaction } from "../../_utils/dbUtils";
import { dateTillÅÅÅÅMMDD, stringTillDate } from "../../_utils/datum";
import { safeAsync, logError, createError } from "../../_utils/errorUtils";
import { withFormRateLimit } from "../../_utils/rateLimit";
import { Artikel } from "../_types/types";

// Förbättrad JSON-parsing med validering som använder centraliserad sanitisering
function safeParseFakturaJSON(jsonString: string): any[] {
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
  // FÖRBÄTTRAD SÄKERHETSVALIDERING: Säker session-hantering via authUtils
  let userId: number;
  try {
    userId = await getUserId();
    logSecurityEvent("login", userId, "Invoice save operation");
  } catch (error) {
    logSecurityEvent("invalid_access", undefined, "Attempted invoice save without valid session");
    return { success: false, error: "Säkerhetsfel: Ingen giltig session - måste vara inloggad" };
  }

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
  const kundEmail = formData.get("kundemail")?.toString() || "";

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
  return withDatabase(async (client) => {
    // Använd utils för säker datum-hantering
    const fakturadatum = dateTillÅÅÅÅMMDD(stringTillDate(formData.get("fakturadatum")?.toString()));
    const forfallodatum = dateTillÅÅÅÅMMDD(
      stringTillDate(formData.get("forfallodatum")?.toString())
    );
    const fakturaId = isUpdate ? parseInt(fakturaIdRaw!.toString(), 10) : undefined;

    // För nya fakturor: sätt dagens datum som default om inget fakturadatum anges
    const fakturaDateString = isUpdate
      ? fakturadatum
      : fakturadatum || dateTillÅÅÅÅMMDD(new Date());

    // För nya fakturor: sätt 30 dagar från idag som default för förfallodatum om inget anges
    const forfalloDatumsString = isUpdate
      ? forfallodatum
      : forfallodatum ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          return dateTillÅÅÅÅMMDD(d);
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

      for (const rad of artiklar) {
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
            rad.antal ?? null, // Använd antal istället för rotRutAntalTimmar
            rad.prisPerEnhet ?? null, // Använd prisPerEnhet istället för rotRutPrisPerTimme
            rad.rotRutBeskrivning ?? null,
            rad.rotRutStartdatum
              ? new Date(rad.rotRutStartdatum).toISOString().split("T")[0]
              : null,
            rad.rotRutSlutdatum ? new Date(rad.rotRutSlutdatum).toISOString().split("T")[0] : null,
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
          "kundId", nummer, logo_width
        ) VALUES ($1, $2, $3::date, $4::date, $5, $6, $7, $8, $9, $10)
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
        ]
      );

      const newId = insertF.rows[0].id;

      for (const rad of artiklar) {
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
            rad.antal ?? null, // Använd antal istället för rotRutAntalTimmar
            rad.prisPerEnhet ?? null, // Använd prisPerEnhet istället för rotRutPrisPerTimme
            rad.rotRutBeskrivning ?? null,
            rad.rotRutStartdatum
              ? new Date(rad.rotRutStartdatum).toISOString().split("T")[0]
              : null,
            rad.rotRutSlutdatum ? new Date(rad.rotRutSlutdatum).toISOString().split("T")[0] : null,
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
  });
}

export async function hämtaNästaFakturanummer() {
  const userId = await getUserId();
  if (!userId) return 1;
  // userId already a number from getUserId()

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

export async function hämtaFakturaMedRader(id: number) {
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

export async function hämtaSparadeFakturor() {
  const userId = await getUserId();
  if (!userId) {
    return [];
  }
  // userId already a number from getUserId()

  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      SELECT
        f.id, f.fakturanummer, f.fakturadatum, f."kundId",
        f.status_betalning, f.status_bokförd, f.betaldatum,
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

        let rotRutTyp: string | null = null;
        if (harROT && harRUT) {
          rotRutTyp = "ROT+RUT";
        } else if (harROT) {
          rotRutTyp = "ROT";
        } else if (harRUT) {
          rotRutTyp = "RUT";
        }

        return {
          ...faktura,
          totalBelopp: Math.round(totalBelopp * 100) / 100, // Avrunda till 2 decimaler
          antalArtiklar: artiklarRes.rows.length,
          rotRutTyp, // ✅ Lägg till ROT/RUT-info
        };
      })
    );

    return fakturorMedTotaler;
  } catch (err) {
    console.error("❌ hämtaSparadeFakturor error:", err);
    return [];
  } finally {
    client.release();
  }
}

export async function deleteFaktura(id: number) {
  // SÄKERHETSVALIDERING: Omfattande sessionsvalidering
  const userId = await getUserId();
  if (!userId) {
    console.error("Ogiltig session vid radering av faktura", { userId });
    return { success: false, error: "Säkerhetsvalidering misslyckades" };
  }

  // SÄKERHETSVALIDERING: Validera faktura-ID
  if (!validateAmount(id) || id <= 0) {
    logError(
      createError("Ogiltigt faktura-ID vid radering", {
        userId,
        context: { fakturaId: id },
      }),
      "deleteFaktura"
    );
    return { success: false, error: "Ogiltigt faktura-ID" };
  }

  // SÄKERHETSEVENT: Logga raderingsförsök
  logSecurityEvent("invalid_access", userId, `delete_faktura_${id}`);

  return withTransaction(async (client) => {
    // SÄKERHETSVALIDERING: Verifiera att fakturan tillhör denna användare
    const verifyRes = await client.query(
      `SELECT id, transaktions_id FROM fakturor WHERE id = $1 AND "user_id" = $2`,
      [id, userId]
    );

    if (verifyRes.rows.length === 0) {
      logError(
        createError("Försök att radera faktura som inte ägs", {
          userId,
          context: { fakturaId: id },
        }),
        "deleteFaktura"
      );
      return { success: false, error: "Fakturan finns inte eller tillhör inte dig" };
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
      throw new Error("Fakturan kunde inte raderas - ägarskapsvalidering misslyckades");
    }

    console.log(`✅ Säkert raderade faktura ${id} för user ${userId}`);
    if (transaktionsId) {
      console.log(`✅ Raderade transaktion ${transaktionsId} och dess poster`);
    }

    return { success: true };
  });
}

export async function getAllInvoices() {
  const userId = await getUserId();
  if (!userId) return { success: false, invoices: [] };
  // userId already a number from getUserId()

  return withDatabase(async (client) => {
    const res = await client.query(`SELECT * FROM fakturor WHERE "user_id" = $1 ORDER BY id DESC`, [
      userId,
    ]);
    const fakturor = res.rows;

    for (const f of fakturor) {
      const r = await client.query(`SELECT * FROM faktura_artiklar WHERE faktura_id = $1`, [f.id]);
      f.artiklar = r.rows.map((rad: { pris_per_enhet: any }) => ({
        ...rad,
        prisPerEnhet: Number(rad.pris_per_enhet),
      }));
    }

    return { success: true, invoices: fakturor };
  });
}

// === FÖRETAGSPROFIL (från foretagActions.ts) ===
export async function hämtaFöretagsprofil(): Promise<any | null> {
  try {
    const userId = await getUserId();

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
        webbplats
      FROM företagsprofil
      WHERE id = $1
      LIMIT 1
      `,
      [userId]
    );

    return rows[0] || null;
  } catch (error) {
    console.error("Fel vid hämtning av företagsprofil:", error);
    return null;
  }
}

export async function sparaFöretagsprofil(data: {
  företagsnamn: string;
  adress: string;
  postnummer: string;
  stad: string;
  organisationsnummer: string;
  momsregistreringsnummer: string;
  telefonnummer: string;
  epost: string;
  webbplats: string;
  logoWidth?: number;
}): Promise<{ success: boolean }> {
  try {
    const userId = await getUserId();

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
        webbplats
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
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
        webbplats = EXCLUDED.webbplats
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

// === KUNDER (från kundActions.ts) ===
export async function sparaNyKund(formData: FormData) {
  // FÖRBÄTTRAD SÄKERHETSVALIDERING: Säker session-hantering
  let userId: number;
  try {
    userId = await getUserId();
    logSecurityEvent("login", userId, "Customer creation operation");
  } catch (error) {
    logSecurityEvent(
      "invalid_access",
      undefined,
      "Attempted customer creation without valid session"
    );
    return { success: false, error: "Säkerhetsfel: Ingen giltig session - måste vara inloggad" };
  }

  // SÄKERHETSVALIDERING: Sanitera och validera all kundinformation
  const kundnamn = sanitizeInput(formData.get("kundnamn")?.toString() || "");
  const kundEmail = formData.get("kundemail")?.toString() || "";
  const orgNummer = formData.get("kundorgnummer")?.toString() || "";
  const personnummer = formData.get("personnummer")?.toString() || "";

  // Validera obligatoriska fält
  if (!kundnamn || kundnamn.length < 2) {
    return { success: false, error: "Kundnamn krävs (minst 2 tecken)" };
  }

  // Validera email om angivet
  if (kundEmail && !validateEmail(kundEmail)) {
    return { success: false, error: "Ogiltig email-adress" };
  }

  // Validera personnummer om angivet (grundläggande format)
  if (personnummer && !/^\d{6}-?\d{4}$/.test(personnummer.replace(/\s/g, ""))) {
    return { success: false, error: "Ogiltigt personnummer (format: YYMMDD-XXXX)" };
  }

  return withDatabase(async (client) => {
    // Säker parametriserad query med saniterade värden
    const res = await client.query(
      `INSERT INTO kunder (
        "user_id", kundnamn, kundorgnummer, kundnummer,
        kundmomsnummer, kundadress1, kundpostnummer, kundstad, kundemail
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        userId,
        kundnamn,
        sanitizeInput(orgNummer),
        sanitizeInput(formData.get("kundnummer")?.toString() || ""),
        sanitizeInput(formData.get("kundmomsnummer")?.toString() || ""),
        sanitizeInput(formData.get("kundadress1")?.toString() || ""),
        sanitizeInput(formData.get("kundpostnummer")?.toString() || ""),
        sanitizeInput(formData.get("kundstad")?.toString() || ""),
        kundEmail,
      ]
    );
    return { success: true, id: res.rows[0].id };
  });
}

export async function hämtaSparadeKunder() {
  const userId = await getUserId();
  if (!userId) return [];

  return withDatabase(async (client) => {
    const res = await client.query(
      'SELECT * FROM kunder WHERE "user_id" = $1 ORDER BY kundnamn ASC',
      [userId]
    );
    return res.rows;
  });
}

// Lägg till andra kundfunktioner vid behov...
export async function deleteKund(id: number) {
  const userId = await getUserId();
  if (!userId) return { success: false };

  return withDatabase(async (client) => {
    const result = await client.query('DELETE FROM kunder WHERE id = $1 AND "user_id" = $2', [
      id,
      userId,
    ]);
    return { success: result.rowCount > 0 };
  });
}

export async function uppdateraKund(id: number, formData: FormData) {
  const userId = await getUserId();
  if (!userId) return { success: false };

  const kundnamn = sanitizeInput(formData.get("kundnamn")?.toString() || "");
  if (!kundnamn || kundnamn.length < 2) {
    return { success: false, error: "Kundnamn krävs (minst 2 tecken)" };
  }

  return withDatabase(async (client) => {
    const result = await client.query(
      `UPDATE kunder SET 
        kundnamn = $1, 
        kundorgnummer = $2, 
        kundemail = $3,
        kundadress1 = $4,
        kundpostnummer = $5,
        kundstad = $6
      WHERE id = $7 AND "user_id" = $8`,
      [
        kundnamn,
        sanitizeInput(formData.get("kundorgnummer")?.toString() || ""),
        formData.get("kundemail")?.toString() || "",
        sanitizeInput(formData.get("kundadress1")?.toString() || ""),
        sanitizeInput(formData.get("kundpostnummer")?.toString() || ""),
        sanitizeInput(formData.get("kundstad")?.toString() || ""),
        id,
        userId,
      ]
    );
    return { success: result.rowCount > 0 };
  });
}

// === ARTIKLAR (från artikelActions.ts) ===
export async function hämtaSparadeArtiklar(): Promise<any[]> {
  const userId = await getUserId();
  if (!userId) return [];

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

// Lägg till andra artikelfunktioner vid behov...
export async function sparaFavoritArtikel(artikel: any) {
  const userId = await getUserId();
  if (!userId) return { success: false };

  return withDatabase(async (client) => {
    await client.query(
      `INSERT INTO faktura_favoritartiklar (
        user_id, beskrivning, antal, pris_per_enhet, moms, valuta, typ
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId,
        artikel.beskrivning,
        artikel.antal,
        artikel.prisPerEnhet,
        artikel.moms,
        artikel.valuta,
        artikel.typ,
      ]
    );
    return { success: true };
  });
}

export async function deleteFavoritArtikel(id: number) {
  const userId = await getUserId();
  if (!userId) return { success: false };

  return withDatabase(async (client) => {
    const result = await client.query(
      "DELETE FROM faktura_favoritartiklar WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return { success: result.rowCount > 0 };
  });
}

// SÄKRA EXPORTS MED RATE LIMITING
// Skyddar kritiska funktioner från missbruk och spam-attacker
export const saveInvoice = withFormRateLimit(saveInvoiceInternal);

// Rate-limited delete-funktioner för säkerhet
export const deleteInvoiceSecure = withFormRateLimit(deleteFaktura);
