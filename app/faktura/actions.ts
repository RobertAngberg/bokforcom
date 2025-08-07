//#region
"use server";

import { auth } from "@/auth";
import { Pool } from "pg";
// import { Resend } from "resend";
// TA BORT DENNA RAD:
// const resend = new Resend(process.env.RESEND_API_KEY);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
  rotRutAntalTimmar?: number;
  rotRutPrisPerTimme?: number;
  rotRutBeskrivning?: string;
  rotRutStartdatum?: string;
  rotRutSlutdatum?: string;
  rotRutPersonnummer?: string;
  rotRutFastighetsbeteckning?: string;
  rotRutBoendeTyp?: string;
  rotRutBrfOrg?: string;
  rotRutBrfLagenhet?: string;
};
//#endregion

export async function saveInvoice(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id);

  // VALIDERING: Kolla att kund är vald
  const kundId = formData.get("kundId")?.toString();
  if (!kundId || kundId.trim() === "") {
    return { success: false, error: "Kund måste väljas" };
  }

  // VALIDERING: Kolla att det finns artiklar
  const artiklarRaw = formData.get("artiklar") as string;
  const artiklar = JSON.parse(artiklarRaw || "[]") as Artikel[];
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
          fakturadatum,
          forfallodatum,
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
            rot_rut_typ, rot_rut_kategori, avdrag_procent, arbetskostnad_ex_moms
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
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
          fakturadatum,
          forfallodatum,
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
            rot_rut_brf_org, rot_rut_brf_lagenhet, är_favorit
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)`,
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
            rad.rotRutStartdatum
              ? new Date(rad.rotRutStartdatum).toISOString().split("T")[0]
              : null,
            rad.rotRutSlutdatum ? new Date(rad.rotRutSlutdatum).toISOString().split("T")[0] : null,
            rad.rotRutPersonnummer ?? null,
            rad.rotRutFastighetsbeteckning ?? null,
            rad.rotRutBoendeTyp ?? null,
            rad.rotRutBrfOrg ?? null,
            rad.rotRutBrfLagenhet ?? null,
            false, // är_favorit = false för fakturaartiklar
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
        f.transaktions_id, 'kund' as typ,
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
          `SELECT antal, pris_per_enhet, moms FROM faktura_artiklar WHERE faktura_id = $1`,
          [faktura.id]
        );

        const totalBelopp = artiklarRes.rows.reduce((sum, artikel) => {
          const prisInkMoms = artikel.pris_per_enhet * (1 + artikel.moms / 100);
          return sum + artikel.antal * prisInkMoms;
        }, 0);

        return {
          ...faktura,
          totalBelopp: Math.round(totalBelopp * 100) / 100, // Avrunda till 2 decimaler
          antalArtiklar: artiklarRes.rows.length,
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
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM faktura_artiklar WHERE id = $1 AND faktura_id IS NULL`, [id]);
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
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id, 10);
  const client = await pool.connect();

  try {
    const res = await client.query(
      `INSERT INTO kunder (
        "userId", kundnamn, kundorgnummer, kundnummer,
        kundmomsnummer, kundadress1, kundpostnummer, kundstad, kundemail
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        userId,
        formData.get("kundnamn"),
        formData.get("kundorgnummer"),
        formData.get("kundnummer"),
        formData.get("kundmomsnummer"),
        formData.get("kundadress1"),
        formData.get("kundpostnummer"),
        formData.get("kundstad"),
        formData.get("kundemail"),
      ]
    );
    return { success: true, id: res.rows[0].id };
  } catch (err) {
    console.error("❌ Kunde inte spara kund:", err);
    return { success: false };
  } finally {
    client.release();
  }
}

export async function uppdateraKund(id: number, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id, 10);

  const client = await pool.connect();
  try {
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
        kundemail = $8
      WHERE id = $9 AND "userId" = $10
      `,
      [
        formData.get("kundnamn"),
        formData.get("kundnummer"),
        formData.get("kundorgnummer"),
        formData.get("kundmomsnummer"),
        formData.get("kundadress1"),
        formData.get("kundpostnummer"),
        formData.get("kundstad"),
        formData.get("kundemail"),
        id,
        userId,
      ]
    );

    return { success: true };
  } catch (err) {
    console.error("❌ uppdateraKund error:", err);
    return { success: false };
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
  try {
    const existing = await pool.query(
      `SELECT id FROM faktura_artiklar
       WHERE faktura_id IS NULL
         AND beskrivning = $1
         AND antal = $2
         AND pris_per_enhet = $3
         AND moms = $4
         AND valuta = $5
         AND typ = $6
         AND (rot_rut_typ IS NOT DISTINCT FROM $7)
         AND (rot_rut_kategori IS NOT DISTINCT FROM $8)
         AND (avdrag_procent IS NOT DISTINCT FROM $9)
         AND (arbetskostnad_ex_moms IS NOT DISTINCT FROM $10)
       LIMIT 1`,
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
        artikel.arbetskostnadExMoms ?? null,
      ]
    );

    if (existing.rows.length > 0) {
      console.log("ℹ️ Artikeln finns redan som favorit, sparas inte igen.");
      return { success: true, alreadyExists: true };
    }

    await pool.query(
      `INSERT INTO faktura_artiklar (
        faktura_id, beskrivning, antal, pris_per_enhet, moms, valuta, typ,
        rot_rut_typ, rot_rut_kategori, avdrag_procent, arbetskostnad_ex_moms,
        rot_rut_antal_timmar, rot_rut_pris_per_timme,
        rot_rut_beskrivning, rot_rut_startdatum, rot_rut_slutdatum,
        rot_rut_personnummer, rot_rut_fastighetsbeteckning, rot_rut_boende_typ,
        rot_rut_brf_org, rot_rut_brf_lagenhet, är_favorit
      )
      VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
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
        artikel.arbetskostnadExMoms ?? null,
        artikel.rotRutAntalTimmar ?? null,
        artikel.rotRutPrisPerTimme ?? null,
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
        true, // är_favorit = true för favoriter
      ]
    );

    return { success: true };
  } catch (err) {
    console.error("❌ Kunde inte spara favoritartikel:", err);
    return { success: false };
  }
}

export async function hämtaSparadeArtiklar(): Promise<Artikel[]> {
  try {
    const res = await pool.query(`
      SELECT id, beskrivning, antal, pris_per_enhet, moms, valuta, typ,
        rot_rut_typ, rot_rut_kategori, avdrag_procent, arbetskostnad_ex_moms,
        rot_rut_antal_timmar, rot_rut_pris_per_timme, rot_rut_beskrivning,
        rot_rut_startdatum, rot_rut_slutdatum,
        rot_rut_personnummer, rot_rut_fastighetsbeteckning,
        rot_rut_boende_typ, rot_rut_brf_org, rot_rut_brf_lagenhet
      FROM faktura_artiklar
      WHERE är_favorit = TRUE
      ORDER BY beskrivning ASC
    `);

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
      rotRutAntalTimmar: row.rot_rut_antal_timmar,
      rotRutPrisPerTimme: row.rot_rut_pris_per_timme,
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
    const artiklar = artiklarRes.rows;

    // ROT/RUT data finns nu i artiklarna, så vi kan skapa ett rotRut-objekt från första artikeln som har ROT/RUT data
    const rotRutArtikel = artiklar.find((artikel) => artikel.rot_rut_typ);
    const rotRut = rotRutArtikel
      ? {
          typ: rotRutArtikel.rot_rut_typ,
          personnummer: rotRutArtikel.rot_rut_personnummer,
          fastighetsbeteckning: rotRutArtikel.rot_rut_fastighetsbeteckning,
          rot_boende_typ: rotRutArtikel.rot_rut_boende_typ,
          brf_organisationsnummer: rotRutArtikel.rot_rut_brf_org,
          brf_lagenhetsnummer: rotRutArtikel.rot_rut_brf_lagenhet,
          // Beräkna totaler från alla ROT/RUT artiklar
          arbetskostnad_ex_moms: artiklar
            .filter((a) => a.rot_rut_typ)
            .reduce((sum, a) => sum + (parseFloat(a.arbetskostnad_ex_moms) || 0), 0),
          avdrag_procent: rotRutArtikel.avdrag_procent,
          avdrag_belopp: artiklar
            .filter((a) => a.rot_rut_typ)
            .reduce((sum, a) => {
              const arbetskostnad = parseFloat(a.arbetskostnad_ex_moms) || 0;
              const procent = parseFloat(a.avdrag_procent) || 0;
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
        // Detta är en betalningsregistrering
        await client.query(
          "UPDATE fakturor SET status_betalning = $1, betaldatum = $2, transaktions_id = $3 WHERE id = $4",
          ["Betald", new Date().toISOString().split("T")[0], transaktionsId, data.fakturaId]
        );
        console.log(`💰 Uppdaterat faktura ${data.fakturaId} status till Betald`);
      } else {
        // Detta är normal bokföring
        await client.query(
          "UPDATE fakturor SET status_bokförd = $1, transaktions_id = $2 WHERE id = $3",
          ["Bokförd", transaktionsId, data.fakturaId]
        );
        console.log(`📊 Uppdaterat faktura ${data.fakturaId} status till Bokförd`);
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
    // Hämta fakturauppgifter
    const fakturaResult = await client.query(
      "SELECT * FROM fakturor WHERE id = $1 AND user_id = $2",
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

    // Kreditera kundfordringar
    await client.query(
      "INSERT INTO transaktionsposter (transaktion_id, konto, debet, kredit, beskrivning) VALUES ($1, $2, $3, $4, $5)",
      [
        transaktionsId,
        "1510",
        0,
        betalningsbelopp,
        `Betalning kundfaktura ${faktura.fakturanummer}`,
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
  const client = await pool.connect();

  try {
    const namn = formData.get("namn")?.toString();
    const organisationsnummer =
      formData.get("organisationsnummer")?.toString() || formData.get("vatnummer")?.toString();
    const adress = formData.get("adress")?.toString();
    const postnummer = formData.get("postnummer")?.toString();
    const ort = formData.get("ort")?.toString();
    const telefon = formData.get("telefon")?.toString();
    const email = formData.get("email")?.toString();

    if (!namn) {
      return { success: false, error: "Namn är obligatoriskt" };
    }

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
    console.error("Fel vid sparande av leverantör:", error);
    return { success: false, error: "Kunde inte spara leverantör" };
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
