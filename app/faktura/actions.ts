//#region
"use server";

import { auth } from "../../auth";
import { Pool } from "pg";
import { withFormRateLimit, withEmailRateLimit } from "../_utils/actionRateLimit";
// import { Resend } from "resend";
// TA BORT DENNA RAD:
// const resend = new Resend(process.env.RESEND_API_KEY);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Säker input-sanitization för faktura-modulen
function sanitizeFakturaInput(text: string): string {
  if (!text || typeof text !== "string") return "";

  return text
    .replace(/[<>'"&{}()[\]]/g, "") // Ta bort XSS-farliga tecken
    .replace(/\s+/g, " ") // Normalisera whitespace
    .trim()
    .substring(0, 1000); // Begränsa längd för fakturatext
}

// Validera numeriska värden för fakturor
function validateNumericFakturaInput(value: number): boolean {
  return !isNaN(value) && isFinite(value) && value >= 0 && value < 100000000;
}

// Säker email-validering för fakturor
function validateEmailInput(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Validera organisationsnummer
function validateOrganisationsnummer(orgNr: string): boolean {
  if (!orgNr || typeof orgNr !== "string") return true; // Frivilligt fält
  const cleanOrgNr = orgNr.replace(/[-\s]/g, "");
  return /^\d{10}$/.test(cleanOrgNr);
}

// Säker JSON-parsing med validering
function safeParseFakturaJSON(jsonString: string): any[] {
  try {
    if (!jsonString || typeof jsonString !== "string") return [];
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return [];

    // Validera varje artikel i arrayen
    return parsed.filter(
      (artikel) =>
        artikel &&
        typeof artikel === "object" &&
        typeof artikel.beskrivning === "string" &&
        artikel.beskrivning.length <= 500
    );
  } catch {
    return [];
  }
}

export type Artikel = {
  id?: number;
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  moms: number;
  valuta: string;
  typ: "vara" | "tjänst";
  rotRutTyp?: "ROT" | "RUT";
  rotRutKategori?: string;
  avdragProcent?: number;
  arbetskostnadExMoms?: number;
  rotRutBeskrivning?: string;
  rotRutStartdatum?: string;
  rotRutSlutdatum?: string;
  rotRutPersonnummer?: string;
  rotRutFastighetsbeteckning?: string;
  rotRutBoendeTyp?: string;
  rotRutBrfOrg?: string;
  rotRutBrfLagenhet?: string;
  // För att hålla reda på om artikeln kommer från en favoritartikel
  ursprungligFavoritId?: number;
};
//#endregion

// Intern funktion utan rate limiting (för wrappers)
async function saveInvoiceInternal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen giltig session - måste vara inloggad");
  }
  const userId = parseInt(session.user.id);
  if (isNaN(userId)) {
    throw new Error("Ogiltigt användar-ID i session");
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
    if (!artikel.beskrivning || sanitizeFakturaInput(artikel.beskrivning).length < 2) {
      return { success: false, error: "Alla artiklar måste ha en giltig beskrivning" };
    }

    if (!validateNumericFakturaInput(artikel.antal) || artikel.antal <= 0) {
      return { success: false, error: "Ogiltigt antal i artikel" };
    }

    if (!validateNumericFakturaInput(artikel.prisPerEnhet) || artikel.prisPerEnhet < 0) {
      return { success: false, error: "Ogiltigt pris i artikel" };
    }

    if (!validateNumericFakturaInput(artikel.moms) || artikel.moms < 0 || artikel.moms > 100) {
      return { success: false, error: "Ogiltig moms i artikel" };
    }
  }

  // SÄKERHETSVALIDERING: Validera fakturauppgifter
  const fakturaNummerRaw = formData.get("fakturanummer")?.toString();
  const fakturanummer = sanitizeFakturaInput(fakturaNummerRaw || "");
  if (!fakturanummer || fakturanummer.length < 1) {
    return { success: false, error: "Fakturanummer krävs" };
  }

  // SÄKERHETSVALIDERING: Validera kunduppgifter
  const kundnamn = sanitizeFakturaInput(formData.get("kundnamn")?.toString() || "");
  const kundEmail = formData.get("kundemail")?.toString() || "";

  if (!kundnamn || kundnamn.length < 2) {
    return { success: false, error: "Giltigt kundnamn krävs" };
  }

  if (kundEmail && !validateEmailInput(kundEmail)) {
    return { success: false, error: "Ogiltig email-adress" };
  }

  // SÄKERHETSVALIDERING: Validera organisationsnummer om angivet
  const orgNummer = formData.get("kundorganisationsnummer")?.toString() || "";
  if (orgNummer && !validateOrganisationsnummer(orgNummer)) {
    return { success: false, error: "Ogiltigt organisationsnummer" };
  }
  if (artiklar.length === 0) {
    return { success: false, error: "Fakturan måste ha minst en artikel" };
  }

  const client = await pool.connect();

  const formatDate = (str: string | null) => {
    if (!str) return null;
    const d = new Date(str);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
      .getDate()
      .toString()
      .padStart(2, "0")}`;
  };

  console.log("FITTLOGG: saveInvoice formData", Object.fromEntries(formData.entries()));

  try {
    const fakturadatum = formatDate(formData.get("fakturadatum")?.toString() ?? null);
    const forfallodatum = formatDate(formData.get("forfallodatum")?.toString() ?? null);
    const fakturaIdRaw = formData.get("id");
    const isUpdate = !!fakturaIdRaw;
    const fakturaId = isUpdate ? parseInt(fakturaIdRaw!.toString(), 10) : undefined;

    // För nya fakturor: sätt dagens datum som default om inget fakturadatum anges
    const fakturaDateString = isUpdate
      ? fakturadatum
      : fakturadatum || new Date().toISOString().split("T")[0];

    // För nya fakturor: sätt 30 dagar från idag som default för förfallodatum om inget anges
    const forfalloDatumsString = isUpdate
      ? forfallodatum
      : forfallodatum ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() + 30);
          return d.toISOString().split("T")[0];
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
        WHERE id = $10 AND "userId" = $11`,
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
        console.log("🔍 Sparar artikel i DB (UPDATE):", {
          beskrivning: rad.beskrivning,
          rotRutTyp: rad.rotRutTyp,
          rotRutBeskrivning: rad.rotRutBeskrivning,
          rotRutPersonnummer: rad.rotRutPersonnummer,
          rotRutStartdatum: rad.rotRutStartdatum,
          rotRutSlutdatum: rad.rotRutSlutdatum,
        });

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
          `SELECT MAX(CAST(fakturanummer AS INTEGER)) AS max FROM fakturor WHERE "userId" = $1`,
          [userId]
        );
        fakturanummer = ((latest.rows[0].max || 0) + 1).toString();
      }

      const insertF = await client.query(
        `INSERT INTO fakturor (
          "userId", fakturanummer, fakturadatum, forfallodatum,
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
  } catch (err) {
    console.error("❌ saveInvoice error:", err);
    return { success: false };
  } finally {
    client.release();
  }
}

export async function deleteFaktura(id: number) {
  const client = await pool.connect();
  try {
    // Först hämta transaktions_id från fakturan
    const fakturaRes = await client.query(`SELECT transaktions_id FROM fakturor WHERE id = $1`, [
      id,
    ]);

    const transaktionsId = fakturaRes.rows[0]?.transaktions_id;

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

    // 4. Radera fakturan själv
    await client.query(`DELETE FROM fakturor WHERE id = $1`, [id]);

    console.log(`✅ Raderade faktura ${id} med alla relaterade data`);
    if (transaktionsId) {
      console.log(`✅ Raderade transaktion ${transaktionsId} och dess poster`);
    }

    return { success: true };
  } catch (err) {
    console.error("❌ deleteFaktura error:", err);
    return { success: false };
  } finally {
    client.release();
  }
}

export async function deleteKund(id: number) {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM kunder WHERE id = $1`, [id]);
    return { success: true };
  } catch (err) {
    console.error("❌ deleteKund error:", err);
    return { success: false };
  } finally {
    client.release();
  }
}

