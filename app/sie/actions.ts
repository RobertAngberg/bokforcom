"use server";

import { Pool } from "pg";
import crypto from "crypto";
import { getUserId } from "../_utils/authUtils";
import { validateSessionAttempt } from "../_utils/actionRateLimit";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 🔒 ENTERPRISE SÄKERHETSFUNKTIONER FÖR SIE-MODUL

async function logSieSecurityEvent(
  userId: number | string,
  eventType: string,
  details: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO security_logs (user_id, event_type, details, timestamp, module) 
       VALUES ($1, $2, $3, NOW(), 'SIE')`,
      [String(userId), eventType, details]
    );
  } catch (error) {
    console.error("Failed to log SIE security event:", error);
  }
}
function validateFileSize(file: File): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024; // 50MB max för SIE-filer
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Filen är för stor (${Math.round(file.size / 1024 / 1024)}MB). Max 50MB tillåtet.`,
    };
  }
  return { valid: true };
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>'"&]/g, "").trim();
}

interface SieData {
  header: {
    program: string;
    organisationsnummer: string;
    företagsnamn: string;
    räkenskapsår: Array<{ år: number; startdatum: string; slutdatum: string }>;
    kontoplan: string;
  };
  konton: Array<{
    nummer: string;
    namn: string;
  }>;
  verifikationer: Array<{
    serie: string;
    nummer: string;
    datum: string;
    beskrivning: string;
    transaktioner: Array<{
      konto: string;
      belopp: number;
    }>;
  }>;
  balanser: {
    ingående: Array<{ konto: string; belopp: number }>;
    utgående: Array<{ konto: string; belopp: number }>;
  };
  resultat: Array<{ konto: string; belopp: number }>;
}

interface SieUploadResult {
  success: boolean;
  data?: SieData;
  saknade?: string[];
  analys?: {
    totaltAntal: number;
    standardKonton: number;
    specialKonton: number;
    kritiskaKonton: string[];
    anvandaSaknade: number;
    totaltAnvanda: number;
  };
  error?: string;
}

