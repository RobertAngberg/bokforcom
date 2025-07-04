"use server";

import { Pool } from "pg";
import { auth } from "@/auth";
import { put } from "@vercel/blob";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function hämtaTransaktionsposter(transaktionsId: number) {
  const result = await pool.query(
    `
    SELECT tp.konto_id, k.kontobeskrivning, tp.debet, tp.kredit
    FROM transaktionsposter tp
    LEFT JOIN konton k ON k.id = tp.konto_id
    WHERE tp.transaktions_id = $1
  `,
    [transaktionsId]
  );

  return result.rows;
}

export async function fetchAllaForval(filters?: { sök?: string; kategori?: string; typ?: string }) {
  let query = "SELECT * FROM förval";
  const values: any[] = [];
  const conditions: string[] = [];

  if (filters?.sök) {
    conditions.push(
      `(LOWER(namn) LIKE $${values.length + 1} OR LOWER(beskrivning) LIKE $${values.length + 1})`
    );
    values.push(`%${filters.sök.toLowerCase()}%`);
  }

  if (filters?.kategori) {
    conditions.push(`kategori = $${values.length + 1}`);
    values.push(filters.kategori);
  }

  if (filters?.typ) {
    conditions.push(`LOWER(typ) = $${values.length + 1}`);
    values.push(filters.typ.toLowerCase());
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(" AND ");
  }

  query += ` ORDER BY namn`;

  const res = await pool.query(query, values);
  return res.rows;
}

export async function fetchDataFromYear(year: string) {
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${+year + 1}-01-01`);

  console.log("🔎 Hämtar data för år:", year, start.toISOString(), "→", end.toISOString());

  try {
    const client = await pool.connect();

    const query = `
      SELECT 
        t.transaktionsdatum,
        tp.debet,
        tp.kredit,
        k.kontoklass,
        k.kontonummer
      FROM transaktioner t
      JOIN transaktionsposter tp ON t.id = tp.transaktions_id
      JOIN konton k ON tp.konto_id = k.id
      WHERE t.transaktionsdatum >= $1 AND t.transaktionsdatum < $2
      ORDER BY t.transaktionsdatum ASC
    `;

    const result = await client.query(query, [start, end]);
    client.release();

    const rows = result.rows;
    console.log("✅ Antal rader hämtade:", rows.length);
    if (rows.length > 0) console.table(rows.slice(0, 5));

    const grouped: Record<string, { inkomst: number; utgift: number }> = {};
    let totalInkomst = 0;
    let totalUtgift = 0;

    rows.forEach((row, i) => {
      const { transaktionsdatum, debet, kredit, kontonummer } = row;

      if (!transaktionsdatum || !kontonummer) {
        console.warn(`⚠️ Rad ${i + 1} saknar datum eller kontonummer:`, row);
        return;
      }

      const date = new Date(transaktionsdatum);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;

      const deb = Number(debet ?? 0);
      const kre = Number(kredit ?? 0);
      const prefix = kontonummer?.toString()[0];

      if (!grouped[key]) grouped[key] = { inkomst: 0, utgift: 0 };

      if (prefix === "3") {
        grouped[key].inkomst += kre;
        totalInkomst += kre;
      }

      if (["5", "6", "7", "8"].includes(prefix)) {
        grouped[key].utgift += deb;
        totalUtgift += deb;
      }
    });

    const yearData = Object.entries(grouped).map(([month, values]) => ({
      month,
      inkomst: values.inkomst,
      utgift: values.utgift,
    }));

    console.log("📊 yearData:", yearData);

    return {
      totalInkomst: +totalInkomst.toFixed(2),
      totalUtgift: +totalUtgift.toFixed(2),
      totalResultat: +(totalInkomst - totalUtgift).toFixed(2),
      yearData,
    };
  } catch (err) {
    console.error("❌ fetchDataFromYear error:", err);
    return {
      totalInkomst: 0,
      totalUtgift: 0,
      totalResultat: 0,
      yearData: [],
    };
  }
}

export async function hämtaAllaTransaktioner() {
  try {
    const client = await pool.connect();
    const res = await client.query(`
      SELECT 
        id,
        transaktionsdatum,
        kontobeskrivning,
        kontoklass,
        belopp,
        fil,
        kommentar,
        "userId"
      FROM transaktioner
      ORDER BY id DESC
    `);
    client.release();

    console.log("Transaktioner:", res.rows);

    return res.rows;
  } catch (err) {
    console.error("❌ hämtaAllaTransaktioner error:", err);
    return [];
  }
}

export async function getAllInvoices() {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT * FROM fakturor ORDER BY skapad ASC`);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function deleteInvoice(id: number) {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM fakturor WHERE id = $1`, [id]);
  } finally {
    client.release();
  }
}

export async function updateFakturanummer(id: number, nyttNummer: string) {
  const client = await pool.connect();
  try {
    await client.query(`UPDATE fakturor SET fakturanummer = $1 WHERE id = $2`, [nyttNummer, id]);
  } finally {
    client.release();
  }
}

export async function saveInvoice(data: any) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO fakturor (fakturanummer, kundnamn, total, skapad) VALUES ($1, $2, $3, NOW())`,
      [data.fakturanummer, data.kundnamn, data.total]
    );
  } finally {
    client.release();
  }
}

