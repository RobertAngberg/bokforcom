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
};
//#endregion

export async function saveInvoice(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id);
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
    const artiklarRaw = formData.get("artiklar") as string;
    const artiklar = JSON.parse(artiklarRaw || "[]") as Artikel[];

    const fakturadatum = formatDate(formData.get("fakturadatum")?.toString() ?? null);
    const forfallodatum = formatDate(formData.get("forfallodatum")?.toString() ?? null);
    const fakturaIdRaw = formData.get("id");
    const isUpdate = !!fakturaIdRaw;
    const fakturaId = isUpdate ? parseInt(fakturaIdRaw!.toString(), 10) : undefined;

    if (isUpdate && fakturaId) {
      // ta bort och lägger till helt nytt längre ner
      await client.query(`DELETE FROM faktura_artiklar WHERE faktura_id = $1`, [fakturaId]);
      await client.query(`DELETE FROM rot_rut WHERE faktura_id = $1`, [fakturaId]);

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

      if (formData.get("rotRutAktiverat") === "true") {
        await client.query(
          `INSERT INTO rot_rut (
            faktura_id, typ, arbetskostnad_ex_moms, materialkostnad_ex_moms, avdrag_procent, avdrag_belopp,
            personnummer, fastighetsbeteckning, rot_boende_typ, brf_organisationsnummer, brf_lagenhetsnummer
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            fakturaId,
            formData.get("rotRutTyp"),
            formData.get("arbetskostnadExMoms")
              ? parseFloat(formData.get("arbetskostnadExMoms")!.toString())
              : null,
            formData.get("materialkostnadExMoms")
              ? parseFloat(formData.get("materialkostnadExMoms")!.toString())
              : null,
            formData.get("avdragProcent")
              ? parseFloat(formData.get("avdragProcent")!.toString())
              : null,
            formData.get("avdragBelopp")
              ? parseFloat(formData.get("avdragBelopp")!.toString())
              : null,
            formData.get("personnummer"),
            formData.get("fastighetsbeteckning"),
            formData.get("rotBoendeTyp"),
            formData.get("brfOrganisationsnummer"),
            formData.get("brfLagenhetsnummer"),
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
            rot_rut_typ, rot_rut_kategori, avdrag_procent, arbetskostnad_ex_moms
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
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
          ]
        );
      }

      if (formData.get("rotRutAktiverat") === "true") {
        await client.query(
          `INSERT INTO rot_rut (
            faktura_id, typ, arbetskostnad_ex_moms, materialkostnad_ex_moms, avdrag_procent, avdrag_belopp,
            personnummer, fastighetsbeteckning, rot_boende_typ, brf_organisationsnummer, brf_lagenhetsnummer
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            newId,
            formData.get("rotRutTyp"),
            formData.get("arbetskostnadExMoms")
              ? parseFloat(formData.get("arbetskostnadExMoms")!.toString())
              : null,
            formData.get("materialkostnadExMoms")
              ? parseFloat(formData.get("materialkostnadExMoms")!.toString())
              : null,
            formData.get("avdragProcent")
              ? parseFloat(formData.get("avdragProcent")!.toString())
              : null,
            formData.get("avdragBelopp")
              ? parseFloat(formData.get("avdragBelopp")!.toString())
              : null,
            formData.get("personnummer"),
            formData.get("fastighetsbeteckning"),
            formData.get("rotBoendeTyp"),
            formData.get("brfOrganisationsnummer"),
            formData.get("brfLagenhetsnummer"),
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
    await client.query(`DELETE FROM faktura_artiklar WHERE faktura_id = $1`, [id]);
    await client.query(`DELETE FROM fakturor WHERE id = $1`, [id]);
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
  if (!session?.user?.id) return [];
  const userId = parseInt(session.user.id, 10);

  const client = await pool.connect();
  try {
    const res = await client.query(
      `
      SELECT
        f.id, f.fakturanummer, f.fakturadatum, f."kundId",
        k.kundnamn
      FROM fakturor f
      LEFT JOIN kunder k ON f."kundId" = k.id
      WHERE f."userId" = $1
      ORDER BY f.id DESC
      `,
      [userId]
    );
    return res.rows;
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
        rot_rut_typ, rot_rut_kategori, avdrag_procent, arbetskostnad_ex_moms
      )
      VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
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
        rot_rut_typ, rot_rut_kategori, avdrag_procent, arbetskostnad_ex_moms
      FROM faktura_artiklar
      WHERE faktura_id IS NULL
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

    // Hämta artiklar
    const artiklarRes = await client.query(
      `SELECT * FROM faktura_artiklar WHERE faktura_id = $1 ORDER BY id ASC`,
      [id]
    );
    const artiklar = artiklarRes.rows;

    // Hämta rot_rut-data
    const rotRutRes = await client.query(`SELECT * FROM rot_rut WHERE faktura_id = $1 LIMIT 1`, [
      id,
    ]);
    const rotRut = rotRutRes.rows[0] || {};

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

interface BokföringsPost {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
  beskrivning: string;
}

interface BokförFakturaData {
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
  kontaktperson?: string;
  hemsida?: string;
  anteckningar?: string;
  skapad?: string;
  uppdaterad?: string;
};

export async function saveLeverantör(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  const userId = parseInt(session.user.id);
  const client = await pool.connect();

  try {
    const namn = formData.get("namn")?.toString();
    const organisationsnummer = formData.get("organisationsnummer")?.toString();
    const adress = formData.get("adress")?.toString();
    const postnummer = formData.get("postnummer")?.toString();
    const ort = formData.get("ort")?.toString();
    const telefon = formData.get("telefon")?.toString();
    const email = formData.get("email")?.toString();
    const kontaktperson = formData.get("kontaktperson")?.toString();
    const hemsida = formData.get("hemsida")?.toString();
    const anteckningar = formData.get("anteckningar")?.toString();

    if (!namn) {
      return { success: false, error: "Namn är obligatoriskt" };
    }

    const result = await client.query(
      `INSERT INTO leverantörer (
        userId, namn, organisationsnummer, adress, postnummer, ort, 
        telefon, email, kontaktperson, hemsida, anteckningar
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        userId,
        namn,
        organisationsnummer,
        adress,
        postnummer,
        ort,
        telefon,
        email,
        kontaktperson,
        hemsida,
        anteckningar,
      ]
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
      `SELECT * FROM leverantörer WHERE userId = $1 ORDER BY namn ASC`,
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