export async function hämtaSparadeKunder() {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = parseInt(session.user.id, 10);

  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT * FROM kunder WHERE "userId" = $1 ORDER BY id DESC`, [
      userId,
    ]);
    return res.rows;
  } catch (err) {
    console.error("❌ hämtaSparadeKunder error:", err);
    return [];
  } finally {
    client.release();
  }
}

export async function hämtaSparadeFakturor() {
  const session = await auth();
  if (!session?.user?.id) {
    console.log("❌ No session or user ID");
    return [];
  }
  const userId = parseInt(session.user.id, 10);
  console.log("🔍 Looking for fakturor with userId:", userId);

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
      WHERE f."userId" = $1
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

    console.log("🔍 Found fakturor:", fakturorMedTotaler.length);
    return fakturorMedTotaler;
  } catch (err) {
    console.error("❌ hämtaSparadeFakturor error:", err);
    return [];
  } finally {
    client.release();
  }
}

export async function deleteFavoritArtikel(id: number) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id);

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

export async function getAllInvoices() {
  const session = await auth();
  if (!session?.user?.id) return { success: false, invoices: [] };
  const userId = parseInt(session.user.id, 10);
  const client = await pool.connect();

  try {
    const res = await client.query(`SELECT * FROM fakturor WHERE "userId" = $1 ORDER BY id DESC`, [
      userId,
    ]);
    const fakturor = res.rows;

    for (const f of fakturor) {
      const r = await client.query(`SELECT * FROM faktura_artiklar WHERE faktura_id = $1`, [f.id]);
      f.artiklar = r.rows.map((rad) => ({
        ...rad,
        prisPerEnhet: Number(rad.pris_per_enhet),
      }));
    }

    return { success: true, invoices: fakturor };
  } catch (err) {
    console.error("❌ getAllInvoices error:", err);
    return { success: false, invoices: [] };
  } finally {
    client.release();
  }
}

export async function sparaNyKund(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen giltig session - måste vara inloggad");
  }
  const userId = parseInt(session.user.id, 10);
  if (isNaN(userId)) {
    throw new Error("Ogiltigt användar-ID i session");
  }

  // SÄKERHETSVALIDERING: Sanitera och validera all kundinformation
  const kundnamn = sanitizeFakturaInput(formData.get("kundnamn")?.toString() || "");
  const kundEmail = formData.get("kundemail")?.toString() || "";
  const orgNummer = formData.get("kundorgnummer")?.toString() || "";
  const personnummer = formData.get("personnummer")?.toString() || "";

  // Validera obligatoriska fält
  if (!kundnamn || kundnamn.length < 2) {
    return { success: false, error: "Kundnamn krävs (minst 2 tecken)" };
  }

  // Validera email om angivet
  if (kundEmail && !validateEmailInput(kundEmail)) {
    return { success: false, error: "Ogiltig email-adress" };
  }

  // Validera organisationsnummer om angivet
  if (orgNummer && !validateOrganisationsnummer(orgNummer)) {
    return { success: false, error: "Ogiltigt organisationsnummer" };
  }

  // Validera personnummer om angivet (grundläggande format)
  if (personnummer && !/^\d{6}-?\d{4}$/.test(personnummer.replace(/\s/g, ""))) {
    return { success: false, error: "Ogiltigt personnummer (format: YYMMDD-XXXX)" };
  }

  const client = await pool.connect();

  try {
    // Säker parametriserad query med saniterade värden
    const res = await client.query(
      `INSERT INTO kunder (
        "userId", kundnamn, kundorgnummer, kundnummer,
        kundmomsnummer, kundadress1, kundpostnummer, kundstad, kundemail, personnummer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        userId,
        kundnamn,
        sanitizeFakturaInput(orgNummer),
        sanitizeFakturaInput(formData.get("kundnummer")?.toString() || ""),
        sanitizeFakturaInput(formData.get("kundmomsnummer")?.toString() || ""),
        sanitizeFakturaInput(formData.get("kundadress1")?.toString() || ""),
        sanitizeFakturaInput(formData.get("kundpostnummer")?.toString() || ""),
        sanitizeFakturaInput(formData.get("kundstad")?.toString() || ""),
        kundEmail,
        sanitizeFakturaInput(personnummer),
      ]
    );
    return { success: true, id: res.rows[0].id };
  } catch (err) {
    console.error("❌ Säkerhetsfel vid sparande av kund:", err);
    return { success: false, error: "Kunde inte spara kund säkert" };
  } finally {
    client.release();
  }
}

