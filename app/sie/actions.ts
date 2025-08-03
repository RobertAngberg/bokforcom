"use server";

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
  };
  error?: string;
}

export async function uploadSieFile(formData: FormData): Promise<SieUploadResult> {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "Ingen fil vald" };
    }

    if (
      !file.name.toLowerCase().endsWith(".se4") &&
      !file.name.toLowerCase().endsWith(".sie") &&
      !file.name.toLowerCase().endsWith(".se")
    ) {
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
    const { saknade, analys } = await kontrollSaknade(sieKonton);

    return {
      success: true,
      data: sieData,
      saknade: saknade,
      analys: analys,
    };
  } catch (error) {
    console.error("Fel vid parsning av SIE-fil:", error);
    return { success: false, error: "Kunde inte läsa SIE-filen" };
  }
}

async function kontrollSaknade(sieKonton: string[]) {
  try {
    const { Pool } = require("pg");
    const tempPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const client = await tempPool.connect();

    // Hämta alla befintliga konton från databasen
    const { rows } = await client.query("SELECT kontonummer FROM konton");
    const befintligaKonton = new Set(rows.map((r: any) => r.kontonummer.toString()));

    client.release();
    await tempPool.end();

    // Hitta konton som finns i SIE men inte i databasen
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
    ]);

    // Separera mellan standard BAS-konton och specialkonton
    const standardKonton = allaSaknade.filter((konto) => basStandardKonton.has(konto));
    const specialKonton = allaSaknade.filter((konto) => !basStandardKonton.has(konto));

    // Kritiska konton som bör finnas (exempel)
    const kritiskaKonton = specialKonton.filter((konto) => {
      // Konton som börjar med 99xx är ofta företagsspecifika
      // Konton mellan 8900-8999 är ofta företagsspecifika
      // Konton som innehåller fler än 4 siffror är ofta detaljkonton
      return konto.startsWith("99") || (konto >= "8900" && konto <= "8999") || konto.length > 4;
    });

    const analys = {
      totaltAntal: allaSaknade.length,
      standardKonton: standardKonton.length,
      specialKonton: specialKonton.length,
      kritiskaKonton: kritiskaKonton,
    };

    // Returnera endast specialkonton som "saknade" för att undvika att visa hundratals BAS-konton
    return {
      saknade: specialKonton,
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

      const values = [];
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