export async function uploadSieFile(formData: FormData): Promise<SieUploadResult> {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Åtkomst nekad - ingen giltig session" };
    }

    // Rate limiting för SIE-uppladdningar
    if (!(await validateSessionAttempt(userId))) {
      return { success: false, error: "För många försök - vänta 15 minuter" };
    }

    await logSieSecurityEvent(userId, "sie_upload_attempt", "SIE file upload started");

    const file = formData.get("file") as File;

    if (!file) {
      await logSieSecurityEvent(userId, "sie_upload_failed", "No file provided");
      return { success: false, error: "Ingen fil vald" };
    }

    // 🔒 FILVALIDERING
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      await logSieSecurityEvent(userId, "sie_upload_failed", `File too large: ${file.size} bytes`);
      return { success: false, error: sizeValidation.error };
    }

    // Validera filtyp
    if (
      !file.name.toLowerCase().endsWith(".se4") &&
      !file.name.toLowerCase().endsWith(".sie") &&
      !file.name.toLowerCase().endsWith(".se")
    ) {
      await logSieSecurityEvent(userId, "sie_upload_failed", `Invalid file type: ${file.name}`);
      return { success: false, error: "Endast SIE-filer (.sie, .se4, .se) stöds" };
    }

    // Läs filinnehållet
    const arrayBuffer = await file.arrayBuffer();
    let content: string = "";

    // Prova olika encodings för svenska tecken
    const uint8Array = new Uint8Array(arrayBuffer);

    // Försök med vanligaste encodings för SIE-filer
    const encodings = ["iso-8859-1", "windows-1252", "utf-8"];
    let bestContent = "";

    for (const encoding of encodings) {
      try {
        const decoder = new TextDecoder(encoding);
        const testContent = decoder.decode(uint8Array);

        // Kolla om denna encoding gav rimligt resultat
        if (testContent.includes("#KONTO") || testContent.includes("#FNAMN")) {
          content = testContent;
          console.log(`✅ Använder encoding: ${encoding}`);
          break;
        } else {
          bestContent = testContent; // Spara som backup
        }
      } catch (error) {
        console.log(`❌ Encoding ${encoding} misslyckades:`, error);
      }
    }

    // Om inget funkade, använd bästa försöket
    if (!content) {
      content = bestContent || new TextDecoder("utf-8").decode(uint8Array);
      console.log("🔄 Använder fallback encoding");
    }

    // Förbättrad encoding-hantering för svenska tecken
    // Hantera olika encoding-varianter som kan förekomma
    content = content
      // Standard replacement characters
      .replace(/�/g, "ä")
      .replace(/�/g, "å")
      .replace(/�/g, "ö")
      .replace(/�/g, "Ä")
      .replace(/�/g, "Å")
      .replace(/�/g, "Ö")
      // CP850 mappings
      .replace(/\x84/g, "ä") // CP850 ä
      .replace(/\x86/g, "å") // CP850 å
      .replace(/\x94/g, "ö") // CP850 ö
      .replace(/\x8E/g, "Ä") // CP850 Ä
      .replace(/\x8F/g, "Å") // CP850 Å
      .replace(/\x99/g, "Ö") // CP850 Ö
      // ISO-8859-1 mappings
      .replace(/\xE4/g, "ä") // ISO-8859-1 ä
      .replace(/\xE5/g, "å") // ISO-8859-1 å
      .replace(/\xF6/g, "ö") // ISO-8859-1 ö
      .replace(/\xC4/g, "Ä") // ISO-8859-1 Ä
      .replace(/\xC5/g, "Å") // ISO-8859-1 Å
      .replace(/\xD6/g, "Ö") // ISO-8859-1 Ö
      // Windows-1252 mappings (liknande ISO-8859-1)
      .replace(/\u00E4/g, "ä")
      .replace(/\u00E5/g, "å")
      .replace(/\u00F6/g, "ö")
      .replace(/\u00C4/g, "Ä")
      .replace(/\u00C5/g, "Å")
      .replace(/\u00D6/g, "Ö");

    // Debug: logga de första raderna för att se encoding-status
    console.log("🔍 SIE-fil encoding test:", content.substring(0, 200));

    // Parsa SIE-data
    const sieData = parseSieContent(content);

    // Kontrollera vilka konton som saknas i databasen
    const sieKonton = sieData.konton.map((k) => k.nummer);

    // Hitta konton som faktiskt används i transaktioner
    const anvandaKonton = new Set<string>();
    sieData.verifikationer.forEach((ver) => {
      ver.transaktioner.forEach((trans) => {
        anvandaKonton.add(trans.konto);
      });
    });

    // Lägg även till konton från balanser och resultat
    sieData.balanser.ingående.forEach((b) => anvandaKonton.add(b.konto));
    sieData.balanser.utgående.forEach((b) => anvandaKonton.add(b.konto));
    sieData.resultat.forEach((r) => anvandaKonton.add(r.konto));

    // 🔒 SÄKER KONTOKONTROLL med userId
    const { saknade, analys } = await kontrollSaknade(sieKonton, Array.from(anvandaKonton), userId);

    await logSieSecurityEvent(
      userId,
      "sie_upload_success",
      `File uploaded: ${file.name}, ${sieData.verifikationer.length} verifications`
    );

    return {
      success: true,
      data: sieData,
      saknade: saknade,
      analys: analys,
    };
  } catch (error) {
    console.error("Fel vid parsning av SIE-fil:", error);
    // Logga fel om vi har userId från session
    try {
      const userId = await getUserId();
      if (userId) {
        await logSieSecurityEvent(
          userId,
          "sie_upload_error",
          `Parse error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    return { success: false, error: "Kunde inte läsa SIE-filen" };
  }
}

async function kontrollSaknade(
  sieKonton: string[],
  anvandaKonton?: string[],
  userId?: number | string
) {
  try {
    const { Pool } = require("pg");
    const tempPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const client = await tempPool.connect();

    // 🔒 SÄKER DATABASKÖRNING - Hämta endast användarens egna konton
    let query = "SELECT kontonummer FROM konton";
    let params: any[] = [];

    if (userId) {
      query += ' WHERE "userId" = $1';
      params = [userId];
    }

    const { rows } = await client.query(query, params);
    const befintligaKonton = new Set(rows.map((r: any) => r.kontonummer.toString()));

    client.release();
    await tempPool.end(); // Hitta konton som finns i SIE men inte i databasen
    const allaSaknade = sieKonton.filter((kontonr) => !befintligaKonton.has(kontonr));

    // BAS 2025 standardkonton (grundläggande kontoplan)
    const basStandardKonton = new Set([
      "1010",
      "1020",
      "1030",
      "1040",
      "1050",
      "1060",
      "1070",
      "1080",
      "1090",
      "1110",
      "1120",
      "1130",
      "1140",
      "1150",
      "1160",
      "1170",
      "1180",
      "1190",
      "1210",
      "1220",
      "1230",
      "1240",
      "1250",
      "1260",
      "1270",
      "1280",
      "1290",
      "1310",
      "1320",
      "1330",
      "1340",
      "1350",
      "1360",
      "1370",
      "1380",
      "1390",
      "1410",
      "1420",
      "1430",
      "1440",
      "1450",
      "1460",
      "1470",
      "1480",
      "1490",
      "1510",
      "1520",
      "1530",
      "1540",
      "1550",
      "1560",
      "1570",
      "1580",
      "1590",
      "1610",
      "1620",
      "1630",
      "1640",
      "1650",
      "1660",
      "1670",
      "1680",
      "1690",
      "1710",
      "1720",
      "1730",
      "1740",
      "1750",
      "1760",
      "1770",
      "1780",
      "1790",
      "1810",
      "1820",
      "1830",
      "1840",
      "1850",
      "1860",
      "1870",
      "1880",
      "1890",
      "1910",
      "1920",
      "1930",
      "1940",
      "1950",
      "1960",
      "1970",
      "1980",
      "1990",
      "2010",
      "2020",
      "2030",
      "2040",
      "2050",
      "2060",
      "2070",
      "2080",
      "2090",
      "2110",
      "2120",
      "2130",
      "2140",
      "2150",
      "2160",
      "2170",
      "2180",
      "2190",
      "2210",
      "2220",
      "2230",
      "2240",
      "2250",
      "2260",
      "2270",
      "2280",
      "2290",
      "2310",
      "2320",
      "2330",
      "2340",
      "2350",
      "2360",
      "2370",
      "2380",
      "2390",
      "2410",
      "2420",
      "2430",
      "2440",
      "2450",
      "2460",
      "2470",
      "2480",
      "2490",
      "2510",
      "2520",
      "2530",
      "2540",
      "2550",
      "2560",
      "2570",
      "2580",
      "2590",
      "2610",
      "2620",
      "2630",
      "2640",
      "2650",
      "2660",
      "2670",
      "2680",
      "2690",
      "2710",
      "2720",
      "2730",
      "2740",
      "2750",
      "2760",
      "2770",
      "2780",
      "2790",
      "2810",
      "2820",
      "2830",
      "2840",
      "2850",
      "2860",
      "2870",
      "2880",
      "2890",
      "2910",
      "2920",
      "2930",
      "2940",
      "2950",
      "2960",
      "2970",
      "2980",
      "2990",
      "3010",
      "3020",
      "3030",
      "3040",
      "3050",
      "3060",
      "3070",
      "3080",
      "3090",
      "3110",
      "3120",
      "3130",
      "3140",
      "3150",
      "3160",
      "3170",
      "3180",
      "3190",
      "3210",
      "3220",
      "3230",
      "3240",
      "3250",
      "3260",
      "3270",
      "3280",
      "3290",
      "3310",
      "3320",
      "3330",
      "3340",
      "3350",
      "3360",
      "3370",
      "3380",
      "3390",
      "3410",
      "3420",
      "3430",
      "3440",
      "3450",
      "3460",
      "3470",
      "3480",
      "3490",
      "3510",
      "3520",
      "3530",
      "3540",
      "3550",
      "3560",
      "3570",
      "3580",
      "3590",
      "3610",
      "3620",
      "3630",
      "3640",
      "3650",
      "3660",
      "3670",
      "3680",
      "3690",
      "3710",
      "3720",
      "3730",
      "3740",
      "3750",
      "3760",
      "3770",
      "3780",
      "3790",
      "3810",
      "3820",
      "3830",
      "3840",
      "3850",
      "3860",
      "3870",
      "3880",
      "3890",
      "3910",
      "3920",
      "3930",
      "3940",
      "3950",
      "3960",
      "3970",
      "3980",
      "3990",
      "4010",
      "4020",
      "4030",
      "4040",
      "4050",
      "4060",
      "4070",
      "4080",
      "4090",
      "5010",
      "5020",
      "5030",
      "5040",
      "5050",
      "5060",
      "5070",
      "5080",
      "5090",
      "6010",
      "6020",
      "6030",
      "6040",
      "6050",
      "6060",
      "6070",
      "6080",
      "6090",
      "7010",
      "7020",
      "7030",
      "7040",
      "7050",
      "7060",
      "7070",
      "7080",
      "7090",
      "8010",
      "8020",
      "8030",
      "8040",
      "8050",
      "8060",
      "8070",
      "8080",
      "8090",
      "8110",
      "8120",
      "8130",
      "8140",
      "8150",
      "8160",
      "8170",
      "8180",
      "8190",
      "8210",
      "8220",
      "8230",
      "8240",
      "8250",
      "8260",
      "8270",
      "8280",
      "8290",
      "8310",
      "8320",
      "8330",
      "8340",
      "8350",
      "8360",
      "8370",
      "8380",
      "8390",
      "8410",
      "8420",
      "8430",
      "8440",
      "8450",
      "8460",
      "8470",
      "8480",
      "8490",
      "8510",
      "8520",
      "8530",
      "8540",
      "8550",
      "8560",
      "8570",
      "8580",
      "8590",
      "8610",
      "8620",
      "8630",
      "8640",
      "8650",
      "8660",
      "8670",
      "8680",
      "8690",
      "8710",
      "8720",
      "8730",
      "8740",
      "8750",
      "8760",
      "8770",
      "8780",
      "8790",
      "8810",
      "8820",
      "8830",
      "8840",
      "8850",
      "8860",
      "8870",
      "8880",
      "8890",
      "8910",
      "8920",
      "8930",
      "8940",
      "8950",
      "8960",
      "8970",
      "8980",
      "8990",
      "8999",
    ]);

    // Separera mellan standard BAS-konton och specialkonton
    const standardKonton = allaSaknade.filter((konto) => basStandardKonton.has(konto));
    const specialKonton = allaSaknade.filter((konto) => !basStandardKonton.has(konto));

    // Om vi har information om använda konton, fokusera på dem
    const anvandaSaknade = anvandaKonton
      ? allaSaknade.filter((konto) => anvandaKonton.includes(konto))
      : allaSaknade;

    // Kritiska konton som bör finnas - endast RIKTIGT företagsspecifika konton SOM OCKSÅ ANVÄNDS
    const kritiskaKonton = specialKonton.filter((konto) => {
      // Hoppa över konton som inte används om vi har den informationen
      if (anvandaKonton && !anvandaKonton.includes(konto)) return false;

      // Endast konton som är:
      // - Längre än 4 siffror (detaljkonton som 19301, 24401 etc)
      // - Konton som INTE är inom BAS-standardintervall
      // - Konton som börjar på 9 men INTE är 8910-8999 (som är BAS-resultatdisposition)
      const kontoNum = parseInt(konto);

      // Konton längre än 4 siffror är nästan alltid företagsspecifika
      if (konto.length > 4) return true;

      // Konton utanför BAS-intervall (under 1000 eller över 9000 men inte 9900-9999)
      if (kontoNum < 1000) return true;
      if (kontoNum > 9000 && kontoNum < 9900) return true;
      if (kontoNum > 9999) return true;

      return false;
    });

    const analys = {
      totaltAntal: allaSaknade.length,
      standardKonton: standardKonton.length,
      specialKonton: specialKonton.length,
      kritiskaKonton: kritiskaKonton,
      anvandaSaknade: anvandaSaknade.length,
      totaltAnvanda: anvandaKonton ? anvandaKonton.length : 0,
    };

    // Returnera endast använda specialkonton som "saknade" om vi har den informationen
    const saknadeAttVisa = anvandaKonton
      ? specialKonton.filter((konto) => anvandaKonton.includes(konto))
      : specialKonton;

    return {
      saknade: saknadeAttVisa,
      analys: analys,
    };
  } catch (error) {
    console.error("❌ Fel vid kontroll av saknade konton:", error);
    return {
      saknade: [],
      analys: {
        totaltAntal: 0,
        standardKonton: 0,
        specialKonton: 0,
        kritiskaKonton: [],
        anvandaSaknade: 0,
        totaltAnvanda: 0,
      },
    };
  }
}

function parseSieContent(content: string): SieData {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const result: SieData = {
    header: {
      program: "",
      organisationsnummer: "",
      företagsnamn: "",
      räkenskapsår: [],
      kontoplan: "",
    },
    konton: [],
    verifikationer: [],
    balanser: {
      ingående: [],
      utgående: [],
    },
    resultat: [],
  };

  let currentVerification: any = null;
  let currentTransactions: any[] = [];

  for (const line of lines) {
    // Extrahera värden inom citattecken och utan
    const extractValue = (line: string, keyword: string): string => {
      const match = line.match(new RegExp(`#${keyword}\\s+"([^"]+)"|#${keyword}\\s+([^\\s]+)`));
      return match ? match[1] || match[2] || "" : "";
    };

    const extractValues = (line: string, keyword: string): string[] => {
      const regex = new RegExp(`#${keyword}\\s+(.+)`);
      const match = line.match(regex);
      if (!match) return [];

      const values: string[] = [];
      let current = match[1];
      let inQuotes = false;
      let currentValue = "";

      for (let i = 0; i < current.length; i++) {
        const char = current[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === " " && !inQuotes) {
          if (currentValue.trim()) {
            values.push(currentValue.trim());
            currentValue = "";
          }
        } else {
          currentValue += char;
        }
      }
      if (currentValue.trim()) {
        values.push(currentValue.trim());
      }

      return values;
    };

    // Parsa header-information
    if (line.startsWith("#PROGRAM")) {
      result.header.program = extractValue(line, "PROGRAM");
    } else if (line.startsWith("#ORGNR")) {
      result.header.organisationsnummer = extractValue(line, "ORGNR");
    } else if (line.startsWith("#FNAMN")) {
      result.header.företagsnamn = extractValue(line, "FNAMN");
    } else if (line.startsWith("#KPTYP")) {
      result.header.kontoplan = extractValue(line, "KPTYP");
    } else if (line.startsWith("#RAR")) {
      const values = extractValues(line, "RAR");
      if (values.length >= 3) {
        result.header.räkenskapsår.push({
          år: parseInt(values[0]),
          startdatum: values[1],
          slutdatum: values[2],
        });
      }
    }

    // Parsa konton
    else if (line.startsWith("#KONTO")) {
      const values = extractValues(line, "KONTO");
      if (values.length >= 2) {
        result.konton.push({
          nummer: values[0],
          namn: values[1].replace(/"/g, ""),
        });
      }
    }

    // Parsa ingående balanser
    else if (line.startsWith("#IB")) {
      const values = extractValues(line, "IB");
      if (values.length >= 3) {
        const år = parseInt(values[0]);
        const konto = values[1];
        const belopp = parseFloat(values[2]);

        // Visa bara aktuellt år (0) för tydlighet
        if (år === 0) {
          result.balanser.ingående.push({ konto, belopp });
        }
      }
    }

    // Parsa utgående balanser
    else if (line.startsWith("#UB")) {
      const values = extractValues(line, "UB");
      if (values.length >= 3) {
        const år = parseInt(values[0]);
        const konto = values[1];
        const belopp = parseFloat(values[2]);

        // Visa bara aktuellt år (0) för tydlighet
        if (år === 0) {
          result.balanser.utgående.push({ konto, belopp });
        }
      }
    }

    // Parsa resultatposter
    else if (line.startsWith("#RES")) {
      const values = extractValues(line, "RES");
      if (values.length >= 3) {
        const år = parseInt(values[0]);
        const konto = values[1];
        const belopp = parseFloat(values[2]);

        // Visa bara aktuellt år (0) för tydlighet
        if (år === 0) {
          result.resultat.push({ konto, belopp });
        }
      }
    }

    // Parsa verifikationer
    else if (line.startsWith("#VER")) {
      if (currentVerification) {
        // Avsluta föregående verifikation
        result.verifikationer.push({
          ...currentVerification,
          transaktioner: currentTransactions,
        });
      }

      const values = extractValues(line, "VER");
      if (values.length >= 4) {
        currentVerification = {
          serie: values[0].replace(/"/g, ""),
          nummer: values[1].replace(/"/g, ""),
          datum: values[2],
          beskrivning: values[3].replace(/"/g, ""),
        };
        currentTransactions = [];
      }
    }

    // Parsa transaktioner inom verifikationer
    else if (line.startsWith("#TRANS") && currentVerification) {
      const values = extractValues(line, "TRANS");
      if (values.length >= 3) {
        currentTransactions.push({
          konto: values[0],
          belopp: parseFloat(values[2]),
        });
      }
    }
  }

  // Lägg till sista verifikationen
  if (currentVerification) {
    result.verifikationer.push({
      ...currentVerification,
      transaktioner: currentTransactions,
    });
  }

  return result;
}

// Ny funktion för att skapa saknade konton
export async function skapaKonton(
  kontoData: Array<{ nummer: string; namn: string }>
): Promise<{ success: boolean; error?: string; skapade?: number }> {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Åtkomst nekad - ingen giltig session" };
    }

    // Rate limiting för kontoskapande
    if (!(await validateSessionAttempt(userId))) {
      return { success: false, error: "För många försök - vänta 15 minuter" };
    }

    await logSieSecurityEvent(
      userId,
      "sie_create_accounts_attempt",
      `Attempting to create ${kontoData.length} accounts`
    );

    const { Pool } = require("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const client = await pool.connect();

    let skapadeAntal = 0;

    for (const konto of kontoData) {
      try {
        // Bestäm kontoklass baserat på kontonummer
        const kontonummer = parseInt(konto.nummer);
        let kontoklass = "Ospecificerad";
        let kategori = "Övrigt";

        if (kontonummer >= 1000 && kontonummer <= 1999) {
          kontoklass = "Tillgångar";
          kategori = "Anläggningstillgångar och omsättningstillgångar";
        } else if (kontonummer >= 2000 && kontonummer <= 2999) {
          kontoklass = "Eget kapital och skulder";
          kategori = "Eget kapital, avsättningar och skulder";
        } else if (kontonummer >= 3000 && kontonummer <= 3999) {
          kontoklass = "Intäkter";
          kategori = "Rörelseintäkter";
        } else if (kontonummer >= 4000 && kontonummer <= 4999) {
          kontoklass = "Kostnader";
          kategori = "Rörelsekostnader - varor";
        } else if (kontonummer >= 5000 && kontonummer <= 5999) {
          kontoklass = "Kostnader";
          kategori = "Rörelsekostnader - lokaler";
        } else if (kontonummer >= 6000 && kontonummer <= 6999) {
          kontoklass = "Kostnader";
          kategori = "Rörelsekostnader - personal";
        } else if (kontonummer >= 7000 && kontonummer <= 7999) {
          kontoklass = "Kostnader";
          kategori = "Rörelsekostnader - övriga";
        } else if (kontonummer >= 8000 && kontonummer <= 8999) {
          kontoklass = "Finansiella poster";
          kategori = "Finansiella intäkter och kostnader";
        }

        // 🔒 SÄKER DATABASSKAPNING - Konto kopplas till userId
        await client.query(
          `INSERT INTO konton (kontonummer, beskrivning, kontoklass, kategori, sökord, "userId") 
           VALUES ($1, $2, $3, $4, $5, $6) 
           ON CONFLICT (kontonummer, "userId") DO NOTHING`,
          [konto.nummer, konto.namn, kontoklass, kategori, [konto.namn.toLowerCase()], userId]
        );

        skapadeAntal++;
      } catch (error) {
        console.error(`Fel vid skapande av konto ${konto.nummer}:`, error);
        await logSieSecurityEvent(
          userId,
          "sie_create_account_error",
          `Failed to create account ${konto.nummer}: ${error}`
        );
      }
    }

    client.release();
    await pool.end();

    await logSieSecurityEvent(
      userId,
      "sie_create_accounts_success",
      `Created ${skapadeAntal} accounts`
    );

    return {
      success: true,
      skapade: skapadeAntal,
    };
  } catch (error) {
    console.error("Fel vid skapande av konton:", error);
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        await logSieSecurityEvent(
          userId,
          "sie_create_accounts_error",
          `Failed to create accounts: ${error}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    return {
      success: false,
      error: "Kunde inte skapa konton",
    };
  }
}

// Ny funktion för att importera SIE-data
interface ImportSettings {
  startDatum?: string;
  slutDatum?: string;
  inkluderaVerifikationer: boolean;
  inkluderaBalanser: boolean;
  inkluderaResultat: boolean;
  skapaKonton: boolean;
  exkluderaVerifikationer?: string[];
}

export async function importeraSieData(
  sieData: SieData,
  saknadeKonton: string[],
  settings: ImportSettings,
  fileInfo?: {
    filnamn: string;
    filstorlek: number;
  }
): Promise<{ success: boolean; error?: string; resultat?: any }> {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const userId = await getUserId();
    if (!userId) {
      return {
        success: false,
        error: "Ingen giltig session - måste vara inloggad",
      };
    }

    // Rate limiting för SIE-import (mycket känslig operation)
    if (!(await validateSessionAttempt(userId))) {
      return {
        success: false,
        error: "För många försök - vänta 15 minuter",
      };
    }

    await logSieSecurityEvent(
      userId,
      "sie_import_attempt",
      `Import started: ${fileInfo?.filnamn || "unknown"}, verifications: ${sieData.verifikationer.length}`
    );

    const { Pool } = require("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    let client;
    let clientReleased = false;
    let poolEnded = false;
    let importId = null;

    try {
      client = await pool.connect();

      // STEG 0: Skapa import-logg FÖRST
      if (fileInfo) {
        const startDatum =
          sieData.verifikationer.length > 0
            ? sieData.verifikationer.reduce(
                (earliest, v) => (v.datum < earliest ? v.datum : earliest),
                sieData.verifikationer[0].datum
              )
            : null;

        const slutDatum =
          sieData.verifikationer.length > 0
            ? sieData.verifikationer.reduce(
                (latest, v) => (v.datum > latest ? v.datum : latest),
                sieData.verifikationer[0].datum
              )
            : null;

        // Räkna alla poster från SIE-filen
        const antalTransaktionsposter = sieData.verifikationer.reduce(
          (total, ver) => total + ver.transaktioner.length,
          0
        );
        const antalBalansposter =
          sieData.balanser.ingående.length + sieData.balanser.utgående.length;
        const antalResultatposter = sieData.resultat.length;

        const importResult = await client.query(
          `
          INSERT INTO sie_importer (
            "userId", filnamn, filstorlek, sie_program, sie_organisationsnummer, 
            sie_företagsnamn, sie_datumintervall_från, sie_datumintervall_till,
            antal_verifikationer, antal_transaktionsposter, antal_balansposter, 
            antal_resultatposter, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pågående')
          RETURNING id
        `,
          [
            userId,
            fileInfo.filnamn,
            fileInfo.filstorlek,
            sieData.header.program,
            sieData.header.organisationsnummer,
            sieData.header.företagsnamn,
            startDatum,
            slutDatum,
            sieData.verifikationer.length,
            antalTransaktionsposter,
            antalBalansposter,
            antalResultatposter,
          ]
        );

        importId = importResult.rows[0].id;
      }

      // STEG 1: Kontrollera duplicates
      if (settings.inkluderaVerifikationer && sieData.verifikationer.length > 0) {
        const verifikationsNamn = sieData.verifikationer.map(
          (v) => `Verifikation ${v.serie}:${v.nummer}`
        );

        const { rows: duplicateRows } = await client.query(
          `SELECT kontobeskrivning, transaktionsdatum 
           FROM transaktioner 
           WHERE kontobeskrivning = ANY($1) 
           AND "userId" = $2 
           AND kommentar LIKE 'SIE Import%'`,
          [verifikationsNamn, userId]
        );

        if (duplicateRows.length > 0) {
          const duplicatesList = duplicateRows
            .map(
              (row: any) =>
                `• ${row.kontobeskrivning} (${row.transaktionsdatum.toISOString().split("T")[0]})`
            )
            .join("\n");

          // Uppdatera import-logg med duplikat-fel
          if (importId) {
            await client.query(
              `
              UPDATE sie_importer SET
                status = 'misslyckad',
                felmeddelande = 'Duplicata verifikationer upptäckta',
                uppdaterad = NOW()
              WHERE id = $1
            `,
              [importId]
            );
          }

          // Markera att vi kommer att stänga
          client.release();
          clientReleased = true;
          await pool.end();
          poolEnded = true;

          return {
            success: false,
            error: `🚨 Import avbruten - Duplicata verifikationer upptäckta!

Följande verifikationer finns redan i din databas:

${duplicatesList}

💡 Detta förhindrar oavsiktliga dubbletter. Om du vill importera ändå, ta först bort de befintliga verifikationerna.`,
          };
        }
      }

      // Nu börja transaktion
      await client.query("BEGIN");

      let resultat = {
        kontonSkapade: 0,
        verifikationerImporterade: 0,
        balanserImporterade: 0,
        resultatImporterat: 0,
      };

      // Steg 2: Hitta ALLA använda konton som saknas (inte bara specialkonton)
      if (settings.skapaKonton) {
        // Samla alla konton som faktiskt används i SIE-filen
        const anvandaKonton = new Set<string>();
        sieData.verifikationer.forEach((ver) => {
          ver.transaktioner.forEach((trans) => {
            anvandaKonton.add(trans.konto);
          });
        });
        sieData.balanser.ingående.forEach((b) => anvandaKonton.add(b.konto));
        sieData.balanser.utgående.forEach((b) => anvandaKonton.add(b.konto));
        sieData.resultat.forEach((r) => anvandaKonton.add(r.konto));

        // Kontrollera vilka av dessa som saknas i databasen
        const { rows } = await client.query("SELECT kontonummer FROM konton");
        const befintligaKonton = new Set(rows.map((r: any) => r.kontonummer.toString()));

        const allaAnvandaSaknade = Array.from(anvandaKonton).filter(
          (konto) => !befintligaKonton.has(konto)
        );

        // Skapa ALLA använda saknade konton (både BAS-standard och specialkonton)
        for (const kontonummer of allaAnvandaSaknade) {
          const kontoInfo = sieData.konton.find((k) => k.nummer === kontonummer);
          const kontoNamn = kontoInfo?.namn || `Konto ${kontonummer}`;

          const kontoNum = parseInt(kontonummer);
          let kontoklass = "Ospecificerad";
          let kategori = "Övrigt";

          if (kontoNum >= 1000 && kontoNum <= 1999) {
            kontoklass = "Tillgångar";
            kategori = "Anläggningstillgångar och omsättningstillgångar";
          } else if (kontoNum >= 2000 && kontoNum <= 2999) {
            kontoklass = "Eget kapital och skulder";
            kategori = "Eget kapital, avsättningar och skulder";
          } else if (kontoNum >= 3000 && kontoNum <= 3999) {
            kontoklass = "Intäkter";
            kategori = "Rörelseintäkter";
          } else if (kontoNum >= 4000 && kontoNum <= 4999) {
            kontoklass = "Kostnader";
            kategori = "Rörelsekostnader - varor";
          } else if (kontoNum >= 5000 && kontoNum <= 5999) {
            kontoklass = "Kostnader";
            kategori = "Rörelsekostnader - lokaler";
          } else if (kontoNum >= 6000 && kontoNum <= 6999) {
            kontoklass = "Kostnader";
            kategori = "Rörelsekostnader - personal";
          } else if (kontoNum >= 7000 && kontoNum <= 7999) {
            kontoklass = "Kostnader";
            kategori = "Rörelsekostnader - övriga";
          } else if (kontoNum >= 8000 && kontoNum <= 8999) {
            kontoklass = "Finansiella poster";
            kategori = "Finansiella intäkter och kostnader";
          }

          const insertResult = await client.query(
            `INSERT INTO konton (kontonummer, beskrivning, kontoklass, kategori, sökord) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (kontonummer) DO NOTHING
             RETURNING id`,
            [kontonummer, kontoNamn, kontoklass, kategori, [kontoNamn.toLowerCase()]]
          );

          if (insertResult.rows.length > 0) {
            resultat.kontonSkapade++;
          }
        }
      }

      // Steg 2: Importera verifikationer
      if (settings.inkluderaVerifikationer) {
        let filtradeVerifikationer = sieData.verifikationer;

        // Filtrera på datum om specificerat - konvertera SIE-datum till jämförbart format
        if (settings.startDatum || settings.slutDatum) {
          filtradeVerifikationer = sieData.verifikationer.filter((v) => {
            // Konvertera SIE-datum (YYYYMMDD) till HTML-datum (YYYY-MM-DD) för jämförelse
            const formatDatum = (datum: string) => {
              if (datum.length === 8) {
                return `${datum.slice(0, 4)}-${datum.slice(4, 6)}-${datum.slice(6, 8)}`;
              }
              return datum;
            };

            const verifikationsDatum = formatDatum(v.datum);

            if (settings.startDatum && verifikationsDatum < settings.startDatum) return false;
            if (settings.slutDatum && verifikationsDatum > settings.slutDatum) return false;
            return true;
          });
        }

        // Filtrera bort användarvalde verifikationer
        if (settings.exkluderaVerifikationer && settings.exkluderaVerifikationer.length > 0) {
          const ursprungligAntal = filtradeVerifikationer.length;
          filtradeVerifikationer = filtradeVerifikationer.filter((v) => {
            const verifikationId = `${v.serie}-${v.nummer}`;
            const shouldExclude =
              settings.exkluderaVerifikationer?.includes(verifikationId) || false;
            if (shouldExclude) {
              console.log(
                `⚠️ Exkluderar verifikation V${v.nummer}: "${v.beskrivning}" (användarval)`
              );
            }
            return !shouldExclude;
          });
          console.log(
            `📊 Exkluderade ${ursprungligAntal - filtradeVerifikationer.length} verifikationer baserat på användarval`
          );
        }

        console.log(`📊 Antal verifikationer att importera: ${filtradeVerifikationer.length}`);

        // Importera varje verifikation som en transaktion med flera transaktionsposter
        for (const verifikation of filtradeVerifikationer) {
          // Konvertera SIE-datum till PostgreSQL-datum
          const formatDatum = (datum: string) => {
            if (datum.length === 8) {
              return `${datum.slice(0, 4)}-${datum.slice(4, 6)}-${datum.slice(6, 8)}`;
            }
            return datum;
          };

          const transaktionsDatum = formatDatum(verifikation.datum);

          // Skapa huvudtransaktion
          const { rows: transaktionRows } = await client.query(
            `INSERT INTO transaktioner (
              transaktionsdatum, 
              kontobeskrivning, 
              kommentar, 
              "userId"
            ) VALUES ($1, $2, $3, $4)
            RETURNING id`,
            [
              transaktionsDatum,
              `Verifikation ${verifikation.serie}:${verifikation.nummer}`,
              `SIE Import - ${verifikation.beskrivning}`,
              userId,
            ]
          );

          const transaktionsId = transaktionRows[0].id;

          // Skapa transaktionsposter för varje konto i verifikationen
          for (const transaktion of verifikation.transaktioner) {
            // Hämta konto_id från konton-tabellen
            const { rows: kontoRows } = await client.query(
              "SELECT id FROM konton WHERE kontonummer = $1",
              [transaktion.konto]
            );

            if (kontoRows.length === 0) {
              console.warn(`Konto ${transaktion.konto} hittades inte i konton-tabellen`);
              continue;
            }

            const kontoId = kontoRows[0].id;

            // Bestäm debet/kredit baserat på beloppets tecken
            const debet = transaktion.belopp > 0 ? transaktion.belopp : 0;
            const kredit = transaktion.belopp < 0 ? Math.abs(transaktion.belopp) : 0;

            await client.query(
              `INSERT INTO transaktionsposter (
                transaktions_id,
                konto_id,
                debet,
                kredit
              ) VALUES ($1, $2, $3, $4)`,
              [transaktionsId, kontoId, debet, kredit]
            );
          }

          resultat.verifikationerImporterade++;
        }
      }

      // Steg 3: Importera balanser (om aktiverat)
      if (settings.inkluderaBalanser) {
        let ingaendeImporterade = 0;

        // ALLTID importera ingående balanser (föregående års slutbalans)
        if (sieData.balanser.ingående.length > 0) {
          console.log("📥 Importerar ingående balanser (föregående års slutbalans)");
          console.log("📊 Ingående balanser i SIE-fil:", sieData.balanser.ingående);

          // Skapa en ingående balanstransaktion
          if (sieData.balanser.ingående.length > 0) {
            const { rows: transaktionRows } = await client.query(
              `INSERT INTO transaktioner (
                transaktionsdatum, 
                kontobeskrivning, 
                kommentar, 
                "userId"
              ) VALUES ($1, $2, $3, $4)
              RETURNING id`,
              [
                settings.startDatum || "2025-01-01",
                "Ingående balanser",
                "SIE Import - Ingående balanser",
                userId,
              ]
            );

            const transaktionsId = transaktionRows[0].id;

            // Skapa transaktionsposter för varje balanspost
            for (const balans of sieData.balanser.ingående) {
              if (balans.belopp !== 0) {
                console.log(
                  `🔍 Försöker importera ingående balans för konto ${balans.konto}: ${balans.belopp}`
                );

                // Hämta konto_id
                const { rows: kontoRows } = await client.query(
                  "SELECT id FROM konton WHERE kontonummer = $1",
                  [balans.konto]
                );

                if (kontoRows.length === 0) {
                  console.warn(`❌ Konto ${balans.konto} hittades inte för ingående balans`);
                  continue;
                }

                const kontoId = kontoRows[0].id;
                const debet = balans.belopp > 0 ? balans.belopp : 0;
                const kredit = balans.belopp < 0 ? Math.abs(balans.belopp) : 0;

                console.log(
                  `✅ Skapar ingående balans för konto ${balans.konto}: debet=${debet}, kredit=${kredit}`
                );

                await client.query(
                  `INSERT INTO transaktionsposter (
                    transaktions_id,
                    konto_id,
                    debet,
                    kredit
                  ) VALUES ($1, $2, $3, $4)`,
                  [transaktionsId, kontoId, debet, kredit]
                );

                ingaendeImporterade++;
                console.log(`📈 Räknare för ingående balanser nu: ${ingaendeImporterade}`);
              }
            }
          }
        }

        // Endast importera utgående balanser om INGA verifikationer finns
        if (sieData.verifikationer.length === 0 && sieData.balanser.utgående.length > 0) {
          console.log("📤 Importerar utgående balanser (eftersom inga verifikationer finns)");

          // Skapa en utgående balanstransaktion bara om inga verifikationer finns
          if (sieData.balanser.utgående.length > 0) {
            const { rows: transaktionRows } = await client.query(
              `INSERT INTO transaktioner (
                transaktionsdatum, 
                kontobeskrivning, 
                kommentar, 
                "userId"
              ) VALUES ($1, $2, $3, $4)
              RETURNING id`,
              [
                settings.slutDatum || "2025-07-29",
                "Utgående balanser",
                "SIE Import - Utgående balanser",
                userId,
              ]
            );

            const transaktionsId = transaktionRows[0].id;

            // Skapa transaktionsposter för varje balanspost
            for (const balans of sieData.balanser.utgående) {
              if (balans.belopp !== 0) {
                // Hämta konto_id
                const { rows: kontoRows } = await client.query(
                  "SELECT id FROM konton WHERE kontonummer = $1",
                  [balans.konto]
                );

                if (kontoRows.length === 0) {
                  console.warn(`Konto ${balans.konto} hittades inte för utgående balans`);
                  continue;
                }

                const kontoId = kontoRows[0].id;
                const debet = balans.belopp > 0 ? balans.belopp : 0;
                const kredit = balans.belopp < 0 ? Math.abs(balans.belopp) : 0;

                await client.query(
                  `INSERT INTO transaktionsposter (
                    transaktions_id,
                    konto_id,
                    debet,
                    kredit
                  ) VALUES ($1, $2, $3, $4)`,
                  [transaktionsId, kontoId, debet, kredit]
                );
              }
            }
          }

          console.log(`📊 Slutlig räknare för ingående balanser: ${ingaendeImporterade}`);
        }

        // Sätt slutresultatet för balanser (ingående är alltid importerade om de finns)
        resultat.balanserImporterade = ingaendeImporterade;
      }

      // Steg 4: Importera resultatdata (om aktiverat)
      if (settings.inkluderaResultat) {
        if (sieData.resultat.length > 0) {
          // Om vi har verifikationer, skippa resultatdata för att undvika dubblering
          if (sieData.verifikationer.length > 0) {
            console.log(
              "⚠️ Skippar resultatdata eftersom verifikationer redan finns (undviker dubblering)"
            );
            resultat.resultatImporterat = 0;
          } else {
            // Skapa en resultatdatatransaktion bara om inga verifikationer finns
            const { rows: transaktionRows } = await client.query(
              `INSERT INTO transaktioner (
                transaktionsdatum, 
                kontobeskrivning, 
                kommentar, 
                "userId"
              ) VALUES ($1, $2, $3, $4)
              RETURNING id`,
              [
                settings.slutDatum || "2025-07-29",
                "Resultatdata",
                "SIE Import - Resultatdata",
                userId,
              ]
            );

            const transaktionsId = transaktionRows[0].id;

            // Skapa transaktionsposter för varje resultatpost
            for (const resultatpost of sieData.resultat) {
              if (resultatpost.belopp !== 0) {
                // Hämta konto_id
                const { rows: kontoRows } = await client.query(
                  "SELECT id FROM konton WHERE kontonummer = $1",
                  [resultatpost.konto]
                );

                if (kontoRows.length === 0) {
                  console.warn(`Konto ${resultatpost.konto} hittades inte för resultatdata`);
                  continue;
                }

                const kontoId = kontoRows[0].id;
                const debet = resultatpost.belopp > 0 ? resultatpost.belopp : 0;
                const kredit = resultatpost.belopp < 0 ? Math.abs(resultatpost.belopp) : 0;

                await client.query(
                  `INSERT INTO transaktionsposter (
                    transaktions_id,
                    konto_id,
                    debet,
                    kredit
                  ) VALUES ($1, $2, $3, $4)`,
                  [transaktionsId, kontoId, debet, kredit]
                );
              }
            }
            resultat.resultatImporterat = sieData.resultat.length;
          }
        }
      }

      // Uppdatera import-logg med slutresultat
      if (importId) {
        await client.query(
          `
          UPDATE sie_importer SET
            antal_konton_skapade = $1,
            antal_verifikationer = $2,
            antal_transaktionsposter = $3,
            antal_balansposter = $4,
            antal_resultatposter = $5,
            status = 'slutförd',
            uppdaterad = NOW()
          WHERE id = $6
        `,
          [
            resultat.kontonSkapade,
            resultat.verifikationerImporterade,
            0, // Vi räknar inte transaktionsposter separat än
            resultat.balanserImporterade,
            resultat.resultatImporterat,
            importId,
          ]
        );
      }

      // Committa transaktionen
      await client.query("COMMIT");

      return {
        success: true,
        resultat,
      };
    } catch (error) {
      // Uppdatera import-logg med fel
      if (importId) {
        try {
          await client.query(
            `
            UPDATE sie_importer SET
              status = 'misslyckad',
              felmeddelande = $1,
              uppdaterad = NOW()
            WHERE id = $2
          `,
            [error instanceof Error ? error.message : String(error), importId]
          );
        } catch (updateError) {
          console.error("Kunde inte uppdatera import-logg:", updateError);
        }
      }

      // Rollback vid fel
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback fel:", rollbackError);
      }
      throw error;
    } finally {
      if (client && !clientReleased) {
        client.release();
      }
      if (!poolEnded) {
        await pool.end();
      }
    }
  } catch (error) {
    console.error("Fel vid import av SIE-data:", error);
    return {
      success: false,
      error: `Kunde inte importera SIE-data: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function exporteraSieData(
  år: number = 2025
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    // 🔒 SÄKERHETSVALIDERING - Session & Rate Limiting
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "Åtkomst nekad - ingen giltig session" };
    }

    // Rate limiting för SIE-export
    if (!(await validateSessionAttempt(userId))) {
      return { success: false, error: "För många försök - vänta 15 minuter" };
    }

    await logSieSecurityEvent(userId, "sie_export_attempt", `Export started for year: ${år}`);

    // 🔒 SÄKER DATABASACCESS - Hämta endast användarens företagsinfo
    const företagQuery = await pool.query(
      `SELECT email, företagsnamn, organisationsnummer FROM users WHERE id = $1`,
      [userId]
    );

    const företag = företagQuery.rows[0];
    const idag = new Date();
    const datumSträng = `${idag.getFullYear()}${String(idag.getMonth() + 1).padStart(2, "0")}${String(idag.getDate()).padStart(2, "0")}`;

    // Bygg SIE 4 fil enligt den fungerande standarden
    let sieContent = "";

    // Obligatoriska SIE 4 huvud-poster
    sieContent += `#FLAGGA 0\n`;
    sieContent += `#PROGRAM "BokforPunkt.com" 1.0\n`;
    sieContent += `#FORMAT PC8\n`;
    sieContent += `#GEN ${datumSträng}\n`;
    sieContent += `#SIETYP 4\n`;

    // Företagsinformation
    const företagsnamn = företag?.företagsnamn || företag?.email || "Företag";
    let organisationsnummer = företag?.organisationsnummer || "000000-0000";

    // Formatera organisationsnummer korrekt (utan bindestreck för SIE 4)
    if (organisationsnummer) {
      organisationsnummer = organisationsnummer.replace(/\D/g, "");
      if (organisationsnummer.length === 12) {
        // Personnummer för enskild firma - ta bara sista 10 siffrorna
        organisationsnummer = organisationsnummer.slice(2);
      }
    }

    sieContent += `#ORGNR ${organisationsnummer}\n`;
    sieContent += `#FNAMN "${sieEscape(företagsnamn)}"\n`;

    // Räkenskapsår (generera flera år som i exemplet)
    for (let i = 0; i >= -7; i--) {
      const currentYear = år + i;
      sieContent += `#RAR ${i} ${currentYear}0101 ${currentYear}1231\n`;
    }

    // Kontoplan
    sieContent += `#KPTYP BAS2014\n`;

    // 🔒 SÄKER DATABASACCESS - Hämta endast användarens egna konton
    const kontoQuery = await pool.query(
      `
      SELECT kontonummer, beskrivning 
      FROM konton 
      WHERE "userId" = $1
      ORDER BY kontonummer::integer
    `,
      [userId]
    );

    // Lägg till #KONTO-poster
    for (const konto of kontoQuery.rows) {
      const beskrivning = sieEscape(konto.beskrivning);
      sieContent += `#KONTO ${konto.kontonummer} "${beskrivning}"\n`;
    }

    // 🔒 SÄKER DATABASACCESS - Hämta endast användarens egna transaktioner
    const transaktionQuery = await pool.query(
      `SELECT 
        t.id as transaktion_id,
        t.transaktionsdatum,
        t.kontobeskrivning,
        t.kommentar,
        tp.konto_id,
        tp.debet,
        tp.kredit,
        k.kontonummer,
        k.beskrivning as kontonamn
      FROM transaktioner t
      JOIN transaktionsposter tp ON t.id = tp.transaktions_id
      JOIN konton k ON tp.konto_id = k.id
      WHERE t."userId" = $1 
      ORDER BY t.transaktionsdatum, t.id
    `,
      [userId]
    );

    // Beräkna kontosaldon per år (från -7 till 0)
    const kontoSaldonPerÅr = new Map<number, Map<string, number>>();

    // Initiera alla år
    for (let i = -7; i <= 0; i++) {
      kontoSaldonPerÅr.set(i, new Map<string, number>());
    }

    // Beräkna ackumulerade saldon per år
    for (const row of transaktionQuery.rows) {
      const transYear = new Date(row.transaktionsdatum).getFullYear();
      const konto = row.kontonummer;
      const belopp = row.debet > 0 ? row.debet : -row.kredit;

      // Lägg till belopp för detta år och alla framtida år
      for (let i = -7; i <= 0; i++) {
        const targetYear = år + i;
        if (transYear <= targetYear) {
          const årMap = kontoSaldonPerÅr.get(i)!;
          const currentSaldo = årMap.get(konto) || 0;
          årMap.set(konto, currentSaldo + belopp);
        }
      }
    }

    // Lägg till ingående balanser (#IB) för alla år
    for (let i = -6; i <= 0; i++) {
      const saldonFörÅr = kontoSaldonPerÅr.get(i - 1) || new Map(); // Föregående års saldon

      for (const konto of kontoQuery.rows) {
        const kontoNr = parseInt(konto.kontonummer);
        if (kontoNr >= 1000 && kontoNr <= 2999) {
          // Endast balanskonton
          const saldo = saldonFörÅr.get(konto.kontonummer) || 0;
          if (Math.abs(saldo) > 0.01) {
            sieContent += `#IB ${i} ${konto.kontonummer} ${saldo.toFixed(2)}\n`;
          }
        }
      }
    }

    // Lägg till utgående balanser (#UB) för alla år
    for (let i = -7; i <= 0; i++) {
      const saldonFörÅr = kontoSaldonPerÅr.get(i)!;

      for (const [konto, saldo] of saldonFörÅr) {
        const kontoNr = parseInt(konto);
        if (kontoNr >= 1000 && kontoNr <= 2999) {
          // Endast balanskonton
          if (Math.abs(saldo) > 0.01) {
            sieContent += `#UB ${i} ${konto} ${saldo.toFixed(2)}\n`;
          }
        }
      }
    }

    // Lägg till resultatposter (#RES) för år -1 och 0
    for (let i = -1; i <= 0; i++) {
      const saldonFörÅr = kontoSaldonPerÅr.get(i)!;

      for (const [konto, saldo] of saldonFörÅr) {
        const kontoNr = parseInt(konto);
        if (kontoNr >= 3000 && kontoNr <= 8999) {
          // Endast resultatkonton
          if (Math.abs(saldo) > 0.01) {
            sieContent += `#RES ${i} ${konto} ${saldo.toFixed(2)}\n`;
          }
        }
      }
    }

    // Lägg till verifikationer (#VER) för det aktuella året
    const årsTransaktioner = transaktionQuery.rows.filter((row) => {
      const transYear = new Date(row.transaktionsdatum).getFullYear();
      return transYear === år;
    });

    if (årsTransaktioner.length > 0) {
      const verifikationer = new Map();
      let verNummer = 1;

      // Gruppera transaktioner per verifikation
      for (const row of årsTransaktioner) {
        const transId = row.transaktion_id;

        if (!verifikationer.has(transId)) {
          const datum = new Date(row.transaktionsdatum);
          const datumStr = `${datum.getFullYear()}${String(datum.getMonth() + 1).padStart(2, "0")}${String(datum.getDate()).padStart(2, "0")}`;
          const beskrivning = sieEscape(row.kommentar || row.kontobeskrivning || "Transaktion");

          verifikationer.set(transId, {
            nummer: verNummer++,
            datum: datumStr,
            beskrivning: beskrivning,
            poster: [],
          });
        }

        const belopp = row.debet > 0 ? row.debet : -row.kredit;
        verifikationer.get(transId).poster.push({
          konto: row.kontonummer,
          belopp: belopp,
        });
      }

      // Skriv ut verifikationer
      for (const [transId, ver] of verifikationer) {
        // Kontrollera balansering
        const summa = ver.poster.reduce((sum: number, post: any) => sum + post.belopp, 0);
        if (Math.abs(summa) > 0.01) {
          console.warn(`Verifikation ${ver.nummer} balanserar inte: ${summa} kr`);
          continue;
        }

        sieContent += `#VER "A" "${ver.nummer}" ${ver.datum} "${ver.beskrivning}" ${ver.datum}\n`;
        sieContent += `{\n`;

        for (const post of ver.poster) {
          sieContent += `\t#TRANS ${post.konto} {} ${post.belopp.toFixed(2)}\n`;
        }

        sieContent += `}\n`;
      }
    }

    await logSieSecurityEvent(
      userId,
      "sie_export_success",
      `SIE export completed for year ${år}, content length: ${sieContent.length}`
    );

    return {
      success: true,
      data: sieContent,
    };
  } catch (error) {
    console.error("Fel vid export av SIE-data:", error);
    // Logga fel om vi har session
    try {
      const userId = await getUserId();
      if (userId) {
        await logSieSecurityEvent(
          userId,
          "sie_export_error",
          `Export failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    return {
      success: false,
      error: `Kunde inte exportera SIE-data: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Hjälpfunktion för SIE 4 text-escaping
function sieEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\") // Escape backslashes
    .replace(/"/g, '\\"') // Escape quotes
    .replace(/\n/g, " ") // Replace newlines with spaces
    .replace(/\r/g, " ") // Replace carriage returns with spaces
    .replace(/\t/g, " "); // Replace tabs with spaces
}