export async function uppdateraKund(id: number, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id, 10);

  // SÄKERHETSVALIDERING: Validera kund-ID
  if (isNaN(id) || id <= 0) {
    return { success: false, error: "Ogiltigt kund-ID" };
  }

  // SÄKERHETSVALIDERING: Sanitera alla input-värden
  const kundnamn = sanitizeFakturaInput(formData.get("kundnamn")?.toString() || "");
  const kundEmail = formData.get("kundemail")?.toString() || "";
  const orgNummer = formData.get("kundorgnummer")?.toString() || "";
  const personnummer = formData.get("personnummer")?.toString() || "";

  // Validera obligatoriska fält
  if (!kundnamn || kundnamn.length < 2) {
    return { success: false, error: "Kundnamn krävs (minst 2 tecken)" };
  }

  // Validera email om angivet
  if (kundEmail && !validateEmailInput(kundEmail)) {
    return { success: false, error: "Ogiltig email-adress" };
  }

  // Validera organisationsnummer om angivet
  if (orgNummer && !validateOrganisationsnummer(orgNummer)) {
    return { success: false, error: "Ogiltigt organisationsnummer" };
  }

  // Validera personnummer om angivet
  if (personnummer && !/^\d{6}-?\d{4}$/.test(personnummer.replace(/\s/g, ""))) {
    return { success: false, error: "Ogiltigt personnummer (format: YYMMDD-XXXX)" };
  }

  const client = await pool.connect();
  try {
    // SÄKERHETSVALIDERING: Verifiera att kunden tillhör denna användare
    const verifyRes = await client.query(`SELECT id FROM kunder WHERE id = $1 AND "userId" = $2`, [
      id,
      userId,
    ]);

    if (verifyRes.rows.length === 0) {
      return { success: false, error: "Kunden finns inte eller tillhör inte dig" };
    }

    await client.query(
      `
      UPDATE kunder SET
        kundnamn = $1,
        kundnummer = $2,
        kundorgnummer = $3,
        kundmomsnummer = $4,
        kundadress1 = $5,
        kundpostnummer = $6,
        kundstad = $7,
        kundemail = $8,
        personnummer = $9
      WHERE id = $10 AND "userId" = $11
      `,
      [
        kundnamn,
        sanitizeFakturaInput(formData.get("kundnummer")?.toString() || ""),
        sanitizeFakturaInput(orgNummer),
        sanitizeFakturaInput(formData.get("kundmomsnummer")?.toString() || ""),
        sanitizeFakturaInput(formData.get("kundadress1")?.toString() || ""),
        sanitizeFakturaInput(formData.get("kundpostnummer")?.toString() || ""),
        sanitizeFakturaInput(formData.get("kundstad")?.toString() || ""),
        kundEmail,
        sanitizeFakturaInput(personnummer),
        id,
        userId,
      ]
    );

    return { success: true };
  } catch (err) {
    console.error("❌ Säkerhetsfel vid uppdatering av kund:", err);
    return { success: false, error: "Kunde inte uppdatera kund säkert" };
  } finally {
    client.release();
  }
}