export async function hämtaFörvalMedSökning(sök: string, offset: number, limit: number) {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id, namn, beskrivning, typ, kategori, konton, sökord, momssats, specialtyp
      FROM förval
      WHERE namn ILIKE $1 OR beskrivning ILIKE $1
      ORDER BY id
      OFFSET $2
      LIMIT $3
    `;

    const values = [`%${sök}%`, offset, limit];
    const res = await client.query(query, values);

    return res.rows.map((row) => ({
      ...row,
      konton: typeof row.konton === "string" ? JSON.parse(row.konton) : row.konton,
      sökord: Array.isArray(row.sökord) ? row.sökord : [],
    }));
  } catch (err) {
    console.error("❌ hämtaFörvalMedSökning error:", err);
    return [];
  } finally {
    client.release();
  }
}

export async function räknaFörval(sök: string) {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT COUNT(*) FROM förval WHERE namn ILIKE $1 OR beskrivning ILIKE $1`,
      [`%${sök}%`]
    );
    return parseInt(res.rows[0].count);
  } catch (err) {
    console.error("❌ räknaFörval error:", err);
    return 0;
  } finally {
    client.release();
  }
}

export async function uppdateraFörval(id: number, kolumn: string, nyttVärde: string) {
  const tillåtnaKolumner = [
    "namn",
    "beskrivning",
    "typ",
    "kategori",
    "momssats",
    "specialtyp",
    "konton",
    "sökord",
  ];

  if (!tillåtnaKolumner.includes(kolumn)) {
    throw new Error("Ogiltig kolumn");
  }

  const client = await pool.connect();

  try {
    let query = "";
    let value: any = nyttVärde;

    if (kolumn === "konton" || kolumn === "sökord") {
      query = `UPDATE förval SET ${kolumn} = $1::jsonb WHERE id = $2`;
    } else if (kolumn === "momssats") {
      query = `UPDATE förval SET ${kolumn} = $1::real WHERE id = $2`;
    } else {
      query = `UPDATE förval SET ${kolumn} = $1 WHERE id = $2`;
    }

    await client.query(query, [value, id]);
  } catch (err) {
    console.error("❌ uppdateraFörval error:", err);
  } finally {
    client.release();
  }
}

export async function taBortFörval(id: number) {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM förval WHERE id = $1`, [id]);
  } catch (err) {
    console.error("❌ taBortFörval error:", err);
  } finally {
    client.release();
  }
}

export async function taBortTransaktion(id: number) {
  const client = await pool.connect();
  try {
    await client.query(`DELETE FROM transaktioner WHERE id = $1`, [id]);
  } finally {
    client.release();
  }
}

export async function fetchForvalMedFel() {
  const client = await pool.connect();

  try {
    const kontonResult = await client.query("SELECT kontonummer FROM konton");
    const giltigaKonton = kontonResult.rows.map((row) => row.kontonummer);

    const forvalResult = await client.query("SELECT * FROM förval");
    const felaktiga = forvalResult.rows.filter((f) => {
      try {
        const konton = Array.isArray(f.konton) ? f.konton : JSON.parse(f.konton);
        return konton.some(
          (konto: any) => konto.kontonummer && !giltigaKonton.includes(konto.kontonummer)
        );
      } catch (err) {
        console.error("❌ JSON parse-fel i förval id:", f.id);
        return true;
      }
    });

    return felaktiga;
  } catch (error) {
    console.error("❌ fetchForvalMedFel error:", error);
    return [];
  } finally {
    client.release();
  }
}

export async function uploadPDF(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("Ingen fil vald");
    }

    if (file.type !== "application/pdf") {
      throw new Error("Endast PDF-filer är tillåtna");
    }

    // Ladda upp till Vercel Blob
    const blob = await put(`uploads/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return { success: true, blob };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Okänt fel" };
  }
}
