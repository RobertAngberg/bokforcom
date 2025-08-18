"use server";

import { Pool } from "pg";
import { auth } from "../../auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Hämta användarens session
async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Ingen giltig session - måste vara inloggad");
  }
  const userId = parseInt(session.user.id);
  if (isNaN(userId)) {
    throw new Error("Ogiltigt användar-ID i session");
  }
  return userId;
}

// Automatisk mappning baserat på BAS-kontoplan (ingen hårdkodning!)
function mappaKontoTillNEPunkt(kontonummer: string): string | null {
  const konto = parseInt(kontonummer);

  // BALANSRÄKNING - TILLGÅNGAR
  if (konto >= 1100 && konto <= 1199) return "B1"; // Immateriella anläggningstillgångar
  if (konto >= 1200 && konto <= 1299) return "B2"; // Byggnader och markanläggningar
  if (konto >= 1300 && konto <= 1399) return "B3"; // Mark och andra tillgångar som inte får skrivas av
  if (konto >= 1400 && konto <= 1499) return "B4"; // Maskiner och inventarier
  if (konto >= 1500 && konto <= 1699) return "B8"; // Övriga fordringar (kundfordringar etc)
  if (konto >= 1400 && konto <= 1489) return "B6"; // Varulager (del av 1400-serien)
  if (konto >= 1510 && konto <= 1579) return "B7"; // Kundfordringar
  if (konto >= 1900 && konto <= 1999) return "B9"; // Kassa och bank

  // BALANSRÄKNING - EGET KAPITAL OCH SKULDER
  if (konto >= 2000 && konto <= 2099) return "B10"; // Eget kapital
  if (konto >= 2100 && konto <= 2199) return "B11"; // Obeskattade reserver
  if (konto >= 2200 && konto <= 2299) return "B12"; // Avsättningar
  if (konto >= 2300 && konto <= 2399) return "B13"; // Låneskulder
  if (konto >= 2500 && konto <= 2599) return "B14"; // Skatteskulder
  if (konto >= 2400 && konto <= 2499) return "B15"; // Leverantörsskulder
  if (konto >= 2600 && konto <= 2999) return "B16"; // Övriga skulder (moms, etc)

  // RESULTATRÄKNING - INTÄKTER
  if (konto >= 3000 && konto <= 3999) return "R1"; // Försäljning och utfört arbete
  if (konto >= 8100 && konto <= 8199) return "R2"; // Momsfria intäkter
  if (konto >= 8200 && konto <= 8299) return "R3"; // Bil- och bostadsförmån
  if (konto >= 8300 && konto <= 8399) return "R4"; // Ränteintäkter

  // RESULTATRÄKNING - KOSTNADER
  if (konto >= 4000 && konto <= 4999) return "R5"; // Varor, material och tjänster
  if (konto >= 5000 && konto <= 6999) return "R6"; // Övriga externa kostnader
  if (konto >= 7000 && konto <= 7699) return "R7"; // Anställd personal
  if (konto >= 8400 && konto <= 8499) return "R8"; // Räntekostnader
  if (konto >= 7700 && konto <= 7799) return "R9"; // Av- och nedskrivningar byggnader
  if (konto >= 7800 && konto <= 7899) return "R10"; // Av- och nedskrivningar maskiner

  return null; // Okänt konto
}

// Säkerhetsvalidering för årtal
function validateYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year >= 2020 && year <= currentYear + 1 && Number.isInteger(year);
}

export async function genereraNEBilaga(ar: number = 2025) {
  const userId = await requireAuth();

  // Säkerhetsvalidering av årtal
  if (!validateYear(ar)) {
    throw new Error("Ogiltigt årtal för NE-bilaga");
  }

  const client = await pool.connect();

  try {
    // Säker query med parametriserade värden
    const result = await client.query(
      `
      SELECT 
        k.kontonummer,
        k.beskrivning,
        k.kontoklass,
        COALESCE(SUM(tp.debet - tp.kredit), 0) as saldo
      FROM konton k
      LEFT JOIN transaktionsposter tp ON k.id = tp.konto_id
      LEFT JOIN transaktioner t ON tp.transaktions_id = t.id
      WHERE t."userId" = $1
        AND EXTRACT(YEAR FROM t.transaktionsdatum) = $2
      GROUP BY k.kontonummer, k.beskrivning, k.kontoklass
      HAVING COALESCE(SUM(tp.debet - tp.kredit), 0) != 0
      ORDER BY k.kontonummer
    `,
      [userId, ar]
    );

    // Initialisera NE-bilaga med alla punkter som 0
    const neBilaga: Record<string, number> = {};

    // Balansräkning
    [
      "B1",
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B7",
      "B8",
      "B9",
      "B10",
      "B11",
      "B12",
      "B13",
      "B14",
      "B15",
      "B16",
    ].forEach((punkt) => {
      neBilaga[punkt] = 0;
    });

    // Resultaträkning
    ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "R10", "R11", "R13", "R14"].forEach(
      (punkt) => {
        neBilaga[punkt] = 0;
      }
    );

    // Underskriftsblad
    ["U1", "U2", "U3", "U4"].forEach((punkt) => {
      neBilaga[punkt] = 0;
    });

    // Mappa alla konton till NE-punkter
    for (const row of result.rows) {
      const punkt = mappaKontoTillNEPunkt(row.kontonummer);
      if (punkt && row.saldo) {
        // För tillgångar och kostnader: positivt saldo = positivt värde
        // För skulder och intäkter: negativt saldo = positivt värde (de ökar på kredit-sidan)
        const kontoklass = row.kontoklass?.toLowerCase() || "";
        let varde = parseFloat(row.saldo);

        if (
          kontoklass.includes("skulder") ||
          kontoklass.includes("intäkter") ||
          punkt.startsWith("R")
        ) {
          varde = Math.abs(varde); // Gör positiva för NE-bilagan
        }

        neBilaga[punkt] += varde;
      }
    }

    // Beräkna bokfört resultat (R11) = Intäkter - Kostnader
    neBilaga["R11"] =
      neBilaga["R1"] +
      neBilaga["R2"] +
      neBilaga["R3"] +
      neBilaga["R4"] -
      (neBilaga["R5"] +
        neBilaga["R6"] +
        neBilaga["R7"] +
        neBilaga["R8"] +
        neBilaga["R9"] +
        neBilaga["R10"]);

    return {
      ar,
      neBilaga,
      genererad: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Fel vid generering av NE-bilaga:", error);
    throw error;
  } finally {
    client.release();
  }
}