export async function hämtaFöretagsprofil(userId: string): Promise<any | null> {
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

export async function sparaFöretagsprofil(
  userId: string,
  data: {
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
  }
): Promise<{ success: boolean }> {
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

export async function sparaFavoritArtikel(artikel: Artikel) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id);

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

export async function updateFavoritArtikel(id: number, artikel: any) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id);

  try {
    const result = await pool.query(
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

export async function hämtaSparadeArtiklar(): Promise<Artikel[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = parseInt(session.user.id);

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

    console.log(`🏗️ hämtaFakturaMedRader(${id}) - ROT/RUT data från artiklar:`, rotRut);

    return { faktura, artiklar, rotRut };
  } finally {
    client.release();
  }
}

export async function hämtaNästaFakturanummer() {
  const session = await auth();
  if (!session?.user?.id) return 1;
  const userId = parseInt(session.user.id);

  const client = await pool.connect();
  try {
    const latest = await client.query(
      `SELECT MAX(CAST(fakturanummer AS INTEGER)) AS max FROM fakturor WHERE "userId" = $1`,
      [userId]
    );
    return (latest.rows[0].max || 0) + 1;
  } finally {
    client.release();
  }
}

export async function hämtaSenasteBetalningsmetod(userId: string) {
  try {
    const result = await pool.query(
      `
      SELECT 
        betalningsmetod, 
        nummer
      FROM fakturor 
      WHERE "userId" = $1 
        AND betalningsmetod IS NOT NULL 
        AND betalningsmetod != ''
        AND nummer IS NOT NULL
        AND nummer != ''
      ORDER BY id DESC
      LIMIT 1
    `,
      [parseInt(userId)]
    );

    if (result.rows.length === 0) {
      return { betalningsmetod: null, nummer: null };
    }

    const { betalningsmetod, nummer } = result.rows[0];
    return { betalningsmetod, nummer };
  } catch (error) {
    console.error("❌ Fel vid hämtning av senaste betalningsmetod:", error);
    return { betalningsmetod: null, nummer: null };
  }
}

export async function hämtaBokföringsmetod() {
  const session = await auth();
  if (!session?.user?.id) return "kontantmetoden"; // Default

  try {
    const result = await pool.query("SELECT bokföringsmetod FROM users WHERE id = $1", [
      parseInt(session.user.id),
    ]);

    return result.rows[0]?.bokföringsmetod || "kontantmetoden";
  } catch (error) {
    console.error("Fel vid hämtning av bokföringsmetod:", error);
    return "kontantmetoden";
  }
}

// Hämta fakturas status
export async function hämtaFakturaStatus(fakturaId: number): Promise<{
  status_betalning?: string;
  status_bokförd?: string;
  betaldatum?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return {};

  try {
    const result = await pool.query(
      'SELECT status_betalning, status_bokförd, betaldatum FROM fakturor WHERE id = $1 AND "userId" = $2',
      [fakturaId, parseInt(session.user.id)]
    );
    return result.rows[0] || {};
  } catch (error) {
    console.error("Fel vid hämtning av fakturaSTATUS:", error);
    return {};
  }
}

export async function sparaBokföringsmetod(metod: "kontantmetoden" | "fakturametoden") {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Inte inloggad" };

  try {
    await pool.query("UPDATE users SET bokföringsmetod = $1, uppdaterad = NOW() WHERE id = $2", [
      metod,
      parseInt(session.user.id),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Fel vid sparande av bokföringsmetod:", error);
    return { success: false, error: "Databasfel" };
  }
}

interface BokföringsPost {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
  beskrivning: string;
}

interface BokförFakturaData {
  fakturaId?: number;
  fakturanummer: string;
  kundnamn: string;
  totaltBelopp: number;
  poster: BokföringsPost[];
  kommentar?: string;
}

export async function bokförFaktura(data: BokförFakturaData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Inte inloggad" };
  }

  const userId = parseInt(session.user.id);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Validera att bokföringen balanserar
    const totalDebet = data.poster.reduce((sum, post) => sum + post.debet, 0);
    const totalKredit = data.poster.reduce((sum, post) => sum + post.kredit, 0);

    if (Math.abs(totalDebet - totalKredit) > 0.01) {
      throw new Error(
        `Bokföringen balanserar inte! Debet: ${totalDebet.toFixed(2)}, Kredit: ${totalKredit.toFixed(2)}`
      );
    }

    // Skapa huvudtransaktion
    const transaktionQuery = `
      INSERT INTO transaktioner (
        transaktionsdatum, kontobeskrivning, belopp, kommentar, "userId"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const transaktionResult = await client.query(transaktionQuery, [
      new Date(), // Dagens datum
      `Faktura ${data.fakturanummer} - ${data.kundnamn}`,
      data.totaltBelopp,
      data.kommentar || `Bokföring av faktura ${data.fakturanummer} för ${data.kundnamn}`,
      userId,
    ]);

    const transaktionsId = transaktionResult.rows[0].id;
    console.log("🆔 Skapad fakturatransaktion:", transaktionsId);

    // Skapa bokföringsposter
    const insertPostQuery = `
      INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit)
      VALUES ($1, $2, $3, $4)
    `;

    for (const post of data.poster) {
      // Hämta konto_id från konton-tabellen
      const kontoResult = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
        post.konto,
      ]);

      if (kontoResult.rows.length === 0) {
        throw new Error(`Konto ${post.konto} (${post.kontoNamn}) finns inte i databasen`);
      }

      const kontoId = kontoResult.rows[0].id;

      await client.query(insertPostQuery, [transaktionsId, kontoId, post.debet, post.kredit]);

      console.log(`📘 Bokförd post ${post.konto}: D ${post.debet}  K ${post.kredit}`);
    }

    // Uppdatera fakturas status när den bokförs
    if (data.fakturaId) {
      // Kolla om det är en betalningsregistrering (innehåller 1930 och 1510)
      const harBankKonto = data.poster.some((p) => p.konto === "1930" || p.konto === "1910");
      const harKundfordringar = data.poster.some((p) => p.konto === "1510");
      const ärBetalning = harBankKonto && harKundfordringar && data.poster.length === 2;

      if (ärBetalning) {
        // Detta är en betalningsregistrering (Fakturametoden: Bank → Kundfordringar)
        // Kolla om fakturan har ROT/RUT-artiklar för att avgöra om det är delvis betald
        const rotRutCheck = await client.query(
          "SELECT COUNT(*) as count FROM faktura_artiklar WHERE faktura_id = $1 AND rot_rut_typ IS NOT NULL",
          [data.fakturaId]
        );

        let status = "Betald";
        const harRotRutArtiklar = parseInt(rotRutCheck.rows[0].count) > 0;

        if (harRotRutArtiklar) {
          // För ROT/RUT-fakturor: Bara kundens del är betald, väntar på SKV
          status = "Delvis betald";
        }

        await client.query(
          "UPDATE fakturor SET status_betalning = $1, betaldatum = $2, transaktions_id = $3 WHERE id = $4",
          [status, new Date().toISOString().split("T")[0], transaktionsId, data.fakturaId]
        );
        console.log(`💰 Uppdaterat faktura ${data.fakturaId} status till ${status}`);
      } else {
        // Kolla om det är kontantmetod (Bank + Försäljning/Moms, men ingen Kundfordringar)
        const harBankKontantmetod = data.poster.some((p) => p.konto === "1930");
        const harIngenKundfordringar = !data.poster.some((p) => p.konto === "1510");
        const ärKontantmetod = harBankKontantmetod && harIngenKundfordringar;

        if (ärKontantmetod) {
          // Kontantmetod: sätt både bokförd OCH betald
          await client.query(
            "UPDATE fakturor SET status_bokförd = $1, status_betalning = $2, betaldatum = $3, transaktions_id = $4 WHERE id = $5",
            [
              "Bokförd",
              "Betald",
              new Date().toISOString().split("T")[0],
              transaktionsId,
              data.fakturaId,
            ]
          );
          console.log(
            `💰📊 Uppdaterat faktura ${data.fakturaId} status till Bokförd och Betald (kontantmetod)`
          );
        } else {
          // Normal fakturametods-bokföring
          await client.query(
            "UPDATE fakturor SET status_bokförd = $1, transaktions_id = $2 WHERE id = $3",
            ["Bokförd", transaktionsId, data.fakturaId]
          );
          console.log(`📊 Uppdaterat faktura ${data.fakturaId} status till Bokförd`);
        }
      }
    }

    await client.query("COMMIT");
    console.log("✅ Faktura bokförd framgångsrikt!");

    return {
      success: true,
      transaktionsId,
      message: `Faktura ${data.fakturanummer} har bokförts framgångsrikt!`,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Fel vid bokföring av faktura:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Okänt fel vid bokföring",
    };
  } finally {
    client.release();
  }
}

export async function hamtaBokfordaFakturor() {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Ej autentiserad" };
  }

  const userId = parseInt(session.user.id);
  const client = await pool.connect();

  try {
    // Hämta endast leverantörsfakturor från leverantörsfakturor tabellen
    const { rows } = await client.query(
      `
      SELECT DISTINCT
        t.id as transaktion_id,
        lf.id,
        t.transaktionsdatum as datum,
        t.belopp,
        t.kommentar,
        lf.leverantör_namn as leverantör,
        lf.fakturanummer,
        lf.fakturadatum,
        lf.förfallodatum,
        lf.betaldatum,
        lf.status_betalning,
        lf.status_bokförd
      FROM transaktioner t
      INNER JOIN leverantörsfakturor lf ON lf.transaktions_id = t.id
      WHERE t."userId" = $1
      ORDER BY t.transaktionsdatum DESC, t.id DESC
      LIMIT 100
    `,
      [userId]
    );

    const fakturor = rows.map((row) => {
      return {
        id: row.id, // Nu leverantörsfaktura.id istället för transaktion.id
        transaktionId: row.transaktion_id, // För verifikat-modal
        datum: row.datum,
        belopp: parseFloat(row.belopp),
        kommentar: row.kommentar || "",
        leverantör: row.leverantör || "",
        fakturanummer: row.fakturanummer || "",
        fakturadatum: row.fakturadatum,
        förfallodatum: row.förfallodatum,
        betaldatum: row.betaldatum,
        status_betalning: row.status_betalning || (row.betaldatum ? "Betald" : "Obetald"),
        status_bokförd: row.status_bokförd || "Bokförd",
      };
    });

    return { success: true, fakturor };
  } catch (error) {
    console.error("Fel vid hämtning av bokförda fakturor:", error);
    return {
      success: false,
      error: "Kunde inte hämta bokförda fakturor",
    };
  } finally {
    client.release();
  }
}

export async function hamtaTransaktionsposter(transaktionId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Ej autentiserad" };
  }

  const userId = parseInt(session.user.id);
  const client = await pool.connect();

  try {
    console.log("🔍 Hämtar transaktionsposter för:", { transaktionId, userId });

    // Först, kolla om transaktionen finns
    const { rows: transCheck } = await client.query(
      `SELECT id, "userId" FROM transaktioner WHERE id = $1`,
      [transaktionId]
    );
    console.log("🔍 Transaktion existerar:", transCheck);

    // Sedan, kolla transaktionsposter utan JOIN först
    const { rows: posterSimple } = await client.query(
      `SELECT * FROM transaktionsposter WHERE transaktions_id = $1`,
      [transaktionId]
    );
    console.log("🔍 Transaktionsposter (simple):", posterSimple);

    // Hämta transaktionsposter med kontoinformation
    const { rows } = await client.query(
      `
      SELECT 
        tp.id,
        tp.debet,
        tp.kredit,
        k.kontonummer,
        k.beskrivning as konto_beskrivning,
        t.transaktionsdatum,
        t.kommentar as transaktionskommentar,
        t.id as transaktion_id
      FROM transaktionsposter tp
      JOIN konton k ON tp.konto_id = k.id
      JOIN transaktioner t ON tp.transaktions_id = t.id
      WHERE tp.transaktions_id = $1 AND t."userId" = $2
      ORDER BY tp.id
    `,
      [transaktionId, userId]
    );

    console.log("📝 Hittade transaktionsposter:", rows.length);

    // Om inga poster hittades, kolla vad som finns i transaktioner
    if (rows.length === 0) {
      const { rows: transaktionCheck } = await client.query(
        `SELECT id, transaktionsdatum, kommentar, "userId" FROM transaktioner WHERE id = $1`,
        [transaktionId]
      );
      console.log("🔍 Transaktion check:", transaktionCheck);

      const { rows: posterCheck } = await client.query(
        `SELECT COUNT(*) as antal FROM transaktionsposter WHERE transaktions_id = $1`,
        [transaktionId]
      );
      console.log("🔍 Poster check:", posterCheck);
    }

    const poster = rows.map((row) => ({
      id: row.id,
      kontonummer: row.kontonummer,
      kontobeskrivning: row.konto_beskrivning,
      debet: parseFloat(row.debet) || 0,
      kredit: parseFloat(row.kredit) || 0,
      transaktionsdatum: row.transaktionsdatum,
      transaktionskommentar: row.transaktionskommentar,
    }));

    return { success: true, poster };
  } catch (error) {
    console.error("Fel vid hämtning av transaktionsposter:", error);
    return {
      success: false,
      error: "Kunde inte hämta transaktionsposter",
    };
  } finally {
    client.release();
  }
}

export async function registreraBetalning(leverantörsfakturaId: number, belopp: number) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Ej autentiserad" };
  }

  const userId = parseInt(session.user.id);
  const client = await pool.connect();

  try {
    // Skapa ny transaktion för betalningen
    const { rows: transRows } = await client.query(
      `INSERT INTO transaktioner (
        transaktionsdatum, kontobeskrivning, belopp, kommentar, "userId"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id`,
      [
        new Date().toISOString().split("T")[0], // Dagens datum
        "Betalning leverantörsfaktura",
        belopp,
        "Automatisk betalning av leverantörsfaktura",
        userId,
      ]
    );
    const transaktionsId = transRows[0].id;

    // Hämta konto-id för 1930 (Företagskonto) och 2440 (Leverantörsskulder)
    const kontoRes = await client.query(
      `SELECT id, kontonummer FROM konton WHERE kontonummer IN ('1930','2440')`
    );
    const kontoMap = Object.fromEntries(kontoRes.rows.map((r: any) => [r.kontonummer, r.id]));

    if (!kontoMap["1930"] || !kontoMap["2440"]) {
      throw new Error("Konto 1930 eller 2440 saknas");
    }

    // Skapa transaktionsposter för betalningen
    // 1930 Företagskonto - Kredit (pengar ut)
    await client.query(
      `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)`,
      [transaktionsId, kontoMap["1930"], 0, belopp]
    );

    // 2440 Leverantörsskulder - Debet (skuld minskar)
    await client.query(
      `INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)`,
      [transaktionsId, kontoMap["2440"], belopp, 0]
    );

    // Uppdatera leverantörsfaktura med betaldatum och status
    console.log("📝 Uppdaterar leverantörsfaktura:", leverantörsfakturaId, "för userId:", userId);
    const updateResult = await client.query(
      `UPDATE leverantörsfakturor 
       SET betaldatum = $1, status_betalning = 'Betald' 
       WHERE id = $2 AND "userId" = $3`,
      [new Date().toISOString().split("T")[0], leverantörsfakturaId, userId]
    );
    console.log("📝 Update result rowCount:", updateResult.rowCount);

    return { success: true, transaktionsId };
  } catch (error) {
    console.error("Fel vid registrering av betalning:", error);
    return {
      success: false,
      error: "Kunde inte registrera betalning",
    };
  } finally {
    client.release();
  }
}

export type Leverantör = {
  id?: number;
  namn: string;
  organisationsnummer?: string;
  adress?: string;
  postnummer?: string;
  ort?: string;
  telefon?: string;
  email?: string;
  skapad?: string;
  uppdaterad?: string;
};

// ENKEL betalningsregistrering - BARA 1510 ↔ 1930
export async function registreraBetalningEnkel(
  fakturaId: number,
  belopp: number
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Inte inloggad" };

  const userId = parseInt(session.user.id);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Skapa transaktion
    const transResult = await client.query(
      'INSERT INTO transaktioner (transaktionsdatum, kontobeskrivning, belopp, "userId") VALUES ($1, $2, $3, $4) RETURNING id',
      [new Date(), `Betalning faktura ${fakturaId}`, belopp, userId]
    );
    const transId = transResult.rows[0].id;

    // Hämta konto-IDn
    const bankResult = await client.query("SELECT id FROM konton WHERE kontonummer = '1930'");
    const kundResult = await client.query("SELECT id FROM konton WHERE kontonummer = '1510'");

    // 1930 Bank - DEBET
    await client.query(
      "INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)",
      [transId, bankResult.rows[0].id, belopp, 0]
    );

    // 1510 Kundfordringar - KREDIT
    await client.query(
      "INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)",
      [transId, kundResult.rows[0].id, 0, belopp]
    );

    // Uppdatera fakturaSTATUS
    await client.query("UPDATE fakturor SET status_betalning = $1, betaldatum = $2 WHERE id = $3", [
      "Betald",
      new Date().toISOString().split("T")[0],
      fakturaId,
    ]);

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fel:", error);
    return { success: false, error: "Kunde inte registrera betalning" };
  } finally {
    client.release();
  }
}
export async function registreraKundfakturaBetalning(
  fakturaId: number,
  betalningsbelopp: number,
  kontoklass: string
): Promise<{ success: boolean; error?: string; transaktionsId?: number }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Inte inloggad" };
  }

  const userId = parseInt(session.user.id);
  const client = await pool.connect();
  try {
    // Hämta fakturauppgifter och artiklar
    const fakturaResult = await client.query(
      'SELECT * FROM fakturor WHERE id = $1 AND "userId" = $2',
      [fakturaId, userId]
    );

    if (fakturaResult.rows.length === 0) {
      return { success: false, error: "Faktura hittades inte" };
    }

    const faktura = fakturaResult.rows[0];

    // Kontrollera att fakturan är en kundfaktura och inte redan betald
    if (faktura.typ !== "kund" || faktura.status_betalning === "betald") {
      return { success: false, error: "Fakturan kan inte betalas" };
    }

    // Kolla om fakturan har ROT/RUT-artiklar
    const artiklarResult = await client.query(
      "SELECT rot_rut_typ FROM faktura_artiklar WHERE faktura_id = $1",
      [fakturaId]
    );

    const harRotRut = artiklarResult.rows.some((row) => row.rot_rut_typ);

    await client.query("BEGIN");

    // Skapa ny transaktion för betalningen
    const transaktionResult = await client.query(
      "INSERT INTO transaktioner (user_id, datum, beskrivning, typ) VALUES ($1, $2, $3, $4) RETURNING id",
      [
        userId,
        new Date().toISOString().split("T")[0],
        `Betalning kundfaktura ${faktura.fakturanummer}`,
        "kundfaktura_betalning",
      ]
    );

    const transaktionsId = transaktionResult.rows[0].id;

    // Debitera bank/kassa konto
    const bankKonto = kontoklass === "1930" ? "1930" : "1910";
    await client.query(
      "INSERT INTO transaktionsposter (transaktion_id, konto, debet, kredit, beskrivning) VALUES ($1, $2, $3, $4, $5)",
      [
        transaktionsId,
        bankKonto,
        betalningsbelopp,
        0,
        `Betalning kundfaktura ${faktura.fakturanummer}`,
      ]
    );

    // Kreditera kundfordringar (bara 1510 för vanliga fakturor, även för ROT/RUT)
    // För ROT/RUT: betalningsbelopp ska vara kundens del (50%), 1513 förblir orörd
    await client.query(
      "INSERT INTO transaktionsposter (transaktion_id, konto, debet, kredit, beskrivning) VALUES ($1, $2, $3, $4, $5)",
      [
        transaktionsId,
        "1510",
        0,
        betalningsbelopp,
        `Betalning kundfaktura ${faktura.fakturanummer}${harRotRut ? " (kundens del)" : ""}`,
      ]
    );

    // Uppdatera fakturastatus
    await client.query(
      "UPDATE fakturor SET status_betalning = $1, betaldatum = $2, transaktions_id = $3 WHERE id = $4",
      ["betald", new Date().toISOString().split("T")[0], transaktionsId, fakturaId]
    );

    await client.query("COMMIT");

    return {
      success: true,
      transaktionsId: transaktionsId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fel vid registrering av kundfakturabetalning:", error);
    return {
      success: false,
      error: "Kunde inte registrera betalning",
    };
  } finally {
    client.release();
  }
}

export async function saveLeverantör(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id);

  // SÄKERHETSVALIDERING: Sanitera och validera all input
  const namn = sanitizeFakturaInput(formData.get("namn")?.toString() || "");
  const organisationsnummer = sanitizeFakturaInput(
    formData.get("organisationsnummer")?.toString() || formData.get("vatnummer")?.toString() || ""
  );
  const adress = sanitizeFakturaInput(formData.get("adress")?.toString() || "");
  const postnummer = sanitizeFakturaInput(formData.get("postnummer")?.toString() || "");
  const ort = sanitizeFakturaInput(formData.get("ort")?.toString() || "");
  const telefon = sanitizeFakturaInput(formData.get("telefon")?.toString() || "");
  const email = formData.get("email")?.toString() || "";

  // Validera obligatoriska fält
  if (!namn || namn.length < 2) {
    return { success: false, error: "Leverantörsnamn krävs (minst 2 tecken)" };
  }

  // Validera email om angivet
  if (email && !validateEmailInput(email)) {
    return { success: false, error: "Ogiltig email-adress" };
  }

  // Validera organisationsnummer om angivet
  if (organisationsnummer && !validateOrganisationsnummer(organisationsnummer)) {
    return { success: false, error: "Ogiltigt organisationsnummer" };
  }

  const client = await pool.connect();

  try {
    const result = await client.query(
      `INSERT INTO "leverantörer" (
        "userId", "namn", "organisationsnummer", "adress", "postnummer", "ort", 
        "telefon", "email"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [userId, namn, organisationsnummer, adress, postnummer, ort, telefon, email]
    );

    return { success: true, leverantör: result.rows[0] };
  } catch (error) {
    console.error("❌ Säkerhetsfel vid sparande av leverantör:", error);
    return { success: false, error: "Kunde inte spara leverantör säkert" };
  } finally {
    client.release();
  }
}

export async function getLeverantörer() {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id);
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT * FROM "leverantörer" WHERE "userId" = $1 ORDER BY "namn" ASC`,
      [userId]
    );

    return { success: true, leverantörer: result.rows };
  } catch (error) {
    console.error("Fel vid hämtning av leverantörer:", error);
    return { success: false, error: "Kunde inte hämta leverantörer" };
  } finally {
    client.release();
  }
}

export async function updateLeverantör(
  id: number,
  data: {
    namn: string;
    organisationsnummer?: string;
    adress?: string;
    postnummer?: string;
    ort?: string;
    telefon?: string;
    email?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id);
  const client = await pool.connect();

  try {
    const result = await client.query(
      `UPDATE "leverantörer" 
       SET "namn" = $1, "organisationsnummer" = $2, "adress" = $3, 
           "postnummer" = $4, "ort" = $5, "telefon" = $6, "email" = $7, "uppdaterad" = NOW()
       WHERE "id" = $8 AND "userId" = $9`,
      [
        data.namn,
        data.organisationsnummer,
        data.adress,
        data.postnummer,
        data.ort,
        data.telefon,
        data.email,
        id,
        userId,
      ]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Leverantör hittades inte" };
    }

    return { success: true };
  } catch (error) {
    console.error("Fel vid uppdatering av leverantör:", error);
    return { success: false, error: "Kunde inte uppdatera leverantör" };
  } finally {
    client.release();
  }
}

export async function uppdateraRotRutStatus(
  fakturaId: number,
  status: "ej_inskickad" | "väntar" | "godkänd"
) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id);
  const client = await pool.connect();

  try {
    const result = await client.query(
      `UPDATE fakturor SET rot_rut_status = $1 WHERE id = $2 AND "userId" = $3`,
      [status, fakturaId, userId]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Faktura hittades inte" };
    }

    return { success: true };
  } catch (error) {
    console.error("Fel vid uppdatering av ROT/RUT status:", error);
    return { success: false, error: "Kunde inte uppdatera status" };
  } finally {
    client.release();
  }
}

export async function registreraRotRutBetalning(
  fakturaId: number
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Inte inloggad" };
  }

  const userId = parseInt(session.user.id);
  const client = await pool.connect();

  try {
    // Hämta faktura för att kolla ROT/RUT-belopp
    const fakturaResult = await client.query(
      'SELECT * FROM fakturor WHERE id = $1 AND "userId" = $2',
      [fakturaId, userId]
    );

    if (fakturaResult.rows.length === 0) {
      return { success: false, error: "Faktura hittades inte" };
    }

    const faktura = fakturaResult.rows[0];

    // Kolla om fakturan har ROT/RUT-artiklar
    const artiklarResult = await client.query(
      "SELECT * FROM faktura_artiklar WHERE faktura_id = $1 AND rot_rut_typ IS NOT NULL",
      [fakturaId]
    );

    if (artiklarResult.rows.length === 0) {
      return { success: false, error: "Inga ROT/RUT-artiklar hittades" };
    }

    // Beräkna totalt ROT/RUT-belopp (50% av fakturasumman)
    const totalArtiklarResult = await client.query(
      "SELECT SUM(antal * pris_per_enhet * (1 + moms/100)) as total FROM faktura_artiklar WHERE faktura_id = $1",
      [fakturaId]
    );

    const totalBelopp = totalArtiklarResult.rows[0].total || 0;
    const rotRutBelopp = Math.round(totalBelopp * 0.5 * 100) / 100; // 50% avrundad

    await client.query("BEGIN");

    // Skapa transaktion för ROT/RUT-betalning
    const transaktionResult = await client.query(
      `INSERT INTO transaktioner (
        transaktionsdatum, kontobeskrivning, belopp, kommentar, "userId"
      ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        new Date(),
        `ROT/RUT-betalning faktura ${faktura.fakturanummer}`,
        rotRutBelopp,
        `ROT/RUT-utbetalning från Skatteverket för faktura ${faktura.fakturanummer}`,
        userId,
      ]
    );

    const transaktionsId = transaktionResult.rows[0].id;

    // Hämta konto_id för 1930 (Bank/Kassa)
    const konto1930Result = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
      "1930",
    ]);
    if (konto1930Result.rows.length === 0) {
      throw new Error("Konto 1930 (Bank/Kassa) finns inte i databasen");
    }
    const konto1930Id = konto1930Result.rows[0].id;

    // Hämta konto_id för 1513 (Kundfordringar – delad faktura)
    const konto1513Result = await client.query("SELECT id FROM konton WHERE kontonummer = $1", [
      "1513",
    ]);
    if (konto1513Result.rows.length === 0) {
      throw new Error("Konto 1513 (Kundfordringar – delad faktura) finns inte i databasen");
    }
    const konto1513Id = konto1513Result.rows[0].id;

    // Debitera Bank/Kassa (pengarna kommer in)
    await client.query(
      "INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)",
      [transaktionsId, konto1930Id, rotRutBelopp, 0]
    );

    // Kreditera 1513 (nollar SKV-fordran)
    await client.query(
      "INSERT INTO transaktionsposter (transaktions_id, konto_id, debet, kredit) VALUES ($1, $2, $3, $4)",
      [transaktionsId, konto1513Id, 0, rotRutBelopp]
    );

    // Uppdatera fakturas betalningsstatus till "Betald" när SKV har betalat
    await client.query("UPDATE fakturor SET status_betalning = $1 WHERE id = $2", [
      "Betald",
      fakturaId,
    ]);

    await client.query("COMMIT");

    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Fel vid registrering av ROT/RUT-betalning:", error);
    return { success: false, error: "Kunde inte registrera ROT/RUT-betalning" };
  } finally {
    client.release();
  }
}

export async function deleteLeverantör(id: number) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id);
  const client = await pool.connect();

  try {
    const result = await client.query(
      `DELETE FROM "leverantörer" WHERE "id" = $1 AND "userId" = $2`,
      [id, userId]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Leverantör hittades inte" };
    }

    return { success: true };
  } catch (error) {
    console.error("Fel vid borttagning av leverantör:", error);
    return { success: false, error: "Kunde inte ta bort leverantör" };
  } finally {
    client.release();
  }
}

// SÄKRA EXPORTS MED RATE LIMITING
// Skyddar kritiska funktioner från missbruk och spam-attacker
export const saveInvoice = withFormRateLimit(saveInvoiceInternal);
